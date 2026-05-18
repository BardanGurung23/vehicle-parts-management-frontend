import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../../app/api";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { toast } from "sonner";
import { useAuth } from "../../app/auth";

export function AddVehiclePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [model, setModel] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!vehicleNumber.trim()) {
      setErrorMessage("Vehicle number is required.");
      return;
    }

    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      setSubmitting(true);

      await api.createVehicle(token, {
        vehicleNumber: vehicleNumber.trim(),
        model: model.trim() || undefined,
      });

      setSuccessMessage("Vehicle added successfully!");
      toast.success("Vehicle added successfully!");
      setVehicleNumber("");
      setModel("");

      setTimeout(() => {
        navigate("/app/my-vehicles");
      }, 1500);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to add vehicle.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel auth-panel--wide">
        <div className="section-header">
          <h1>Add New Vehicle</h1>
          <p>Register a vehicle to start booking service appointments.</p>
        </div>

        {errorMessage ? <AlertBox tone="error" message={errorMessage} /> : null}
        {successMessage ? (
          <AlertBox tone="success" message={successMessage} />
        ) : null}

        <form
          className="form-grid form-grid--two-columns"
          onSubmit={handleSubmit}
        >
          <Field
            label="Vehicle Number"
            error={!vehicleNumber ? "Vehicle number is required" : undefined}
          >
            <input
              className="input"
              type="text"
              placeholder="e.g. BA 1 PA 1234"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
            />
          </Field>

          <Field label="Model (Optional)">
            <input
              className="input"
              type="text"
              placeholder="e.g. Toyota Corolla"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </Field>

          <div className="form-grid__full-width">
            <ActionButton type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Vehicle"}
            </ActionButton>
          </div>
        </form>
      </section>
    </main>
  );
}
