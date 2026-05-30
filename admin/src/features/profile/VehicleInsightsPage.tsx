import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  BatteryCharging,
  BrainCircuit,
  Gauge,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { VehicleInsightItem, VehicleInsights } from "../../app/types";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { Badge } from "../../shared/components/Badge";
import { SkeletonCard } from "../../shared/components/Skeleton";

function riskVariant(riskLevel: string) {
  if (riskLevel === "High") return "danger" as const;
  if (riskLevel === "Medium") return "warning" as const;
  return "success" as const;
}

function healthVariant(status: string) {
  if (status === "Critical") return "danger" as const;
  if (status === "Moderate") return "warning" as const;
  return "success" as const;
}

function insightIcon(category: string) {
  if (category === "Brakes") return ShieldCheck;
  if (category === "Electrical") return BatteryCharging;
  if (category === "Engine") return Gauge;
  if (category === "Tires") return Activity;
  return Wrench;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatNumber(value?: number | null) {
  return typeof value === "number" ? value.toLocaleString() : "—";
}

function InsightCard({ insight }: { insight: VehicleInsightItem }) {
  const Icon = insightIcon(insight.category);
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid place-items-center w-10 h-10 rounded-md bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-100)] shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
              {insight.title}
            </p>
            <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
              {insight.category}
            </p>
          </div>
        </div>
        <Badge variant={riskVariant(insight.riskLevel)} dot>
          {insight.riskLevel}
        </Badge>
      </div>
      <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] leading-6 mt-3">
        {insight.description}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        <div className="rounded-md bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] p-3">
          <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--md-sys-color-on-surface-variant)]">
            Predicted timeframe
          </p>
          <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] mt-1">
            {insight.predictedTimeframe}
          </p>
        </div>
        <div className="rounded-md bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] p-3">
          <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--md-sys-color-on-surface-variant)]">
            Recommended action
          </p>
          <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] mt-1">
            {insight.recommendedAction}
          </p>
        </div>
      </div>
    </Card>
  );
}

export function VehicleInsightsPage() {
  const { token } = useAuth();
  const { vehicleId } = useParams();
  const [insights, setInsights] = useState<VehicleInsights | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const parsedVehicleId = Number(vehicleId);

    if (!token || !Number.isInteger(parsedVehicleId)) {
      setPageError("Vehicle insight details are unavailable for this vehicle.");
      setIsLoading(false);
      return;
    }

    let isActive = true;

    void api
      .getVehicleInsights(token, parsedVehicleId)
      .then((response) => {
        if (!isActive) return;
        setInsights(response);
        setPageError(null);
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setPageError(
          error instanceof ApiError
            ? error.message
            : "Could not load AI vehicle insights.",
        );
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [token, vehicleId]);

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
        title="Predictive maintenance"
        description="Rule-based analysis from mileage, age, and recent service signals."
        actions={
          <Link to="/app/profile/vehicles">
            <ActionButton tone="secondary" icon={ArrowLeft} size="sm">
              Vehicles
            </ActionButton>
          </Link>
        }
      />

      {pageError ? <AlertBox tone="error" message={pageError} dismissible /> : null}

      {insights ? (
        <div className="space-y-4">
          <Card
            header={
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center w-10 h-10 rounded-md bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-100)]">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
                      {insights.model ?? "Vehicle"}
                    </h3>
                    <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
                      {insights.vehicleNumber}
                    </p>
                  </div>
                </div>
                <Badge variant={healthVariant(insights.healthStatus)} dot>
                  {insights.healthStatus}
                </Badge>
              </div>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-6 items-center">
              <div className="rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] p-5 text-center">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--md-sys-color-on-surface-variant)]">
                  Health score
                </p>
                <p className="text-4xl font-semibold text-[var(--md-sys-color-on-surface)] mt-3 tabular">
                  {insights.healthScore}
                </p>
                <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
                  out of 100
                </p>
                <div className="h-2 rounded-full bg-[var(--md-sys-color-surface-container)] mt-5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${insights.healthScore}%`,
                      backgroundColor:
                        insights.healthStatus === "Critical"
                          ? "var(--danger-500)"
                          : insights.healthStatus === "Moderate"
                            ? "var(--warning-500)"
                            : "var(--success-500)",
                    }}
                  />
                </div>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                {[
                  {
                    label: "Mileage",
                    value:
                      insights.mileage != null
                        ? `${formatNumber(insights.mileage)} km`
                        : "—",
                  },
                  {
                    label: "Vehicle age",
                    value:
                      typeof insights.vehicleAgeYears === "number"
                        ? `${insights.vehicleAgeYears} years`
                        : "—",
                  },
                  { label: "Usage", value: insights.usagePattern },
                  {
                    label: "Last service",
                    value: formatDate(insights.lastServiceDate),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-md bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] p-3"
                  >
                    <dt className="text-[11px] uppercase tracking-[0.06em] text-[var(--md-sys-color-on-surface-variant)]">
                      {item.label}
                    </dt>
                    <dd className="text-[var(--md-sys-color-on-surface)] font-semibold mt-1 tabular">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Card>

          {insights.insights.some((item) => item.riskLevel === "High") ? (
            <AlertBox
              tone="warning"
              message="One or more high-priority maintenance risks were detected. Review the recommended actions before your next long trip."
            />
          ) : null}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {insights.insights.map((insight) => (
              <InsightCard key={insight.code} insight={insight} />
            ))}
          </div>

          <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
            Generated {formatDate(insights.generatedAt)}. This rule-based
            assistant supports preventive maintenance and does not replace a
            physical inspection.
          </p>
        </div>
      ) : !pageError ? (
        <AlertBox tone="info" message="No insights are available for this vehicle yet." />
      ) : null}
    </PageShell>
  );
}
