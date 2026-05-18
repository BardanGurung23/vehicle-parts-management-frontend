import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wrench, Shield, Clock, BarChart3 } from "lucide-react";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import Toast from "../../components/Toast";
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
      navigate("/app", { replace: true });
      Toast("User Logged in Successful", "success");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Login failed.";
      setErrorMessage(message);
      Toast("Session Expired. Please Try Again", "error");
    }
  });

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.15),transparent_50%)]" />
        <div>
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
              Manage your auto shop
              <br />
              <span className="text-accent-400">from one place</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Inventory management, staff coordination, customer relationships,
              and financial reporting — all in a single, unified console.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {features.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-container/200/10 flex items-center justify-center">
                  <f.icon className="w-4 h-4 text-accent-400" />
                </div>
                <span className="text-sm text-slate-300">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">
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

          <h2 className="text-xl font-bold text-on-surface mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-on-surface-variant mb-8">
            Sign in to continue to the dashboard.
          </p>

          {errorMessage ? (
            <AlertBox tone="error" message={errorMessage} dismissible />
          ) : null}

          <form onSubmit={onSubmit} className="space-y-5">
            <Field
              label="Email"
              error={errors.email?.message}
              required
              htmlFor="login-email"
            >
              <input
                id="login-email"
                className="input"
                type="email"
                placeholder="you@example.com"
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
                className="input"
                type="password"
                placeholder="Minimum 8 characters"
                {...register("password")}
              />
            </Field>

            <ActionButton
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="w-full"
            >
              Sign in
            </ActionButton>
          </form>

          <p className="mt-6 text-sm text-on-surface-variant text-center">
            New customer?{" "}
            <Link
              to="/register"
              className="text-primary font-medium hover:text-accent-700"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
