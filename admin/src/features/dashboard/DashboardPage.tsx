import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { DashboardSummary } from "../../app/types";
import { PageShell } from "../../shared/components/PageShell";
import { AlertBox } from "../../shared/components/AlertBox";
import { Card } from "../../shared/components/Card";
import { KpiGrid } from "./components/KpiGrid";
import { InventoryHealthPanel } from "./components/InventoryHealthPanel";
import { CustomerLookupPanel } from "./components/CustomerLookupPanel";

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function formatNumber(value: number) { return numberFormatter.format(value); }
function formatCurrency(value: number) { return currencyFormatter.format(value); }

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
    return asMessage(details.detail) ?? asMessage(details.message) ?? asMessage(details.title) ?? fallback;
  }
  return asMessage(payload.error) ?? fallback;
}

type MetricCard = { label: string; value: string; note: string };

export function DashboardPage() {
  const { user, token, isAdmin } = useAuth();
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
        setSummaryError(extractErrorMessage(error, "Could not load the dashboard summary."));
      })
      .finally(() => {
        if (isActive) setIsSummaryLoading(false);
      });

    return () => { isActive = false; };
  }, [token]);

  const inventory = summary?.inventory ?? null;
  const alerts = summary?.alerts ?? null;
  const customerProfile = summary?.currentCustomer ?? null;

  const trackedPartCount = inventory?.trackedPartCount ?? 0;
  const lowStockCount = inventory?.lowStockCount ?? 0;
  const outOfStockCount = inventory?.outOfStockCount ?? 0;
  const totalUnitsOnHand = inventory?.totalUnitsOnHand ?? 0;
  const inventoryCost = inventory?.inventoryCost ?? 0;
  const lowStockWatchlist = inventory?.lowStockParts ?? [];
  const overdueCreditWatchlist = alerts?.overdueCreditAlerts ?? [];
  const predictiveWatchlist = alerts?.predictiveAlerts ?? [];

  const dashboardUnavailable = Boolean(summaryError) && !isSummaryLoading;

  const inventorySegments = useMemo(
    () =>
      (inventory?.stockStatus ?? []).map((segment) => {
        if (segment.label === "Healthy")
          return { label: segment.label, count: segment.count, color: "#0f766e" };
        if (segment.label === "Reorder soon")
          return { label: segment.label, count: segment.count, color: "#d97706" };
        return { label: segment.label, count: segment.count, color: "#b91c1c" };
      }),
    [inventory],
  );

  const metricCards = useMemo<MetricCard[]>(() => {
    if (isCustomer) {
      return [
        { label: "Vehicles", value: customerProfile ? formatNumber(customerProfile.vehicles.length) : "-", note: "Linked to your account" },
        { label: "Status", value: user?.isActive ? "Active" : "Inactive", note: "Account state" },
      ];
    }
    return [
      { label: "Tracked SKUs", value: isSummaryLoading ? "..." : dashboardUnavailable ? "-" : formatNumber(trackedPartCount), note: "Parts in inventory" },
      { label: "Low stock", value: isSummaryLoading ? "..." : dashboardUnavailable ? "-" : formatNumber(lowStockCount), note: "Below reorder level" },
      { label: "Out of stock", value: isSummaryLoading ? "..." : dashboardUnavailable ? "-" : formatNumber(outOfStockCount), note: "Zero sellable stock" },
      { label: "Inventory value", value: isSummaryLoading ? "..." : dashboardUnavailable ? "-" : formatCurrency(inventoryCost), note: "Cost on hand" },
      { label: "Units on hand", value: isSummaryLoading ? "..." : dashboardUnavailable ? "-" : formatNumber(totalUnitsOnHand), note: "Total stock units" },
    ];
  }, [customerProfile, inventoryCost, isCustomer, dashboardUnavailable, isSummaryLoading, lowStockCount, outOfStockCount, totalUnitsOnHand, trackedPartCount, user?.isActive]);

  return (
    <PageShell>
      {summaryError ? <AlertBox tone="error" message={summaryError} dismissible /> : null}

      <KpiGrid cards={metricCards} />

      {isCustomer ? (
        customerProfile ? (
          <div className="rounded-xl bg-surface-container-lowest shadow-level1 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-on-surface">Account Details</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Email", value: customerProfile.email ?? user?.email ?? "-" },
                { label: "Phone", value: customerProfile.phoneNumber },
                { label: "Address", value: customerProfile.address ?? "-" },
                { label: "Vehicles", value: formatNumber(customerProfile.vehicles.length) },
              ].map((item) => (
                <div key={item.label} className="flex gap-2 text-xs">
                  <dt className="w-16 text-on-surface-variant shrink-0">{item.label}</dt>
                  <dd className="text-on-surface">{item.value}</dd>
                </div>
              ))}
            </dl>
            {customerProfile.vehicles.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {customerProfile.vehicles.map((v) => (
                  <span key={v.vehicleId} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                    {v.vehicleNumber}{v.model ? ` (${v.model})` : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : null
      ) : (
        <>
          {canViewInventory && (
            <InventoryHealthPanel
              isLoading={isSummaryLoading}
              isUnavailable={dashboardUnavailable}
              trackedPartCount={trackedPartCount}
              segments={inventorySegments}
              lowStockWatchlist={lowStockWatchlist}
            />
          )}

              {isAdmin && alerts && !dashboardUnavailable && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card
                    header={
                      <div>
                        <h3 className="text-sm font-semibold text-on-surface">Alert Summary</h3>
                        <p className="text-xs text-on-surface-variant">Generated {new Date(alerts.generatedAt).toLocaleString()}</p>
                      </div>
                    }
                  >
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-2"><span className="text-on-surface-variant">Active alerts</span><span className="font-semibold text-on-surface">{formatNumber(alerts.activeAlertCount)}</span></div>
                      <div className="flex items-center justify-between gap-2"><span className="text-on-surface-variant">Low stock</span><span className="font-semibold text-on-surface">{formatNumber(alerts.lowStockAlertCount)}</span></div>
                      <div className="flex items-center justify-between gap-2"><span className="text-on-surface-variant">Overdue credits</span><span className="font-semibold text-on-surface">{formatNumber(alerts.overdueCreditAlertCount)}</span></div>
                      <div className="flex items-center justify-between gap-2"><span className="text-on-surface-variant">Predictive alerts</span><span className="font-semibold text-on-surface">{formatNumber(alerts.predictiveAlertCount)}</span></div>
                    </div>
                  </Card>

                  <Card
                    header={
                      <div>
                        <h3 className="text-sm font-semibold text-on-surface">Attention Watchlist</h3>
                        <p className="text-xs text-on-surface-variant">Low stock, unpaid credits, and recent predictive alerts.</p>
                      </div>
                    }
                  >
                    <div className="space-y-3 text-xs">
                      {alerts.lowStockAlerts.slice(0, 3).map((alert) => (
                        <div key={`stock-${alert.partId}`} className="flex items-center justify-between gap-2">
                          <span className="text-on-surface truncate">{alert.partName}</span>
                          <span className="font-medium text-warning">{alert.stockQuantity}/{alert.threshold}</span>
                        </div>
                      ))}
                      {overdueCreditWatchlist.slice(0, 2).map((alert) => (
                        <div key={`credit-${alert.saleId}`} className="flex items-center justify-between gap-2">
                          <span className="text-on-surface truncate">{alert.customerName}</span>
                          <span className="font-medium text-error">{formatCurrency(alert.outstandingAmount)}</span>
                        </div>
                      ))}
                      {predictiveWatchlist.slice(0, 2).map((alert) => (
                        <div key={`predictive-${alert.predictiveAlertId}`} className="flex items-center justify-between gap-2">
                          <span className="text-on-surface truncate">{alert.vehicleNumber}</span>
                          <span className="font-medium text-on-surface-variant">{alert.riskLevel}</span>
                        </div>
                      ))}
                      {alerts.activeAlertCount === 0 && <p className="text-on-surface-variant">No active alerts right now.</p>}
                    </div>
                  </Card>
                </div>
              )}

          {token && (
            <CustomerLookupPanel token={token} />
          )}
        </>
      )}
    </PageShell>
  );
}
