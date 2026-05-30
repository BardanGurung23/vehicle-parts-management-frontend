import { useState, useEffect, useCallback, useRef } from "react";
import { CalendarCheck, Plus } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useAuth } from "../../app/auth";
import { api, ApiError } from "../../app/api";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { EmptyState } from "../../shared/components/EmptyState";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { FormSection } from "../../shared/components/FormSection";
import type { Vehicle, CreateAppointmentRequest } from "../../app/types";

function formatDateTimeLocal(date: Date) {
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0") +
    "T" +
    String(date.getHours()).padStart(2, "0") +
    ":" +
    String(date.getMinutes()).padStart(2, "0")
  );
}

function toOffsetDateTime(value: string) {
  const localDate = new Date(value);
  if (Number.isNaN(localDate.getTime())) return value;
  const offsetMinutes = -localDate.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetMinutes);
  const hh = String(Math.floor(absOffset / 60)).padStart(2, "0");
  const mm = String(absOffset % 60).padStart(2, "0");
  return `${value}:00${sign}${hh}:${mm}`;
}

export function BookAppointmentPage() {
  const { token } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [minDate] = useState(() => formatDateTimeLocal(new Date()));
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<CreateAppointmentRequest>({
    vehicleId: 0,
    appointmentDate: "",
    serviceType: "",
    notes: "",
  });

  const loadVehicles = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingVehicles(true);
      const data = await api.getMyVehicles(token);
      setVehicles(data);
      if (data.length > 0)
        setForm((prev) => ({ ...prev, vehicleId: data[0].vehicleId }));
    } catch {
      toast.error("Could not load your vehicles.");
    } finally {
      setLoadingVehicles(false);
    }
  }, [token]);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const appointmentDate = inputRef.current?.value.trim() || form.appointmentDate;
    if (!form.vehicleId || !appointmentDate || !form.serviceType) {
      setDateError(appointmentDate ? undefined : "Select date and time");
      setErrorMessage("Please complete every required field.");
      return;
    }
    try {
      setDateError(undefined);
      setErrorMessage(null);
      setSuccessMessage(null);
      setSubmitting(true);
      await api.createAppointment(token, {
        ...form,
        appointmentDate: toOffsetDateTime(appointmentDate),
      });
      setSuccessMessage("Appointment booked.");
      toast.success("Appointment booked");
      setForm({
        vehicleId: vehicles[0]?.vehicleId || 0,
        appointmentDate: "",
        serviceType: "",
        notes: "",
      });
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Could not book the appointment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingVehicles) {
    return (
      <PageShell>
        <SkeletonCard />
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="md">
      <PageHeader
        title="Book a service"
        description="Schedule a visit for one of your vehicles."
      />

      {errorMessage ? <AlertBox tone="error" message={errorMessage} dismissible /> : null}
      {successMessage ? <AlertBox tone="success" message={successMessage} dismissible /> : null}

      {vehicles.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No vehicles linked"
          description="Add a vehicle to your account before booking a service."
          action={
            <Link to="/app/profile/vehicles">
              <ActionButton icon={Plus}>Add a vehicle</ActionButton>
            </Link>
          }
        />
      ) : (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormSection title="Service details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  label="Vehicle"
                  error={form.vehicleId ? undefined : "Select a vehicle"}
                  required
                  htmlFor="book-vehicle"
                >
                  <select
                    id="book-vehicle"
                    value={form.vehicleId}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        vehicleId: Number(e.target.value),
                      }))
                    }
                  >
                    <option value={0} disabled>
                      Select vehicle
                    </option>
                    {vehicles.map((v) => (
                      <option key={v.vehicleId} value={v.vehicleId}>
                        {v.vehicleNumber}
                        {v.model ? ` · ${v.model}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Service"
                  error={form.serviceType ? undefined : "Enter the service"}
                  required
                  htmlFor="book-service"
                >
                  <input
                    id="book-service"
                    type="text"
                    placeholder="Oil change, brake inspection…"
                    value={form.serviceType}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        serviceType: e.target.value,
                      }))
                    }
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field
                    label="Date & time"
                    error={dateError}
                    required
                    htmlFor="book-date"
                  >
                    <input
                      id="book-date"
                      ref={inputRef}
                      type="datetime-local"
                      defaultValue=""
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          appointmentDate: e.target.value,
                        }))
                      }
                      min={minDate}
                      step={60}
                    />
                  </Field>
                </div>
              </div>
            </FormSection>

            <FormSection title="Notes">
              <Field label="Anything we should know?" htmlFor="book-notes">
                <textarea
                  id="book-notes"
                  rows={3}
                  placeholder="Optional"
                  value={form.notes || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </Field>
            </FormSection>

            <div className="flex justify-end pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
              <ActionButton type="submit" isLoading={submitting} disabled={submitting}>
                Book appointment
              </ActionButton>
            </div>
          </form>
        </Card>
      )}
    </PageShell>
  );
}
