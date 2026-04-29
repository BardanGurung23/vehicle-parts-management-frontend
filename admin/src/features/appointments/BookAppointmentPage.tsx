import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../app/auth";
import { api, ApiError } from "../../app/api";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { toast } from "react-toastify";
import type { Vehicle, CreateAppointmentRequest } from "../../app/types";

export function BookAppointmentPage() {
  const { user, token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
      if (data.length > 0) {
        setForm((prev) => ({ ...prev, vehicleId: data[0].vehicleId }));
      }
    } catch {
      toast.error("Failed to load vehicles");
    } finally {
      setLoadingVehicles(false);
    }
  }, [token]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const handleChange = (
    field: keyof CreateAppointmentRequest,
    value: string | number,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!form.vehicleId || !form.appointmentDate || !form.serviceType) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      setSubmitting(true);

      await api.createAppointment(token, {
        ...form,
        appointmentDate: new Date(form.appointmentDate).toISOString(),
      });

      setSuccessMessage("Appointment booked successfully!");
      toast.success("Appointment booked successfully!");
      setForm({ vehicleId: vehicles[0]?.vehicleId || 0, appointmentDate: "", serviceType: "", notes: "" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to book appointment.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingVehicles) {
    return <p className="loading-screen">Loading vehicles...</p>;
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel auth-panel--wide">
        <div className="section-header">
          <h1>Book Service Appointment</h1>
          <p>Schedule a service for your vehicle.</p>
        </div>

        {errorMessage ? <AlertBox tone="error" message={errorMessage} /> : null}
        {successMessage ? <AlertBox tone="success" message={successMessage} /> : null}

        {vehicles.length === 0 ? (
          <div>
            <AlertBox tone="error" message="You have no vehicles registered." />
            <div className="mt-4">
              <a href="/app/add-vehicle" className="button">
                Add Vehicle Now
              </a>
            </div>
          </div>
        ) : (
          <form className="form-grid form-grid--two-columns" onSubmit={handleSubmit}>
            <Field label="Vehicle" error={form.vehicleId ? undefined : "Select a vehicle"}>
              <select
                className="input"
                value={form.vehicleId}
                onChange={(e) => handleChange("vehicleId", Number(e.target.value))}
              >
                <option value={0} disabled>Select vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.vehicleId} value={v.vehicleId}>
                    {v.vehicleNumber} - {v.vehicleBrand} {v.vehicleModel}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Appointment Date & Time" error={form.appointmentDate ? undefined : "Select date and time"}>
              <input
                className="input"
                type="datetime-local"
                value={form.appointmentDate}
                onChange={(e) => handleChange("appointmentDate", e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </Field>

            <Field label="Service Type" error={form.serviceType ? undefined : "Enter service type"}>
              <input
                className="input"
                type="text"
                placeholder="e.g. Oil Change, Brake Inspection"
                value={form.serviceType}
                onChange={(e) => handleChange("serviceType", e.target.value)}
              />
            </Field>

            <Field label="Notes (Optional)">
              <textarea
                className="input input--textarea"
                rows={3}
                placeholder="Any additional notes..."
                value={form.notes || ""}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </Field>

            <div className="form-grid__full-width">
              <ActionButton type="submit" disabled={submitting}>
                {submitting ? "Booking..." : "Book Appointment"}
              </ActionButton>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
