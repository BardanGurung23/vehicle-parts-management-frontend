import type { PropsWithChildren, ReactNode } from "react";

/**
 * Card — surface container for grouped content.
 *
 * Variants:
 *   - filled   : default white surface with a 1px border (no shadow). Calm.
 *   - outlined : same as filled but with a slightly lower-contrast border;
 *                used for nested cards inside another card.
 *   - elevated : adds a soft level-2 shadow for floating panels.
 *
 * Composition:
 *   - `header`    → top section, separated by a hairline.
 *   - `children`  → body, with default p-5 (override via bodyClassName).
 *   - `footer`    → bottom section on a soft surface.
 *
 * Documentation: /doc/admin-design-system.md#cards
 */
type CardProps = PropsWithChildren<{
  variant?: "filled" | "outlined" | "elevated";
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
  bodyless?: boolean;
}>;

const variantStyles: Record<NonNullable<CardProps["variant"]>, string> = {
  filled:
    "bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]",
  outlined:
    "bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]",
  elevated:
    "bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-level2",
};

export function Card({
  variant = "filled",
  header,
  footer,
  children,
  className,
  bodyClassName,
  id,
  bodyless,
}: CardProps) {
  return (
    <article
      id={id}
      className={`rounded-lg overflow-hidden ${variantStyles[variant]} ${className ?? ""}`}
    >
      {header ? (
        <header className="px-5 py-4 border-b border-[var(--md-sys-color-outline-variant)]">
          {header}
        </header>
      ) : null}
      {children
        ? bodyless
          ? <div>{children}</div>
          : <div className={`p-5 ${bodyClassName ?? ""}`}>{children}</div>
        : null}
      {footer ? (
        <footer className="px-5 py-3 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
          {footer}
        </footer>
      ) : null}
    </article>
  );
}
