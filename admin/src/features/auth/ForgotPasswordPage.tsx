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
              Recover access
              <br />
              <span className="text-accent-400">with a secure reset link</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Enter the email tied to your Autonix account. If it matches an active user, we will send a one-time reset link that expires automatically.
            </p>
          </div>

          <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm max-w-md">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container/200/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-accent-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">One-time reset link</p>
                <p className="mt-1 text-sm text-slate-300 leading-relaxed">
                  Every new request invalidates older active links for the same account.
                </p>
              </div>
            </div>
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
            Forgot your password?
          </h2>
          <p className="text-sm text-on-surface-variant mb-8">
            We will send a secure reset link to the email address you use to sign in.
          </p>

          <div className="mb-8 space-y-4">
            {successMessage ? (
              <AlertBox tone="success" message={successMessage} />
            ) : null}
            {errorMessage ? (
              <AlertBox tone="error" message={errorMessage} dismissible />
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
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

          <p className="mt-6 text-sm text-on-surface-variant">
            Need a new account instead?{" "}
            <Link to="/register" className="text-primary font-medium hover:text-accent-700">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}