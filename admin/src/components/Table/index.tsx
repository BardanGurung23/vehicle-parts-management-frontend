import useTranslation from "@/locale/useTranslation";
import { PaginationType } from "@/types/commonTypes";
import React from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import styles from "./index.module.css";

interface TableProps {
  headers: string[] | any;
  data: any[][];
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
      <table className="w-max min-w-full border-collapse bg-surface-container-lowest text-on-surface border border-outline-variant">
        <thead className="bg-surface-container border-b border-outline-variant">
          <tr>
            {isSN && (
              <th className="px-3 py-1.5 text-left text-on-surface-variant uppercase font-bold text-[10px] tracking-widest whitespace-nowrap">
                S.N.
              </th>
            )}
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-3 py-1.5 text-left text-on-surface-variant uppercase font-bold text-[10px] tracking-widest whitespace-nowrap"
              >
                {translate(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`${styles.tableBody}`}>
          {data.length > 0 ? (
            data.map((row, index) => (
              <tr key={index} className="border-b border-outline-variant hover:bg-surface-container transition-colors h-[36px]">
                {isSN && <td className="px-3 py-1 font-medium text-[12px]">{index + 1}</td>}
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-1 text-[12px] align-top">
                    {React.isValidElement(cell) ? cell : `${cell}`}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={isSN ? headers.length + 1 : headers.length}
                className="border border-outline-variant px-4 py-2 text-center text-on-surface-variant"
              >
                {translate("No data available")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {pagination && (
        <div className="mt-2 flex justify-between items-center text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant font-semibold uppercase tracking-wider">Show:</span>
            <select
              name="pagination"
              id="pagination"
              value={pagination.limit}
              className="bg-surface-container-low border border-outline-variant rounded px-1 py-0.5 h-6 text-[11px] text-on-surface focus:outline-none focus:border-primary"
              onChange={(e) =>
                handlePagination &&
                handlePagination({
                  ...pagination,
                  limit: Number(e.target.value),
                })
              }
            >
              {[10, 25, 50, 100].map((each) => (
                <option key={each} value={each} className="bg-surface-container text-on-surface">
                  {each}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <button
                className={`p-1 border border-outline-variant rounded hover:bg-surface-container transition-colors ${
                  pagination.page === 1 ? "text-on-surface-variant opacity-40 cursor-not-allowed" : "text-on-surface-variant"
                }`}
                disabled={pagination.page === 1}
                onClick={() =>
                  handlePagination({ ...pagination, page: pagination.page - 1 })
                }
              >
                <FaAngleLeft size={14} />
              </button>
              <button
                className={`p-1 border border-outline-variant rounded hover:bg-surface-container transition-colors ${
                  pagination.page === pagination.totalPages
                    ? "text-on-surface-variant opacity-40 cursor-not-allowed"
                    : "text-on-surface-variant"
                }`}
                disabled={pagination.page === pagination.totalPages}
                onClick={() =>
                  handlePagination({ ...pagination, page: pagination.page + 1 })
                }
              >
                <FaAngleRight size={14} />
              </button>
            </div>

            <div className="flex gap-4 text-on-surface-variant font-medium uppercase tracking-tighter">
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
