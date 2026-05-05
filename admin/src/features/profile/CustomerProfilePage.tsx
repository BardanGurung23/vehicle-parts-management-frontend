import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Car } from "lucide-react";
import { toast } from "react-toastify";
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
import { fullNameSchema, phoneNumberSchema, requiredEmailSchema } from "../../shared/validation/member4Validation";

const profileSchema = z.object({
  fullName: fullNameSchema,
  email: requiredEmailSchema,
  phoneNumber: phoneNumberSchema,
  address: z.string().max(500, "Address is too long.").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function CustomerProfilePage() {
  const { token, refreshProfile } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema) });
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }
    let isActive = true;
    void api.getCurrentCustomer(token)
      .then((response) => {
        if (!isActive) return;
        setCustomer(response);
        reset({ fullName: response.fullName, email: response.email ?? "", phoneNumber: response.phoneNumber, address: response.address ?? "" });
        setPageError(null);
      })
      .catch((error: unknown) => { if (isActive) setPageError(error instanceof ApiError ? error.message : "Could not load your customer profile."); })
      .finally(() => { if (isActive) setIsLoading(false); });
    return () => { isActive = false; };
  }, [reset, token]);

  const onSubmit = handleSubmit(async (values) => {
    if (!token) return;
    try {
      setPageError(null);
      setPageSuccess(null);
      const updatedCustomer = await api.updateCurrentCustomer(token, {
        fullName: values.fullName, email: values.email, phoneNumber: values.phoneNumber, address: values.address,
      });
      setCustomer(updatedCustomer);
      reset({ fullName: updatedCustomer.fullName, email: updatedCustomer.email ?? "", phoneNumber: updatedCustomer.phoneNumber, address: updatedCustomer.address ?? "" });
      await refreshProfile();
      const msg = "Your customer profile was updated.";
      setPageSuccess(msg);
      toast.success(msg);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not update your customer profile.";
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
        eyebrow="Feature 12"
        title="My Profile"
        description="Review your account details and keep your customer record in sync."
        actions={
          <Link to="/app/profile/vehicles">
            <ActionButton tone="secondary" icon={Car}>Manage vehicles</ActionButton>
          </Link>
        }
      />

      {pageError ? <AlertBox tone="error" message={pageError} dismissible /> : null}
      {pageSuccess ? <AlertBox tone="success" message={pageSuccess} dismissible /> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          header={
            <div>
              <h3 className="text-base font-semibold text-on-surface">Update profile</h3>
              <p className="text-sm text-on-surface-variant">Changes update both your customer record and linked login identity.</p>
            </div>
          }
        >
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Full name" error={errors.fullName?.message} required htmlFor="profile-name">
              <input id="profile-name" className="input" type="text" {...register("fullName")} />
            </Field>
            <Field label="Email" error={errors.email?.message} required htmlFor="profile-email">
              <input id="profile-email" className="input" type="email" {...register("email")} />
            </Field>
            <Field label="Phone number" error={errors.phoneNumber?.message} required htmlFor="profile-phone">
              <input id="profile-phone" className="input" type="tel" {...register("phoneNumber")} />
            </Field>
            <Field label="Address" error={errors.address?.message} htmlFor="profile-address">
              <textarea id="profile-address" className="input" rows={3} {...register("address")} />
            </Field>
            <ActionButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving profile..." : "Save profile"}
            </ActionButton>
          </form>
        </Card>

        <Card
          header={
            <div>
              <h3 className="text-base font-semibold text-on-surface">Current summary</h3>
              <p className="text-sm text-on-surface-variant">Profile state stored in the customer backend.</p>
            </div>
          }
        >
          {customer ? (
            <dl className="space-y-3 text-sm">
              {[
                { label: "Customer ID", value: `#${customer.customerId}` },
                { label: "Phone", value: customer.phoneNumber },
                { label: "Email", value: customer.email ?? "No email recorded" },
                { label: "Address", value: customer.address ?? "No address recorded" },
              ].map((item) => (
                <div key={item.label} className="flex gap-3">
                  <dt className="w-24 text-on-surface-variant shrink-0">{item.label}</dt>
                  <dd className="text-on-surface">{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-on-surface-variant">Customer profile data is unavailable right now.</p>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
