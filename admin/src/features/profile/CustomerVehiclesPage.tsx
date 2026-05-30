import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
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
import { Modal, ConfirmDialog } from "../../shared/components/Modal";
import { FormSection } from "../../shared/components/FormSection";
import { vehicleSchema } from "./schema";

type VehicleFormValues = z.infer<typeof vehicleSchema>;
type VehicleRow = CustomerDetail["vehicles"][number];

const emptyForm: VehicleFormValues = {
  vehicleNumber: "",
  vehicleModel: "",
  mileage: "",
  manufactureYear: "",
  lastServiceDate: "",
};

function toOptionalNumber(value: string) {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : undefined;
}

function toOptionalDateTime(value: string) {
  const trimmed = value.trim();
  return trimmed ? new Date(`${trimmed}T00:00:00.000Z`).toISOString() : undefined;
}

function formatDateForInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function formatDisplayDate(value?: string | null) {
  if (!value) return "—";
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
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleRow | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<VehicleRow | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: emptyForm,
  });

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

  const openAdd = () => {
    setEditingVehicle(null);
    reset(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (vehicle: VehicleRow) => {
    setEditingVehicle(vehicle);
    reset({
      vehicleNumber: vehicle.vehicleNumber,
      vehicleModel: vehicle.model ?? "",
      mileage: vehicle.mileage?.toString() ?? "",
      manufactureYear: vehicle.manufactureYear?.toString() ?? "",
      lastServiceDate: formatDateForInput(vehicle.lastServiceDate),
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingVehicle(null);
    reset(emptyForm);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!token) return;
    try {
      setPageError(null);
      setPageSuccess(null);
      if (editingVehicle) {
        await api.updateCurrentCustomerVehicle(
          token,
          editingVehicle.vehicleId,
          buildVehiclePayload(values),
        );
        toast.success("Vehicle updated");
      } else {
        await api.addCurrentCustomerVehicle(token, buildVehiclePayload(values));
        toast.success("Vehicle added");
      }
      await loadCustomer();
      closeForm();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Could not save the vehicle.";
      setPageError(message);
      toast.error(message);
    }
  });

  const submitRemove = async () => {
    if (!token || !confirmRemove) return;
    try {
      setIsRemoving(true);
      const updated = await api.removeCurrentCustomerVehicle(
        token,
        confirmRemove.vehicleId,
      );
      setCustomer(updated);
      toast.success("Vehicle removed");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not remove the vehicle.",
      );
    } finally {
      setIsRemoving(false);
      setConfirmRemove(null);
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
        title="My vehicles"
        description="Keep mileage, year, and service dates current for accurate maintenance insights."
        actions={
          <>
            <Link to="/app/profile">
              <ActionButton tone="secondary" size="sm" icon={ArrowLeft}>
                Profile
              </ActionButton>
            </Link>
            <ActionButton icon={Plus} onClick={openAdd}>
              Add vehicle
            </ActionButton>
          </>
        }
      />

      {pageError ? <AlertBox tone="error" message={pageError} dismissible /> : null}
      {pageSuccess ? <AlertBox tone="success" message={pageSuccess} dismissible /> : null}

      <Card bodyless>
        {vehicles.length === 0 ? (
          <div className="p-5">
            <EmptyState
              embedded
              icon={Car}
              title="No vehicles yet"
              description="Add a vehicle to start building your service history."
              action={
                <ActionButton icon={Plus} onClick={openAdd}>
                  Add vehicle
                </ActionButton>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-[var(--md-sys-color-outline-variant)]">
            {vehicles.map((vehicle) => (
              <li key={vehicle.vehicleId} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] tabular">
                        {vehicle.vehicleNumber}
                      </p>
                      <Badge variant="neutral">#{vehicle.vehicleId}</Badge>
                    </div>
                    <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                      {vehicle.model ?? "Model not recorded"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/app/profile/vehicles/${vehicle.vehicleId}/insights`}
                    >
                      <ActionButton tone="ghost" size="sm" icon={BrainCircuit}>
                        Insights
                      </ActionButton>
                    </Link>
                    <ActionButton
                      tone="ghost"
                      size="sm"
                      icon={Edit3}
                      onClick={() => openEdit(vehicle)}
                      aria-label={`Edit ${vehicle.vehicleNumber}`}
                    >
                      Edit
                    </ActionButton>
                    <ActionButton
                      tone="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => setConfirmRemove(vehicle)}
                      aria-label={`Remove ${vehicle.vehicleNumber}`}
                    >
                      <span className="sr-only">Remove</span>
                    </ActionButton>
                  </div>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-[12px]">
                  <DetailRow label="Mileage">
                    {vehicle.mileage != null
                      ? `${vehicle.mileage.toLocaleString()} km`
                      : "—"}
                  </DetailRow>
                  <DetailRow label="Year">
                    {vehicle.manufactureYear ?? "—"}
                  </DetailRow>
                  <DetailRow label="Last service">
                    {formatDisplayDate(vehicle.lastServiceDate)}
                  </DetailRow>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={isFormOpen}
        onClose={closeForm}
        size="md"
        title={editingVehicle ? "Edit vehicle" : "Add vehicle"}
        description={
          editingVehicle
            ? `${editingVehicle.vehicleNumber} · ${editingVehicle.model ?? "Model not recorded"}`
            : "Vehicle numbers must be unique on your account."
        }
        footer={
          <>
            <ActionButton tone="secondary" onClick={closeForm} disabled={isSubmitting}>
              Cancel
            </ActionButton>
            <ActionButton
              type="submit"
              form="vehicle-form"
              isLoading={isSubmitting}
            >
              {editingVehicle ? "Save changes" : "Add vehicle"}
            </ActionButton>
          </>
        }
      >
        <form id="vehicle-form" onSubmit={onSubmit} className="space-y-5">
          <FormSection title="Identification">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="Vehicle number"
                error={errors.vehicleNumber?.message}
                required
                htmlFor="vehicle-number"
              >
                <input
                  id="vehicle-number"
                  type="text"
                  placeholder="BA 1 PA 1234"
                  {...register("vehicleNumber")}
                />
              </Field>
              <Field
                label="Model"
                error={errors.vehicleModel?.message}
                htmlFor="vehicle-model"
                hint="Optional"
              >
                <input id="vehicle-model" type="text" {...register("vehicleModel")} />
              </Field>
            </div>
          </FormSection>
          <FormSection title="Health">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field
                label="Mileage (km)"
                error={errors.mileage?.message}
                htmlFor="vehicle-mileage"
              >
                <input
                  id="vehicle-mileage"
                  type="number"
                  min="0"
                  max="2000000"
                  {...register("mileage")}
                />
              </Field>
              <Field
                label="Year"
                error={errors.manufactureYear?.message}
                htmlFor="vehicle-year"
              >
                <input
                  id="vehicle-year"
                  type="number"
                  min="1950"
                  max={new Date().getFullYear() + 1}
                  {...register("manufactureYear")}
                />
              </Field>
              <Field
                label="Last service"
                error={errors.lastServiceDate?.message}
                htmlFor="vehicle-service-date"
              >
                <input
                  id="vehicle-service-date"
                  type="date"
                  {...register("lastServiceDate")}
                />
              </Field>
            </div>
          </FormSection>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmRemove !== null}
        onClose={() => setConfirmRemove(null)}
        onConfirm={submitRemove}
        title="Remove this vehicle?"
        message={
          confirmRemove
            ? `${confirmRemove.vehicleNumber} will be detached from your account. Past service history is preserved.`
            : ""
        }
        confirmLabel={isRemoving ? "Removing…" : "Remove"}
        tone="danger"
        isLoading={isRemoving}
      />
    </PageShell>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.06em] text-[var(--md-sys-color-on-surface-variant)]">
        {label}
      </dt>
      <dd className="mt-0.5 text-[var(--md-sys-color-on-surface)] tabular">
        {children}
      </dd>
    </div>
  );
}
