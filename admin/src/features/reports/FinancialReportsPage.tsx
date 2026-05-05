import { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetDailyFinancialReportQuery, useGetMonthlyFinancialReportQuery, useGetYearlyFinancialReportQuery } from "../../redux/services/financialReports";
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

type ReportType = "daily" | "monthly" | "yearly";
type RtqErrorShape = { data?: unknown };

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const numberFormatter = new Intl.NumberFormat("en-US");
function formatCurrency(value: number) { return currencyFormatter.format(value); }
function formatNumber(value: number) { return numberFormatter.format(value); }
function asMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.trim() || null;
}
function extractErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") return fallback;
  const payload = error as RtqErrorShape;
  const body = payload.data;
  if (!body || typeof body !== "object") return fallback;
  const details = body as { detail?: unknown; title?: unknown; message?: unknown };
  return asMessage(details.detail) ?? asMessage(details.message) ?? asMessage(details.title) ?? fallback;
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

export function FinancialReportsPage() {
  const now = useMemo(() => new Date(), []);
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [selectedDate, setSelectedDate] = useState(toIsoDate(now));
  const [selectedMonth, setSelectedMonth] = useState(toMonthValue(now));
  const [selectedYear, setSelectedYear] = useState(String(now.getUTCFullYear()));

  const dailyQuery = useGetDailyFinancialReportQuery(reportType === "daily" ? { date: selectedDate || undefined } : skipToken);
  const { year: monthlyYear, month: monthlyMonth } = parseMonthValue(selectedMonth);
  const monthlyQuery = useGetMonthlyFinancialReportQuery(reportType === "monthly" ? { year: monthlyYear, month: monthlyMonth } : skipToken);
  const parsedYear = Number(selectedYear);
  const yearlyQuery = useGetYearlyFinancialReportQuery(reportType === "yearly" && Number.isInteger(parsedYear) ? { year: parsedYear } : skipToken);

  const activeQuery = reportType === "daily" ? dailyQuery : reportType === "monthly" ? monthlyQuery : yearlyQuery;
  const report: FinancialReport | undefined = activeQuery.data;
  const errorMessage = activeQuery.error ? extractErrorMessage(activeQuery.error, "Could not load the financial report.") : null;

  if (activeQuery.isLoading) return <PageShell><SkeletonCard /></PageShell>;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Admin Finance"
        title="Financial Reports"
        description="Review revenue, discounts, purchase spend, and gross profit across reporting windows."
      />

      {errorMessage ? <AlertBox tone="error" message={errorMessage} dismissible /> : null}

      <Card
        header={
          <div>
            <h3 className="text-base font-semibold text-on-surface">Report Range</h3>
            <p className="text-sm text-on-surface-variant">Switch between daily, monthly, and yearly windows.</p>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {(["daily", "monthly", "yearly"] as const).map((type) => (
              <ActionButton key={type} tone={reportType === type ? "primary" : "secondary"} size="sm" onClick={() => setReportType(type)}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
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
          </div>
        </div>
      </Card>

      {!report ? (
        <div className="bg-info-50 border border-info-100 text-info-700 rounded-lg p-3 text-sm">
          Choose a report range to review financial metrics.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard label="Revenue" value={formatCurrency(report.revenue)} />
            <StatCard label="Discounts" value={formatCurrency(report.discounts)} />
            <StatCard label="Purchase costs" value={formatCurrency(report.purchaseCosts)} />
            <StatCard label="Gross profit" value={formatCurrency(report.grossProfit)} accent />
            <StatCard label="Sales" value={formatNumber(report.saleCount)} />
            <StatCard label="Purchase invoices" value={formatNumber(report.purchaseInvoiceCount)} />
          </div>

          <Card
            header={
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">{report.reportType} Report</p>
                <h3 className="text-base font-semibold text-on-surface mt-1">{report.periodLabel}</h3>
                <p className="text-sm text-on-surface-variant">
                  {new Date(report.rangeStart).toLocaleString()} &ndash; {new Date(report.rangeEndExclusive).toLocaleString()}
                </p>
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
        </>
      )}
    </PageShell>
  );
}
