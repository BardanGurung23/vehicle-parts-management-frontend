import { useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { StatCard } from "../../shared/components/StatCard";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { EmptyState } from "../../shared/components/EmptyState";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { BarChart3 } from "lucide-react";
import type { FinancialReport } from "../../app/types";
import { downloadElementPdf } from "../../shared/utils/downloadElementPdf";

type ReportType = "daily" | "monthly" | "yearly" | "all-time";

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const numberFormatter = new Intl.NumberFormat("en-US");
function formatCurrency(value: number) { return currencyFormatter.format(value); }
function formatNumber(value: number) { return numberFormatter.format(value); }
function extractErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}
function toIsoDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}
function toMonthValue(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
function parseMonthValue(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return { year: new Date().getUTCFullYear(), month: new Date().getUTCMonth() + 1 };
  return { year: Number(match[1]), month: Number(match[2]) };
}

function buildFinancialReportCsv(report: FinancialReport) {
  const rows = [
    ["Report Type", report.reportType],
    ["Period", report.periodLabel],
    ["Range Start", report.rangeStart],
    ["Range End Exclusive", report.rangeEndExclusive],
    ["Revenue", report.revenue],
    ["Discounts", report.discounts],
    ["Purchase Costs", report.purchaseCosts],
    ["Gross Profit", report.grossProfit],
    ["Sales", report.saleCount],
    ["Purchase Invoices", report.purchaseInvoiceCount],
    [],
    ["Period", "Revenue", "Discounts", "Purchase Costs", "Gross Profit", "Sales", "Purchase Invoices"],
    ...report.entries.map((entry) => [
      entry.label,
      entry.revenue,
      entry.discounts,
      entry.purchaseCosts,
      entry.grossProfit,
      entry.saleCount,
      entry.purchaseInvoiceCount,
    ]),
  ];

  return rows
    .map((row) => row.map((value) => {
      const normalized = value == null ? "" : String(value);
      if (/[",\n]/.test(normalized)) {
        return `"${normalized.replaceAll("\"", "\"\"")}"`;
      }
      return normalized;
    }).join(","))
    .join("\n");
}

function downloadCsvFile(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export function FinancialReportsPage() {
  const { token } = useAuth();
  const exportRef = useRef<HTMLDivElement | null>(null);
  const now = useMemo(() => new Date(), []);
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [selectedDate, setSelectedDate] = useState(toIsoDate(now));
  const [selectedMonth, setSelectedMonth] = useState(toMonthValue(now));
  const [selectedYear, setSelectedYear] = useState(String(now.getUTCFullYear()));
  const { year: monthlyYear, month: monthlyMonth } = parseMonthValue(selectedMonth);
  const parsedYear = Number(selectedYear);
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let isActive = true;
    setIsLoading(true);

    const loadReport = async () => {
      if (reportType === "daily") {
        return api.getDailyFinancialReport(token, { date: selectedDate || undefined });
      }

      if (reportType === "monthly") {
        return api.getMonthlyFinancialReport(token, { year: monthlyYear, month: monthlyMonth });
      }

      if (reportType === "yearly") {
        return api.getYearlyFinancialReport(token, { year: Number.isInteger(parsedYear) ? parsedYear : undefined });
      }

      return api.getAllTimeFinancialReport(token);
    };

    void loadReport()
      .then((response) => {
        if (!isActive) {
          return;
        }

        setReport(response);
        setErrorMessage(null);
        setFeedback(null);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setReport(null);
        setErrorMessage(extractErrorMessage(error, "Could not load the financial report."));
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [monthlyMonth, monthlyYear, parsedYear, reportType, selectedDate, token]);

  const handleCsvExport = () => {
    if (!report) {
      setFeedback({ tone: "error", message: "Load a financial report before exporting it." });
      return;
    }

    downloadCsvFile(buildFinancialReportCsv(report), `financial-report-${report.reportType.toLowerCase().replace(/\s+/g, "-")}.csv`);
    setFeedback({ tone: "success", message: `CSV export started for the ${report.reportType.toLowerCase()} report.` });
  };

  const handlePdfExport = async () => {
    if (!report) {
      setFeedback({ tone: "error", message: "Load a financial report before exporting it." });
      return;
    }

    if (!exportRef.current) {
      setFeedback({ tone: "error", message: "Could not find the report preview to export." });
      return;
    }

    try {
      setIsExportingPdf(true);
      setFeedback(null);
      await downloadElementPdf({
        container: exportRef.current,
        fileName: `financial-report-${report.reportType.toLowerCase().replace(/\s+/g, "-")}.pdf`,
      });
      setFeedback({ tone: "success", message: `PDF export started for the ${report.reportType.toLowerCase()} report.` });
    } catch {
      setFeedback({ tone: "error", message: "Could not generate the financial report PDF." });
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (isLoading) return <PageShell><SkeletonCard /></PageShell>;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Admin Finance"
        title="Financial Reports"
        description="Review revenue, discounts, purchase spend, and gross profit across reporting windows."
      />

      {errorMessage ? <AlertBox tone="error" message={errorMessage} dismissible /> : null}
      {feedback ? <AlertBox tone={feedback.tone} message={feedback.message} dismissible /> : null}

      <Card
        header={
          <div>
            <h3 className="text-base font-semibold text-on-surface">Report Range</h3>
            <p className="text-sm text-on-surface-variant">Switch between daily, monthly, yearly, and all-time windows.</p>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {(["daily", "monthly", "yearly", "all-time"] as const).map((type) => (
              <ActionButton key={type} tone={reportType === type ? "filled" : "tonal"} size="sm" onClick={() => setReportType(type)}>
                {type === "all-time" ? "All Time" : type.charAt(0).toUpperCase() + type.slice(1)}
              </ActionButton>
            ))}
          </div>

          <div className="max-w-xs">
            {reportType === "daily" && (
              <div>
                <label htmlFor="report-date" className="block text-xs font-medium text-on-surface-variant mb-1">Date</label>
                <input id="report-date" className="input" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              </div>
            )}
            {reportType === "monthly" && (
              <div>
                <label htmlFor="report-month" className="block text-xs font-medium text-on-surface-variant mb-1">Month</label>
                <input id="report-month" className="input" type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
              </div>
            )}
            {reportType === "yearly" && (
              <div>
                <label htmlFor="report-year" className="block text-xs font-medium text-on-surface-variant mb-1">Year</label>
                <input id="report-year" className="input" type="number" min="2000" step="1" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} />
              </div>
            )}
            {reportType === "all-time" && (
              <div className="rounded-2xl bg-surface-container-low p-3 text-sm text-on-surface-variant">
                All recorded financial activity will be included in this report.
              </div>
            )}
          </div>
        </div>
      </Card>

      {!report ? (
        <div className="bg-info-50 border border-info-100 text-info-700 rounded-lg p-3 text-sm">
          Choose a report range to review financial metrics.
        </div>
      ) : (
        <>
          <div ref={exportRef} className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
              <StatCard label="Revenue" value={formatCurrency(report.revenue)} />
              <StatCard label="Discounts" value={formatCurrency(report.discounts)} />
              <StatCard label="Purchase costs" value={formatCurrency(report.purchaseCosts)} />
              <StatCard label="Gross profit" value={formatCurrency(report.grossProfit)} accent />
              <StatCard label="Sales" value={formatNumber(report.saleCount)} />
              <StatCard label="Purchase invoices" value={formatNumber(report.purchaseInvoiceCount)} />
            </div>

            <Card
              header={
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">{report.reportType} Report</p>
                    <h3 className="text-base font-semibold text-on-surface mt-1">{report.periodLabel}</h3>
                    <p className="text-sm text-on-surface-variant">
                      {new Date(report.rangeStart).toLocaleString()} &ndash; {new Date(report.rangeEndExclusive).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton size="sm" tone="tonal" icon={Download} onClick={handleCsvExport}>
                      Export CSV
                    </ActionButton>
                    <ActionButton size="sm" icon={Download} onClick={() => void handlePdfExport()} isLoading={isExportingPdf}>
                      Download PDF
                    </ActionButton>
                  </div>
                </div>
              }
            >
              {report.entries.length === 0 ? (
                <EmptyState icon={BarChart3} title="No data" description="No transactions were recorded for this reporting window." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-white/[0.06]">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Period</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Revenue</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Discounts</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Purchase costs</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Gross profit</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Sales</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Purchase invoices</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {report.entries.map((entry) => (
                        <tr key={entry.label} className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3 text-on-surface">{entry.label}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{formatCurrency(entry.revenue)}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{formatCurrency(entry.discounts)}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{formatCurrency(entry.purchaseCosts)}</td>
                          <td className="px-4 py-3 text-on-surface font-semibold">{formatCurrency(entry.grossProfit)}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{formatNumber(entry.saleCount)}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{formatNumber(entry.purchaseInvoiceCount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </PageShell>
  );
}
