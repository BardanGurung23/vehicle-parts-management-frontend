import { ShoppingCart, Heart, Star, Eye } from "lucide-react";
import { resolveBackendAssetUrl } from "../../../app/api";
import type { Part } from "../../../app/types";
import { ActionButton } from "../../../shared/components/ActionButton";
import { Badge } from "../../../shared/components/Badge";
import {
  formatMoney,
  getProductPromotion,
  getProductRating,
} from "../utils/shopHelpers";

/**
 * ProductCard — storefront product tile.
 *
 * Shows a lazy-loaded image, title, category, rating, price (with optional
 * crossed-out compare-at), a marketing badge, and quick actions: wishlist,
 * peek (recently-viewed beacon), and "Add to cart".
 *
 * The card is kept dense and information-rich without becoming noisy: most
 * elements are shown only when there is useful content (e.g. discount,
 * compare-at price, marketing badge).
 */

type ProductCardProps = {
  part: Part;
  inWishlist: boolean;
  inCartCount: number;
  onAdd: () => void;
  onToggleWishlist: () => void;
  onPeek: () => void;
};

export function ProductCard({
  part,
  inWishlist,
  inCartCount,
  onAdd,
  onToggleWishlist,
  onPeek,
}: ProductCardProps) {
  const imageUrl = resolveBackendAssetUrl(part.imageUrl);
  const promo = getProductPromotion(part);
  const { rating, reviewCount } = getProductRating(part);
  const lowStock = part.stockQuantity > 0 && part.stockQuantity <= 5;

  return (
    <article
      className="group flex flex-col rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] overflow-hidden shadow-level1 transition-[box-shadow,transform,border-color] duration-200 hover:shadow-level3 hover:-translate-y-0.5 hover:border-[var(--md-sys-color-outline)] focus-within:shadow-level3 focus-within:-translate-y-0.5"
      aria-labelledby={`part-${part.partId}-title`}
    >
      {/* ---- Media ---- */}
      <div className="relative aspect-[4/3] bg-[var(--md-sys-color-surface-container-low)] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={part.partName}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] uppercase tracking-[0.2em] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
            {part.partNumber}
          </div>
        )}

        {/* Badges (top-left): discount + promotion */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start">
          {promo.discountPercent > 0 ? (
            <span
              className="inline-flex items-center px-1.5 h-5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--danger-500)] text-white shadow-level1"
              aria-label={`${promo.discountPercent} percent off`}
            >
              −{promo.discountPercent}%
            </span>
          ) : null}
          {promo.badge ? (
            <span
              className={[
                "inline-flex items-center px-1.5 h-5 rounded-md text-[10px] font-semibold uppercase tracking-wider",
                promo.badge === "New"
                  ? "bg-[var(--info-500)] text-white"
                  : promo.badge === "Popular"
                    ? "bg-[var(--brand-600)] text-white"
                    : "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]",
              ].join(" ")}
            >
              {promo.badge}
            </span>
          ) : null}
        </div>

        {/* Quick actions (top-right) */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={onToggleWishlist}
            aria-label={
              inWishlist
                ? `Remove ${part.partName} from wishlist`
                : `Add ${part.partName} to wishlist`
            }
            aria-pressed={inWishlist}
            className={[
              "w-8 h-8 inline-flex items-center justify-center rounded-full border shadow-level1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]",
              inWishlist
                ? "bg-[var(--danger-50)] border-[var(--danger-100)] text-[var(--danger-600)]"
                : "bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]",
            ].join(" ")}
          >
            <Heart
              className="w-3.5 h-3.5"
              fill={inWishlist ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            onClick={onPeek}
            aria-label={`Mark ${part.partName} as recently viewed`}
            className="w-8 h-8 inline-flex items-center justify-center rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] shadow-level1 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]"
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Stock chip (bottom-right) */}
        <div className="absolute bottom-2 right-2">
          <Badge variant={lowStock ? "warning" : "success"} dot>
            {lowStock ? `Only ${part.stockQuantity} left` : "In stock"}
          </Badge>
        </div>
      </div>

      {/* ---- Body ---- */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
          {part.categoryName ?? "Uncategorized"}
        </p>
        <h3
          id={`part-${part.partId}-title`}
          className="text-[14px] leading-snug font-semibold text-[var(--md-sys-color-on-surface)] line-clamp-2"
          title={part.partName}
        >
          {part.partName}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <StarRating rating={rating} />
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] tabular">
            {rating.toFixed(1)}
            <span className="opacity-70"> ({reviewCount})</span>
          </span>
        </div>

        {/* Price */}
        <div className="mt-auto pt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[17px] font-semibold text-[var(--md-sys-color-on-surface)] tabular">
            {formatMoney(part.unitPrice)}
          </span>
          {promo.comparePrice ? (
            <span
              className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] line-through tabular"
              aria-label={`Original price ${formatMoney(promo.comparePrice)}`}
            >
              {formatMoney(promo.comparePrice)}
            </span>
          ) : null}
          {promo.discountPercent > 0 && promo.comparePrice ? (
            <span className="text-[11px] font-semibold text-[var(--success-700)] ml-auto">
              Save {formatMoney(promo.comparePrice - part.unitPrice)}
            </span>
          ) : null}
        </div>

        {/* Action */}
        <div className="pt-2 flex items-center gap-2">
          <ActionButton
            size="sm"
            icon={ShoppingCart}
            onClick={onAdd}
            fullWidth
            aria-label={`Add ${part.partName} to cart`}
          >
            {inCartCount > 0 ? `In cart · ${inCartCount}` : "Add to cart"}
          </ActionButton>
        </div>
      </div>
    </article>
  );
}

/**
 * Compact 5-star rating display. Half-stars are approximated with a
 * gradient mask using the linear `Star` SVG.
 */
function StarRating({ rating }: { rating: number }) {
  const stars = [0, 1, 2, 3, 4].map((i) => {
    const fill = Math.max(0, Math.min(1, rating - i));
    return fill;
  });
  return (
    <span
      className="inline-flex items-center"
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {stars.map((fill, i) => (
        <span key={i} className="relative inline-block w-3.5 h-3.5">
          <Star
            className="absolute inset-0 w-3.5 h-3.5 text-[var(--md-sys-color-outline)]"
            aria-hidden="true"
          />
          <span
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${fill * 100}%` }}
            aria-hidden="true"
          >
            <Star
              className="w-3.5 h-3.5 text-[var(--warning-500)]"
              fill="currentColor"
            />
          </span>
        </span>
      ))}
    </span>
  );
}
