import type { PropsWithChildren } from "react";

/**
 * Badge — compact, friendly status pill.
 *
 * Six tonal variants: neutral, info, success, warning, danger, brand.
 * Use `dot` to display a small leading status dot. Badges are intentionally
 * low contrast so they sit calmly inside dense lists.
 *
 * Documentation: /doc/admin-design-system.md#badges
 */
type BadgeVariant =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "brand";

type BadgeProps = PropsWithChildren<{
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}>;

const variantStyles: Record<BadgeVariant, string> = {
  neutral:
    "bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)]",
  info:
    "bg-[var(--info-50)] text-[var(--info-700)] border-[var(--info-100)]",
  success:
    "bg-[var(--success-50)] text-[var(--success-700)] border-[var(--success-100)]",
  warning:
    "bg-[var(--warning-50)] text-[var(--warning-700)] border-[var(--warning-100)]",
  danger:
    "bg-[var(--danger-50)] text-[var(--danger-700)] border-[var(--danger-100)]",
  brand:
    "bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-100)]",
};

const dotStyles: Record<BadgeVariant, string> = {
  neutral: "bg-[var(--md-sys-color-outline)]",
  info: "bg-[var(--info-500)]",
  success: "bg-[var(--success-500)]",
  warning: "bg-[var(--warning-500)]",
  danger: "bg-[var(--danger-500)]",
  brand: "bg-[var(--brand-500)]",
};

export function Badge({
  children,
  variant = "neutral",
  dot,
  className,
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2 h-[22px] text-[11px] font-medium rounded-full border",
        variantStyles[variant],
        className ?? "",
      ].join(" ")}
    >
      {dot ? (
        <span
          className={`block w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  );
}
