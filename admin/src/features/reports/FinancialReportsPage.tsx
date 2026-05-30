import { useEffect, useMemo, useRef, useState } from "react";
import { Download, BarChart3 } from "lucide-react";
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
import { DataTable, type Column } from "../../shared/components/DataTable";
import type { FinancialReport } from "../../app/types";
import { downloadElementPdf } from "../../shared/utils/downloadElementPdf";

type ReportType = "daily" | "monthly" | "yearly" | "all-time";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const numberFormatter = new Intl.NumberFormat("en-US");
const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatNumber = (value: number) => numberFormatter.format(value);
const extractErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

function toIsoDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}
function toMonthValue(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
function parseMonthValue(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    const now = new Date();
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
    };
  }
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
    .map((row) =>
      row
        .map((value) => {
          const normalized = value == null ? "" : String(value);
          if (/[",\n]/.test(normalized)) {
            return `"${normalized.replaceAll('"', '""')}"`;
          }
          return normalized;
        })
        .join(","),
    )
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
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
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
        return api.getMonthlyFinancialReport(token, {
          year: monthlyYear,
          month: monthlyMonth,
        });
      }
      if (reportType === "yearly") {
        return api.getYearlyFinancialReport(token, {
          year: Number.isInteger(parsedYear) ? parsedYear : undefined,
        });
      }
      return api.getAllTimeFinancialReport(token);
    };

    void loadReport()
      .then((response) => {
        if (!isActive) return;
        setReport(response);
        setErrorMessage(null);
        setFeedback(null);
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setReport(null);
        setErrorMessage(extractErrorMessage(error, "Could not load the report."));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [monthlyMonth, monthlyYear, parsedYear, reportType, selectedDate, token]);

  const handleCsvExport = () => {
    if (!report) {
      setFeedback({ tone: "error", message: "Load a report before exporting." });
      return;
    }
    downloadCsvFile(
      buildFinancialReportCsv(report),
      `financial-report-${report.reportType.toLowerCase().replace(/\s+/g, "-")}.csv`,
    );
    setFeedback({
      tone: "success",
      message: `CSV export started for the ${report.reportType.toLowerCase()} report.`,
    });
  };

  const handlePdfExport = async () => {
    if (!report || !exportRef.current) {
      setFeedback({ tone: "error", message: "Report is not ready to export." });
      return;
    }
    try {
      setIsExportingPdf(true);
      setFeedback(null);
      await downloadElementPdf({
        container: exportRef.current,
        fileName: `financial-report-${report.reportType.toLowerCase().replace(/\s+/g, "-")}.pdf`,
      });
      setFeedback({
        tone: "success",
        message: `PDF export started for the ${report.reportType.toLowerCase()} report.`,
      });
    } catch {
      setFeedback({ tone: "error", message: "Could not generate the report PDF." });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const columns: Column<FinancialReport["entries"][number]>[] = [
    {
      key: "label",
      header: "Period",
      cell: (row) => (
        <span className="text-[var(--md-sys-color-on-surface)]">{row.label}</span>
      ),
    },
    {
      key: "revenue",
      header: "Revenue",
      align: "right",
      cell: (row) => <span className="tabular">{formatCurrency(row.revenue)}</span>,
    },
    {
      key: "discounts",
      header: "Discounts",
      align: "right",
      cell: (row) => (
        <span className="tabular text-[var(--md-sys-color-on-surface-variant)]">
          {formatCurrency(row.discounts)}
        </span>
      ),
    },
    {
      key: "costs",
      header: "Costs",
      align: "right",
      cell: (row) => (
        <span className="tabular text-[var(--md-sys-color-on-surface-variant)]">
          {formatCurrency(row.purchaseCosts)}
        </span>
      ),
    },
    {
      key: "profit",
      header: "Gross profit",
      align: "right",
      cell: (row) => (
        <span className="tabular font-semibold">{formatCurrency(row.grossProfit)}</span>
      ),
    },
    {
      key: "sales",
      header: "Sales",
      align: "right",
      cell: (row) => <span className="tabular">{formatNumber(row.saleCount)}</span>,
      width: "90px",
    },
    {
      key: "invoices",
      header: "Invoices",
      align: "right",
      cell: (row) => (
        <span className="tabular">{formatNumber(row.purchaseInvoiceCount)}</span>
      ),
      width: "100px",
    },
  ];

  if (isLoading) {
    return (
      <PageShell>
        <SkeletonCard />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Financial Reports"
        description="Revenue, discounts, purchase spend, and gross profit."
        actions={
          report ? (
            <>
              <ActionButton
                tone="secondary"
                size="sm"
                icon={Download}
                onClick={handleCsvExport}
              >
                Export CSV
              </ActionButton>
              <ActionButton
                size="sm"
                icon={Download}
                onClick={() => void handlePdfExport()}
                isLoading={isExportingPdf}
              >
                Download PDF
              </ActionButton>
            </>
          ) : undefined
        }
      />

      {errorMessage ? <AlertBox tone="error" message={errorMessage} dismissible /> : null}
      {feedback ? <AlertBox tone={feedback.tone} message={feedback.message} dismissible /> : null}

      <Card
        header={
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
              Range
            </h3>
            <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
              Switch between daily, monthly, yearly, and all-time windows.
            </p>
          </div>
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div
            role="radiogroup"
            aria-label="Select report range"
            className="flex items-center gap-1 flex-wrap"
          >
            {(
              [
                ["daily", "Daily"],
                ["monthly", "Monthly"],
                ["yearly", "Yearly"],
                ["all-time", "All Time"],
              ] as const
            ).map(([value, label]) => (
              <ActionButton
                key={value}
                tone={reportType === value ? "primary" : "secondary"}
                size="sm"
                aria-pressed={reportType === value}
                onClick={() => setReportType(value)}
              >
                {label}
              </ActionButton>
            ))}
          </div>
          <div className="max-w-xs w-full">
            {reportType === "daily" ? (
              <label className="block text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                <span className="block mb-1">Date</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </label>
            ) : null}
            {reportType === "monthly" ? (
              <label className="block text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                <span className="block mb-1">Month</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </label>
            ) : null}
            {reportType === "yearly" ? (
              <label className="block text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                <span className="block mb-1">Year</span>
                <input
                  type="number"
                  min="2000"
                  step="1"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                />
              </label>
            ) : null}
            {reportType === "all-time" ? (
              <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                Includes every recorded transaction.
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      {!report ? (
        <AlertBox tone="info" message="Choose a report range to review financial metrics." />
      ) : (
        <div ref={exportRef} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Revenue" value={formatCurrency(report.revenue)} />
            <StatCard label="Discounts" value={formatCurrency(report.discounts)} />
            <StatCard label="Purchase costs" value={formatCurrency(report.purchaseCosts)} />
            <StatCard label="Gross profit" value={formatCurrency(report.grossProfit)} accent />
            <StatCard label="Sales" value={formatNumber(report.saleCount)} />
            <StatCard label="Invoices" value={formatNumber(report.purchaseInvoiceCount)} />
          </div>

          <Card
            header={
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
                  {report.periodLabel}
                </h3>
                <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
                  {new Date(report.rangeStart).toLocaleString()} —{" "}
                  {new Date(report.rangeEndExclusive).toLocaleString()}
                </p>
              </div>
            }
            bodyless
          >
            {report.entries.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  embedded
                  icon={BarChart3}
                  title="No data"
                  description="No transactions in this window."
                />
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={report.entries}
                keyExtractor={(row) => row.label}
                caption="Financial breakdown"
              />
            )}
          </Card>
        </div>
      )}
    </PageShell>
  );
}
