import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/auth";
import { api, ApiError } from "../../app/api";
import { toast } from "react-toastify";
import type { Appointment } from "../../app/types";

const STATUS_CLASSES: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function MyAppointmentsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMyAppointments(token);
      setAppointments(data);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load appointments.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  if (loading) {
    return <p className="loading-screen">Loading your appointments...</p>;
  }

  return (
    <main className="page-stack">
      <section className="bg-white rounded-lg p-6 flex flex-col gap-[15px]">
        <div className="flex flex-col gap-2">
          <p className="eyebrow">My Appointments</p>
          <h2>Your Service Appointments</h2>
          <p className="">
            View all your booked service appointments and their current status.
          </p>
        </div>

        {error && (
          <div className="alert alert--error">
            <p>{error}</p>
          </div>
        )}

        {appointments.length === 0 ? (
          <p className="empty-state">
            You have no appointments yet. Book one now!
          </p>
        ) : (
          <div className="appointments-list flex flex-col gap-2">
            {appointments.map((appointment) => (
              <article
                key={appointment.appointmentId}
                className="card parts-item-card"
              >
                <div className="parts-item-card__top">
                  <div className="parts-item-card__identity">
                    <div className="parts-item-card__title-row">
                      <h3>{appointment.serviceType}</h3>
                      <span
                        className={`status-pill ${STATUS_CLASSES[appointment.status] || "bg-gray-100 text-gray-800"}`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                    <p className="parts-item-card__subtitle">
                      <span>{appointment.vehicleNumber}</span>
                      <span aria-hidden="true">/</span>
                      <span>{appointment.vehicleModel}</span>
                    </p>
                  </div>

                  {appointment.status === "Completed" &&
                    !appointment.hasReview && (
                      <div className="parts-item-card__actions">
                        <button
                          type="button"
                          className="button button--secondary"
                          onClick={() =>
                            navigate(
                              `/app/write-review/${appointment.appointmentId}`,
                            )
                          }
                        >
                          Write Review
                        </button>
                      </div>
                    )}

                  {appointment.hasReview && (
                    <div className="parts-item-card__actions">
                      <span className="text-sm text-gray-500">Reviewed</span>
                    </div>
                  )}
                </div>

                <dl className="parts-item-card__meta">
                  <div>
                    <dt>Appointment Date</dt>
                    <dd>{formatDate(appointment.appointmentDate)}</dd>
                  </div>
                  <div>
                    <dt>Booked On</dt>
                    <dd>{formatDate(appointment.createdAt)}</dd>
                  </div>
                </dl>

                {appointment.notes ? (
                  <p className="parts-item-card__description">
                    <strong>Notes:</strong> {appointment.notes}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
