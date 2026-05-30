import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail, ShieldCheck, Clock } from "lucide-react";
import { api, ApiError } from "../../app/api";
import { AlertBox } from "../../shared/components/AlertBox";
import { ActionButton } from "../../shared/components/ActionButton";
import { Field } from "../../shared/components/Field";
import { AuthShell } from "./AuthShell";
import { forgotPasswordSchema } from "./schema";

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const features = [
  { icon: Mail, text: "One-time secure reset link" },
  { icon: ShieldCheck, text: "Encrypted token validation" },
  { icon: Clock, text: "Automatic expiration" },
];

export function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    try {
      setErrorMessage(null);
      const response = await api.requestPasswordReset(values);
      setSuccessMessage(response.message);
      reset();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "We could not process your request right now.";
      setSuccessMessage(null);
      setErrorMessage(message);
    }
  });

  return (
    <AuthShell
      size="sm"
      headline={
        <>
          Recover access with
          <br />a secure reset link.
        </>
      }
      tagline="Enter the email tied to your account. If it matches an active
      user, we will send a one-time link that expires automatically."
      highlights={features}
    >
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to sign in
      </Link>

      <h2 className="text-xl font-semibold text-[var(--md-sys-color-on-surface)]">
        Forgot your password?
      </h2>
      <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">
        We will send a secure reset link to your sign-in email.
      </p>

      <div className="mt-6 space-y-3">
        {successMessage ? (
          <AlertBox tone="success" message={successMessage} />
        ) : null}
        {errorMessage ? (
          <AlertBox tone="error" message={errorMessage} dismissible />
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field
          label="Email"
          error={errors.email?.message}
          hint="Use the same email you sign in with."
          required
          htmlFor="forgot-password-email"
        >
          <input
            id="forgot-password-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
          />
        </Field>

        <ActionButton
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          fullWidth
        >
          Send reset link
        </ActionButton>
      </form>

      <p className="mt-6 text-sm text-[var(--md-sys-color-on-surface-variant)]">
        Need a new account instead?{" "}
        <Link
          to="/register"
          className="font-medium text-[var(--md-sys-color-primary)] hover:opacity-80"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
