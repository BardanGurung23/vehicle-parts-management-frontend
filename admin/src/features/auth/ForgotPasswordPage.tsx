import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail, Wrench } from "lucide-react";
import { api, ApiError } from "../../app/api";
import { AlertBox } from "../../shared/components/AlertBox";
import { ActionButton } from "../../shared/components/ActionButton";
import { Field } from "../../shared/components/Field";
import { forgotPasswordSchema } from "./schema";

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.12),transparent_40%),linear-gradient(180deg,_#f8fafc,_#eef2ff)] px-4 py-10 sm:px-6 lg:px-8">
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
                  Account recovery
                </p>
                <h2 className="text-4xl font-semibold leading-tight">
                  Recover access without exposing account details.
                </h2>
                <p className="max-w-md text-sm leading-7 text-slate-300">
                  Enter the email tied to your Autonix account. If it matches an active user, we will send a one-time reset link that expires automatically.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-500/15 text-accent-300">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white">One-time reset link</p>
                  <p className="text-sm leading-6 text-slate-300">
                    Every new request invalidates older active links for the same account.
                  </p>
                </div>
              </div>
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
                  Forgot your password?
                </h2>
                <p className="text-sm leading-6 text-slate-500">
                  We will send a secure reset link to the email address you use to sign in.
                </p>
              </div>

              <div className="mt-8 space-y-4">
                {successMessage ? (
                  <AlertBox tone="success" message={successMessage} />
                ) : null}
                {errorMessage ? (
                  <AlertBox tone="error" message={errorMessage} dismissible />
                ) : null}
              </div>

              <form onSubmit={onSubmit} className="mt-8 space-y-5">
                <Field
                  label="Email"
                  error={errors.email?.message}
                  hint="Use the same email address you sign in with."
                  required
                  htmlFor="forgot-password-email"
                >
                  <input
                    id="forgot-password-email"
                    className="input"
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
                  className="w-full"
                >
                  Send reset link
                </ActionButton>
              </form>

              <p className="mt-6 text-sm text-slate-500">
                Need a new account instead?{" "}
                <Link to="/register" className="font-medium text-primary hover:text-accent-700">
                  Create an account
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}