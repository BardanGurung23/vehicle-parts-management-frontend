import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Activity, AlertTriangle, ArrowLeft, BatteryCharging, BrainCircuit, Gauge, ShieldCheck, Wrench } from "lucide-react";
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
  if (riskLevel === "High") return "danger";
  if (riskLevel === "Medium") return "warning";
  return "success";
}

function healthVariant(status: string) {
  if (status === "Critical") return "danger";
  if (status === "Moderate") return "warning";
  return "success";
}

function insightIcon(category: string) {
  if (category === "Brakes") return ShieldCheck;
  if (category === "Electrical") return BatteryCharging;
  if (category === "Engine") return Gauge;
  if (category === "Tires") return Activity;
  return Wrench;
}

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

function formatNumber(value?: number | null) {
  return typeof value === "number" ? value.toLocaleString() : "Not recorded";
}

function InsightCard({ insight }: { insight: VehicleInsightItem }) {
  const Icon = insightIcon(insight.category);

  return (
    <div className="rounded-xl bg-surface-container-low ring-1 ring-white/[0.06] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid place-items-center w-10 h-10 rounded-xl bg-surface-container-highest text-primary shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">{insight.title}</p>
            <p className="text-xs text-on-surface-variant">{insight.category}</p>
          </div>
        </div>
        <Badge variant={riskVariant(insight.riskLevel)}>{insight.riskLevel}</Badge>
      </div>

      <p className="text-sm text-on-surface-variant leading-6">{insight.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface-container-highest/60 p-3">
          <p className="text-xs uppercase tracking-wide text-on-surface-variant">Predicted timeframe</p>
          <p className="text-sm font-semibold text-on-surface mt-1">{insight.predictedTimeframe}</p>
        </div>
        <div className="rounded-lg bg-surface-container-highest/60 p-3">
          <p className="text-xs uppercase tracking-wide text-on-surface-variant">Recommended action</p>
          <p className="text-sm font-semibold text-on-surface mt-1">{insight.recommendedAction}</p>
        </div>
      </div>
    </div>
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

    void api.getVehicleInsights(token, parsedVehicleId)
      .then((response) => {
        if (!isActive) return;
        setInsights(response);
        setPageError(null);
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setPageError(error instanceof ApiError ? error.message : "Could not load AI vehicle insights.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => { isActive = false; };
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
        eyebrow="AI Vehicle Insights"
        title="Predictive Maintenance"
        description="Rule-based vehicle analysis using mileage, age, service timing, and usage pattern signals."
        actions={
          <Link to="/app/profile/vehicles">
            <ActionButton tone="tonal" icon={ArrowLeft}>Back to vehicles</ActionButton>
          </Link>
        }
      />

      {pageError ? <AlertBox tone="error" message={pageError} dismissible /> : null}

      {insights ? (
        <div className="space-y-6">
          <Card
            variant="elevated"
            className="overflow-hidden"
            header={
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center w-12 h-12 rounded-2xl bg-primary-container text-primary-on-container">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-title-medium text-on-surface">{insights.model ?? "Vehicle"}</h3>
                    <p className="text-sm text-on-surface-variant">{insights.vehicleNumber}</p>
                  </div>
                </div>
                <Badge variant={healthVariant(insights.healthStatus)}>{insights.healthStatus}</Badge>
              </div>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-6 items-center">
              <div className="rounded-3xl bg-surface-container-highest/70 p-5 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Health score</p>
                <p className="text-5xl font-semibold text-on-surface mt-3">{insights.healthScore}</p>
                <p className="text-sm text-on-surface-variant mt-1">out of 100</p>
                <div className="h-2 rounded-full bg-surface-container-low mt-5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${insights.healthStatus === "Critical" ? "bg-error" : insights.healthStatus === "Moderate" ? "bg-warning" : "bg-success"}`}
                    style={{ width: `${insights.healthScore}%` }}
                  />
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                <div className="rounded-xl bg-surface-container-low p-4">
                  <dt className="text-on-surface-variant">Mileage</dt>
                  <dd className="text-on-surface font-semibold mt-1">{formatNumber(insights.mileage)}{insights.mileage ? " km" : ""}</dd>
                </div>
                <div className="rounded-xl bg-surface-container-low p-4">
                  <dt className="text-on-surface-variant">Vehicle age</dt>
                  <dd className="text-on-surface font-semibold mt-1">{insights.vehicleAgeYears ?? "Unknown"}{typeof insights.vehicleAgeYears === "number" ? " years" : ""}</dd>
                </div>
                <div className="rounded-xl bg-surface-container-low p-4">
                  <dt className="text-on-surface-variant">Usage pattern</dt>
                  <dd className="text-on-surface font-semibold mt-1">{insights.usagePattern}</dd>
                </div>
                <div className="rounded-xl bg-surface-container-low p-4">
                  <dt className="text-on-surface-variant">Last service</dt>
                  <dd className="text-on-surface font-semibold mt-1">{formatDate(insights.lastServiceDate)}</dd>
                </div>
              </dl>
            </div>
          </Card>

          {insights.insights.some((item) => item.riskLevel === "High") ? (
            <AlertBox tone="warning" message="One or more high-priority maintenance risks were detected. Please review the recommended actions before your next long trip." />
          ) : null}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {insights.insights.map((insight) => (
              <InsightCard key={insight.code} insight={insight} />
            ))}
          </div>

          <p className="text-xs text-on-surface-variant">
            Generated {formatDate(insights.generatedAt)}. This rule-based AI assistant supports preventive maintenance decisions and does not replace a physical inspection by service staff.
          </p>
        </div>
      ) : !pageError ? (
        <AlertBox tone="info" message="No insights are available for this vehicle yet." />
      ) : null}
    </PageShell>
  );
}