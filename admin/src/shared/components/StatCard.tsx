import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * StatCard — KPI tile.
 *
 * Numeric values are visually prominent (display weight, tabular figures).
 * Labels stay quiet (xs, uppercase, low saturation). The optional `accent`
 * flag adds a left-edge bar in the primary color for the focus metric of a
 * row of cards.
 *
 * Documentation: /doc/admin-design-system.md#stat-card
 */
type StatCardProps = {
  label: string;
  value: ReactNode;
  note?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  accent?: boolean;
  icon?: React.ElementType;
  compact?: boolean;
};

export function StatCard({
  label,
  value,
  note,
  trend,
  trendValue,
  accent,
  icon: Icon,
  compact,
}: StatCardProps) {
  const padding = compact ? "p-4" : "p-5";

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendChip =
    trend === "up"
      ? "text-[var(--success-700)] bg-[var(--success-50)] border-[var(--success-100)]"
      : trend === "down"
        ? "text-[var(--danger-700)] bg-[var(--danger-50)] border-[var(--danger-100)]"
        : "text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]";

  return (
    <div
      className={[
        "relative rounded-lg",
        "bg-[var(--md-sys-color-surface)]",
        "border border-[var(--md-sys-color-outline-variant)]",
        "transition-colors duration-150 hover:border-[var(--md-sys-color-outline)]",
        padding,
      ].join(" ")}
    >
      {accent ? (
        <span
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-[var(--md-sys-color-primary)]"
          aria-hidden="true"
        />
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--md-sys-color-on-surface-variant)]">
          {label}
        </p>
        {Icon ? (
          <span className="w-8 h-8 rounded-md bg-[var(--md-sys-color-surface-container-low)] flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)]">
            <Icon className="w-4 h-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <strong
          className={[
            "font-semibold tracking-tight tabular leading-none",
            "text-[var(--md-sys-color-on-surface)]",
            compact ? "text-xl" : "text-[1.625rem]",
          ].join(" ")}
        >
          {value}
        </strong>
        {trend && trendValue ? (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-medium border rounded-full px-1.5 py-0.5 ${trendChip}`}
          >
            <TrendIcon className="w-3 h-3" aria-hidden="true" />
            {trendValue}
          </span>
        ) : null}
      </div>
      {note ? (
        <p className="mt-1.5 text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
          {note}
        </p>
      ) : null}
    </div>
  );
}
