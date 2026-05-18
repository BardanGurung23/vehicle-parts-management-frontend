import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../app/auth";
import { api, ApiError } from "../../app/api";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { EmptyState } from "../../shared/components/EmptyState";
import { CalendarCheck, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Vehicle, CreateAppointmentRequest } from "../../app/types";

function formatDateTimeLocal(date: Date) {
  return date.getFullYear() + "-" +
    String(date.getMonth() + 1).padStart(2, "0") + "-" +
    String(date.getDate()).padStart(2, "0") + "T" +
    String(date.getHours()).padStart(2, "0") + ":" +
    String(date.getMinutes()).padStart(2, "0");
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
    vehicleId: 0, appointmentDate: "", serviceType: "", notes: "",
  });

  const loadVehicles = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingVehicles(true);
      const data = await api.getMyVehicles(token);
      setVehicles(data);
      if (data.length > 0) setForm((prev) => ({ ...prev, vehicleId: data[0].vehicleId }));
    } catch { toast.error("Failed to load vehicles"); }
    finally { setLoadingVehicles(false); }
  }, [token]);

  useEffect(() => { loadVehicles(); }, [loadVehicles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const appointmentDate = inputRef.current?.value.trim() || form.appointmentDate;
    if (!form.vehicleId || !appointmentDate || !form.serviceType) {
      setDateError(appointmentDate ? undefined : "Select date and time");
      setErrorMessage("Please fill in all required fields.");
      return;
    }
    try {
      setDateError(undefined); setErrorMessage(null); setSuccessMessage(null); setSubmitting(true);
      await api.createAppointment(token, { ...form, appointmentDate: toOffsetDateTime(appointmentDate) });
      setSuccessMessage("Appointment booked successfully!");
      toast.success("Appointment booked successfully!");
      setForm({ vehicleId: vehicles[0]?.vehicleId || 0, appointmentDate: "", serviceType: "", notes: "" });
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Failed to book appointment.");
    } finally { setSubmitting(false); }
  };

  if (loadingVehicles) {
    return (
      <PageShell>
        <div className="space-y-4"><div className="h-8 rounded-md bg-surface-container-high animate-shimmer" /><div className="h-32 rounded-xl border border-outline-variant/20 animate-shimmer" /></div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="md">
      <PageHeader eyebrow="Appointment" title="Book Service Appointment" description="Schedule a service for your vehicle." />

      {errorMessage ? <AlertBox tone="error" message={errorMessage} dismissible /> : null}
      {successMessage ? <AlertBox tone="success" message={successMessage} dismissible /> : null}

      {vehicles.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No vehicles registered"
          description="You need to add a vehicle before booking an appointment."
          action={
            <a href="/app/profile/vehicles" className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 text-white text-sm font-semibold rounded-lg hover:bg-accent-700 transition-colors">
              <Plus className="w-4 h-4" /> Add Vehicle Now
            </a>
          }
        />
      ) : (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Vehicle" error={form.vehicleId ? undefined : "Select a vehicle"} required htmlFor="book-vehicle">
                <select id="book-vehicle" className="input" value={form.vehicleId} onChange={(e) => setForm((prev) => ({ ...prev, vehicleId: Number(e.target.value) }))}>
                  <option value={0} disabled>Select vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.vehicleId} value={v.vehicleId}>{v.vehicleNumber} - {v.model || "Model not recorded"}</option>
                  ))}
                </select>
              </Field>
              <Field label="Service Type" error={form.serviceType ? undefined : "Enter service type"} required htmlFor="book-service">
                <input id="book-service" className="input" type="text" placeholder="e.g. Oil Change, Brake Inspection"
                  value={form.serviceType} onChange={(e) => setForm((prev) => ({ ...prev, serviceType: e.target.value }))} />
              </Field>
              <Field label="Appointment Date & Time" error={dateError} required htmlFor="book-date">
                <input id="book-date" ref={inputRef} className="input" type="datetime-local"
                  defaultValue="" onChange={(e) => setForm((prev) => ({ ...prev, appointmentDate: e.target.value }))}
                  min={minDate} step={60} />
              </Field>
            </div>
            <Field label="Notes (Optional)" htmlFor="book-notes">
              <textarea id="book-notes" className="input" rows={3} placeholder="Any additional notes..."
                value={form.notes || ""} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </Field>
            <ActionButton type="submit" disabled={submitting}>
              {submitting ? "Booking..." : "Book Appointment"}
            </ActionButton>
          </form>
        </Card>
      )}
    </PageShell>
  );
}
