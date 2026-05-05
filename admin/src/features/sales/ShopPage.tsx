import { useState, type FormEvent } from "react";
import { ShoppingCart, Trash2, Search, X, User } from "lucide-react";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { CustomerSearchInput, CustomerSearchResult } from "../../app/types";
import { useGetPartsQuery } from "../../redux/services/parts";
import { useCreateSaleMutation } from "../../redux/services/sales";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { toast } from "react-toastify";

interface CartItem { partId: number; partName: string; unitPrice: number; quantity: number; }

type SearchFormState = { customerId: string; phoneNumber: string; vehicleNumber: string; name: string; };

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
  const { user, token } = useAuth();
  const { data: parts = [], isLoading: partsLoading } = useGetPartsQuery();
  const [createSale, { isLoading: isCreating }] = useCreateSaleMutation();
  const isEmployee = user?.role === "Admin" || user?.role === "Staff";

  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const inStockParts = parts.filter((p) => p.stockQuantity > 0);
  const [searchValues, setSearchValues] = useState<SearchFormState>({ customerId: "", phoneNumber: "", vehicleNumber: "", name: "" });
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearchRun, setHasSearchRun] = useState(false);

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
      setCustomerResults(results); setHasSearchRun(true);
      if (selectedCustomer && results.every((c) => c.customerId !== selectedCustomer.customerId)) setSelectedCustomer(null);
    } catch (error) { setSearchError(error instanceof ApiError ? error.message : "Could not search customers."); setCustomerResults([]); setHasSearchRun(true); }
    finally { setIsSearching(false); }
  };

  const resetCustomerSearch = () => {
    setSearchValues({ customerId: "", phoneNumber: "", vehicleNumber: "", name: "" });
    setCustomerResults([]); setSearchError(null); setSelectedCustomer(null); setHasSearchRun(false);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error("Your cart is empty."); return; }
    if (isEmployee && !selectedCustomer) { toast.error("Select a customer before checkout."); return; }
    try {
      await createSale({ customerId: isEmployee ? selectedCustomer?.customerId : undefined, items: cart.map((i) => ({ partId: i.partId, quantity: i.quantity })), notes: notes || undefined }).unwrap();
      toast.success("Purchase completed successfully!");
      setCart([]); setNotes("");
    } catch { toast.error("Failed to complete purchase."); }
  };

  if (partsLoading) {
    return <PageShell><div className="space-y-4"><div className="h-8 rounded-md bg-surface-container-high animate-shimmer" /><div className="h-64 rounded-xl border border-outline-variant/20 animate-shimmer" /></div></PageShell>;
  }

  return (
    <PageShell>
      <PageHeader title="Shop Parts" description="Browse and purchase vehicle parts." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {inStockParts.length === 0 ? (
            <Card><p className="text-sm text-on-surface-variant text-center py-8">No parts are currently in stock.</p></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inStockParts.map((part) => (
                <Card key={part.partId}>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-on-surface">{part.partName}</h3>
                        <p className="text-xs text-on-surface-variant">{part.partNumber}</p>
                      </div>
                      <Badge variant={part.stockQuantity > 10 ? "success" : "warning"}>In stock: {part.stockQuantity}</Badge>
                    </div>
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
                  <p className="text-xs text-on-surface-variant">Staff purchases must be assigned to a customer.</p>
                </div>

                {selectedCustomer && (
                  <div className="flex items-start justify-between gap-2 p-3 rounded-lg bg-surface-container-low ring-1 ring-white/[0.06]">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-on-surface">{selectedCustomer.fullName}</p>
                      <p className="text-xs text-on-surface-variant">Customer #{selectedCustomer.customerId}</p>
                    </div>
                    <ActionButton size="sm" tone="secondary" onClick={() => setSelectedCustomer(null)}>Clear</ActionButton>
                  </div>
                )}

                {searchError ? <AlertBox tone="error" message={searchError} dismissible /> : null}

                <form onSubmit={handleCustomerSearch} className="space-y-2">
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
                          <p className="text-xs font-medium text-on-surface">{c.fullName}</p>
                          <p className="text-[10px] text-on-surface-variant">#{c.customerId} &middot; {c.vehicleCount} vehicle{c.vehicleCount === 1 ? "" : "s"}</p>
                        </div>
                        <ActionButton size="sm" tone={selectedCustomer?.customerId === c.customerId ? "primary" : "secondary"} onClick={() => setSelectedCustomer(c)}>
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
