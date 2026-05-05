import { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetDailyFinancialReportQuery, useGetMonthlyFinancialReportQuery, useGetYearlyFinancialReportQuery } from "../../redux/services/financialReports";
import { AlertBox } from "../../shared/components/AlertBox";
import { ActionButton } from "../../shared/components/ActionButton";
import { LoadingScreen } from "../../shared/components/LoadingScreen";
import type { FinancialReport } from "../../app/types";

type ReportType = "daily" | "monthly" | "yearly";

type RtqErrorShape = {
  data?: unknown;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US");

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function asMessage(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const payload = error as RtqErrorShape;
  const body = payload.data;
  if (!body || typeof body !== "object") {
    return fallback;
  }

  const details = body as { detail?: unknown; title?: unknown; message?: unknown };
  return asMessage(details.detail) ?? asMessage(details.message) ?? asMessage(details.title) ?? fallback;
}

function toIsoDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toMonthValue(date: Date) {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function parseMonthValue(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    const now = new Date();
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
  };
}

export function FinancialReportsPage() {
  const now = useMemo(() => new Date(), []);
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [selectedDate, setSelectedDate] = useState(toIsoDate(now));
  const [selectedMonth, setSelectedMonth] = useState(toMonthValue(now));
  const [selectedYear, setSelectedYear] = useState(String(now.getUTCFullYear()));

  const dailyQuery = useGetDailyFinancialReportQuery(
    reportType === "daily" ? { date: selectedDate || undefined } : skipToken,
  );

  const { year: monthlyYear, month: monthlyMonth } = parseMonthValue(selectedMonth);
  const monthlyQuery = useGetMonthlyFinancialReportQuery(
    reportType === "monthly" ? { year: monthlyYear, month: monthlyMonth } : skipToken,
  );

  const parsedYear = Number(selectedYear);
  const yearlyQuery = useGetYearlyFinancialReportQuery(
    reportType === "yearly" && Number.isInteger(parsedYear) ? { year: parsedYear } : skipToken,
  );

  const activeQuery = reportType === "daily"
    ? dailyQuery
    : reportType === "monthly"
      ? monthlyQuery
      : yearlyQuery;

  const report: FinancialReport | undefined = activeQuery.data;
  const errorMessage = activeQuery.error
    ? extractErrorMessage(activeQuery.error, "Could not load the financial report.")
    : null;

  if (activeQuery.isLoading) {
    return <LoadingScreen message="Loading financial reports..." />;
  }

  return (
    <section className="page-stack">
      {errorMessage ? <AlertBox tone="error" message={errorMessage} /> : null}

      <article className="card parts-overview">
        <div className="parts-overview__top">
          <div className="card__header">
            <p className="eyebrow">Admin Finance</p>
            <h2>Track revenue against purchase spend</h2>
            <p className="card__copy">
              Switch between daily, monthly, and yearly windows to review revenue, discounts, purchase costs, and gross profit from persisted transactions.
            </p>
          </div>
        </div>

        <div className="staff-user-card__actions">
          <ActionButton type="button" tone={reportType === "daily" ? "primary" : "secondary"} onClick={() => setReportType("daily")}>
            Daily
          </ActionButton>
          <ActionButton type="button" tone={reportType === "monthly" ? "primary" : "secondary"} onClick={() => setReportType("monthly")}>
            Monthly
          </ActionButton>
          <ActionButton type="button" tone={reportType === "yearly" ? "primary" : "secondary"} onClick={() => setReportType("yearly")}>
            Yearly
          </ActionButton>
        </div>

        <div className="form-grid form-grid--three-columns">
          {reportType === "daily" ? (
            <label className="field">
              <span className="field__label">Date</span>
              <input className="input" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </label>
          ) : null}

          {reportType === "monthly" ? (
            <label className="field">
              <span className="field__label">Month</span>
              <input className="input" type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
            </label>
          ) : null}

          {reportType === "yearly" ? (
            <label className="field">
              <span className="field__label">Year</span>
              <input className="input" type="number" min="2000" step="1" value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} />
            </label>
          ) : null}
        </div>
      </article>

      {!report ? (
        <AlertBox tone="info" message="Choose a report range to review financial metrics." />
      ) : (
        <>
          <div className="parts-stats">
            <div className="card">
              <dt>Revenue</dt>
              <dd>{formatCurrency(report.revenue)}</dd>
            </div>
            <div className="card">
              <dt>Discounts</dt>
              <dd>{formatCurrency(report.discounts)}</dd>
            </div>
            <div className="card">
              <dt>Purchase costs</dt>
              <dd>{formatCurrency(report.purchaseCosts)}</dd>
            </div>
            <div className="card">
              <dt>Gross profit</dt>
              <dd>{formatCurrency(report.grossProfit)}</dd>
            </div>
            <div className="card">
              <dt>Sales</dt>
              <dd>{formatNumber(report.saleCount)}</dd>
            </div>
            <div className="card">
              <dt>Purchase invoices</dt>
              <dd>{formatNumber(report.purchaseInvoiceCount)}</dd>
            </div>
          </div>

          <section className="card parts-list-card">
            <div className="parts-list-card__header">
              <div className="card__header">
                <p className="eyebrow">{report.reportType} Report</p>
                <h2>{report.periodLabel}</h2>
                <p className="card__copy">
                  Reporting window from {new Date(report.rangeStart).toLocaleString()} to {new Date(report.rangeEndExclusive).toLocaleString()}.
                </p>
              </div>
            </div>

            {report.entries.length === 0 ? (
              <p className="empty-state">No transactions were recorded for this reporting window.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-surface text-foreground border border-line">
                  <thead className="bg-surface border-b border-line">
                    <tr>
                      <th className="px-3 py-1.5 text-left text-muted uppercase font-bold text-[10px] tracking-widest whitespace-nowrap">Period</th>
                      <th className="px-3 py-1.5 text-left text-muted uppercase font-bold text-[10px] tracking-widest whitespace-nowrap">Revenue</th>
                      <th className="px-3 py-1.5 text-left text-muted uppercase font-bold text-[10px] tracking-widest whitespace-nowrap">Discounts</th>
                      <th className="px-3 py-1.5 text-left text-muted uppercase font-bold text-[10px] tracking-widest whitespace-nowrap">Purchase costs</th>
                      <th className="px-3 py-1.5 text-left text-muted uppercase font-bold text-[10px] tracking-widest whitespace-nowrap">Gross profit</th>
                      <th className="px-3 py-1.5 text-left text-muted uppercase font-bold text-[10px] tracking-widest whitespace-nowrap">Sales</th>
                      <th className="px-3 py-1.5 text-left text-muted uppercase font-bold text-[10px] tracking-widest whitespace-nowrap">Purchase invoices</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.entries.map((entry) => (
                      <tr key={entry.label} className="border-b border-line hover:bg-accent-faint transition-colors">
                        <td className="px-3 py-2 text-[12px]">{entry.label}</td>
                        <td className="px-3 py-2 text-[12px]">{formatCurrency(entry.revenue)}</td>
                        <td className="px-3 py-2 text-[12px]">{formatCurrency(entry.discounts)}</td>
                        <td className="px-3 py-2 text-[12px]">{formatCurrency(entry.purchaseCosts)}</td>
                        <td className="px-3 py-2 text-[12px]">{formatCurrency(entry.grossProfit)}</td>
                        <td className="px-3 py-2 text-[12px]">{formatNumber(entry.saleCount)}</td>
                        <td className="px-3 py-2 text-[12px]">{formatNumber(entry.purchaseInvoiceCount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}