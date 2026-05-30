import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, Star } from "lucide-react";
import { useAuth } from "../../app/auth";
import { api, ApiError } from "../../app/api";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { ActionButton } from "../../shared/components/ActionButton";
import { EmptyState } from "../../shared/components/EmptyState";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { Toolbar } from "../../shared/components/Toolbar";
import { Segmented } from "../../shared/components/Segmented";
import { AlertBox } from "../../shared/components/AlertBox";
import type { Appointment } from "../../app/types";

const badgeVariant = (status: string) => {
  switch (status) {
    case "Pending":
      return "warning" as const;
    case "Confirmed":
      return "info" as const;
    case "Completed":
      return "success" as const;
    case "Cancelled":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type StatusFilter = "all" | "Pending" | "Confirmed" | "Completed" | "Cancelled";

export function MyAppointmentsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const loadAppointments = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      setAppointments(await api.getMyAppointments(token));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load your appointments.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const counts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      all: appointments.length,
      Pending: 0,
      Confirmed: 0,
      Completed: 0,
      Cancelled: 0,
    };
    appointments.forEach((a) => {
      const key = a.status as StatusFilter;
      if (key in base) base[key] += 1;
    });
    return base;
  }, [appointments]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return appointments;
    return appointments.filter((a) => a.status === statusFilter);
  }, [appointments, statusFilter]);

  if (loading) {
    return (
      <PageShell>
        <SkeletonCard />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="My appointments"
        description={`${appointments.length} total · ${counts.Pending} pending`}
      />

      {error ? (
        <AlertBox
          tone="error"
          message={error}
          dismissible
          action={
            <ActionButton tone="secondary" size="sm" onClick={loadAppointments}>
              Retry
            </ActionButton>
          }
        />
      ) : null}

      {appointments.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No appointments yet"
          description="Book a service to see your visits here."
          action={
            <ActionButton onClick={() => navigate("/app/book-appointment")}>
              Book an appointment
            </ActionButton>
          }
        />
      ) : (
        <>
          <Toolbar
            leading={
              <Segmented
                size="sm"
                ariaLabel="Filter by status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "All", count: counts.all },
                  { value: "Pending", label: "Pending", count: counts.Pending },
                  { value: "Confirmed", label: "Confirmed", count: counts.Confirmed },
                  { value: "Completed", label: "Completed", count: counts.Completed },
                  { value: "Cancelled", label: "Cancelled", count: counts.Cancelled },
                ]}
              />
            }
          />
          <div className="space-y-3">
            {filtered.map((appt) => (
              <Card key={appt.appointmentId}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                        {appt.serviceType}
                      </h3>
                      <Badge variant={badgeVariant(appt.status)} dot>
                        {appt.status}
                      </Badge>
                    </div>
                    <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
                      {appt.vehicleNumber}
                      {appt.vehicleModel ? ` · ${appt.vehicleModel}` : ""}
                    </p>
                  </div>
                  {appt.status === "Completed" && !appt.hasReview ? (
                    <ActionButton
                      size="sm"
                      icon={Star}
                      onClick={() =>
                        navigate(`/app/write-review/${appt.appointmentId}`)
                      }
                    >
                      Write review
                    </ActionButton>
                  ) : null}
                  {appt.hasReview ? (
                    <Badge variant="neutral">Reviewed</Badge>
                  ) : null}
                </div>
                <dl className="grid grid-cols-2 gap-3 text-[12px] mt-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
                  <div>
                    <dt className="text-[var(--md-sys-color-on-surface-variant)]">
                      Scheduled
                    </dt>
                    <dd className="font-medium text-[var(--md-sys-color-on-surface)] tabular mt-0.5">
                      {formatDate(appt.appointmentDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--md-sys-color-on-surface-variant)]">
                      Booked
                    </dt>
                    <dd className="font-medium text-[var(--md-sys-color-on-surface)] tabular mt-0.5">
                      {formatDate(appt.createdAt)}
                    </dd>
                  </div>
                </dl>
                {appt.notes ? (
                  <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] mt-3">
                    {appt.notes}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
