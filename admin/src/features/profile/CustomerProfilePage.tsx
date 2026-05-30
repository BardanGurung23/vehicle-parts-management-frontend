import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Car } from "lucide-react";
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
import { SkeletonCard } from "../../shared/components/Skeleton";
import { FormSection } from "../../shared/components/FormSection";
import { ProfileSchema } from "./schema";

type ProfileFormValues = z.infer<typeof ProfileSchema>;

export function CustomerProfilePage() {
  const { token, refreshProfile } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({ resolver: zodResolver(ProfileSchema) });
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    let isActive = true;
    void api
      .getCurrentCustomer(token)
      .then((response) => {
        if (!isActive) return;
        setCustomer(response);
        reset({
          fullName: response.fullName,
          email: response.email ?? "",
          phoneNumber: response.phoneNumber,
          address: response.address ?? "",
        });
        setPageError(null);
      })
      .catch((error: unknown) => {
        if (isActive)
          setPageError(
            error instanceof ApiError
              ? error.message
              : "Could not load your profile.",
          );
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [reset, token]);

  const onSubmit = handleSubmit(async (values) => {
    if (!token) return;
    try {
      setPageError(null);
      setPageSuccess(null);
      const updated = await api.updateCurrentCustomer(token, {
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        address: values.address,
      });
      setCustomer(updated);
      reset({
        fullName: updated.fullName,
        email: updated.email ?? "",
        phoneNumber: updated.phoneNumber,
        address: updated.address ?? "",
      });
      await refreshProfile();
      const msg = "Profile updated.";
      setPageSuccess(msg);
      toast.success(msg);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Could not save your profile.";
      setPageError(message);
      toast.error(message);
    }
  });

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
        title="Profile"
        description="Keep your contact details up to date."
        actions={
          <Link to="/app/profile/vehicles">
            <ActionButton tone="secondary" icon={Car}>
              Manage vehicles
            </ActionButton>
          </Link>
        }
      />

      {pageError ? <AlertBox tone="error" message={pageError} dismissible /> : null}
      {pageSuccess ? <AlertBox tone="success" message={pageSuccess} dismissible /> : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={onSubmit} className="space-y-5">
              <FormSection title="Identity">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Field
                      label="Full name"
                      error={errors.fullName?.message}
                      required
                      htmlFor="profile-name"
                    >
                      <input id="profile-name" type="text" {...register("fullName")} />
                    </Field>
                  </div>
                  <Field
                    label="Email"
                    error={errors.email?.message}
                    required
                    htmlFor="profile-email"
                  >
                    <input id="profile-email" type="email" {...register("email")} />
                  </Field>
                  <Field
                    label="Phone"
                    error={errors.phoneNumber?.message}
                    required
                    htmlFor="profile-phone"
                  >
                    <input id="profile-phone" type="tel" {...register("phoneNumber")} />
                  </Field>
                </div>
              </FormSection>
              <FormSection title="Address">
                <Field
                  label="Address"
                  error={errors.address?.message}
                  htmlFor="profile-address"
                  hint="Optional"
                >
                  <textarea id="profile-address" rows={3} {...register("address")} />
                </Field>
              </FormSection>
              <div className="flex justify-end pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <ActionButton
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={isSubmitting || !isDirty}
                >
                  Save changes
                </ActionButton>
              </div>
            </form>
          </Card>
        </div>

        <Card
          header={
            <div>
              <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
                Current record
              </h3>
              <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                Profile state on file
              </p>
            </div>
          }
        >
          {customer ? (
            <dl className="space-y-3 text-sm">
              {[
                { label: "Customer ID", value: `#${customer.customerId}` },
                { label: "Phone", value: customer.phoneNumber },
                { label: "Email", value: customer.email ?? "—" },
                { label: "Address", value: customer.address ?? "—" },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-[11px] uppercase tracking-[0.06em] text-[var(--md-sys-color-on-surface-variant)]">
                    {item.label}
                  </dt>
                  <dd className="mt-0.5 text-[var(--md-sys-color-on-surface)]">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
              Customer record is unavailable right now.
            </p>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
