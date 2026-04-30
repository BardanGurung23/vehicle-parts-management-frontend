import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { Field } from "../../shared/components/Field";
import {
  fullNameSchema,
  optionalEmailSchema,
  phoneNumberSchema,
  requiredVehicleNumberSchema,
  vehicleModelSchema,
} from "../../shared/validation/member4Validation";

const createCustomerSchema = z.object({
  fullName: fullNameSchema,
  phoneNumber: phoneNumberSchema,
  email: optionalEmailSchema,
  address: z.string().max(500, "Address is too long.").optional(),
  vehicleNumber: requiredVehicleNumberSchema,
  vehicleModel: vehicleModelSchema,
});

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
    defaultValues: {
      email: "",
      address: "",
      vehicleModel: "",
    },
  });
  const [pageError, setPageError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      return;
    }

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

      toast.success(`Customer profile created for ${createdCustomer.fullName}.`);
      navigate(`/app/customers/${createdCustomer.customerId}`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not create the customer profile.";
      setPageError(message);
      toast.error(message);
    }
  });

  return (
    <section className="page-stack">
      {pageError ? <AlertBox tone="error" message={pageError} /> : null}

      <header className="card dashboard-hero">
        <div className="dashboard-hero__copy">
          <p className="eyebrow">Feature 6</p>
          <h2>Register customer</h2>
          <p className="card__copy">
            Create a staff-managed customer record with one required vehicle so the front desk can search and revisit it later.
          </p>
        </div>

        <div className="dashboard-hero__actions">
          <Link className="button button--secondary" to="/app/customers/search">
            Search customers
          </Link>
        </div>
      </header>

      <article className="card dashboard-panel dashboard-panel--wide">
        <div className="card__header">
          <h3>Customer details</h3>
          <p className="card__copy">Portal login credentials stay in the self-registration flow. This page creates the customer and initial vehicle only.</p>
        </div>

        <form className="form-grid form-grid--two-columns" onSubmit={onSubmit}>
          <Field label="Full name" error={errors.fullName?.message}>
            <input className="input" type="text" placeholder="Alex Johnson" {...register("fullName")} />
          </Field>

          <Field label="Phone number" error={errors.phoneNumber?.message}>
            <input className="input" type="tel" placeholder="+9779800000000" {...register("phoneNumber")} />
          </Field>

          <Field label="Email" error={errors.email?.message} hint="Optional for staff-created profiles.">
            <input className="input" type="email" placeholder="alex@example.com" {...register("email")} />
          </Field>

          <Field label="Address" error={errors.address?.message}>
            <textarea className="input input--textarea" rows={4} placeholder="Optional address" {...register("address")} />
          </Field>

          <Field label="Vehicle number" error={errors.vehicleNumber?.message}>
            <input className="input" type="text" placeholder="BA 1 PA 1234" {...register("vehicleNumber")} />
          </Field>

          <Field label="Vehicle model" error={errors.vehicleModel?.message}>
            <input className="input" type="text" placeholder="Civic" {...register("vehicleModel")} />
          </Field>

          <div className="form-grid__full-width">
            <ActionButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating customer..." : "Create customer"}
            </ActionButton>
          </div>
        </form>
      </article>
    </section>
  );
}