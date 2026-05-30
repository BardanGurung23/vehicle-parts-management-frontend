import { useId, useState } from "react";
import { ChevronDown, Filter, RotateCcw, Star } from "lucide-react";
import { ActionButton } from "../../../shared/components/ActionButton";
import {
  defaultFilters,
  formatMoney,
  SORT_OPTIONS,
  type ShopFilterState,
  type SortOption,
} from "../utils/shopHelpers";

/**
 * ShopFilters — faceted filter panel for the storefront.
 *
 * Behavior:
 *   - Desktop (≥ lg): rendered as a sticky left rail of always-visible
 *     facets.
 *   - Mobile / tablet: collapsed into an accordion behind a single "Filters"
 *     toggle so the catalog stays the primary surface.
 *
 * Each facet is its own `<details>` so screen readers can announce them as
 * disclosure widgets and the user can keyboard-toggle them with space.
 */

type ShopFiltersProps = {
  /** Currently selected filter values. */
  value: ShopFilterState;
  onChange: (next: ShopFilterState) => void;
  /** Catalog-derived facet options. */
  categoryOptions: { name: string; count: number }[];
  priceMax: number;
  /** Total products matching current filters (shown as a header counter). */
  matchingCount: number;
  /** Total products in the catalog (shown as a baseline). */
  totalCount: number;
};

