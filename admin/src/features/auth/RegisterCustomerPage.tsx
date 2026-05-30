import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Car, Shield, Clock, BarChart3 } from "lucide-react";
import { api, ApiError } from "../../app/api";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { toast } from "sonner";
import { AuthShell } from "./AuthShell";
import { registerSchema } from "./schema";

type RegisterFormValues = z.infer<typeof registerSchema>;

const features = [
  { icon: Car, text: "Link your vehicles" },
  { icon: Shield, text: "Secure account management" },
  { icon: Clock, text: "24/7 appointment booking" },
  { icon: BarChart3, text: "Service history tracking" },
];

export function RegisterCustomerPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      const response = await api.registerCustomer({
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        address: values.address,
        vehicleNumber: values.vehicleNumber || undefined,
        vehicleModel: values.vehicleModel?.trim() || undefined,
        password: values.password,
      });

      const message = `Account created for ${response.fullName}. You can sign in now.`;
      setSuccessMessage(message);
      toast.success(message);
      reset();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Registration failed.";
      setErrorMessage(message);
      toast.error(message);
    }
  });

  return (
    <AuthShell
      size="lg"
      headline={
        <>
          Create your Autonix
          <br />
          customer account.
        </>
      }
      tagline="Book appointments, track repairs, and manage vehicles from your
      personal portal."
      highlights={features}
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--md-sys-color-on-surface)]">Create account</h2>
        <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">
          Fill in your details to get started.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {errorMessage ? (
          <AlertBox tone="error" message={errorMessage} dismissible />
        ) : null}
        {successMessage ? (
          <AlertBox tone="success" message={successMessage} dismissible />
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <FormSection title="Account information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field
                label="Full name"
                error={errors.fullName?.message}
                required
                htmlFor="reg-name"
              >
                <input
                  id="reg-name"
                  type="text"
                  placeholder="Alex Johnson"
                  autoComplete="name"
                  {...register("fullName")}
                />
              </Field>
            </div>
            <Field
              label="Email"
              error={errors.email?.message}
              required
              htmlFor="reg-email"
            >
              <input
                id="reg-email"
                type="email"
                placeholder="alex@example.com"
                autoComplete="email"
                {...register("email")}
              />
            </Field>
            <Field
              label="Phone number"
              error={errors.phoneNumber?.message}
              required
              htmlFor="reg-phone"
            >
              <input
                id="reg-phone"
                type="tel"
                placeholder="+1 555 123 4567"
                autoComplete="tel"
                {...register("phoneNumber")}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field
                label="Address"
                error={errors.address?.message}
                htmlFor="reg-address"
              >
                <textarea
                  id="reg-address"
                  rows={3}
                  placeholder="Optional"
                  autoComplete="street-address"
                  {...register("address")}
                />
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection title="Vehicle information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Vehicle number"
              error={errors.vehicleNumber?.message}
              hint="Add a vehicle now or skip and add it later."
              htmlFor="reg-vehicle"
            >
              <input
                id="reg-vehicle"
                type="text"
                placeholder="ABC 123"
                {...register("vehicleNumber")}
              />
            </Field>
            <Field
              label="Vehicle model"
              error={errors.vehicleModel?.message}
              htmlFor="reg-model"
            >
              <input
                id="reg-model"
                type="text"
                placeholder="Civic"
                {...register("vehicleModel")}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Security">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Password"
              error={errors.password?.message}
              required
              htmlFor="reg-password"
            >
              <input
                id="reg-password"
                type="password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                {...register("password")}
              />
            </Field>
            <Field
              label="Confirm password"
              error={errors.confirmPassword?.message}
              required
              htmlFor="reg-confirm"
            >
              <input
                id="reg-confirm"
                type="password"
                placeholder="Repeat password"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
            </Field>
          </div>
        </FormSection>

        <ActionButton
          type="submit"
          disabled={isSubmitting}
          isLoading={isSubmitting}
          fullWidth
        >
          Create account
        </ActionButton>
      </form>

      <p className="mt-6 text-sm text-[var(--md-sys-color-on-surface-variant)] text-center">
        Already have an account?{" "}
        <Link
          to="/"
          className="font-medium text-[var(--md-sys-color-primary)] hover:opacity-80"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-3 pb-2 border-b border-[var(--md-sys-color-outline-variant)] w-full">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}
