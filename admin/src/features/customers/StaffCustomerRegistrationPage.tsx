import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { FormSection } from "../../shared/components/FormSection";
import { createCustomerSchema } from "./schema";

type CreateCustomerFormValues = z.infer<typeof createCustomerSchema>;

export function StaffCustomerRegistrationPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: { email: "", address: "", vehicleModel: "" },
  });
  const [pageError, setPageError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    if (!token) return;
    try {
      setPageError(null);
      const created = await api.createCustomer(token, {
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        email: values.email || undefined,
        address: values.address,
        vehicleNumber: values.vehicleNumber,
        vehicleModel: values.vehicleModel,
      });
      toast.success(`Customer profile created for ${created.fullName}.`);
      navigate(`/app/customers/${created.customerId}`);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Could not create the customer profile.";
      setPageError(message);
      toast.error(message);
    }
  });

  return (
    <PageShell maxWidth="lg">
      <PageHeader
        title="Register customer"
        description="Create a staff-managed record with one initial vehicle."
        actions={
          <Link to="/app/customers/search">
            <ActionButton tone="secondary" icon={Search}>
              Search customers
            </ActionButton>
          </Link>
        }
      />

      {pageError ? <AlertBox tone="error" message={pageError} dismissible /> : null}

      <Card>
        <form onSubmit={onSubmit} className="space-y-5">
          <FormSection title="Customer">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Field
                  label="Full name"
                  error={errors.fullName?.message}
                  required
                  htmlFor="cust-name"
                >
                  <input
                    id="cust-name"
                    type="text"
                    placeholder="Alex Johnson"
                    {...register("fullName")}
                  />
                </Field>
              </div>
              <Field
                label="Phone"
                error={errors.phoneNumber?.message}
                required
                htmlFor="cust-phone"
              >
                <input
                  id="cust-phone"
                  type="tel"
                  placeholder="+1 555 123 4567"
                  {...register("phoneNumber")}
                />
              </Field>
              <Field
                label="Email"
                error={errors.email?.message}
                hint="Optional"
                htmlFor="cust-email"
              >
                <input
                  id="cust-email"
                  type="email"
                  placeholder="alex@example.com"
                  {...register("email")}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field
                  label="Address"
                  error={errors.address?.message}
                  htmlFor="cust-address"
                  hint="Optional"
                >
                  <textarea
                    id="cust-address"
                    rows={3}
                    {...register("address")}
                  />
                </Field>
              </div>
            </div>
          </FormSection>

          <FormSection title="Vehicle">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="Vehicle number"
                error={errors.vehicleNumber?.message}
                required
                htmlFor="cust-vehicle"
              >
                <input
                  id="cust-vehicle"
                  type="text"
                  placeholder="BA 1 PA 1234"
                  {...register("vehicleNumber")}
                />
              </Field>
              <Field
                label="Model"
                error={errors.vehicleModel?.message}
                htmlFor="cust-model"
                hint="Optional"
              >
                <input
                  id="cust-model"
                  type="text"
                  placeholder="Civic"
                  {...register("vehicleModel")}
                />
              </Field>
            </div>
          </FormSection>

          <div className="flex justify-end pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <ActionButton type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
              Create customer
            </ActionButton>
          </div>
        </form>
      </Card>
    </PageShell>
  );
}