export function ShopFilters({
  value,
  onChange,
  categoryOptions,
  priceMax,
  matchingCount,
  totalCount,
}: ShopFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCategory = (name: string) => {
    const exists = value.categories.includes(name);
    onChange({
      ...value,
      categories: exists
        ? value.categories.filter((c) => c !== name)
        : [...value.categories, name],
    });
  };

  const reset = () => onChange(defaultFilters(priceMax));

  const activeCount =
    (value.categories.length > 0 ? 1 : 0) +
    (value.priceMax < priceMax ? 1 : 0) +
    (value.minRating > 0 ? 1 : 0) +
    (value.inStockOnly ? 0 : 1) +
    (value.onSaleOnly ? 1 : 0);

  return (
    <>
      {/* Mobile/tablet toggle */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-controls="shop-filters-panel"
          className="w-full inline-flex items-center justify-between gap-2 h-10 px-3 rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-sm font-medium text-[var(--md-sys-color-on-surface)] hover:border-[var(--md-sys-color-outline)] transition-colors"
        >
          <span className="inline-flex items-center gap-2">
            <Filter className="w-4 h-4" aria-hidden="true" />
            Filters
            {activeCount > 0 ? (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-[10px] font-semibold">
                {activeCount}
              </span>
            ) : null}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
            {matchingCount}/{totalCount}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </span>
        </button>
      </div>

      <aside
        id="shop-filters-panel"
        aria-label="Catalog filters"
        className={[
          "lg:block",
          mobileOpen ? "block" : "hidden",
          // Sticky offset matches AppLayout header (56px) + sticky shop
          // subheader (~60px) so the filters drop into place beneath the
          // search bar without slipping behind it on scroll.
          "lg:sticky lg:top-[120px] lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto",
        ].join(" ")}
      >
        <div className="rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] divide-y divide-[var(--md-sys-color-outline-variant)]">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <div>
              <p className="text-[13px] font-semibold text-[var(--md-sys-color-on-surface)]">
                Filters
              </p>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] tabular">
                Showing {matchingCount} of {totalCount}
              </p>
            </div>
            {activeCount > 0 ? (
              <ActionButton
                tone="ghost"
                size="sm"
                icon={RotateCcw}
                onClick={reset}
              >
                Reset
              </ActionButton>
            ) : null}
          </div>

          {/* Sort (mobile-only; desktop uses the catalog toolbar) */}
          <FilterSection title="Sort by" defaultOpen className="lg:hidden">
            <select
              value={value.sort}
              onChange={(event) =>
                onChange({ ...value, sort: event.target.value as SortOption })
              }
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterSection>

          {/* Category */}
          {categoryOptions.length > 0 ? (
            <FilterSection title="Category" defaultOpen>
              <ul className="space-y-1.5">
                {categoryOptions.map((option) => {
                  const checked = value.categories.includes(option.name);
                  return (
                    <li key={option.name}>
                      <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-on-surface)]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCategory(option.name)}
                          className="!w-4 !h-4 !min-h-0 !p-0"
                        />
                        <span className="flex-1 truncate">{option.name}</span>
                        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] tabular">
                          {option.count}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </FilterSection>
          ) : null}

          {/* Price */}
          <FilterSection title="Price" defaultOpen>
            <PriceFilter
              max={priceMax}
              value={value.priceMax}
              onChange={(next) => onChange({ ...value, priceMax: next })}
            />
          </FilterSection>

          {/* Rating */}
          <FilterSection title="Customer rating" defaultOpen>
            <ul className="space-y-1.5">
              {[4, 3, 0].map((threshold) => {
                const id = `rating-${threshold}`;
                const checked = value.minRating === threshold;
                const label =
                  threshold === 0 ? "Any rating" : `${threshold}★ & up`;
                return (
                  <li key={threshold}>
                    <label
                      htmlFor={id}
                      className="flex items-center gap-2 cursor-pointer text-[13px] text-[var(--md-sys-color-on-surface)]"
                    >
                      <input
                        id={id}
                        type="radio"
                        name="rating"
                        checked={checked}
                        onChange={() =>
                          onChange({
                            ...value,
                            minRating: threshold as 0 | 3 | 4,
                          })
                        }
                        className="!w-4 !h-4 !min-h-0 !p-0"
                      />
                      {threshold > 0 ? (
                        <span className="inline-flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={[
                                "w-3.5 h-3.5",
                                i < threshold
                                  ? "text-[var(--warning-500)]"
                                  : "text-[var(--md-sys-color-outline)]",
                              ].join(" ")}
                              fill={i < threshold ? "currentColor" : "none"}
                              aria-hidden="true"
                            />
                          ))}
                          <span className="ml-1 text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                            &amp; up
                          </span>
                        </span>
                      ) : (
                        <span>{label}</span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          </FilterSection>

          {/* Availability + offers */}
          <FilterSection title="Availability">
            <div className="space-y-2">
              <ToggleRow
                checked={value.inStockOnly}
                onChange={(next) => onChange({ ...value, inStockOnly: next })}
                label="In stock only"
              />
              <ToggleRow
                checked={value.onSaleOnly}
                onChange={(next) => onChange({ ...value, onSaleOnly: next })}
                label="On sale only"
              />
            </div>
          </FilterSection>
        </div>
      </aside>
    </>
  );
}

/* ============================================================================
 * FilterSection — accordion wrapper for individual facet groups.
 * ========================================================================= */
function FilterSection({
  title,
  children,
  defaultOpen,
  className,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details
      className={["group px-4 py-3", className ?? ""].join(" ")}
      open={defaultOpen}
    >
      <summary className="flex items-center justify-between cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--md-sys-color-on-surface-variant)]">
          {title}
        </span>
        <ChevronDown
          className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}

/* ============================================================================
 * PriceFilter — single-thumb max-price range control.
 * ========================================================================= */
function PriceFilter({
  max,
  value,
  onChange,
}: {
  max: number;
  value: number;
  onChange: (next: number) => void;
}) {
  const id = useId();
  const safeMax = Math.max(1, Math.ceil(max));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
        <span>{formatMoney(0)}</span>
        <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
          Up to {formatMoney(value)}
        </span>
        <span>{formatMoney(safeMax)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={safeMax}
        step={Math.max(1, Math.round(safeMax / 100))}
        value={Math.min(value, safeMax)}
        onChange={(event) => onChange(Number(event.target.value))}
        className="!min-h-0 !p-0 !border-0 !bg-transparent w-full accent-[var(--md-sys-color-primary)]"
        aria-label="Maximum price"
      />
    </div>
  );
}

/* ============================================================================
 * ToggleRow — row-style switch with a label.
 * ========================================================================= */
function ToggleRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between gap-2 cursor-pointer text-[13px] text-[var(--md-sys-color-on-surface)]">
      <span>{label}</span>
      <span
        className={[
          "relative inline-flex w-9 h-5 shrink-0 rounded-full border transition-colors",
          checked
            ? "bg-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)]"
            : "bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]",
        ].join(" ")}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
        />
        <span
          className={[
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-level1 transition-transform",
            checked ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
          aria-hidden="true"
        />
      </span>
    </label>
  );
}
