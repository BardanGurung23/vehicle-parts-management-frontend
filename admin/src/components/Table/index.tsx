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
    <div className="overflow-x-auto ">
      {/* Table */}
      <table className="min-w-full border-collapse bg-[#F8F7FA] text-black">
        <thead className="bg-primaryColor">
          <tr>
            {isSN && (
              <th className="px-4 py-2 text-center text-white font-[400] text-[1.125rem] whitespace-nowrap">
                S.N.
              </th>
            )}
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-2 text-center text-white font-[400] text-[1.125rem] whitespace-nowrap"
              >
                {translate(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`${styles.tableBody}`}>
          {data.length > 0 ? (
            data.map((row, index) => (
              <tr key={index}>
                {isSN && <td className="px-4 py-2">{index + 1}</td>}
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-2">
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
        <div className="mt-[6px] flex justify-between ">
          <div>
            <p className="font-[500] text-[0.875rem] text-[#2F2B3D] bg-white px-[0.75rem] py-[0.5rem]">
              Show:{" "}
              <select
                name="pagination"
                id="pagination"
                value={pagination.limit}
                className="bg-white"
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
              </select>{" "}
              entries
            </p>
          </div>
          <div className="flex gap-[1rem] ">
            <button
              className={
                pagination.page === 1 ? "text-gray-400 cursor-not-allowed" : ""
              }
              disabled={pagination.page === 1}
              onClick={() =>
                handlePagination({ ...pagination, page: pagination.page - 1 })
              }
            >
              <FaAngleLeft size={24} />
            </button>
            <button
              className={
                pagination.page === pagination.totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : ""
              }
              disabled={pagination.page === pagination.totalPages}
              onClick={() =>
                handlePagination({ ...pagination, page: pagination.page + 1 })
              }
            >
              <FaAngleRight size={24} />
            </button>
          </div>
          <div className="flex gap-[0.875rem]">
            <p className="font-[500] text-[0.875rem] text-[#2F2B3D] bg-white px-[0.75rem] py-[0.5rem]">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <p className="font-[500] text-[0.875rem] text-[#2F2B3D] bg-white px-[0.75rem] py-[0.5rem]">
              Total Data: {pagination.total}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
export default Table;
