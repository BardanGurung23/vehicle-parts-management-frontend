import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/auth";
import { api, ApiError } from "../../app/api";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { toast } from "react-toastify";

export function StaffCustomerRegistrationPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!fullName.trim() || !phoneNumber.trim() || !vehicleNumber.trim()) {
      setErrorMessage("Full name, phone number, and vehicle number are required.");
      return;
    }

    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      setSubmitting(true);

      const payload = {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        vehicleNumber: vehicleNumber.trim(),
        vehicleModel: vehicleModel.trim() || undefined,
      };

      const result = await api.createCustomerWithVehicle(token, payload);
      setSuccessMessage(`Customer registered! Customer ID: ${result.customerId}, Vehicle ID: ${result.vehicleId}`);
      toast.success("Customer and vehicle registered successfully!");

      // Reset form
      setFullName("");
      setPhoneNumber("");
      setEmail("");
      setAddress("");
      setVehicleNumber("");
      setVehicleModel("");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to register customer.";
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
          <h1>Register Customer</h1>
          <p>Register a new customer and their vehicle (for walk-in customers).</p>
        </div>

        {errorMessage ? <AlertBox tone="error" message={errorMessage} /> : null}
        {successMessage ? <AlertBox tone="success" message={successMessage} /> : null}

        <form className="form-grid form-grid--two-columns" onSubmit={handleSubmit}>
          <div className="form-grid__full-width">
            <h3>Customer Details</h3>
          </div>

          <Field label="Full Name" error={!fullName ? "Required" : undefined}>
            <input
              className="input"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </Field>

          <Field label="Phone Number" error={!phoneNumber ? "Required" : undefined}>
            <input
              className="input"
              type="tel"
              placeholder="+9779800000000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </Field>

          <Field label="Email (Optional)">
            <input
              className="input"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label="Address (Optional)">
            <textarea
              className="input input--textarea"
              rows={3}
              placeholder="Customer address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Field>

          <div className="form-grid__full-width">
            <h3>Vehicle Details</h3>
          </div>

          <Field label="Vehicle Number" error={!vehicleNumber ? "Required" : undefined}>
            <input
              className="input"
              type="text"
              placeholder="BA 1 PA 1234"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
            />
          </Field>

          <Field label="Vehicle Model (Optional)">
            <input
              className="input"
              type="text"
              placeholder="Toyota Corolla"
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
            />
          </Field>

          <div className="form-grid__full-width">
            <ActionButton type="submit" disabled={submitting}>
              {submitting ? "Registering..." : "Register Customer"}
            </ActionButton>
          </div>
        </form>
      </section>
    </main>
  );
}
