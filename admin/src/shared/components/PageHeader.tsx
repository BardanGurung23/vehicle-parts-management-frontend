import type { ReactNode } from "react";

/**
 * PageHeader — top-of-page banner that introduces a feature.
 *
 * Anatomy:
 *   - optional eyebrow (kicker, brand-tinted)
 *   - required title
 *   - optional supporting description
 *   - optional breadcrumbs above the title
 *   - actions on the right (buttons, dropdowns)
 *
 * Documentation: /doc/admin-design-system.md#page-header
 */
type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <div className="space-y-2">
      {breadcrumbs ? <div>{breadcrumbs}</div> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1 min-w-0">
          {eyebrow ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--md-sys-color-primary)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-headline-medium text-[var(--md-sys-color-on-surface)] font-semibold tracking-tight">
            {title}
          </h1>
          {description ? (
            <p className="text-[13px] text-[var(--md-sys-color-on-surface-variant)] max-w-3xl">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
