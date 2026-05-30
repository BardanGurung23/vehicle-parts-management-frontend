import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  RefreshCcw,
  Lock,
} from "lucide-react";
import { api, ApiError } from "../../app/api";
import Toast from "../../components/Toast";
import { AlertBox } from "../../shared/components/AlertBox";
import { ActionButton } from "../../shared/components/ActionButton";
import { Field } from "../../shared/components/Field";
import { LoadingScreen } from "../../shared/components/LoadingScreen";
import { AuthShell } from "./AuthShell";
import { resetPasswordSchema } from "./schema";

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const features = [
  { icon: ShieldCheck, text: "One-time recovery token" },
  { icon: Lock, text: "Encrypted password storage" },
  { icon: RefreshCcw, text: "Automatic link expiry" },
];

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!token) {
      setValidationError("This password reset link is invalid or has expired.");
      setIsValidating(false);
      return () => {
        isActive = false;
      };
    }

    void api
      .validatePasswordResetToken({ token })
      .then(() => {
        if (!isActive) return;
        setValidationError(null);
      })
      .catch((error) => {
        if (!isActive) return;
        const message =
          error instanceof ApiError
            ? error.message
            : "This password reset link is invalid or has expired.";
        setValidationError(message);
      })
      .finally(() => {
        if (isActive) setIsValidating(false);
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      const response = await api.resetPassword({ token, ...values });
      Toast(response.message, "success");
      navigate("/", { replace: true });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "We could not reset your password right now.";
      setSubmitError(message);
    }
  });

  if (isValidating) {
    return <LoadingScreen message="Validating your reset link…" />;
  }

  return (
    <AuthShell
      size="sm"
      headline={
        <>
          Set a new password
          <br />
          and get back to work.
        </>
      }
      tagline="Reset links are one-time use and expire automatically to keep
      your account protected."
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
        Reset your password
      </h2>
      <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">
        Choose a new password with at least eight characters.
      </p>

      <div className="mt-6 space-y-3">
        {validationError ? (
          <AlertBox tone="error" message={validationError} />
        ) : null}
        {submitError ? (
          <AlertBox tone="error" message={submitError} dismissible />
        ) : null}
      </div>

      {validationError ? (
        <div className="mt-6 space-y-3">
          <Link to="/forgot-password" className="block">
            <ActionButton fullWidth>Request a new reset link</ActionButton>
          </Link>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
            If the problem continues, submit a new forgot-password request from
            the sign-in screen.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field
            label="New password"
            error={errors.password?.message}
            hint="Use at least 8 characters."
            required
            htmlFor="reset-password"
          >
            <input
              id="reset-password"
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
            htmlFor="reset-password-confirm"
          >
            <input
              id="reset-password-confirm"
              type="password"
              placeholder="Repeat your new password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
          </Field>

          <ActionButton
            type="submit"
            icon={KeyRound}
            isLoading={isSubmitting}
            disabled={isSubmitting}
            fullWidth
          >
            Save new password
          </ActionButton>
        </form>
      )}
    </AuthShell>
  );
}
