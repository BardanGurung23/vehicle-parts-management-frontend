import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { useAuth } from "../../app/auth";
import { api, ApiError } from "../../app/api";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { ActionButton } from "../../shared/components/ActionButton";
import { EmptyState } from "../../shared/components/EmptyState";
import { CalendarCheck } from "lucide-react";
import type { Appointment } from "../../app/types";

const badgeVariant = (status: string) => {
  switch (status) {
    case "Pending": return "warning";
    case "Confirmed": return "info";
    case "Completed": return "success";
    case "Cancelled": return "danger";
    default: return "neutral";
  }
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export function MyAppointmentsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    if (!token) return;
    try { setLoading(true); setError(null); setAppointments(await api.getMyAppointments(token)); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Failed to load appointments."); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  if (loading) {
    return (
      <PageShell>
        <div className="space-y-4"><div className="h-8 rounded-md bg-surface-container-high animate-shimmer" /><div className="h-32 rounded-xl border border-outline-variant/20 animate-shimmer" /></div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader eyebrow="My Appointments" title="Your Service Appointments" description="View all your booked service appointments and their status." />

      {error && (
        <div className="bg-danger-50 border border-danger-100 text-danger-700 rounded-lg p-3 text-sm">
          {error} <button onClick={loadAppointments} className="text-primary font-medium underline ml-2">Retry</button>
        </div>
      )}

      {appointments.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No appointments" description="You have no appointments yet. Book one now!" />
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <Card key={appt.appointmentId}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-on-surface">{appt.serviceType}</h3>
                    <Badge variant={badgeVariant(appt.status)}>{appt.status}</Badge>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {appt.vehicleNumber} / {appt.vehicleModel}
                  </p>
                </div>
                {appt.status === "Completed" && !appt.hasReview && (
                  <ActionButton size="sm" icon={Star} onClick={() => navigate(`/app/write-review/${appt.appointmentId}`)}>
                    Write Review
                  </ActionButton>
                )}
                {appt.hasReview && (
                  <span className="text-xs text-on-surface-variant italic shrink-0">Reviewed</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs mt-3 pt-3 border-t border-white/[0.06]">
                <div>
                  <span className="text-on-surface-variant">Appointment Date</span>
                  <p className="font-medium text-on-surface">{formatDate(appt.appointmentDate)}</p>
                </div>
                <div>
                  <span className="text-on-surface-variant">Booked On</span>
                  <p className="font-medium text-on-surface">{formatDate(appt.createdAt)}</p>
                </div>
              </div>
              {appt.notes && (
                <p className="text-xs text-on-surface-variant mt-2"><strong>Notes:</strong> {appt.notes}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
