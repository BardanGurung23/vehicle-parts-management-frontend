import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, getHours } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  CreditCard,
  Package,
  PackageX,
  TrendingUp,
} from "lucide-react";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { DashboardSummary } from "../../app/types";
import { PageShell } from "../../shared/components/PageShell";
import { AlertBox } from "../../shared/components/AlertBox";
import { Badge } from "../../shared/components/Badge";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { InventoryHealthPanel } from "./components/InventoryHealthPanel";
import { CustomerLookupPanel } from "./components/CustomerLookupPanel";
import { KpiGrid } from "./components/KpiGrid";

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const formatNumber = (value: number) => numberFormatter.format(value);
const formatCurrency = (value: number) => currencyFormatter.format(value);

type RtqErrorShape = { data?: unknown; error?: unknown };

function asMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (!error || typeof error !== "object") return fallback;
  const payload = error as RtqErrorShape;
  const body = payload.data;
  if (body && typeof body === "object") {
    const details = body as { detail?: unknown; title?: unknown; message?: unknown };
    return (
      asMessage(details.detail) ??
      asMessage(details.message) ??
      asMessage(details.title) ??
      fallback
    );
  }
  return asMessage(payload.error) ?? fallback;
}

function getPartOfDay(date: Date): string {
  const hour = getHours(date);
  if (hour >= 0 && hour < 6) return "evening";
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

function GreetingHeader({ userName }: { userName: string }) {
  const today = format(new Date(), "EEEE, MMMM d");
  return (
    <div>
      <p className="text-[12px] font-medium text-[var(--md-sys-color-on-surface-variant)] tabular">
        {today}
      </p>
      <h2 className="mt-1 text-headline-medium text-[var(--md-sys-color-on-surface)] font-semibold tracking-tight">
        Good {getPartOfDay(new Date())}, {userName}
      </h2>
    </div>
  );
}

type MetricCard = {
  label: string;
  value: string;
  note: string;
  icon?: React.ElementType;
  accent?: boolean;
};

export function DashboardPage() {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const role = user?.role ?? "";
  const isCustomer = role === "Customer";
  const canViewInventory = role === "Admin" || role === "Staff";

  useEffect(() => {
    if (!token) {
      setSummary(null);
      setSummaryError(null);
      setIsSummaryLoading(false);
      return;
    }

    let isActive = true;
    setIsSummaryLoading(true);

    void api
      .getDashboardSummary(token)
      .then((response) => {
        if (!isActive) return;
        setSummary(response);
        setSummaryError(null);
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setSummary(null);
        setSummaryError(extractErrorMessage(error, "Could not load the dashboard."));
      })
      .finally(() => {
        if (isActive) setIsSummaryLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  const inventory = summary?.inventory ?? null;
  const alerts = summary?.alerts ?? null;
  const customerProfile = summary?.currentCustomer ?? null;
  const displayName =
    customerProfile?.fullName ?? user?.fullName ?? user?.email ?? "there";

  const trackedPartCount = inventory?.trackedPartCount ?? 0;
  const lowStockCount = inventory?.lowStockCount ?? 0;
  const outOfStockCount = inventory?.outOfStockCount ?? 0;
  const totalUnitsOnHand = inventory?.totalUnitsOnHand ?? 0;
  const inventoryCost = inventory?.inventoryCost ?? 0;
  const lowStockWatchlist = inventory?.lowStockParts ?? [];
  const overdueCreditWatchlist = alerts?.overdueCreditAlerts ?? [];
  const predictiveWatchlist = alerts?.predictiveAlerts ?? [];
  const recentRegisteredCustomers = summary?.recentRegisteredCustomers ?? [];

  const dashboardUnavailable = Boolean(summaryError) && !isSummaryLoading;

  const inventorySegments = useMemo(
    () =>
      (inventory?.stockStatus ?? []).map((segment) => {
        if (segment.label === "Healthy")
          return { label: segment.label, count: segment.count, color: "var(--success-500)" };
        if (segment.label === "Reorder soon")
          return { label: segment.label, count: segment.count, color: "var(--warning-500)" };
        return { label: segment.label, count: segment.count, color: "var(--danger-500)" };
      }),
    [inventory],
  );

  const metricCards = useMemo<MetricCard[]>(() => {
    if (isCustomer) {
      return [
        {
          label: "Vehicles",
          value: customerProfile ? formatNumber(customerProfile.vehicles.length) : "—",
          note: "Linked to your account",
          accent: true,
        },
        {
          label: "Account",
          value: user?.isActive ? "Active" : "Inactive",
          note: "Account status",
        },
      ];
    }
    return [
      {
        label: "Tracked SKUs",
        value: isSummaryLoading ? "—" : dashboardUnavailable ? "—" : formatNumber(trackedPartCount),
        note: "Parts in inventory",
        icon: Package,
        accent: true,
      },
      {
        label: "Reorder soon",
        value: isSummaryLoading ? "—" : dashboardUnavailable ? "—" : formatNumber(lowStockCount),
        note: "At or below threshold",
        icon: AlertTriangle,
      },
      {
        label: "Out of stock",
        value: isSummaryLoading ? "—" : dashboardUnavailable ? "—" : formatNumber(outOfStockCount),
        note: "Zero on hand",
        icon: PackageX,
      },
      {
        label: "Inventory value",
        value: isSummaryLoading ? "—" : dashboardUnavailable ? "—" : formatCurrency(inventoryCost),
        note: "Cost on hand",
        icon: CreditCard,
      },
      {
        label: "Units on hand",
        value: isSummaryLoading ? "—" : dashboardUnavailable ? "—" : formatNumber(totalUnitsOnHand),
        note: "Total stock units",
        icon: TrendingUp,
      },
    ];
  }, [
    customerProfile,
    inventoryCost,
    isCustomer,
    dashboardUnavailable,
    isSummaryLoading,
    lowStockCount,
    outOfStockCount,
    totalUnitsOnHand,
    trackedPartCount,
    user?.isActive,
  ]);

  return (
    <PageShell maxWidth="2xl">
      {summaryError ? <AlertBox tone="error" message={summaryError} dismissible /> : null}

      <GreetingHeader userName={displayName} />

      <KpiGrid cards={metricCards} />

      {isCustomer ? (
        customerProfile ? (
          <Card
            header={
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
                  Account details
                </h3>
                <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                  Contact information and linked vehicles.
                </p>
              </div>
            }
          >
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                { label: "Email", value: customerProfile.email ?? user?.email ?? "—" },
                { label: "Phone", value: customerProfile.phoneNumber },
                { label: "Address", value: customerProfile.address ?? "—" },
                { label: "Vehicles", value: formatNumber(customerProfile.vehicles.length) },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-[11px] uppercase tracking-[0.06em] font-medium text-[var(--md-sys-color-on-surface-variant)]">
                    {item.label}
                  </dt>
                  <dd className="mt-0.5 text-[var(--md-sys-color-on-surface)]">{item.value}</dd>
                </div>
              ))}
            </dl>
            {customerProfile.vehicles.length > 0 ? (
              <div className="mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-2">
                  Linked vehicles
                </p>
                <div className="flex flex-wrap gap-2">
                  {customerProfile.vehicles.map((v) => (
                    <Badge key={v.vehicleId} variant="brand">
                      {v.vehicleNumber}
                      {v.model ? ` · ${v.model}` : ""}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        ) : null
      ) : (
        <>
          {canViewInventory ? (
            <InventoryHealthPanel
              isLoading={isSummaryLoading}
              isUnavailable={dashboardUnavailable}
              trackedPartCount={trackedPartCount}
              segments={inventorySegments}
              lowStockWatchlist={lowStockWatchlist}
            />
          ) : null}

          <Card
            header={
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
                    Recent Registered Accounts
                  </h3>
                  <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                    Newly created portal accounts ready for staff workflows.
                  </p>
                </div>
                <Link
                  to="/app/customers/search"
                  className="text-[12px] font-medium text-[var(--md-sys-color-primary)] hover:opacity-80"
                >
                  View all
                </Link>
              </div>
            }
            bodyless
          >
            {isSummaryLoading ? (
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] p-5">
                Loading…
              </p>
            ) : dashboardUnavailable ? (
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] p-5">
                Recently registered accounts are unavailable right now.
              </p>
            ) : recentRegisteredCustomers.length > 0 ? (
              <ul className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                {recentRegisteredCustomers.map((customer) => (
                  <li key={customer.customerId}>
                    <Link
                      to={`/app/customers/${customer.customerId}`}
                      className="flex items-center justify-between gap-3 py-3 px-5 hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">
                            {customer.fullName}
                          </p>
                          <Badge variant="success" dot>Portal account</Badge>
                        </div>
                        <p className="mt-0.5 text-[12px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                          #{customer.customerId} · {customer.phoneNumber}
                          {customer.email ? ` · ${customer.email}` : ""}
                        </p>
                      </div>
                      <ArrowRight
                        className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] shrink-0"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5">
                <EmptyState
                  embedded
                  title="No registrations yet"
                  description="Customers who register through the portal will appear here."
                />
              </div>
            )}
          </Card>

          {alerts && !dashboardUnavailable ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card
                header={
                  <div>
                    <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
                      Alert summary
                    </h3>
                    <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                      Generated {new Date(alerts.generatedAt).toLocaleString()}
                    </p>
                  </div>
                }
              >
                <dl className="space-y-2.5 text-sm">
                  <Row label="Active alerts" value={formatNumber(alerts.activeAlertCount)} />
                  <Row label="Low stock" value={formatNumber(alerts.lowStockAlertCount)} />
                  <Row label="Overdue credits" value={formatNumber(alerts.overdueCreditAlertCount)} />
                  <Row label="Predictive alerts" value={formatNumber(alerts.predictiveAlertCount)} />
                </dl>
              </Card>

              <Card
                header={
                  <div>
                    <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
                      Attention watchlist
                    </h3>
                    <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                      Low stock, unpaid credits, and predictive flags.
                    </p>
                  </div>
                }
              >
                <div className="space-y-2 text-sm">
                  {alerts.lowStockAlerts.slice(0, 3).map((alert) => (
                    <Row
                      key={`stock-${alert.partId}`}
                      label={alert.partName}
                      value={
                        <span className="text-[var(--warning-700)] font-medium tabular">
                          {alert.stockQuantity}/{alert.threshold}
                        </span>
                      }
                    />
                  ))}
                  {overdueCreditWatchlist.slice(0, 2).map((alert) => (
                    <Row
                      key={`credit-${alert.saleId}`}
                      label={alert.customerName}
                      value={
                        <span className="text-[var(--danger-700)] font-medium tabular">
                          {formatCurrency(alert.outstandingAmount)}
                        </span>
                      }
                    />
                  ))}
                  {predictiveWatchlist.slice(0, 2).map((alert) => (
                    <Row
                      key={`predictive-${alert.predictiveAlertId}`}
                      label={alert.vehicleNumber}
                      value={alert.riskLevel}
                    />
                  ))}
                  {alerts.activeAlertCount === 0 ? (
                    <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                      No active alerts right now.
                    </p>
                  ) : null}
                </div>
              </Card>
            </div>
          ) : null}

          {token ? <CustomerLookupPanel token={token} /> : null}
        </>
      )}
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--md-sys-color-on-surface-variant)] truncate">{label}</span>
      <span className="text-[var(--md-sys-color-on-surface)]">{value}</span>
    </div>
  );
}
