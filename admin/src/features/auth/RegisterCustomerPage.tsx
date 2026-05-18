import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wrench, Car, UserPlus, Shield, Clock, BarChart3 } from "lucide-react";
import { api, ApiError } from "../../app/api";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { toast } from "sonner";
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

      const message = `Customer account created for ${response.fullName}. You can sign in now.`;
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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-12 flex-col justify-between relative overflow-hidden">
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
              Join Autonix
              <br />
              <span className="text-accent-400">and stay in control</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Create a customer account to book appointments, track repairs,
              manage your vehicles, and more.
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
        <div className="w-full max-w-lg animate-slideUp">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-lg shadow-accent-500/30">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-on-surface">Autonix</h1>
              <p className="text-xs text-on-surface-variant">Access Console</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary-container/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">
                Create account
              </h2>
              <p className="text-sm text-on-surface-variant">
                Fill in your details to get started.
              </p>
            </div>
          </div>

          {errorMessage ? (
            <AlertBox tone="error" message={errorMessage} dismissible />
          ) : null}
          {successMessage ? (
            <AlertBox tone="success" message={successMessage} dismissible />
          ) : null}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-on-surface mb-3 pb-2 border-b border-white/[0.06]">
                Account Information
              </h3>
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
                      className="input"
                      type="text"
                      placeholder="Alex Johnson"
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
                    className="input"
                    type="email"
                    placeholder="alex@example.com"
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
                    className="input"
                    type="tel"
                    placeholder="+9779800000000"
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
                      className="input"
                      rows={3}
                      placeholder="Optional address"
                      {...register("address")}
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-on-surface mb-3 pb-2 border-b border-white/[0.06]">
                Vehicle Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Vehicle number"
                  error={errors.vehicleNumber?.message}
                  hint="Add a vehicle or skip for now."
                  htmlFor="reg-vehicle"
                >
                  <input
                    id="reg-vehicle"
                    className="input"
                    type="text"
                    placeholder="BA 1 PA 1234"
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
                    className="input"
                    type="text"
                    placeholder="Civic"
                    {...register("vehicleModel")}
                  />
                </Field>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-on-surface mb-3 pb-2 border-b border-white/[0.06]">
                Security
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Password"
                  error={errors.password?.message}
                  required
                  htmlFor="reg-password"
                >
                  <input
                    id="reg-password"
                    className="input"
                    type="password"
                    placeholder="Minimum 8 characters"
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
                    className="input"
                    type="password"
                    placeholder="Repeat password"
                    {...register("confirmPassword")}
                  />
                </Field>
              </div>
            </div>

            <ActionButton
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="w-full"
            >
              Register customer
            </ActionButton>
          </form>

          <p className="mt-6 text-sm text-on-surface-variant text-center">
            Already have access?{" "}
            <Link
              to="/"
              className="text-primary font-medium hover:text-accent-700"
            >
              Go to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
