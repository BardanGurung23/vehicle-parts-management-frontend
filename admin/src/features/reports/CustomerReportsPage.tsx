import { useEffect, useMemo, useState } from "react";
import { BarChart3, Eye, Users } from "lucide-react";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { CustomerReportEntry, CustomerReports } from "../../app/types";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { StatCard } from "../../shared/components/StatCard";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { DataTable, type Column } from "../../shared/components/DataTable";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { EmptyState } from "../../shared/components/EmptyState";
import { Segmented } from "../../shared/components/Segmented";
import { Field } from "../../shared/components/Field";
import { CustomerReportDetailDialog } from "./components/CustomerReportDetailDialog";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "—";

function toIsoDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

const extractErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

type ReportSection = "regular" | "high-spenders" | "pending-credits";

export function CustomerReportsPage() {
  const { token } = useAuth();
  const now = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState(
    toIsoDate(
      new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30),
      ),
    ),
  );
  const [endDate, setEndDate] = useState(
    toIsoDate(
      new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
      ),
    ),
  );
  const [threshold, setThreshold] = useState("5000");
  const [section, setSection] = useState<ReportSection>("regular");
  const [report, setReport] = useState<CustomerReports | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerReportEntry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    let isActive = true;
    setIsLoading(true);
    void api
      .getCustomerReports(token, {
        startDate,
        endDate,
        highSpenderThreshold: Number(threshold) || 5000,
      })
      .then((response) => {
        if (!isActive) return;
        setReport(response);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!isActive) return;
        setReport(null);
        setError(
          extractErrorMessage(loadError, "Could not load customer reports."),
        );
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [endDate, startDate, threshold, token]);

  const activeRows =
    section === "regular"
      ? (report?.regularCustomers ?? [])
      : section === "high-spenders"
        ? (report?.highSpenders ?? [])
        : (report?.pendingCredits ?? []);

  const columns: Column<CustomerReportEntry>[] = [
    {
      key: "customer",
      header: "Customer",
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)] truncate">
            {row.fullName}
          </p>
          <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] truncate tabular">
            #{row.customerId} · {row.phoneNumber}
          </p>
        </div>
      ),
    },
    {
      key: "spend",
      header: "Total spent",
      align: "right",
      cell: (row) => <span className="tabular">{formatCurrency(row.totalSpent)}</span>,
      width: "140px",
    },
    {
      key: "activity",
      header: "Activity",
      cell: (row) => (
        <span className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
          {row.saleCount} sales · {row.appointmentCount} appointments
        </span>
      ),
    },
    {
      key: "credits",
      header: "Credits",
      cell: (row) => (
        <span className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
          {row.pendingInvoiceCount} pending · {row.overdueInvoiceCount} overdue
        </span>
      ),
    },
    {
      key: "outstanding",
      header: "Outstanding",
      align: "right",
      cell: (row) => <span className="tabular">{formatCurrency(row.outstandingAmount)}</span>,
      width: "140px",
    },
    {
      key: "last-activity",
      header: "Last activity",
      cell: (row) => (
        <span className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
          {formatDate(row.lastActivityAt)}
        </span>
      ),
      width: "180px",
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "120px",
      cell: (row) => (
        <ActionButton
          tone="ghost"
          size="sm"
          icon={Eye}
          onClick={() => {
            setSelectedCustomer(row);
            setIsDetailOpen(true);
          }}
        >
          View details
        </ActionButton>
      ),
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
        title="Customer Reports"
        description="Loyalty, top spenders, and pending credit balances."
      />

      {error ? <AlertBox tone="error" message={error} dismissible /> : null}

      <Card
        header={
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
              Filters
            </h3>
            <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
              Adjust the activity window and the high-spender threshold.
            </p>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Start date" htmlFor="customer-report-start">
            <input
              id="customer-report-start"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </Field>
          <Field label="End date" htmlFor="customer-report-end">
            <input
              id="customer-report-end"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </Field>
          <Field
            label="High spender threshold"
            htmlFor="customer-report-threshold"
            hint="Used to populate the High spenders tab."
          >
            <input
              id="customer-report-threshold"
              type="number"
              min="0"
              step="100"
              value={threshold}
              onChange={(event) => setThreshold(event.target.value)}
            />
          </Field>
        </div>
      </Card>

      {report ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Regular customers"
              value={String(report.regularCustomerCount)}
              note={report.periodLabel}
              accent
            />
            <StatCard
              label="High spenders"
              value={String(report.highSpenderCount)}
              note={`Threshold ${formatCurrency(report.highSpenderThreshold)}`}
            />
            <StatCard
              label="Pending credits"
              value={String(report.pendingCreditCustomerCount)}
              note="Customers with unpaid invoices"
            />
            <StatCard
              label="Overdue credits"
              value={String(report.overdueCreditCustomerCount)}
              note="Older than one month"
            />
          </div>

          <Card bodyless>
            <div className="px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
                  {report.periodLabel}
                </h3>
                <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
                  {activeRows.length} record{activeRows.length === 1 ? "" : "s"}
                </p>
              </div>
              <Segmented
                size="sm"
                ariaLabel="Filter customers"
                value={section}
                onChange={setSection}
                options={[
                  { value: "regular", label: "Regular", count: report.regularCustomerCount },
                  { value: "high-spenders", label: "High spenders", count: report.highSpenderCount },
                  { value: "pending-credits", label: "Credits", count: report.pendingCreditCustomerCount },
                ]}
              />
            </div>

            {activeRows.length > 0 ? (
              <DataTable
                columns={columns}
                data={activeRows}
                keyExtractor={(row) => row.customerId}
                caption="Customer report"
              />
            ) : (
              <div className="p-5">
                <EmptyState
                  embedded
                  icon={section === "pending-credits" ? BarChart3 : Users}
                  title="No matching customers"
                  description="Adjust the filters to broaden the report."
                />
              </div>
            )}
          </Card>

          <CustomerReportDetailDialog
            token={token}
            customer={selectedCustomer}
            open={isDetailOpen}
            onOpenChange={(open) => {
              setIsDetailOpen(open);
              if (!open) setSelectedCustomer(null);
            }}
          />
        </>
      ) : (
        <EmptyState
          icon={BarChart3}
          title="Report unavailable"
          description="The report could not be loaded for the selected filters."
        />
      )}
    </PageShell>
  );
}
