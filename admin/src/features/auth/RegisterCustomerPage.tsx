import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, ApiError } from "../../app/api";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { toast } from "react-toastify";

const registerSchema = z
  .object({
    fullName: z.string().min(3, "Full name must be at least 3 characters.").trim(),
    email: z.string().email("Enter a valid email address.").trim(),
    phoneNumber: z.string().min(7, "Phone number must be at least 7 characters.").trim(),
    address: z.string().max(500, "Address is too long.").optional(),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

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
        password: values.password,
      });

      const successMessageText = `Customer account created for ${response.fullName}. You can sign in now.`;
      setSuccessMessage(successMessageText);
      toast.success(successMessageText);
      reset();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Registration failed.";
      setErrorMessage(message);
      toast.error(message);
    }
  });

  return (
    <main className="auth-shell">
      <section className="auth-panel auth-panel--wide">
        <div className="section-header">
          <h1>Create customer account</h1>
          <p>This creates a customer record and a matching login.</p>
        </div>

        {errorMessage ? <AlertBox tone="error" message={errorMessage} /> : null}
        {successMessage ? <AlertBox tone="success" message={successMessage} /> : null}

        <form className="form-grid form-grid--two-columns" onSubmit={onSubmit}>
          <Field label="Full name" error={errors.fullName?.message}>
            <input className="input" type="text" placeholder="Alex Johnson" {...register("fullName")} />
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <input className="input" type="email" placeholder="alex@example.com" {...register("email")} />
          </Field>

          <Field label="Phone number" error={errors.phoneNumber?.message}>
            <input className="input" type="tel" placeholder="+9779800000000" {...register("phoneNumber")} />
          </Field>

          <Field label="Address" error={errors.address?.message}>
            <textarea className="input input--textarea" rows={4} placeholder="Optional address" {...register("address")} />
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <input className="input" type="password" placeholder="Minimum 8 characters" {...register("password")} />
          </Field>

          <Field label="Confirm password" error={errors.confirmPassword?.message}>
            <input className="input" type="password" placeholder="Repeat password" {...register("confirmPassword")} />
          </Field>

          <div className="form-grid__full-width">
            <ActionButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Register customer"}
            </ActionButton>
          </div>
        </form>

        <p className="section-footer">
          Already have access? <Link to="/">Go to login</Link>
        </p>
      </section>
    </main>
  );
}