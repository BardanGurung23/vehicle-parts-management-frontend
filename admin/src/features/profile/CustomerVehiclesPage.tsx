import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { CustomerDetail } from "../../app/types";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { Field } from "../../shared/components/Field";
import { LoadingScreen } from "../../shared/components/LoadingScreen";

const vehicleSchema = z.object({
  vehicleNumber: z.string().min(2, "Vehicle number must be at least 2 characters.").trim(),
  vehicleModel: z.string().max(80, "Vehicle model is too long.").optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export function CustomerVehiclesPage() {
  const { token } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
  });
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [removingVehicleId, setRemovingVehicleId] = useState<number | null>(null);

  const loadCustomer = useCallback(async () => {
    if (!token) {
      return;
    }

    const response = await api.getCurrentCustomer(token);
    setCustomer(response);
  }, [token]);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let isActive = true;

    void loadCustomer()
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setPageError(error instanceof ApiError ? error.message : "Could not load your vehicles.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [loadCustomer, token]);

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      return;
    }

    try {
      setPageError(null);
      setPageSuccess(null);

      const updatedCustomer = await api.addCurrentCustomerVehicle(token, {
        vehicleNumber: values.vehicleNumber,
        vehicleModel: values.vehicleModel,
      });

      setCustomer(updatedCustomer);
      reset();
      const successMessage = "Vehicle added to your customer profile.";
      setPageSuccess(successMessage);
      toast.success(successMessage);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not add the vehicle.";
      setPageError(message);
      toast.error(message);
    }
  });

  const removeVehicle = async (vehicleId: number) => {
    if (!token) {
      return;
    }

    try {
      setRemovingVehicleId(vehicleId);
      setPageError(null);
      setPageSuccess(null);

      const updatedCustomer = await api.removeCurrentCustomerVehicle(token, vehicleId);
      setCustomer(updatedCustomer);

      const successMessage = "Vehicle removed from your customer profile.";
      setPageSuccess(successMessage);
      toast.success(successMessage);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not remove the vehicle.";
      setPageError(message);
      toast.error(message);
    } finally {
      setRemovingVehicleId(null);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading your vehicles..." />;
  }

  return (
    <section className="page-stack">
      {pageError ? <AlertBox tone="error" message={pageError} /> : null}
      {pageSuccess ? <AlertBox tone="success" message={pageSuccess} /> : null}

      <header className="card dashboard-hero">
        <div className="dashboard-hero__copy">
          <p className="eyebrow">Feature 12</p>
          <h2>Manage vehicles</h2>
          <p className="card__copy">
            Add and remove the vehicles linked to your account without leaving the active customer workspace.
          </p>
        </div>

        <div className="dashboard-hero__actions">
          <Link className="button button--secondary" to="/app/profile">
            Back to profile
          </Link>
        </div>
      </header>

      <div className="dashboard-board">
        <article className="card dashboard-panel">
          <div className="card__header">
            <h3>Add vehicle</h3>
            <p className="card__copy">Vehicle numbers must remain unique across the system.</p>
          </div>

          <form className="form-grid" onSubmit={onSubmit}>
            <Field label="Vehicle number" error={errors.vehicleNumber?.message}>
              <input className="input" type="text" placeholder="BA 1 PA 1234" {...register("vehicleNumber")} />
            </Field>

            <Field label="Vehicle model" error={errors.vehicleModel?.message}>
              <input className="input" type="text" placeholder="Civic" {...register("vehicleModel")} />
            </Field>

            <ActionButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding vehicle..." : "Add vehicle"}
            </ActionButton>
          </form>
        </article>

        <article className="card dashboard-panel dashboard-panel--wide">
          <div className="card__header">
            <h3>Linked vehicles</h3>
            <p className="card__copy">
              {customer?.vehicles.length
                ? `${customer.vehicles.length} vehicle${customer.vehicles.length === 1 ? "" : "s"} currently linked.`
                : "No vehicles are linked to your account yet."}
            </p>
          </div>

          {customer?.vehicles.length ? (
            <div className="dashboard-vehicle-list">
              {customer.vehicles.map((vehicle) => (
                <article key={vehicle.vehicleId} className="dashboard-vehicle-card">
                  <div className="dashboard-vehicle-card__top">
                    <strong>{vehicle.vehicleNumber}</strong>
                    <span className="status-pill">Vehicle #{vehicle.vehicleId}</span>
                  </div>

                  <p>{vehicle.model ?? "Model not recorded"}</p>

                  <div className="dashboard-hero__actions">
                    <ActionButton
                      type="button"
                      tone="secondary"
                      disabled={removingVehicleId === vehicle.vehicleId}
                      onClick={() => void removeVehicle(vehicle.vehicleId)}
                    >
                      {removingVehicleId === vehicle.vehicleId ? "Removing..." : "Remove vehicle"}
                    </ActionButton>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">Add a vehicle to start building your account history.</p>
          )}
        </article>
      </div>
    </section>
  );
}