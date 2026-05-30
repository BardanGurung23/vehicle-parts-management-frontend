import { useEffect, useMemo, useRef, useState, forwardRef } from "react";
import {
  ShoppingCart,
  Trash2,
  Package,
  Plus,
  Minus,
  User,
  Heart,
  ShieldCheck,
  Truck,
  Sparkles,
  Clock,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type {
  CustomerSearchResult,
  DashboardSummary,
  Part,
} from "../../app/types";
import { PageShell } from "../../shared/components/PageShell";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { SearchInput } from "../../shared/components/SearchInput";
import { Field } from "../../shared/components/Field";
import { EmptyState } from "../../shared/components/EmptyState";
import { CustomerPicker } from "./components/CustomerPicker";
import { ProductCard } from "./components/ProductCard";
import { ShopFilters } from "./components/ShopFilters";
import {
  defaultFilters,
  formatMoney,
  getProductPromotion,
  getProductRating,
  pushRecentlyViewed,
  readRecentlyViewed,
  readWishlist,
  SHOP_FREE_SHIPPING_THRESHOLD,
  SORT_OPTIONS,
  writeWishlist,
  type ShopFilterState,
  type SortOption,
} from "./utils/shopHelpers";

/**
 * ShopPage — the storefront a logged-in customer (or staff member) lands on
 * after signing in.
 *
 * The page is composed of:
 *   1. Personalized welcome banner ("Welcome back, {name}").
 *   2. Trust-signal strip (secure checkout, free shipping, returns).
 *   3. Sticky shop subheader: search + wishlist + cart-summary pills.
 *   4. Faceted filter rail (left on desktop, accordion on mobile).
 *   5. Product grid with rich product cards.
 *   6. Recommended-for-you and recently-viewed rails.
 *   7. Side cart (drawer on small screens, sticky on desktop).
 *
 * The page preserves the staff-facing employee-assisted checkout flow: when
 * the signed-in user is staff or admin, a customer picker appears and the
 * payment status / due date controls are surfaced inside the cart, with a
 * low-stock watchlist beside the catalog.
 */

interface CartItem {
  partId: number;
  partName: string;
  unitPrice: number;
  quantity: number;
}

function sortCustomerDirectory(customers: CustomerSearchResult[]) {
  return [...customers].sort((left, right) => {
    const accountDelta = Number(Boolean(right.userId)) - Number(Boolean(left.userId));
    if (accountDelta !== 0) return accountDelta;
    const nameDelta = left.fullName.localeCompare(right.fullName);
    if (nameDelta !== 0) return nameDelta;
    return left.customerId - right.customerId;
  });
}

export function ShopPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const isEmployee = user?.role === "Admin" || user?.role === "Staff";
  const isCustomer = user?.role === "Customer";

  /* ---------------------------------------------------------------------- */
  /*                                  data                                  */
  /* ---------------------------------------------------------------------- */
  const [parts, setParts] = useState<Part[]>([]);
  const [partsLoading, setPartsLoading] = useState(true);
  const [partsError, setPartsError] = useState<string | null>(null);

  const [insightsSummary, setInsightsSummary] = useState<DashboardSummary | null>(null);

  const [allCustomers, setAllCustomers] = useState<CustomerSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [customersLoading, setCustomersLoading] = useState(false);

  /* ---------------------------------------------------------------------- */
  /*                                cart state                              */
  /* ---------------------------------------------------------------------- */
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [dueDate, setDueDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ShopFilterState>(defaultFilters(0));
  const [wishlist, setWishlist] = useState<number[]>(() => readWishlist());
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>(() => readRecentlyViewed());
  // Staff/admin checkout requires a customer + payment-status step that
  // both live inside the cart, so the cart drawer is opened by default for
  // them. Customers see a slim catalog-first layout and open the cart on
  // demand.
  const [isCartOpen, setIsCartOpen] = useState<boolean>(() => isEmployee);
  const [highlightedItemId, setHighlightedItemId] = useState<number | null>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);

  /* ---------------------------------------------------------------------- */
  /*                                  loaders                               */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!token) {
      setParts([]);
      setPartsLoading(false);
      return;
    }
    let isActive = true;
    setPartsLoading(true);
    void api
      .getParts(token)
      .then((response) => {
        if (!isActive) return;
        setParts(response);
        setPartsError(null);
      })
      .catch((loadError: unknown) => {
        if (!isActive) return;
        setParts([]);
        setPartsError(
          loadError instanceof ApiError
            ? loadError.message
            : "Could not load inventory.",
        );
      })
      .finally(() => {
        if (isActive) setPartsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      setInsightsSummary(null);
      return;
    }
    let isActive = true;
    void api
      .getDashboardSummary(token)
      .then((response) => {
        if (isActive) setInsightsSummary(response);
      })
      .catch(() => {
        if (isActive) setInsightsSummary(null);
      });
    return () => {
      isActive = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token || !isEmployee) {
      setAllCustomers([]);
      return;
    }
    let isActive = true;
    setCustomersLoading(true);
    void api
      .getCustomers(token)
      .then((results) => {
        if (!isActive) return;
        const ordered = sortCustomerDirectory(results);
        setAllCustomers(ordered);
      })
      .catch(() => {
        if (!isActive) return;
        setAllCustomers([]);
      })
      .finally(() => {
        if (isActive) setCustomersLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [isEmployee, token]);

  /* ---------------------------------------------------------------------- */
  /*                                derived                                 */
  /* ---------------------------------------------------------------------- */
  const priceMax = useMemo(() => {
    const ceiling = parts.reduce((max, p) => Math.max(max, p.unitPrice), 0);
    return Math.max(1, Math.ceil(ceiling));
  }, [parts]);

  // Initialize / re-sync the price ceiling whenever the catalog changes.
  useEffect(() => {
    setFilters((prev) => {
      if (prev.priceMax === 0 || prev.priceMax > priceMax) {
        return { ...prev, priceMax };
      }
      return prev;
    });
  }, [priceMax]);

  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    parts.forEach((part) => {
      const name = part.categoryName?.trim() || "Uncategorized";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [parts]);

  const filteredParts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parts
      .filter((part) => {
        // Stock filter
        if (filters.inStockOnly && part.stockQuantity <= 0) return false;
        // Category filter
        if (filters.categories.length > 0) {
          const name = part.categoryName?.trim() || "Uncategorized";
          if (!filters.categories.includes(name)) return false;
        }
        // Price filter
        if (part.unitPrice > filters.priceMax) return false;
        // Rating filter (synthetic but deterministic per partId)
        if (filters.minRating > 0) {
          const { rating } = getProductRating(part);
          if (rating < filters.minRating) return false;
        }
        // On-sale filter
        if (filters.onSaleOnly && getProductPromotion(part).discountPercent === 0) {
          return false;
        }
        // Search
        if (q) {
          const haystack = [
            part.partName,
            part.partNumber,
            part.categoryName ?? "",
            part.description ?? "",
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => sortParts(a, b, filters.sort));
  }, [parts, filters, search]);

  const cartTotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const lowStockWatchlist = insightsSummary?.inventory?.lowStockParts?.slice(0, 3) ?? [];

  const partsById = useMemo(() => {
    const map = new Map<number, Part>();
    parts.forEach((p) => map.set(p.partId, p));
    return map;
  }, [parts]);

  const wishlistedParts = useMemo(
    () =>
      wishlist
        .map((id) => partsById.get(id))
        .filter((p): p is Part => Boolean(p)),
    [wishlist, partsById],
  );

  const recentlyViewedParts = useMemo(
    () =>
      recentlyViewed
        .map((id) => partsById.get(id))
        .filter((p): p is Part => Boolean(p))
        .slice(0, 6),
    [recentlyViewed, partsById],
  );

  const recommendedParts = useMemo(() => {
    if (parts.length === 0) return [];
    const cartIds = new Set(cart.map((i) => i.partId));
    const recentSet = new Set(recentlyViewed);
    const candidates = parts.filter(
      (p) => !cartIds.has(p.partId) && p.stockQuantity > 0,
    );
    // Score: in-stock + on-sale + matching recent categories.
    const recentCategories = new Set(
      recentlyViewed
        .map((id) => partsById.get(id)?.categoryName ?? "")
        .filter(Boolean),
    );
    return [...candidates]
      .map((part) => {
        const promo = getProductPromotion(part);
        const { rating } = getProductRating(part);
        let score = rating;
        if (promo.discountPercent > 0) score += 1;
        if (
          part.categoryName &&
          recentCategories.has(part.categoryName)
        )
          score += 1.5;
        if (recentSet.has(part.partId)) score -= 5;
        return { part, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((entry) => entry.part);
  }, [parts, cart, recentlyViewed, partsById]);

  const freeShippingProgress = Math.min(
    1,
    cartTotal / SHOP_FREE_SHIPPING_THRESHOLD,
  );
  const freeShippingRemainder = Math.max(
    0,
    SHOP_FREE_SHIPPING_THRESHOLD - cartTotal,
  );

  /* ---------------------------------------------------------------------- */
  /*                                handlers                                */
  /* ---------------------------------------------------------------------- */
  const trackRecent = (partId: number) => {
    const next = pushRecentlyViewed(partId);
    setRecentlyViewed(next);
  };

  const addToCart = (part: Part) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.partId === part.partId);
      return existing
        ? prev.map((i) =>
            i.partId === part.partId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          )
        : [
            ...prev,
            {
              partId: part.partId,
              partName: part.partName,
              unitPrice: part.unitPrice,
              quantity: 1,
            },
          ];
    });
    trackRecent(part.partId);
    setHighlightedItemId(part.partId);
    window.setTimeout(() => {
      setHighlightedItemId((current) =>
        current === part.partId ? null : current,
      );
    }, 1400);
    toast.success(`Added ${part.partName} to cart`, {
      action: {
        label: "View cart",
        onClick: () => setIsCartOpen(true),
      },
    });
  };

  const updateQuantity = (partId: number, quantity: number) => {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.partId !== partId)
        : prev.map((i) => (i.partId === partId ? { ...i, quantity } : i)),
    );
  };

  const removeFromCart = (partId: number) =>
    setCart((prev) => prev.filter((i) => i.partId !== partId));

  const toggleWishlist = (part: Part) => {
    setWishlist((prev) => {
      const exists = prev.includes(part.partId);
      const next = exists
        ? prev.filter((id) => id !== part.partId)
        : [part.partId, ...prev];
      writeWishlist(next);
      toast.success(
        exists
          ? `Removed ${part.partName} from wishlist`
          : `Saved ${part.partName} to wishlist`,
      );
      return next;
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    if (isEmployee && !selectedCustomer) {
      toast.error("Select a customer before checkout.");
      return;
    }
    if (!token) {
      toast.error("Your session expired. Sign in again.");
      return;
    }
    if (isEmployee && paymentStatus !== "Paid" && !dueDate) {
      toast.error("Choose a due date for pending or credit sales.");
      return;
    }
    try {
      setIsCreating(true);
      const sale = await api.createSale(token, {
        customerId: isEmployee ? selectedCustomer?.customerId : undefined,
        paymentStatus: isEmployee ? paymentStatus : undefined,
        dueDate:
          isEmployee && paymentStatus !== "Paid" && dueDate
            ? new Date(`${dueDate}T00:00:00Z`).toISOString()
            : undefined,
        items: cart.map((i) => ({ partId: i.partId, quantity: i.quantity })),
        notes: notes || undefined,
      });
      toast.success("Purchase completed");
      setCart([]);
      setNotes("");
      setPaymentStatus("Paid");
      setDueDate("");
      setIsCartOpen(false);
      navigate(`/app/sales/${sale.saleId}`);
    } catch {
      toast.error("Could not complete the purchase.");
    } finally {
      setIsCreating(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /*                              loading state                             */
  /* ---------------------------------------------------------------------- */
  if (partsLoading) {
    return (
      <PageShell>
        <SkeletonCard />
        <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-6">
          <SkeletonCard />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </PageShell>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*                                  view                                  */
  /* ---------------------------------------------------------------------- */
  return (
    <PageShell>
      {partsError ? <AlertBox tone="error" message={partsError} dismissible /> : null}

      {/* ---------------------------------------------------------------- */}
      {/*                       sticky shop subheader                      */}
      {/* ---------------------------------------------------------------- */}
      <div
        className="sticky z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-[var(--md-sys-color-background)] border-b border-[var(--md-sys-color-outline-variant)]"
        style={{ top: 56 }}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search 1000+ parts by name, number, or category"
              onClear={() => setSearch("")}
              aria-label="Search products"
            />
          </div>
          <div className="hidden md:flex items-center gap-2">
            <label
              htmlFor="shop-sort"
              className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]"
            >
              Sort
            </label>
            <select
              id="shop-sort"
              value={filters.sort}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  sort: event.target.value as SortOption,
                })
              }
              className="!min-h-0 !h-9 !w-auto !py-0 !pr-8 text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            aria-label={`Wishlist (${wishlist.length} ${wishlist.length === 1 ? "item" : "items"})`}
            className="relative inline-flex items-center justify-center w-10 h-9 rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:border-[var(--md-sys-color-outline)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]"
          >
            <Heart
              className="w-4 h-4"
              fill={wishlist.length > 0 ? "currentColor" : "none"}
              aria-hidden="true"
            />
            {wishlist.length > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] inline-flex items-center justify-center px-1 rounded-full bg-[var(--danger-500)] text-white text-[10px] font-semibold border-2 border-[var(--md-sys-color-background)]">
                {wishlist.length}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/*                            main grid                             */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6 items-start">
        {/* Filters rail */}
        <ShopFilters
          value={filters}
          onChange={setFilters}
          categoryOptions={categoryOptions}
          priceMax={priceMax}
          matchingCount={filteredParts.length}
          totalCount={parts.length}
        />

        {/* Catalog + recommendations */}
        <div className="space-y-6 min-w-0">
          {/* Active filter chips */}
          <ActiveFilterChips
            filters={filters}
            onChange={setFilters}
            priceMax={priceMax}
          />

          {/* Catalog */}
          <Card bodyless>
            <div className="px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between gap-3">
              <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
                {filteredParts.length} item{filteredParts.length === 1 ? "" : "s"}
                {parts.length > 0
                  ? ` of ${parts.length}`
                  : ""}
              </p>
              <p className="hidden sm:flex items-center gap-1.5 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                <ShieldCheck
                  className="w-3.5 h-3.5 text-[var(--success-600)]"
                  aria-hidden="true"
                />
                Verified inventory
              </p>
            </div>

            {filteredParts.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  embedded
                  icon={Package}
                  title="No parts match your filters"
                  description={
                    parts.length === 0
                      ? "Inventory will appear here once parts are stocked."
                      : "Try clearing a filter or using a different search term."
                  }
                  action={
                    parts.length > 0 ? (
                      <ActionButton
                        tone="secondary"
                        size="sm"
                        onClick={() => {
                          setSearch("");
                          setFilters(defaultFilters(priceMax));
                        }}
                      >
                        Clear filters
                      </ActionButton>
                    ) : null
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                {filteredParts.map((part) => {
                  const inCart =
                    cart.find((i) => i.partId === part.partId)?.quantity ?? 0;
                  return (
                    <ProductCard
                      key={part.partId}
                      part={part}
                      inWishlist={wishlist.includes(part.partId)}
                      inCartCount={inCart}
                      onAdd={() => addToCart(part)}
                      onToggleWishlist={() => toggleWishlist(part)}
                      onPeek={() => trackRecent(part.partId)}
                    />
                  );
                })}
              </div>
            )}
          </Card>

          {/* Recommended for you */}
          {recommendedParts.length > 0 ? (
            <ProductRail
              title={isCustomer ? "Recommended for you" : "Featured picks"}
              icon={Sparkles}
              description={
                isCustomer
                  ? "Selected based on what you've browsed and what's trending in your categories."
                  : "Highly rated stock to suggest at the counter."
              }
              parts={recommendedParts}
              cart={cart}
              wishlist={wishlist}
              onAdd={addToCart}
              onToggleWishlist={toggleWishlist}
              onPeek={(p) => trackRecent(p.partId)}
            />
          ) : null}

          {/* Recently viewed */}
          {recentlyViewedParts.length > 0 ? (
            <ProductRail
              title="Recently viewed"
              icon={Clock}
              description="Pick up where you left off."
              parts={recentlyViewedParts}
              cart={cart}
              wishlist={wishlist}
              onAdd={addToCart}
              onToggleWishlist={toggleWishlist}
              onPeek={(p) => trackRecent(p.partId)}
            />
          ) : null}

          {/* Wishlist quick rail */}
          {wishlistedParts.length > 0 ? (
            <ProductRail
              title="Saved for later"
              icon={Heart}
              description="Items in your wishlist."
              parts={wishlistedParts.slice(0, 6)}
              cart={cart}
              wishlist={wishlist}
              onAdd={addToCart}
              onToggleWishlist={toggleWishlist}
              onPeek={(p) => trackRecent(p.partId)}
            />
          ) : null}

          {/* Low-stock watchlist (employees only) */}
          {isEmployee && lowStockWatchlist.length > 0 ? (
            <Card
              header={
                <div>
                  <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
                    Low-stock watchlist
                  </h3>
                  <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                    Stock to keep an eye on while you sell.
                  </p>
                </div>
              }
            >
              <ul className="-mt-2 divide-y divide-[var(--md-sys-color-outline-variant)]">
                {lowStockWatchlist.map((alert) => (
                  <li
                    key={alert.partId}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <span className="text-[var(--md-sys-color-on-surface)] truncate">
                      {alert.partName}
                    </span>
                    <Badge variant="warning">
                      {alert.stockQuantity}/{alert.reorderLevel}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/*                              cart                                */}
      {/* ---------------------------------------------------------------- */}
      <CartPanel
        open={isCartOpen}
        onClose={() => {
          setIsCartOpen(false);
          window.setTimeout(
            () => cartButtonRef.current?.focus({ preventScroll: true }),
            0,
          );
        }}
        isEmployee={isEmployee}
        token={token ?? ""}
        cart={cart}
        cartTotal={cartTotal}
        cartCount={cartCount}
        notes={notes}
        setNotes={setNotes}
        paymentStatus={paymentStatus}
        setPaymentStatus={setPaymentStatus}
        dueDate={dueDate}
        setDueDate={setDueDate}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        isCreating={isCreating}
        onCheckout={handleCheckout}
        allCustomers={allCustomers}
        customersLoading={customersLoading}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        onCustomersFetched={(results) => {
          setAllCustomers((prev) => {
            const byId = new Map(prev.map((c) => [c.customerId, c]));
            results.forEach((c) => byId.set(c.customerId, c));
            return sortCustomerDirectory(Array.from(byId.values()));
          });
        }}
        freeShippingProgress={freeShippingProgress}
        freeShippingRemainder={freeShippingRemainder}
        highlightedItemId={highlightedItemId}
      />

      {/* ---------------------------------------------------------------- */}
      {/*                       floating cart launcher                     */}
      {/* ---------------------------------------------------------------- */}
      <CartLauncher
        ref={cartButtonRef}
        cartCount={cartCount}
        cartTotal={cartTotal}
        hidden={isCartOpen}
        onClick={() => setIsCartOpen(true)}
      />
    </PageShell>
  );
}

/* ============================================================================
 * CartLauncher — viewport-anchored floating button that opens the cart.
 *
 * Pinned to the right edge of the screen so it's reachable from anywhere on
 * the page. It is rendered outside the document flow so it never widens the
 * page (no horizontal scroll), and disappears while the cart drawer is
 * open to avoid stacking with the close button.
 * ========================================================================= */
const CartLauncher = forwardRef<
  HTMLButtonElement,
  {
    cartCount: number;
    cartTotal: number;
    hidden: boolean;
    onClick: () => void;
  }
>(function CartLauncher({ cartCount, cartTotal, hidden, onClick }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={`Open cart (${cartCount} ${cartCount === 1 ? "item" : "items"}, total ${formatMoney(cartTotal)})`}
      className={[
        "fixed right-0 top-1/2 -translate-y-1/2 z-30",
        "flex flex-col items-center gap-1.5",
        "px-2.5 py-3 rounded-l-xl",
        "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]",
        "shadow-level3 border-y border-l border-[var(--md-sys-color-primary)]",
        "transition-[opacity,transform] duration-200 ease-standard",
        "hover:pr-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--md-sys-color-background)]",
        hidden
          ? "opacity-0 pointer-events-none translate-x-full"
          : "opacity-100 pointer-events-auto translate-x-0",
      ].join(" ")}
    >
      <span className="relative inline-flex items-center justify-center">
        <ShoppingCart className="w-5 h-5" aria-hidden="true" />
        {cartCount > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -top-2 -right-2 min-w-[18px] h-[18px] inline-flex items-center justify-center px-1 rounded-full bg-white text-[var(--md-sys-color-primary)] text-[10px] font-bold tabular border border-[var(--md-sys-color-primary)] shadow-level1"
          >
            {cartCount}
          </span>
        ) : null}
      </span>
      <span className="text-[10px] font-semibold tabular leading-none">
        {formatMoney(cartTotal)}
      </span>
    </button>
  );
});

/* ============================================================================
 * Sorting
 * ========================================================================= */
function sortParts(a: Part, b: Part, sort: SortOption): number {
  switch (sort) {
    case "price-asc":
      return a.unitPrice - b.unitPrice;
    case "price-desc":
      return b.unitPrice - a.unitPrice;
    case "rating": {
      const ra = getProductRating(a).rating;
      const rb = getProductRating(b).rating;
      if (ra !== rb) return rb - ra;
      return a.partName.localeCompare(b.partName);
    }
    case "newest": {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return db - da;
    }
    case "featured":
    default: {
      // Featured: on-sale first, then in-stock, then alphabetical.
      const sa = getProductPromotion(a).discountPercent > 0 ? 1 : 0;
      const sb = getProductPromotion(b).discountPercent > 0 ? 1 : 0;
      if (sa !== sb) return sb - sa;
      const stockA = a.stockQuantity > 0 ? 1 : 0;
      const stockB = b.stockQuantity > 0 ? 1 : 0;
      if (stockA !== stockB) return stockB - stockA;
      return a.partName.localeCompare(b.partName);
    }
  }
}

/* ============================================================================
 * ActiveFilterChips — quick-removable summary of currently active filters.
 * ========================================================================= */
function ActiveFilterChips({
  filters,
  onChange,
  priceMax,
}: {
  filters: ShopFilterState;
  onChange: (next: ShopFilterState) => void;
  priceMax: number;
}) {
  const chips: { key: string; label: string; clear: () => void }[] = [];

  filters.categories.forEach((category) => {
    chips.push({
      key: `cat-${category}`,
      label: category,
      clear: () =>
        onChange({
          ...filters,
          categories: filters.categories.filter((c) => c !== category),
        }),
    });
  });

  if (filters.priceMax < priceMax) {
    chips.push({
      key: "price",
      label: `Up to ${formatMoney(filters.priceMax)}`,
      clear: () => onChange({ ...filters, priceMax }),
    });
  }

  if (filters.minRating > 0) {
    chips.push({
      key: "rating",
      label: `${filters.minRating}★ & up`,
      clear: () => onChange({ ...filters, minRating: 0 }),
    });
  }

  if (filters.onSaleOnly) {
    chips.push({
      key: "sale",
      label: "On sale",
      clear: () => onChange({ ...filters, onSaleOnly: false }),
    });
  }

  if (!filters.inStockOnly) {
    chips.push({
      key: "include-out",
      label: "Including out of stock",
      clear: () => onChange({ ...filters, inStockOnly: true }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--md-sys-color-on-surface-variant)] mr-1">
        Active
      </span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.clear}
          className="inline-flex items-center gap-1 h-7 px-2 rounded-full text-[12px] bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-100)] hover:bg-[var(--brand-100)] transition-colors"
        >
          <span>{chip.label}</span>
          <X className="w-3 h-3" aria-hidden="true" />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
    </div>
  );
}

/* ============================================================================
 * ProductRail — horizontally-scrollable shelf for related products.
 * ========================================================================= */
function ProductRail({
  title,
  icon: Icon,
  description,
  parts,
  cart,
  wishlist,
  onAdd,
  onToggleWishlist,
  onPeek,
}: {
  title: string;
  icon: React.ElementType;
  description?: string;
  parts: Part[];
  cart: CartItem[];
  wishlist: number[];
  onAdd: (part: Part) => void;
  onToggleWishlist: (part: Part) => void;
  onPeek: (part: Part) => void;
}) {
  if (parts.length === 0) return null;
  return (
    <section
      aria-label={title}
      className="rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] overflow-hidden"
    >
      <header className="px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)] flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[14px] font-semibold text-[var(--md-sys-color-on-surface)] inline-flex items-center gap-1.5">
            <Icon
              className="w-4 h-4 text-[var(--md-sys-color-primary)]"
              aria-hidden="true"
            />
            {title}
          </h3>
          {description ? (
            <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              {description}
            </p>
          ) : null}
        </div>
      </header>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {parts.map((part) => {
          const inCart =
            cart.find((i) => i.partId === part.partId)?.quantity ?? 0;
          return (
            <ProductCard
              key={part.partId}
              part={part}
              inWishlist={wishlist.includes(part.partId)}
              inCartCount={inCart}
              onAdd={() => onAdd(part)}
              onToggleWishlist={() => onToggleWishlist(part)}
              onPeek={() => onPeek(part)}
            />
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================================
 * CartPanel — slide-over cart for both customer and employee flows.
 *
 * On large screens the cart sits as a sticky right-rail card (always
 * visible). On small screens it slides in from the right when the cart
 * button is tapped. The same content is reused so behavior stays identical.
 * ========================================================================= */
type CartPanelProps = {
  open: boolean;
  onClose: () => void;
  isEmployee: boolean;
  token: string;
  cart: CartItem[];
  cartTotal: number;
  cartCount: number;
  notes: string;
  setNotes: (next: string) => void;
  paymentStatus: string;
  setPaymentStatus: (next: string) => void;
  dueDate: string;
  setDueDate: (next: string) => void;
  updateQuantity: (partId: number, quantity: number) => void;
  removeFromCart: (partId: number) => void;
  isCreating: boolean;
  onCheckout: () => void;
  allCustomers: CustomerSearchResult[];
  customersLoading: boolean;
  selectedCustomer: CustomerSearchResult | null;
  setSelectedCustomer: (next: CustomerSearchResult | null) => void;
  onCustomersFetched: (results: CustomerSearchResult[]) => void;
  freeShippingProgress: number;
  freeShippingRemainder: number;
  highlightedItemId: number | null;
};

function CartPanel(props: CartPanelProps) {
  const { open, onClose, cartCount, cartTotal, cart } = props;
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape and focus the close button when the drawer opens. We
  // intentionally do NOT lock body scroll: keeping the document scroll
  // independent means the cart can be opened or closed without the page
  // jumping, and `preventScroll` on focus stops the browser from scrolling
  // the just-translated drawer into view.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus({ preventScroll: true });
    }, 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  return (
    <>
      {/*
       * Scrim — only rendered while the drawer is open. The pointer-events
       * toggle lets the rest of the page stay fully interactive otherwise.
       */}
      <div
        className={[
          "fixed inset-0 z-40 bg-[var(--md-sys-color-scrim)] transition-opacity duration-200",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
        aria-hidden="true"
      />

      {/*
       * The cart is a single slide-over drawer at every breakpoint. It
       * opens and closes independently of page scroll — when collapsed the
       * page reflows to the full width with no reserved gutter.
       */}
      <aside
        role="dialog"
        aria-modal={open ? true : undefined}
        aria-hidden={!open}
        aria-label="Shopping cart"
        className={[
          "fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[var(--md-sys-color-surface)] border-l border-[var(--md-sys-color-outline-variant)] shadow-level5 flex flex-col transition-transform duration-200 ease-standard",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--md-sys-color-outline-variant)]">
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
              Cart
            </h2>
            <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
              {cartCount} item{cartCount === 1 ? "" : "s"}
              {cart.length > 0 ? ` · ${formatMoney(cartTotal)}` : ""}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="p-1.5 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <CartContents {...props} onContinueShopping={onClose} />
        </div>
      </aside>
    </>
  );
}

/* ============================================================================
 * CartContents — body of the cart panel (shared between drawer and rail).
 * ========================================================================= */
type CartContentsProps = Omit<CartPanelProps, "open" | "onClose"> & {
  onContinueShopping: () => void;
};

function CartContents({
  isEmployee,
  token,
  cart,
  cartTotal,
  notes,
  setNotes,
  paymentStatus,
  setPaymentStatus,
  dueDate,
  setDueDate,
  updateQuantity,
  removeFromCart,
  isCreating,
  onCheckout,
  onContinueShopping,
  allCustomers,
  customersLoading,
  selectedCustomer,
  setSelectedCustomer,
  onCustomersFetched,
  freeShippingProgress,
  freeShippingRemainder,
  highlightedItemId,
}: CartContentsProps) {
  return (
    <div className="space-y-4">
      {/* Free shipping meter */}
      {cart.length > 0 ? (
        <div className="rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] px-3 py-2.5">
          <div className="flex items-start gap-2">
            <Truck
              className="w-4 h-4 text-[var(--md-sys-color-primary)] mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-[var(--md-sys-color-on-surface)] leading-snug">
                {freeShippingRemainder <= 0 ? (
                  <span className="font-semibold text-[var(--success-700)]">
                    You unlocked free shipping.
                  </span>
                ) : (
                  <>
                    Add{" "}
                    <span className="font-semibold tabular">
                      {formatMoney(freeShippingRemainder)}
                    </span>{" "}
                    more for free shipping.
                  </>
                )}
              </p>
              <div
                className="mt-1.5 h-1.5 w-full rounded-full bg-[var(--md-sys-color-surface-container)]"
                role="progressbar"
                aria-valuenow={Math.round(freeShippingProgress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progress toward free shipping"
              >
                <div
                  className="h-full rounded-full bg-[var(--md-sys-color-primary)] transition-[width] duration-300"
                  style={{ width: `${freeShippingProgress * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Customer picker (employee flow only) */}
      {isEmployee ? (
        <div className="pb-4 border-b border-[var(--md-sys-color-outline-variant)] space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Customer
          </p>
          <CustomerPicker
            token={token}
            customers={allCustomers}
            isLoading={customersLoading}
            selected={selectedCustomer}
            onChange={setSelectedCustomer}
            onSearchResults={onCustomersFetched}
          />
        </div>
      ) : null}

      {cart.length === 0 ? (
        <EmptyState
          embedded
          icon={ShoppingCart}
          title="Cart is empty"
          description="Add parts from the catalog to start a purchase."
          action={
            <ActionButton
              tone="secondary"
              size="sm"
              onClick={onContinueShopping}
            >
              Continue shopping
            </ActionButton>
          }
        />
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2">
            {cart.map((item) => {
              const isHighlighted = item.partId === highlightedItemId;
              return (
                <li
                  key={item.partId}
                  className={[
                    "flex items-center justify-between gap-2 rounded-md transition-colors",
                    isHighlighted
                      ? "bg-[var(--success-50)] -mx-1 px-1 py-1"
                      : "",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[var(--md-sys-color-on-surface)] truncate">
                      {item.partName}
                    </p>
                    <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] tabular">
                      {formatMoney(item.unitPrice)} × {item.quantity}
                      <span className="ml-2 font-semibold text-[var(--md-sys-color-on-surface)]">
                        {formatMoney(item.unitPrice * item.quantity)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${item.partName}`}
                      onClick={() =>
                        updateQuantity(item.partId, item.quantity - 1)
                      }
                      className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="min-w-[20px] text-center text-[12px] tabular">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${item.partName}`}
                      onClick={() =>
                        updateQuantity(item.partId, item.quantity + 1)
                      }
                      className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${item.partName}`}
                      onClick={() => removeFromCart(item.partId)}
                      className="w-7 h-7 inline-flex items-center justify-center rounded-md text-[var(--danger-500)] hover:bg-[var(--danger-50)] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {isEmployee ? (
            <div className="space-y-2 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
              <Field label="Payment status" htmlFor="payment-status">
                <select
                  id="payment-status"
                  value={paymentStatus}
                  onChange={(event) => setPaymentStatus(event.target.value)}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Credit">Credit</option>
                </select>
              </Field>
              {paymentStatus !== "Paid" ? (
                <Field label="Due date" htmlFor="payment-due">
                  <input
                    id="payment-due"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                </Field>
              ) : null}
            </div>
          ) : null}

          <Field label="Notes" htmlFor="cart-notes" hint="Optional">
            <textarea
              id="cart-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add a note for this sale…"
            />
          </Field>

          <div className="pt-3 border-t border-[var(--md-sys-color-outline-variant)] space-y-1.5">
            <Row label="Subtotal" value={formatMoney(cartTotal)} />
            <Row
              label="Shipping"
              value={
                cartTotal >= SHOP_FREE_SHIPPING_THRESHOLD ? (
                  <span className="text-[var(--success-700)] font-semibold">
                    Free
                  </span>
                ) : (
                  "Calculated at next step"
                )
              }
            />
            <div className="pt-1.5 mt-1.5 border-t border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                Total
              </span>
              <span className="text-base font-semibold text-[var(--md-sys-color-on-surface)] tabular">
                {formatMoney(cartTotal)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <ActionButton
              fullWidth
              isLoading={isCreating}
              disabled={isCreating}
              onClick={onCheckout}
              icon={ShieldCheck}
            >
              Secure checkout
            </ActionButton>
            <ActionButton
              tone="ghost"
              size="sm"
              fullWidth
              onClick={onContinueShopping}
            >
              Continue shopping
            </ActionButton>
          </div>

          <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] text-center leading-snug">
            14-day returns · Genuine parts · Encrypted checkout
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-[12.5px] text-[var(--md-sys-color-on-surface-variant)]">
      <span>{label}</span>
      <span className="text-[var(--md-sys-color-on-surface)] tabular">
        {value}
      </span>
    </div>
  );
}
