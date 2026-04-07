import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface ExportToExcelProps {
  title: string; // Title of the spreadsheet (used as sheet name)
  data: string[][] | []; // Array of arrays for data rows
  headers: string[]; // Array of column headers
}

export const exportToExcel = ({ title, data, headers }: ExportToExcelProps) => {
  // Validate inputs
  if (!title) {
    throw new Error("Title is required");
  }
  if (!headers || headers.length === 0) {
    throw new Error("Headers are required");
  }
  if (!data || !Array.isArray(data)) {
    throw new Error("Data must be an array of arrays");
  }

  // Create worksheet data by combining headers and data
  const worksheetData = [
    headers, // First row is headers
    ...data, // Subsequent rows are data
  ];

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title.slice(0, 31)); // Excel sheet names limited to 31 characters

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, `${title.replace(/\s+/g, "-")}.xlsx`);
};
