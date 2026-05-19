import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Activity,
  BrainCircuit,
  Car,
  Edit3,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { CustomerDetail } from "../../app/types";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { Badge } from "../../shared/components/Badge";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { EmptyState } from "../../shared/components/EmptyState";
import {
  requiredVehicleNumberSchema,
  vehicleModelSchema,
} from "../../shared/validation/member4Validation";

const vehicleSchema = z.object({
  vehicleNumber: requiredVehicleNumberSchema,
  vehicleModel: vehicleModelSchema,
  mileage: z
    .string()
    .trim()
    .refine((value) => {
      if (value.length === 0) return true;
      const mileage = Number(value);
      return Number.isInteger(mileage) && mileage >= 0 && mileage <= 2_000_000;
    }, "Mileage must be between 0 and 2,000,000 km."),
  manufactureYear: z
    .string()
    .trim()
    .refine(
      (value) => {
        if (value.length === 0) return true;
        const year = Number(value);
        return (
          Number.isInteger(year) &&
          year >= 1950 &&
          year <= new Date().getFullYear() + 1
        );
      },
      `Manufacture year must be between 1950 and ${new Date().getFullYear() + 1}.`,
    ),
  lastServiceDate: z
    .string()
    .trim()
    .refine((value) => {
      if (value.length === 0) return true;
      const timestamp = new Date(`${value}T00:00:00.000Z`).getTime();
      return Number.isFinite(timestamp) && timestamp <= Date.now() + 86_400_000;
    }, "Last service date cannot be in the future."),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

function toOptionalNumber(value: string) {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : undefined;
}

function toOptionalDateTime(value: string) {
  const trimmed = value.trim();
  return trimmed
    ? new Date(`${trimmed}T00:00:00.000Z`).toISOString()
    : undefined;
}

function formatDateForInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function formatDisplayDate(value?: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function buildVehiclePayload(values: VehicleFormValues) {
  return {
    vehicleNumber: values.vehicleNumber,
    vehicleModel: values.vehicleModel,
    mileage: toOptionalNumber(values.mileage),
    manufactureYear: toOptionalNumber(values.manufactureYear),
    lastServiceDate: toOptionalDateTime(values.lastServiceDate),
  };
}

export function CustomerVehiclesPage() {
  const { token } = useAuth();
  const {
    register: registerAdd,
    handleSubmit: handleAddSubmit,
    reset: resetAdd,
    formState: { errors: addErrors, isSubmitting: isAdding },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicleNumber: "",
      vehicleModel: "",
      mileage: "",
      manufactureYear: "",
      lastServiceDate: "",
    },
  });
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: isUpdating },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicleNumber: "",
      vehicleModel: "",
      mileage: "",
      manufactureYear: "",
      lastServiceDate: "",
    },
  });
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [removingVehicleId, setRemovingVehicleId] = useState<number | null>(
    null,
  );

  const loadCustomer = useCallback(async () => {
    if (!token) return;
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
        if (isActive)
          setPageError(
            error instanceof ApiError
              ? error.message
              : "Could not load your vehicles.",
          );
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [loadCustomer, token]);

  const onSubmit = handleAddSubmit(async (values) => {
    if (!token) return;
    try {
      setPageError(null);
      setPageSuccess(null);
      await api.addCurrentCustomerVehicle(token, buildVehiclePayload(values));
      await loadCustomer();
      resetAdd();
      const msg = "Vehicle added to your customer profile.";
      setPageSuccess(msg);
      toast.success(msg);
    } catch (error) {
      setPageError(
        error instanceof ApiError
          ? error.message
          : "Could not add the vehicle.",
      );
    }
  });

  const startEditing = (vehicle: CustomerDetail["vehicles"][number]) => {
    setEditingVehicleId(vehicle.vehicleId);
    setPageError(null);
    setPageSuccess(null);
    resetEdit({
      vehicleNumber: vehicle.vehicleNumber,
      vehicleModel: vehicle.model ?? "",
      mileage: vehicle.mileage?.toString() ?? "",
      manufactureYear: vehicle.manufactureYear?.toString() ?? "",
      lastServiceDate: formatDateForInput(vehicle.lastServiceDate),
    });
  };

  const stopEditing = () => {
    setEditingVehicleId(null);
    resetEdit({
      vehicleNumber: "",
      vehicleModel: "",
      mileage: "",
      manufactureYear: "",
      lastServiceDate: "",
    });
  };

  const onUpdateVehicle = handleEditSubmit(async (values) => {
    if (!token || editingVehicleId === null) return;
    try {
      setPageError(null);
      setPageSuccess(null);
      await api.updateCurrentCustomerVehicle(
        token,
        editingVehicleId,
        buildVehiclePayload(values),
      );
      await loadCustomer();
      stopEditing();
      const msg = "Vehicle details updated.";
      setPageSuccess(msg);
      toast.success(msg);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Could not update the vehicle.";
      setPageError(message);
      toast.error(message);
    }
  });

  const removeVehicle = async (vehicleId: number) => {
    if (!token) return;
    try {
      setRemovingVehicleId(vehicleId);
      setPageError(null);
      setPageSuccess(null);
      const updatedCustomer = await api.removeCurrentCustomerVehicle(
        token,
        vehicleId,
      );
      setCustomer(updatedCustomer);
      toast.success("Vehicle removed from your customer profile.");
    } catch (error) {
      setPageError(
        error instanceof ApiError
          ? error.message
          : "Could not remove the vehicle.",
      );
    } finally {
      setRemovingVehicleId(null);
    }
  };

  const vehicles = customer?.vehicles ?? [];

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
        eyebrow="Feature 12"
        title="Manage Vehicles"
        description="Keep vehicle details current so AI insights can predict service needs from mileage, age, and maintenance history."
        actions={
          <Link to="/app/profile">
            <span className="inline-flex items-center gap-1 text-sm text-primary hover:text-accent-700 font-medium">
              <ArrowLeft className="w-4 h-4" /> Back to profile
            </span>
          </Link>
        }
      />

      {pageError ? (
        <AlertBox tone="error" message={pageError} dismissible />
      ) : null}
      {pageSuccess ? (
        <AlertBox tone="success" message={pageSuccess} dismissible />
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[20rem_1fr] gap-6 items-start">
        <Card
          header={
            <div>
              <h3 className="text-base font-semibold text-on-surface">
                Add vehicle
              </h3>
              <p className="text-sm text-on-surface-variant">
                Vehicle numbers must be unique.
              </p>
            </div>
          }
        >
          <form onSubmit={onSubmit} className="space-y-4">
            <Field
              label="Vehicle number"
              error={addErrors.vehicleNumber?.message}
              required
              htmlFor="add-vin"
            >
              <input
                id="add-vin"
                className="input"
                type="text"
                placeholder="BA 1 PA 1234"
                {...registerAdd("vehicleNumber")}
              />
            </Field>
            <Field
              label="Vehicle model"
              error={addErrors.vehicleModel?.message}
              htmlFor="add-model"
            >
              <input
                id="add-model"
                className="input"
                type="text"
                placeholder="Civic"
                {...registerAdd("vehicleModel")}
              />
            </Field>
            <Field
              label="Mileage (km)"
              error={addErrors.mileage?.message}
              htmlFor="add-mileage"
            >
              <input
                id="add-mileage"
                className="input"
                type="number"
                min="0"
                max="2000000"
                placeholder="45000"
                {...registerAdd("mileage")}
              />
            </Field>
            <Field
              label="Manufacture year"
              error={addErrors.manufactureYear?.message}
              htmlFor="add-year"
            >
              <input
                id="add-year"
                className="input"
                type="number"
                min="1950"
                max={new Date().getFullYear() + 1}
                placeholder="2019"
                {...registerAdd("manufactureYear")}
              />
            </Field>
            <Field
              label="Last service date"
              error={addErrors.lastServiceDate?.message}
              htmlFor="add-service-date"
            >
              <input
                id="add-service-date"
                className="input"
                type="date"
                {...registerAdd("lastServiceDate")}
              />
            </Field>
            <ActionButton type="submit" icon={Plus} disabled={isAdding}>
              {isAdding ? "Adding vehicle..." : "Add vehicle"}
            </ActionButton>
          </form>
        </Card>

        <Card
          header={
            <div>
              <h3 className="text-base font-semibold text-on-surface">
                Linked vehicles
              </h3>
              <p className="text-sm text-on-surface-variant">
                {vehicles.length
                  ? `${vehicles.length} vehicle${vehicles.length === 1 ? "" : "s"} currently linked.`
                  : "No vehicles linked yet."}
              </p>
            </div>
          }
        >
          {vehicles.length === 0 ? (
            <EmptyState
              icon={Car}
              title="No vehicles"
              description="Add a vehicle to start building your account history."
            />
          ) : (
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.vehicleId}
                  className="rounded-lg ring-1 ring-white/[0.06] p-4 space-y-3"
                >
                  {editingVehicleId === vehicle.vehicleId ? (
                    <form onSubmit={onUpdateVehicle} className="space-y-3">
                      <p className="text-sm font-semibold text-on-surface">
                        Editing vehicle #{vehicle.vehicleId}
                      </p>
                      <Field
                        label="Vehicle number"
                        error={editErrors.vehicleNumber?.message}
                        required
                      >
                        <input
                          className="input"
                          type="text"
                          {...registerEdit("vehicleNumber")}
                        />
                      </Field>
                      <Field
                        label="Vehicle model"
                        error={editErrors.vehicleModel?.message}
                      >
                        <input
                          className="input"
                          type="text"
                          {...registerEdit("vehicleModel")}
                        />
                      </Field>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Field
                          label="Mileage (km)"
                          error={editErrors.mileage?.message}
                        >
                          <input
                            className="input"
                            type="number"
                            min="0"
                            max="2000000"
                            {...registerEdit("mileage")}
                          />
                        </Field>
                        <Field
                          label="Manufacture year"
                          error={editErrors.manufactureYear?.message}
                        >
                          <input
                            className="input"
                            type="number"
                            min="1950"
                            max={new Date().getFullYear() + 1}
                            {...registerEdit("manufactureYear")}
                          />
                        </Field>
                        <Field
                          label="Last service"
                          error={editErrors.lastServiceDate?.message}
                        >
                          <input
                            className="input"
                            type="date"
                            {...registerEdit("lastServiceDate")}
                          />
                        </Field>
                      </div>
                      <div className="flex items-center gap-3">
                        <ActionButton type="submit" disabled={isUpdating}>
                          {isUpdating ? "Saving..." : "Save changes"}
                        </ActionButton>
                        <ActionButton
                          type="button"
                          tone="tonal"
                          onClick={stopEditing}
                        >
                          Cancel
                        </ActionButton>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-on-surface">
                            {vehicle.vehicleNumber}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {vehicle.model ?? "Model not recorded"}
                          </p>
                        </div>
                        <Badge>#{vehicle.vehicleId}</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-on-surface-variant">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-surface-container-highest/60 px-3 py-2">
                          <Activity className="w-3.5 h-3.5" />{" "}
                          {vehicle.mileage?.toLocaleString() ??
                            "Mileage not recorded"}
                          {vehicle.mileage ? " km" : ""}
                        </span>
                        <span className="rounded-lg bg-surface-container-highest/60 px-3 py-2">
                          Year: {vehicle.manufactureYear ?? "Not recorded"}
                        </span>
                        <span className="rounded-lg bg-surface-container-highest/60 px-3 py-2">
                          Last service:{" "}
                          {formatDisplayDate(vehicle.lastServiceDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ActionButton
                          size="sm"
                          icon={Edit3}
                          onClick={() => startEditing(vehicle)}
                        >
                          Edit
                        </ActionButton>
                        <Link
                          to={`/app/profile/vehicles/${vehicle.vehicleId}/insights`}
                        >
                          <ActionButton
                            size="sm"
                            tone="tonal"
                            icon={BrainCircuit}
                          >
                            AI Insights
                          </ActionButton>
                        </Link>
                        <ActionButton
                          size="sm"
                          tone="error"
                          icon={Trash2}
                          disabled={removingVehicleId === vehicle.vehicleId}
                          onClick={() => void removeVehicle(vehicle.vehicleId)}
                        >
                          {removingVehicleId === vehicle.vehicleId
                            ? "Removing..."
                            : "Remove"}
                        </ActionButton>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
