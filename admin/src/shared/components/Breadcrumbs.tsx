import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * Breadcrumbs — shows the user's location in the app hierarchy.
 *
 * The last crumb is rendered as static text and marked with aria-current.
 *
 * Documentation: /doc/admin-design-system.md#breadcrumbs
 */
export type Crumb = {
  label: ReactNode;
  to?: string;
};

type BreadcrumbsProps = {
  items: Crumb[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center text-sm text-[var(--md-sys-color-on-surface-variant)] ${className ?? ""}`}
    >
      <ol className="flex items-center flex-wrap gap-1">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1">
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast
                      ? "text-[var(--md-sys-color-on-surface)] font-medium"
                      : "text-[var(--md-sys-color-on-surface-variant)]"
                  }
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight
                  className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] mx-1"
                  aria-hidden="true"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
