import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound, ShieldCheck, Wrench } from "lucide-react";
import { api, ApiError } from "../../app/api";
import Toast from "../../components/Toast";
import { AlertBox } from "../../shared/components/AlertBox";
import { ActionButton } from "../../shared/components/ActionButton";
import { Field } from "../../shared/components/Field";
import { LoadingScreen } from "../../shared/components/LoadingScreen";
import { resetPasswordSchema } from "./schema";

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

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
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!token) {
      setValidationError("This password reset link is invalid or has expired.");
      setIsValidating(false);
      return () => {
        isActive = false;
      };
    }

    void api.validatePasswordResetToken({ token })
      .then((response) => {
        if (!isActive) {
          return;
        }

        setExpiresAt(response.expiresAt);
        setValidationError(null);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        const message =
          error instanceof ApiError
            ? error.message
            : "This password reset link is invalid or has expired.";

        setValidationError(message);
      })
      .finally(() => {
        if (isActive) {
          setIsValidating(false);
        }
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
    return <LoadingScreen message="Validating your reset link..." />;
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-lg shadow-accent-500/30">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Autonix</h1>
              <p className="text-xs text-slate-400 font-medium">
                Access Console
              </p>
            </div>
          </div>

          <div className="mt-16 space-y-6">
            <h2 className="text-3xl font-bold text-white leading-tight">
              Set a new password
              <br />
              <span className="text-accent-400">and get back to work</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Reset links are one-time use only and expire automatically to keep your account protected.
            </p>
          </div>

          <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm max-w-md space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container/200/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-accent-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">One-time recovery token</p>
                <p className="mt-1 text-sm text-slate-300 leading-relaxed">
                  Once your password is updated, this link can no longer be used.
                </p>
              </div>
            </div>
            {expiresAt ? (
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Link validated
              </p>
            ) : null}
          </div>
        </div>

        <p className="relative text-xs text-slate-600">
          &copy; {new Date().getFullYear()} Autonix. All rights reserved.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-surface">
        <div className="w-full max-w-sm animate-slideUp">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-lg shadow-accent-500/30">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-on-surface">Autonix</h1>
              <p className="text-xs text-on-surface-variant">Access Console</p>
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-on-surface mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>

          <h2 className="text-xl font-bold text-on-surface mb-1">
            Reset your password
          </h2>
          <p className="text-sm text-on-surface-variant mb-8">
            Choose a new password with at least eight characters.
          </p>

          <div className="mb-8 space-y-4">
            {validationError ? (
              <AlertBox tone="error" message={validationError} />
            ) : null}
            {submitError ? (
              <AlertBox tone="error" message={submitError} dismissible />
            ) : null}
          </div>

          {validationError ? (
            <div className="space-y-4">
              <Link
                to="/forgot-password"
                className="inline-flex w-full items-center justify-center rounded-full bg-primary text-primary-on hover:bg-primary-fixed-dim shadow-level1 hover:shadow-level2 active:shadow-level1 h-10 px-6 text-label-large gap-2 font-semibold transition-all duration-200 ease-standard"
              >
                Request a new reset link
              </Link>
              <p className="text-sm text-on-surface-variant">
                If the problem continues, submit a new forgot-password request from the sign-in screen.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <Field
                label="New password"
                error={errors.password?.message}
                hint="Use at least 8 characters."
                required
                htmlFor="reset-password"
              >
                <input
                  id="reset-password"
                  className="input"
                  type="password"
                  placeholder="Minimum 8 characters"
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
                  className="input"
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
                className="w-full"
              >
                Save new password
              </ActionButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}