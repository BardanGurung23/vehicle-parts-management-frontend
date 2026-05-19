import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ShoppingCart, Trash2, Search, X, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, ApiError, resolveBackendAssetUrl } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { CustomerSearchInput, CustomerSearchResult, DashboardSummary, Part } from "../../app/types";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { toast } from "sonner";

interface CartItem { partId: number; partName: string; unitPrice: number; quantity: number; }

type SearchFormState = { customerId: string; phoneNumber: string; vehicleNumber: string; name: string; };

function sortCustomerDirectory(customers: CustomerSearchResult[]) {
  return [...customers].sort((left, right) => {
    const accountDelta = Number(Boolean(right.userId)) - Number(Boolean(left.userId));
    if (accountDelta !== 0) {
      return accountDelta;
    }

    const nameDelta = left.fullName.localeCompare(right.fullName);
    if (nameDelta !== 0) {
      return nameDelta;
    }

    return left.customerId - right.customerId;
  });
}

function buildCustomerSearchPayload(values: SearchFormState): { payload: CustomerSearchInput | null; error: string | null } {
  const cid = values.customerId.trim(); const ph = values.phoneNumber.trim();
  const vn = values.vehicleNumber.trim(); const nm = values.name.trim();
  if (!cid && !ph && !vn && !nm) return { payload: null, error: "Provide at least one search field." };
  const payload: CustomerSearchInput = {};
  if (cid) { const n = Number(cid); if (!Number.isInteger(n) || n <= 0) return { payload: null, error: "Customer ID must be a positive whole number." }; payload.customerId = n; }
  if (ph) payload.phoneNumber = ph;
  if (vn) payload.vehicleNumber = vn;
  if (nm) payload.name = nm;
  return { payload, error: null };
}

