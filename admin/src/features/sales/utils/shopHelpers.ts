import type { Part } from "../../../app/types";

/**
 * Shop helpers — small utilities and shared types for the customer-facing
 * storefront. Keeping the value-level constants (`SORT_OPTIONS`,
 * `defaultFilters`) outside of the component file lets the filter panel
 * file export only React components, which keeps Vite's fast-refresh
 * behavior simple.
 *
 * The catalog data comes from the Parts inventory, which doesn't carry
 * promotional copy or per-SKU ratings. To make the storefront feel like a
 * real e-commerce surface (sale tags, ratings, etc.) we synthesize a small
 * presentation layer that is *deterministic per `partId`* so a given part
 * always renders the same visual treatment across reloads. Real promotional
 * data would replace this layer when the API exposes it.
 */

const FREE_SHIPPING_THRESHOLD = 5000;

export const SHOP_FREE_SHIPPING_THRESHOLD = FREE_SHIPPING_THRESHOLD;

/* ============================================================================
 * Filter / sort state — consumed by the filter panel and the catalog page.
 * ========================================================================= */
export type SortOption =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "newest";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Highest rated" },
  { value: "newest", label: "Newest" },
];

export interface ShopFilterState {
  categories: string[];
  priceMax: number;
  minRating: 0 | 3 | 4;
  /** When true, only items currently in stock are shown. */
  inStockOnly: boolean;
  /** When true, only items currently on sale are shown. */
  onSaleOnly: boolean;
  sort: SortOption;
}

export function defaultFilters(priceMax: number): ShopFilterState {
  return {
    categories: [],
    priceMax,
    minRating: 0,
    inStockOnly: true,
    onSaleOnly: false,
    sort: "featured",
  };
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatMoney(value: number): string {
  return currencyFormatter.format(value);
}

/**
 * Deterministic 32-bit hash. We use it to pick stable visual treatments
 * (rating, sale, new) per part without having any real backing data yet.
 */
function seed(partId: number, salt = 0): number {
  let h = (partId | 0) ^ (salt * 2654435761);
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  return Math.abs(h) >>> 0;
}

export interface ProductPromotion {
  /** Discount percent (0–35). 0 means "not on sale". */
  discountPercent: number;
  /** Marketing badge to display on the card. */
  badge: "Sale" | "New" | "Popular" | null;
  /** "Compare-at" price for the crossed-out display. */
  comparePrice: number | null;
}

/**
 * Synthesize a stable promotional state for a part. Intended purely as a
 * presentation layer until the API provides real discount data.
 */
export function getProductPromotion(part: Part): ProductPromotion {
  const slot = seed(part.partId) % 10;

  // Roughly: 30% on sale, 10% new, 10% popular, 50% nothing.
  if (slot < 3) {
    const tiers = [10, 15, 20, 25];
    const discountPercent = tiers[seed(part.partId, 1) % tiers.length];
    const comparePrice =
      Math.round((part.unitPrice / (1 - discountPercent / 100)) * 100) / 100;
    return { discountPercent, badge: "Sale", comparePrice };
  }
  if (slot < 4) {
    return { discountPercent: 0, badge: "New", comparePrice: null };
  }
  if (slot < 5) {
    return { discountPercent: 0, badge: "Popular", comparePrice: null };
  }
  return { discountPercent: 0, badge: null, comparePrice: null };
}

export interface ProductRating {
  /** 0–5, rounded to one decimal. */
  rating: number;
  /** Number of reviews (deterministic). */
  reviewCount: number;
}

/**
 * Synthesize a deterministic rating per part so the storefront has
 * something to display until per-product reviews exist.
 */
export function getProductRating(part: Part): ProductRating {
  const r = seed(part.partId, 17) % 11; // 0..10 → 4.0..5.0
  const rating = Math.round((4 + r / 10) * 10) / 10;
  const reviewCount = 8 + (seed(part.partId, 23) % 142);
  return { rating, reviewCount };
}

const WISHLIST_STORAGE_KEY = "autonix.shop.wishlist";
const RECENT_STORAGE_KEY = "autonix.shop.recently-viewed";
const RECENT_MAX = 8;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readWishlist(): number[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is number => typeof value === "number")
      : [];
  } catch {
    return [];
  }
}

export function writeWishlist(ids: number[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* localStorage unavailable; ignore */
  }
}

export function readRecentlyViewed(): number[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .filter((value): value is number => typeof value === "number")
          .slice(0, RECENT_MAX)
      : [];
  } catch {
    return [];
  }
}

export function pushRecentlyViewed(id: number): number[] {
  const current = readRecentlyViewed().filter((existing) => existing !== id);
  const next = [id, ...current].slice(0, RECENT_MAX);
  if (isBrowser()) {
    try {
      window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* localStorage unavailable; ignore */
    }
  }
  return next;
}
