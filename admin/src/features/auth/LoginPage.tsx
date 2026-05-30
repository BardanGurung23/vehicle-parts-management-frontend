import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, Clock, BarChart3 } from "lucide-react";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import Toast from "../../components/Toast";
import { AuthShell } from "./AuthShell";
import { loginSchema } from "./schema";

type LoginFormValues = z.infer<typeof loginSchema>;

const features = [
  { icon: Shield, text: "Role-based access control" },
  { icon: Clock, text: "Real-time inventory tracking" },
  { icon: BarChart3, text: "Comprehensive reporting" },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    try {
      setErrorMessage(null);
      const response = await api.login(values);
      setSession(response);
      Toast("Signed in successfully", "success");
      navigate("/app", { replace: true });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Sign in failed.";
      setErrorMessage(message);
      Toast("Incorrect email or password. Please try again.", "error");
    }
  });

  return (
    <AuthShell
      size="sm"
      headline={
        <>
          Manage your auto shop
          <br />
          from a single console.
        </>
      }
      tagline="Inventory, staff, customers, and financials — unified in one
      organized place."
      highlights={features}
    >
      <h2 className="text-xl font-semibold text-[var(--md-sys-color-on-surface)]">Welcome back</h2>
      <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">
        Sign in to continue.
      </p>

      {errorMessage ? (
        <div className="mt-6">
          <AlertBox tone="error" message={errorMessage} dismissible />
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field
          label="Email"
          error={errors.email?.message}
          required
          htmlFor="login-email"
        >
          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
          />
        </Field>

        <Field
          label="Password"
          error={errors.password?.message}
          required
          htmlFor="login-password"
        >
          <input
            id="login-password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="current-password"
            {...register("password")}
          />
        </Field>

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-[var(--md-sys-color-primary)] hover:opacity-80"
          >
            Forgot password?
          </Link>
        </div>

        <ActionButton
          type="submit"
          disabled={isSubmitting}
          isLoading={isSubmitting}
          fullWidth
        >
          Sign in
        </ActionButton>
      </form>

      <p className="mt-6 text-sm text-[var(--md-sys-color-on-surface-variant)] text-center">
        New customer?{" "}
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