export function ShopPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const isEmployee = user?.role === "Admin" || user?.role === "Staff";
  const [parts, setParts] = useState<Part[]>([]);
  const [partsLoading, setPartsLoading] = useState(true);
  const [partsError, setPartsError] = useState<string | null>(null);
  const [insightsSummary, setInsightsSummary] = useState<DashboardSummary | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [dueDate, setDueDate] = useState("");
  const [searchValues, setSearchValues] = useState<SearchFormState>({ customerId: "", phoneNumber: "", vehicleNumber: "", name: "" });
  const [allCustomers, setAllCustomers] = useState<CustomerSearchResult[]>([]);
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearchRun, setHasSearchRun] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const registeredCustomerCount = useMemo(
    () => allCustomers.filter((customer) => Boolean(customer.userId)).length,
    [allCustomers],
  );

  useEffect(() => {
    if (!token) {
      setParts([]);
      setPartsError(null);
      setPartsLoading(false);
      return;
    }

    let isActive = true;
    setPartsLoading(true);

    void api.getParts(token)
      .then((response) => {
        if (!isActive) {
          return;
        }

        setParts(response);
        setPartsError(null);
      })
      .catch((loadError: unknown) => {
        if (!isActive) {
          return;
        }

        setParts([]);
        setPartsError(loadError instanceof ApiError ? loadError.message : "Could not load inventory.");
      })
      .finally(() => {
        if (isActive) {
          setPartsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      setInsightsSummary(null);
      setInsightsError(null);
      setInsightsLoading(false);
      return;
    }

    let isActive = true;
    setInsightsLoading(true);

    void api.getDashboardSummary(token)
      .then((response) => {
        if (!isActive) {
          return;
        }

        setInsightsSummary(response);
        setInsightsError(null);
      })
      .catch((loadError: unknown) => {
        if (!isActive) {
          return;
        }

        setInsightsSummary(null);
        setInsightsError(loadError instanceof ApiError ? loadError.message : "Could not load shop insights.");
      })
      .finally(() => {
        if (isActive) {
          setInsightsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token || !isEmployee) {
      setAllCustomers([]);
      setCustomerResults([]);
      setCustomersLoading(false);
      return;
    }

    let isActive = true;
    setCustomersLoading(true);

    void api.getCustomers(token)
      .then((results) => {
        if (!isActive) {
          return;
        }

        const orderedResults = sortCustomerDirectory(results);

        setAllCustomers(orderedResults);
        setCustomerResults(orderedResults);
        setSearchError(null);

        setSelectedCustomer((currentSelection) => {
          if (!currentSelection) {
            return null;
          }

          return orderedResults.find((customer) => customer.customerId === currentSelection.customerId) ?? null;
        });
      })
      .catch((loadError: unknown) => {
        if (!isActive) {
          return;
        }

        setAllCustomers([]);
        setCustomerResults([]);
        setSearchError(loadError instanceof ApiError ? loadError.message : "Could not load customers.");
      })
      .finally(() => {
        if (isActive) {
          setCustomersLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [isEmployee, token]);

  const inStockParts = useMemo(() => parts.filter((p) => p.stockQuantity > 0), [parts]);
  const topCategories = insightsSummary?.inventory?.topCategories?.slice(0, 3) ?? [];
  const lowStockWatchlist = insightsSummary?.inventory?.lowStockParts?.slice(0, 3) ?? [];
  const currentInsightCustomer = isEmployee ? selectedCustomer : insightsSummary?.currentCustomer ?? null;
  const predictiveSignals = useMemo(() => {
    const predictiveAlerts = insightsSummary?.alerts?.predictiveAlerts ?? [];

    if (!currentInsightCustomer) {
      return [];
    }

    return predictiveAlerts
      .filter((alert) => alert.customerId === currentInsightCustomer.customerId)
      .slice(0, 3);
  }, [currentInsightCustomer, insightsSummary?.alerts?.predictiveAlerts]);
  const cartSignals = useMemo(() => {
    return cart
      .map((item) => {
        const matchingPart = parts.find((part) => part.partId === item.partId);

        if (!matchingPart || matchingPart.stockQuantity > matchingPart.reorderLevel) {
          return null;
        }

        return {
          partId: item.partId,
          partName: item.partName,
          stockQuantity: matchingPart.stockQuantity,
          reorderLevel: matchingPart.reorderLevel,
        };
      })
      .filter((item): item is { partId: number; partName: string; stockQuantity: number; reorderLevel: number } => item !== null);
  }, [cart, parts]);
  const showInsights = topCategories.length > 0 || lowStockWatchlist.length > 0 || predictiveSignals.length > 0 || cartSignals.length > 0;

  const addToCart = (partId: number, partName: string, unitPrice: number) => {
    setCart((prev) => { const e = prev.find((i) => i.partId === partId); return e ? prev.map((i) => i.partId === partId ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { partId, partName, unitPrice, quantity: 1 }]; });
  };
  const updateQuantity = (partId: number, quantity: number) => { setCart((prev) => quantity <= 0 ? prev.filter((i) => i.partId !== partId) : prev.map((i) => i.partId === partId ? { ...i, quantity } : i)); };
  const removeFromCart = (partId: number) => setCart((prev) => prev.filter((i) => i.partId !== partId));
  const cartTotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const handleCustomerSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    const { payload, error } = buildCustomerSearchPayload(searchValues);
    if (!payload) { setSearchError(error); setCustomerResults([]); setHasSearchRun(false); return; }
    try {
      setIsSearching(true); setSearchError(null);
      const results = await api.searchCustomers(token, payload);
      setCustomerResults(sortCustomerDirectory(results)); setHasSearchRun(true);
      if (selectedCustomer && results.every((c) => c.customerId !== selectedCustomer.customerId)) setSelectedCustomer(null);
    } catch (error) { setSearchError(error instanceof ApiError ? error.message : "Could not search customers."); setCustomerResults([]); setHasSearchRun(true); }
    finally { setIsSearching(false); }
  };

  const resetCustomerSearch = () => {
    setSearchValues({ customerId: "", phoneNumber: "", vehicleNumber: "", name: "" });
    setCustomerResults(allCustomers); setSearchError(null); setSelectedCustomer(null); setHasSearchRun(false);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error("Your cart is empty."); return; }
    if (isEmployee && !selectedCustomer) { toast.error("Select a customer before checkout."); return; }
    if (!token) { toast.error("Your session expired. Sign in again."); return; }
    if (isEmployee && paymentStatus !== "Paid" && !dueDate) { toast.error("Choose a due date for pending or credit sales."); return; }
    try {
      setIsCreating(true);
      const sale = await api.createSale(token, {
        customerId: isEmployee ? selectedCustomer?.customerId : undefined,
        paymentStatus: isEmployee ? paymentStatus : undefined,
        dueDate: isEmployee && paymentStatus !== "Paid" && dueDate ? new Date(`${dueDate}T00:00:00Z`).toISOString() : undefined,
        items: cart.map((i) => ({ partId: i.partId, quantity: i.quantity })),
        notes: notes || undefined,
      });
      toast.success("Purchase completed successfully!");
      setCart([]); setNotes("");
      setPaymentStatus("Paid");
      setDueDate("");
      navigate(`/app/sales/${sale.saleId}`);
    } catch { toast.error("Failed to complete purchase."); }
    finally { setIsCreating(false); }
  };

  if (partsLoading) {
    return <PageShell><div className="space-y-4"><div className="h-8 rounded-md bg-surface-container-high animate-shimmer" /><div className="h-64 rounded-xl border border-outline-variant/20 animate-shimmer" /></div></PageShell>;
  }

  return (
    <PageShell>
      <PageHeader title="Shop Parts" description="Browse and purchase vehicle parts." />

      {partsError ? <AlertBox tone="error" message={partsError} dismissible /> : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card
            header={
              <div>
                <h2 className="text-base font-semibold text-on-surface">AI Shop Insights</h2>
                <p className="text-sm text-on-surface-variant">Live inventory and alert-driven guidance for this shop session.</p>
              </div>
            }
          >
            {insightsLoading ? (
              <p className="text-sm text-on-surface-variant">Analyzing inventory, demand, and alert signals...</p>
            ) : insightsError ? (
              <p className="text-sm text-danger-600">{insightsError}</p>
            ) : showInsights ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Top demand categories</p>
                  {topCategories.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {topCategories.map((category) => (
                        <Badge key={category.label} variant="info">
                          {category.label} · {category.count}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-on-surface-variant">Demand trends will appear once category signals are available.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Cart pressure</p>
                  {cartSignals.length > 0 ? (
                    <div className="space-y-2">
                      {cartSignals.map((signal) => (
                        <div key={signal.partId} className="rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-800 ring-1 ring-warning-100">
                          {signal.partName} is already at its reorder threshold: {signal.stockQuantity} left against a target of {signal.reorderLevel}.
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-on-surface-variant">Your current cart is not putting additional pressure on low-stock inventory.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Stock to watch</p>
                  {lowStockWatchlist.length > 0 ? (
                    <div className="space-y-2">
                      {lowStockWatchlist.map((part) => (
                        <div key={part.partId} className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low px-3 py-2 ring-1 ring-white/[0.06]">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-on-surface">{part.partName}</p>
                            <p className="text-[11px] text-on-surface-variant">{part.partNumber}{part.categoryName ? ` · ${part.categoryName}` : ""}</p>
                          </div>
                          <Badge variant="warning">{part.stockQuantity}/{part.reorderLevel}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-on-surface-variant">No urgent stock warnings are active right now.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Customer signals</p>
                  {currentInsightCustomer && predictiveSignals.length > 0 ? (
                    <div className="space-y-2">
                      {predictiveSignals.map((alert) => (
                        <div key={alert.predictiveAlertId} className="rounded-lg bg-primary-container/40 px-3 py-2 text-xs text-on-surface ring-1 ring-white/[0.06]">
                          <p className="font-medium">{alert.vehicleNumber}{alert.partName ? ` · ${alert.partName}` : ""}</p>
                          <p className="text-on-surface-variant mt-1">{alert.alertMessage}</p>
                        </div>
                      ))}
                    </div>
                  ) : currentInsightCustomer ? (
                    <p className="text-xs text-on-surface-variant">No predictive part signals are active for {currentInsightCustomer.fullName} right now.</p>
                  ) : (
                    <p className="text-xs text-on-surface-variant">Select a customer to unlock customer-specific maintenance and part-risk insights.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">The catalog is healthy right now, so there are no additional insight signals to surface.</p>
            )}
          </Card>

          {inStockParts.length === 0 ? (
            <Card><p className="text-sm text-on-surface-variant text-center py-8">No parts are currently in stock.</p></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inStockParts.map((part) => (
                <Card key={part.partId}>
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-lg bg-surface-container-low ring-1 ring-white/[0.08]">
                      {resolveBackendAssetUrl(part.imageUrl) ? (
                        <img
                          src={resolveBackendAssetUrl(part.imageUrl) ?? undefined}
                          alt={part.partName}
                          className="h-40 w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-40 items-center justify-center px-4 text-center text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                          {part.partNumber}
                        </div>
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-on-surface">{part.partName}</h3>
                        <p className="text-xs text-on-surface-variant">{part.partNumber}{part.categoryName ? ` · ${part.categoryName}` : ""}</p>
                      </div>
                      <Badge variant={part.stockQuantity > 10 ? "success" : "warning"}>In stock: {part.stockQuantity}</Badge>
                    </div>
                    {part.description ? (
                      <p className="text-xs leading-5 text-on-surface-variant">{part.description}</p>
                    ) : null}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-lg font-bold text-on-surface">${part.unitPrice.toFixed(2)}</span>
                      <ActionButton size="sm" icon={ShoppingCart} onClick={() => addToCart(part.partId, part.partName, part.unitPrice)}>Add to Cart</ActionButton>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card
            header={<h2 className="text-base font-semibold text-on-surface">Cart ({cart.length})</h2>}
          >
            {isEmployee && (
              <div className="mb-4 pb-4 border-b border-white/[0.06] space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2"><User className="w-4 h-4" /> Select Customer</h3>
                  <p className="text-xs text-on-surface-variant">Staff purchases must be assigned to a customer. Use the dropdown or narrow the directory below.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Customer directory</label>
                  <p className="mb-2 text-[11px] text-on-surface-variant">{registeredCustomerCount} registered account{registeredCustomerCount === 1 ? "" : "s"} prioritized for faster staff checkout.</p>
                  <select
                    className="input text-xs"
                    value={selectedCustomer?.customerId ?? ""}
                    onChange={(event) => {
                      const customerId = Number(event.target.value);

                      if (!customerId) {
                        setSelectedCustomer(null);
                        return;
                      }

                      const customer = allCustomers.find((item) => item.customerId === customerId) ?? null;
                      setSelectedCustomer(customer);
                    }}
                    disabled={customersLoading || allCustomers.length === 0}
                  >
                    <option value="">{customersLoading ? "Loading customers..." : "Select a customer"}</option>
                    {allCustomers.map((customer) => (
                      <option key={customer.customerId} value={customer.customerId}>
                        {customer.userId ? "Portal" : "Profile"} · {customer.fullName} #{customer.customerId}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCustomer && (
                  <div className="flex items-start justify-between gap-2 p-3 rounded-lg bg-surface-container-low ring-1 ring-white/[0.06]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-on-surface">{selectedCustomer.fullName}</p>
                        <Badge variant={selectedCustomer.userId ? "success" : "neutral"}>{selectedCustomer.userId ? "Portal account" : "Staff-created profile"}</Badge>
                      </div>
                      <p className="text-xs text-on-surface-variant">Customer #{selectedCustomer.customerId} · {selectedCustomer.phoneNumber}</p>
                    </div>
                    <ActionButton size="sm" tone="secondary" onClick={() => setSelectedCustomer(null)}>Clear</ActionButton>
                  </div>
                )}

                {searchError ? <AlertBox tone="error" message={searchError} dismissible /> : null}

                <form onSubmit={handleCustomerSearch} className="space-y-2">
                  <p className="text-[11px] text-on-surface-variant">Optional search filters</p>
                  <input className="input h-8 text-xs" type="text" inputMode="numeric" placeholder="Customer ID" value={searchValues.customerId}
                    onChange={(e) => setSearchValues((prev) => ({ ...prev, customerId: e.target.value }))} />
                  <input className="input h-8 text-xs" type="text" placeholder="Phone number" value={searchValues.phoneNumber}
                    onChange={(e) => setSearchValues((prev) => ({ ...prev, phoneNumber: e.target.value }))} />
                  <input className="input h-8 text-xs" type="text" placeholder="Vehicle number" value={searchValues.vehicleNumber}
                    onChange={(e) => setSearchValues((prev) => ({ ...prev, vehicleNumber: e.target.value }))} />
                  <input className="input h-8 text-xs" type="text" placeholder="Customer name" value={searchValues.name}
                    onChange={(e) => setSearchValues((prev) => ({ ...prev, name: e.target.value }))} />
                  <div className="flex gap-2">
                    <ActionButton type="submit" size="sm" icon={Search} disabled={isSearching}>{isSearching ? "Searching..." : "Search"}</ActionButton>
                    <ActionButton type="button" size="sm" tone="secondary" icon={X} onClick={resetCustomerSearch}>Reset</ActionButton>
                  </div>
                </form>

                {hasSearchRun && customerResults.length === 0 && <p className="text-xs text-on-surface-variant">No customers found.</p>}

                {customerResults.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {customerResults.map((c) => (
                      <div key={c.customerId} className="flex items-center justify-between gap-2 p-2 rounded ring-1 ring-white/[0.06]">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-medium text-on-surface">{c.fullName}</p>
                            <Badge variant={c.userId ? "success" : "neutral"}>{c.userId ? "Portal" : "Profile"}</Badge>
                          </div>
                          <p className="text-[10px] text-on-surface-variant">#{c.customerId} &middot; {c.vehicleCount} vehicle{c.vehicleCount === 1 ? "" : "s"}</p>
                        </div>
                        <ActionButton size="sm" tone={selectedCustomer?.customerId === c.customerId ? "filled" : "tonal"} onClick={() => setSelectedCustomer(c)}>
                          {selectedCustomer?.customerId === c.customerId ? "Selected" : "Select"}
                        </ActionButton>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {cart.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-4">Your cart is empty.</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.partId} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-on-surface">{item.partName}</p>
                      <p className="text-[10px] text-on-surface-variant">${item.unitPrice.toFixed(2)} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <input type="number" min="1" value={item.quantity} className="w-12 h-7 text-xs border border-outline-variant/20 rounded px-1 text-center"
                        onChange={(e) => updateQuantity(item.partId, Number(e.target.value))} />
                      <button type="button" onClick={() => removeFromCart(item.partId)} className="p-1 text-danger-500 hover:text-danger-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-sm text-on-surface pt-2 border-t border-white/[0.06]">
                  <span>Total:</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                {isEmployee && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <div>
                      <label className="block text-xs font-medium text-on-surface-variant mb-1">Payment status</label>
                      <select className="input text-xs" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Credit">Credit</option>
                      </select>
                    </div>
                    {paymentStatus !== "Paid" && (
                      <div>
                        <label className="block text-xs font-medium text-on-surface-variant mb-1">Due date</label>
                        <input className="input text-xs" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                      </div>
                    )}
                  </div>
                )}
                <textarea className="input h-16 text-xs" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (Optional)" />
                <ActionButton className="w-full" disabled={isCreating} onClick={handleCheckout}>
                  {isCreating ? "Processing..." : "Checkout"}
                </ActionButton>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
