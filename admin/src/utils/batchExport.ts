// utils/batchExport.ts
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Interface for chart data and metadata
interface ChartBatchExportData {
  id: string; // Unique chart identifier (e.g., 'line-chart-sales')
  title: string; // Chart title (e.g., 'Monthly Sales Trend')
  data: ChartData[]; // Chart data (matches your ChartData interface)
  dataKeys: string[]; // Keys for data (e.g., ['sales', 'orders'] for Line/Bar, ['value'] for Pie)
  elementSelector: string; // CSS selector for chart element (e.g., '#line-chart-sales .recharts-responsive-container')
}

// Your ChartData interface (shared across components)
interface ChartData {
  name: string;
  [key: string]: unknown;
}

// Export as Excel (multiple sheets)
export const exportBatchToExcel = (charts: ChartBatchExportData[]) => {
  const workbook = XLSX.utils.book_new();

  charts.forEach((chart) => {
    const worksheetData = chart.data.map((item) => ({
      Name: item.name,
      ...Object.fromEntries(chart.dataKeys.map((key) => [key, item[key]])),
    }));
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, chart.title.slice(0, 31)); // Excel sheet names limited to 31 chars
  });

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, "analytics-batch-export.xlsx");
};

// Export as PDF (charts as images, optional data tables)
export const exportBatchToPDF = async (charts: ChartBatchExportData[]) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const imgWidth = 190; // A4 width in mm
  let yOffset = 10;

  for (const chart of charts) {
    // Add chart title
    pdf.setFontSize(14);
    pdf.text(chart.title, 10, yOffset);
    yOffset += 10;

    // Capture chart image
    const chartElement = document.querySelector(chart.elementSelector);
    if (chartElement) {
      const canvas = await html2canvas(chartElement as HTMLElement);
      const imgData = canvas.toDataURL("image/png");
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add image to PDF
      pdf.addImage(imgData, "PNG", 10, yOffset, imgWidth, imgHeight);
      yOffset += imgHeight + 10;

      // Check if we need a new page
      if (yOffset > 250) {
        pdf.addPage();
        yOffset = 10;
      }
    }
  }

  pdf.save("analytics-batch-export.pdf");
};

// Export as CSV (single file with sections)
export const exportBatchToCSV = (charts: ChartBatchExportData[]) => {
  let csvContent = "";

  charts.forEach((chart) => {
    // Add section header
    csvContent += `${chart.title}\n`;
    const headers = ["name", ...chart.dataKeys];
    const rows = chart.data.map((item) =>
      headers.map((key) => `"${item[key] ?? ""}"`).join(","),
    );
    csvContent += [headers.join(","), ...rows].join("\n") + "\n\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, "analytics-batch-export.csv");
};

// Export as JSON (single object)
export const exportBatchToJSON = (charts: ChartBatchExportData[]) => {
  const jsonData = charts.reduce(
    (acc, chart) => ({
      ...acc,
      [chart.id]: {
        title: chart.title,
        data: chart.data,
        dataKeys: chart.dataKeys,
      },
    }),
    {},
  );
  const jsonContent = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonContent], {
    type: "application/json;charset=utf-8;",
  });
  saveAs(blob, "analytics-batch-export.json");
};
