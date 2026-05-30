import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

/**
 * DataTable — the canonical table for admin tabular data.
 *
 * Behaviour:
 *   - Sticky thead with a hairline separator.
 *   - Subtle row hover; rows are focusable when `onRowClick` is supplied.
 *   - Right-align numeric columns via `align="right"`.
 *   - Horizontal scroll preserved for narrow viewports.
 *
 * Documentation: /doc/admin-design-system.md#data-table
 */
export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  width?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  dense?: boolean;
  caption?: string;
};

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No data available.",
  onRowClick,
  dense,
  caption,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]/40 py-12 px-4 flex flex-col items-center text-center">
        <Inbox className="w-5 h-5 text-[var(--md-sys-color-on-surface-variant)] mb-2" aria-hidden="true" />
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{emptyMessage}</p>
      </div>
    );
  }

  const rowPadding = dense ? "py-2" : "py-3";

  return (
    <div className="rounded-lg overflow-hidden bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={[
                    "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--md-sys-color-on-surface-variant)]",
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : "text-left",
                    col.className ?? "",
                  ].join(" ")}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const interactive = Boolean(onRowClick);
              return (
                <tr
                  key={keyExtractor(row)}
                  onClick={interactive ? () => onRowClick?.(row) : undefined}
                  onKeyDown={
                    interactive
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick?.(row);
                          }
                        }
                      : undefined
                  }
                  tabIndex={interactive ? 0 : undefined}
                  role={interactive ? "button" : undefined}
                  className={[
                    "border-b border-[var(--md-sys-color-outline-variant)] last:border-0",
                    "transition-colors",
                    interactive
                      ? "cursor-pointer hover:bg-[var(--md-sys-color-surface-container-low)] focus:bg-[var(--md-sys-color-surface-container-low)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-inset"
                      : "hover:bg-[var(--md-sys-color-surface-container-low)]/60",
                  ].join(" ")}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={[
                        "px-4 align-middle text-[var(--md-sys-color-on-surface)]",
                        rowPadding,
                        col.align === "right"
                          ? "text-right tabular"
                          : col.align === "center"
                            ? "text-center"
                            : "text-left",
                        col.className ?? "",
                      ].join(" ")}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
