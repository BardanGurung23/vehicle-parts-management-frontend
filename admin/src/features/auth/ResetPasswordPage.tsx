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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.12),transparent_42%),linear-gradient(180deg,_#f8fafc,_#e2e8f0)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_40px_120px_-60px_rgba(15,23,42,0.45)] lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden bg-slate-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 shadow-lg shadow-black/20">
                  <Wrench className="h-5 w-5 text-accent-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Autonix</h1>
                  <p className="text-sm text-slate-400">Access Console</p>
                </div>
              </div>

              <div className="mt-16 space-y-5">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Secure recovery
                </p>
                <h2 className="text-4xl font-semibold leading-tight">
                  Set a new password and return to the console.
                </h2>
                <p className="max-w-md text-sm leading-7 text-slate-300">
                  Reset links are one-time use only and expire automatically to keep your account protected.
                </p>
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white">One-time recovery token</p>
                  <p className="text-sm leading-6 text-slate-300">
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
          </section>

          <section className="px-6 py-8 sm:px-10 sm:py-12">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>

            <div className="mt-10 max-w-md">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-950">Autonix</h1>
                  <p className="text-sm text-slate-500">Access Console</p>
                </div>
              </div>

              <div className="mt-8 space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                  Reset your password
                </h2>
                <p className="text-sm leading-6 text-slate-500">
                  Choose a new password with at least eight characters.
                </p>
              </div>

              <div className="mt-8 space-y-4">
                {validationError ? (
                  <AlertBox tone="error" message={validationError} />
                ) : null}
                {submitError ? (
                  <AlertBox tone="error" message={submitError} dismissible />
                ) : null}
              </div>

              {validationError ? (
                <div className="mt-8 space-y-4">
                  <Link
                    to="/forgot-password"
                    className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-on transition-all duration-200 hover:bg-primary-fixed-dim"
                  >
                    Request a new reset link
                  </Link>
                  <p className="text-sm text-slate-500">
                    If the problem continues, submit a new forgot-password request from the sign-in screen.
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="mt-8 space-y-5">
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
          </section>
        </div>
      </div>
    </div>
  );
}