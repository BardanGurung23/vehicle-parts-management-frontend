import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { CustomerDetail } from "../../app/types";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { Field } from "../../shared/components/Field";
import { LoadingScreen } from "../../shared/components/LoadingScreen";
import { fullNameSchema, phoneNumberSchema, requiredEmailSchema } from "../../shared/validation/member4Validation";

const profileSchema = z.object({
  fullName: fullNameSchema,
  email: requiredEmailSchema,
  phoneNumber: phoneNumberSchema,
  address: z.string().max(500, "Address is too long.").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function CustomerProfilePage() {
  const { token, refreshProfile } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let isActive = true;

    void api.getCurrentCustomer(token)
      .then((response) => {
        if (!isActive) {
          return;
        }

        setCustomer(response);
        reset({
          fullName: response.fullName,
          email: response.email ?? "",
          phoneNumber: response.phoneNumber,
          address: response.address ?? "",
        });
        setPageError(null);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setPageError(error instanceof ApiError ? error.message : "Could not load your customer profile.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [reset, token]);

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      return;
    }

    try {
      setPageError(null);
      setPageSuccess(null);

      const updatedCustomer = await api.updateCurrentCustomer(token, {
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        address: values.address,
      });

      setCustomer(updatedCustomer);
      reset({
        fullName: updatedCustomer.fullName,
        email: updatedCustomer.email ?? "",
        phoneNumber: updatedCustomer.phoneNumber,
        address: updatedCustomer.address ?? "",
      });
      await refreshProfile();

      const successMessage = "Your customer profile was updated.";
      setPageSuccess(successMessage);
      toast.success(successMessage);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not update your customer profile.";
      setPageError(message);
      toast.error(message);
    }
  });

  if (isLoading) {
    return <LoadingScreen message="Loading your profile..." />;
  }

  return (
    <section className="page-stack">
      {pageError ? <AlertBox tone="error" message={pageError} /> : null}
      {pageSuccess ? <AlertBox tone="success" message={pageSuccess} /> : null}

      <header className="card dashboard-hero">
        <div className="dashboard-hero__copy">
          <p className="eyebrow">Feature 12</p>
          <h2>My profile</h2>
          <p className="card__copy">
            Review your account details and keep the customer record in sync with the login profile used by the access console.
          </p>
        </div>

        <div className="dashboard-hero__actions">
          <Link className="button button--secondary" to="/app/profile/vehicles">
            Manage vehicles
          </Link>
        </div>
      </header>

      <div className="dashboard-board">
        <article className="card dashboard-panel dashboard-panel--wide">
          <div className="card__header">
            <h3>Update profile</h3>
            <p className="card__copy">Changes here update both your customer record and your linked login identity.</p>
          </div>

          <form className="form-grid form-grid--two-columns" onSubmit={onSubmit}>
            <Field label="Full name" error={errors.fullName?.message}>
              <input className="input" type="text" {...register("fullName")} />
            </Field>

            <Field label="Email" error={errors.email?.message}>
              <input className="input" type="email" {...register("email")} />
            </Field>

            <Field label="Phone number" error={errors.phoneNumber?.message}>
              <input className="input" type="tel" {...register("phoneNumber")} />
            </Field>

            <Field label="Address" error={errors.address?.message}>
              <textarea className="input input--textarea" rows={4} {...register("address")} />
            </Field>

            <div className="form-grid__full-width">
              <ActionButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving profile..." : "Save profile"}
              </ActionButton>
            </div>
          </form>
        </article>

        <article className="card dashboard-panel">
          <div className="card__header">
            <h3>Current summary</h3>
            <p className="card__copy">The profile state currently stored in the customer backend.</p>
          </div>

          {customer ? (
            <dl className="detail-list">
              <div>
                <dt>Customer ID</dt>
                <dd>#{customer.customerId}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{customer.phoneNumber}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{customer.email ?? "No email recorded"}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{customer.address ?? "No address recorded"}</dd>
              </div>
            </dl>
          ) : (
            <p className="empty-state">Customer profile data is unavailable right now.</p>
          )}
        </article>
      </div>
    </section>
  );
}