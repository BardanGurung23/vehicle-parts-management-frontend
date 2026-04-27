import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { toast } from "react-toastify";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address.").trim(),
  password: z.string().min(8, "Password must be at least 8 characters.").trim(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

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
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Login failed.";
      setErrorMessage(message);
      toast.error(message);
    }
  });

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="section-header">
          <h1>Sign in</h1>
          <p>Use your email and password to access the console.</p>
        </div>

        {errorMessage ? <AlertBox tone="error" message={errorMessage} /> : null}

        <form className="form-grid" onSubmit={onSubmit}>
          <Field label="Email" error={errors.email?.message}>
            <input className="input" type="email" placeholder="you@example.com" {...register("email")} />
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <input className="input" type="password" placeholder="Minimum 8 characters" {...register("password")} />
          </Field>

          <ActionButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </ActionButton>
        </form>

        <p className="section-footer">
          New customer account? <Link to="/register">Register here</Link>
        </p>
      </section>
    </main>
  );
}