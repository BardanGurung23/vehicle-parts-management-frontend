import useTranslation from "@/locale/useTranslation";
import { PaginationType } from "@/types/commonTypes";
import React from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import styles from "./index.module.css";

interface TableProps {
  headers: string[] | any; // Table header titles
  data: any[][]; // Array of table data
  pagination: PaginationType;
  isSN?: boolean;
  handlePagination: (pagination: PaginationType) => void;
}

const Table: React.FC<TableProps> = ({
  headers,
  data,
  pagination,
  isSN,
  handlePagination,
}) => {
  const translate = useTranslation();
  return (
    <div className="overflow-x-auto">
      {/* Table */}
      <table className="min-w-full border-collapse bg-surface text-foreground border border-line">
        <thead className="bg-surface border-b border-line">
          <tr>
            {isSN && (
              <th className="px-3 py-1.5 text-left text-muted uppercase font-bold text-[10px] tracking-widest whitespace-nowrap">
                S.N.
              </th>
            )}
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-3 py-1.5 text-left text-muted uppercase font-bold text-[10px] tracking-widest whitespace-nowrap"
              >
                {translate(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`${styles.tableBody}`}>
          {data.length > 0 ? (
            data.map((row, index) => (
              <tr key={index} className="border-b border-line hover:bg-accent-faint transition-colors h-[36px]">
                {isSN && <td className="px-3 py-1 font-medium text-[12px]">{index + 1}</td>}
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-1 text-[12px]">
                    {React.isValidElement(cell) ? cell : `${cell}`}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={isSN ? headers.length + 1 : headers.length}
                className="border px-4 py-2 text-center"
              >
                {translate("No data available")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {/* Pagination */}
      {pagination && (
        <div className="mt-2 flex justify-between items-center text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-muted font-semibold uppercase tracking-wider">Show:</span>
            <select
              name="pagination"
              id="pagination"
              value={pagination.limit}
              className="bg-surface border border-line rounded px-1 py-0.5 h-6 text-[11px] focus:outline-none focus:border-accent"
              onChange={(e) =>
                handlePagination &&
                handlePagination({
                  ...pagination,
                  limit: Number(e.target.value),
                })
              }
            >
              {[10, 25, 50, 100].map((each) => (
                <option key={each} value={each}>
                  {each}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <button
                className={`p-1 border border-line rounded hover:bg-accent-faint transition-colors ${
                  pagination.page === 1 ? "text-line cursor-not-allowed" : "text-muted"
                }`}
                disabled={pagination.page === 1}
                onClick={() =>
                  handlePagination({ ...pagination, page: pagination.page - 1 })
                }
              >
                <FaAngleLeft size={14} />
              </button>
              <button
                className={`p-1 border border-line rounded hover:bg-accent-faint transition-colors ${
                  pagination.page === pagination.totalPages
                    ? "text-line cursor-not-allowed"
                    : "text-muted"
                }`}
                disabled={pagination.page === pagination.totalPages}
                onClick={() =>
                  handlePagination({ ...pagination, page: pagination.page + 1 })
                }
              >
                <FaAngleRight size={14} />
              </button>
            </div>
            
            <div className="flex gap-4 text-muted font-medium uppercase tracking-tighter">
              <span>Page {pagination.page} / {pagination.totalPages}</span>
              <span>Total: {pagination.total}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Table;
