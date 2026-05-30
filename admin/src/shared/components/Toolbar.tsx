import type { PropsWithChildren, ReactNode } from "react";

/**
 * Toolbar — horizontal control band for list/table pages.
 *
 * Layout zones:
 *   - leading  : filters and search
 *   - trailing : primary actions (Add, Export, etc.)
 *
 * Use it as the first element inside a list page below the PageHeader. Falls
 * back to a stacked layout on mobile.
 *
 * Documentation: /doc/admin-design-system.md#toolbar
 */
type ToolbarProps = PropsWithChildren<{
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Optional caption shown above the bar (e.g. "12 results"). */
  caption?: ReactNode;
}>;

export function Toolbar({ leading, trailing, caption, children }: ToolbarProps) {
  return (
    <div className="space-y-2">
      {caption ? (
        <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">{caption}</p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
          {leading ?? children}
        </div>
        {trailing ? (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  );
}
