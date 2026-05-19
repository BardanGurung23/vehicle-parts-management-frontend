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
import { CustomerReportDetailDialog } from "./components/CustomerReportDetailDialog";

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
function formatCurrency(value: number) { return currencyFormatter.format(value); }
function formatDate(value?: string | null) { return value ? new Date(value).toLocaleString() : "-"; }
function toIsoDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return fallback;
}

type ReportSection = "regular" | "high-spenders" | "pending-credits";

export function CustomerReportsPage() {
  const { token } = useAuth();
  const now = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState(toIsoDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30))));
  const [endDate, setEndDate] = useState(toIsoDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))));
  const [threshold, setThreshold] = useState("5000");
  const [section, setSection] = useState<ReportSection>("regular");
  const [report, setReport] = useState<CustomerReports | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerReportEntry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isActive = true;
    setIsLoading(true);

    void api.getCustomerReports(token, {
      startDate,
      endDate,
      highSpenderThreshold: Number(threshold) || 5000,
    })
      .then((response) => {
        if (!isActive) {
          return;
        }

        setReport(response);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!isActive) {
          return;
        }

        setReport(null);
        setError(extractErrorMessage(loadError, "Could not load the customer reports."));
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [endDate, startDate, threshold, token]);

  const activeRows = section === "regular"
    ? report?.regularCustomers ?? []
    : section === "high-spenders"
      ? report?.highSpenders ?? []
      : report?.pendingCredits ?? [];

  const columns: Column<CustomerReportEntry>[] = [
    {
      key: "customer",
      header: "Customer",
      cell: (row) => (
        <div>
          <p className="text-on-surface font-medium">{row.fullName}</p>
          <p className="text-xs text-on-surface-variant">#{row.customerId} · {row.phoneNumber}</p>
        </div>
      ),
    },
    {
      key: "spend",
      header: "Total spent",
      cell: (row) => <span>{formatCurrency(row.totalSpent)}</span>,
    },
    {
      key: "activity",
      header: "Activity",
      cell: (row) => <span>{row.saleCount} sales · {row.appointmentCount} appointments</span>,
    },
    {
      key: "credits",
      header: "Credits",
      cell: (row) => <span>{row.pendingInvoiceCount} pending · {row.overdueInvoiceCount} overdue</span>,
    },
    {
      key: "outstanding",
      header: "Outstanding",
      cell: (row) => <span>{formatCurrency(row.outstandingAmount)}</span>,
    },
    {
      key: "last-activity",
      header: "Last activity",
      cell: (row) => <span>{formatDate(row.lastActivityAt)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <ActionButton size="sm" tone="tonal" icon={Eye} onClick={() => {
          setSelectedCustomer(row);
          setIsDetailOpen(true);
        }}>
          View details
        </ActionButton>
      ),
    },
  ];

  if (isLoading) {
    return <PageShell><SkeletonCard /></PageShell>;
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Staff Reports"
        title="Customer Reports"
        description="Review regular customers, high spenders, and pending or overdue credit accounts."
      />

      {error ? <AlertBox tone="error" message={error} dismissible /> : null}

      <Card
        header={
          <div>
            <h3 className="text-base font-semibold text-on-surface">Report filters</h3>
            <p className="text-sm text-on-surface-variant">Adjust the activity window and high-spender threshold.</p>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="customer-report-start" className="block text-xs font-medium text-on-surface-variant mb-1">Start date</label>
            <input id="customer-report-start" className="input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </div>
          <div>
            <label htmlFor="customer-report-end" className="block text-xs font-medium text-on-surface-variant mb-1">End date</label>
            <input id="customer-report-end" className="input" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </div>
          <div>
            <label htmlFor="customer-report-threshold" className="block text-xs font-medium text-on-surface-variant mb-1">High spender threshold</label>
            <input id="customer-report-threshold" className="input" type="number" min="0" step="100" value={threshold} onChange={(event) => setThreshold(event.target.value)} />
          </div>
        </div>
      </Card>

      {report ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Regular customers" value={String(report.regularCustomerCount)} note={report.periodLabel} />
            <StatCard label="High spenders" value={String(report.highSpenderCount)} note={`Threshold ${formatCurrency(report.highSpenderThreshold)}`} accent />
            <StatCard label="Pending credits" value={String(report.pendingCreditCustomerCount)} note="Customers with unpaid invoices" />
            <StatCard label="Overdue credits" value={String(report.overdueCreditCustomerCount)} note="Older than one month" />
          </div>

          <Card
            header={
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Customer Report</p>
                <h3 className="text-base font-semibold text-on-surface mt-1">{report.periodLabel}</h3>
                <p className="text-sm text-on-surface-variant">Switch between report sections without leaving the page.</p>
              </div>
            }
          >
            <div className="flex flex-wrap gap-2 mb-4">
              <ActionButton tone={section === "regular" ? "filled" : "tonal"} size="sm" onClick={() => setSection("regular")}>Regular Customers</ActionButton>
              <ActionButton tone={section === "high-spenders" ? "filled" : "tonal"} size="sm" onClick={() => setSection("high-spenders")}>High Spenders</ActionButton>
              <ActionButton tone={section === "pending-credits" ? "filled" : "tonal"} size="sm" onClick={() => setSection("pending-credits")}>Pending Credits</ActionButton>
            </div>

            {activeRows.length > 0 ? (
              <DataTable columns={columns} data={activeRows} keyExtractor={(row) => row.customerId} />
            ) : (
              <EmptyState icon={section === "pending-credits" ? BarChart3 : Users} title="No matching customers" description="No customers matched this report section for the selected filters." />
            )}
          </Card>

          <CustomerReportDetailDialog
            token={token}
            customer={selectedCustomer}
            open={isDetailOpen}
            onOpenChange={(open) => {
              setIsDetailOpen(open);
              if (!open) {
                setSelectedCustomer(null);
              }
            }}
          />
        </>
      ) : (
        <EmptyState icon={BarChart3} title="Customer reports unavailable" description="The report could not be loaded for the selected filters." />
      )}
    </PageShell>
  );
}