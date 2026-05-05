import { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  emptyMessage?: string;
};

export function DataTable<T>({ columns, data, keyExtractor, emptyMessage = "No data available." }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 rounded-xl bg-surface-container-lowest shadow-level1">
        <p className="text-body-medium text-on-surface-variant">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-surface-container-lowest shadow-level1">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-container-low">
            {columns.map((col) => (
              <th key={col.key}
                className={`px-4 py-3.5 text-left text-label-small text-on-surface-variant uppercase tracking-wider ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-surface-container-lowest">
          {data.map((row, idx) => (
            <tr key={keyExtractor(row)}
              className={`transition-colors hover:bg-surface-container-low ${
                idx % 2 === 1 ? "bg-surface-container-low/35" : ""
              }`}
            >
              {columns.map((col) => (
                <td key={col.key}
                  className={`px-4 py-3.5 text-body-medium text-on-surface-variant ${col.className ?? ""}`}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
