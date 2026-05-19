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
      const createdCustomer = await api.createCustomer(token, {
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        email: values.email || undefined,
        address: values.address,
        vehicleNumber: values.vehicleNumber,
        vehicleModel: values.vehicleModel,
      });
      toast.success(
        `Customer profile created for ${createdCustomer.fullName}.`,
      );
      navigate(`/app/customers/${createdCustomer.customerId}`);
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
    <PageShell>
      <PageHeader
        eyebrow="Feature 6"
        title="Register Customer"
        description="Create a staff-managed customer record with one required vehicle."
        actions={
          <Link to="/app/customers/search">
            <ActionButton tone="secondary" icon={Search}>
              Search customers
            </ActionButton>
          </Link>
        }
      />

      {pageError ? (
        <AlertBox tone="error" message={pageError} dismissible />
      ) : null}

      <div className="max-w-2xl">
        <Card
          header={
            <div>
              <h3 className="text-base font-semibold text-on-surface">
                Customer details
              </h3>
              <p className="text-sm text-on-surface-variant">
                Portal login credentials stay in the self-registration flow.
              </p>
            </div>
          }
        >
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field
                  label="Full name"
                  error={errors.fullName?.message}
                  required
                  htmlFor="cust-name"
                >
                  <input
                    id="cust-name"
                    className="input"
                    type="text"
                    placeholder="Alex Johnson"
                    {...register("fullName")}
                  />
                </Field>
              </div>
              <Field
                label="Phone number"
                error={errors.phoneNumber?.message}
                required
                htmlFor="cust-phone"
              >
                <input
                  id="cust-phone"
                  className="input"
                  type="tel"
                  placeholder="+9779800000000"
                  {...register("phoneNumber")}
                />
              </Field>
              <Field
                label="Email"
                error={errors.email?.message}
                hint="Optional for staff-created profiles."
                htmlFor="cust-email"
              >
                <input
                  id="cust-email"
                  className="input"
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
                >
                  <textarea
                    id="cust-address"
                    className="input"
                    rows={3}
                    placeholder="Optional address"
                    {...register("address")}
                  />
                </Field>
              </div>
              <Field
                label="Vehicle number"
                error={errors.vehicleNumber?.message}
                required
                htmlFor="cust-vehicle"
              >
                <input
                  id="cust-vehicle"
                  className="input"
                  type="text"
                  placeholder="BA 1 PA 1234"
                  {...register("vehicleNumber")}
                />
              </Field>
              <Field
                label="Vehicle model"
                error={errors.vehicleModel?.message}
                htmlFor="cust-model"
              >
                <input
                  id="cust-model"
                  className="input"
                  type="text"
                  placeholder="Civic"
                  {...register("vehicleModel")}
                />
              </Field>
            </div>
            <ActionButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating customer..." : "Create customer"}
            </ActionButton>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
