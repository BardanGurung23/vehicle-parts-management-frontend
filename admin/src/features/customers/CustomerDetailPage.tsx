import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { CustomerDetail } from "../../app/types";
import { AlertBox } from "../../shared/components/AlertBox";
import { LoadingScreen } from "../../shared/components/LoadingScreen";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function asMessage(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (!error || typeof error !== "object") {
    return fallback;
  }

  const payload = error as {
    data?: {
      detail?: unknown;
      title?: unknown;
      message?: unknown;
    };
    error?: unknown;
  };

  if (payload.data) {
    return (
      asMessage(payload.data.detail) ??
      asMessage(payload.data.message) ??
      asMessage(payload.data.title) ??
      fallback
    );
  }

  return asMessage(payload.error) ?? fallback;
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function CustomerDetailPage() {
  const { customerId } = useParams();
  const { token } = useAuth();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const parsedCustomerId = Number(customerId);
  const isValidCustomerId = Number.isInteger(parsedCustomerId) && parsedCustomerId > 0;

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    if (!isValidCustomerId) {
      setPageError("The customer ID in the route is invalid.");
      setIsLoading(false);
      return;
    }

    let isActive = true;
    setIsLoading(true);

    void api
      .getCustomerById(token, parsedCustomerId)
      .then((response) => {
        if (!isActive) {
          return;
        }

        setCustomer(response);
        setPageError(null);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setCustomer(null);
        setPageError(extractErrorMessage(error, "Could not load the customer profile."));
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [isValidCustomerId, parsedCustomerId, token]);

  if (isLoading) {
    return <LoadingScreen message="Loading customer profile..." />;
  }

  return (
    <section className="page-stack">
      <header className="card dashboard-hero">
        <div className="dashboard-hero__copy">
          <p className="eyebrow">Customer record</p>
          <h2>{customer?.fullName ?? "Customer details"}</h2>
          <p className="card__copy">
            Review the selected customer profile, contact details, and linked vehicles from the active customer API.
          </p>
        </div>

        <div className="dashboard-hero__actions">
          <Link className="button button--secondary" to="/app">
            Back to dashboard
          </Link>
        </div>
      </header>

      {pageError ? <AlertBox tone="error" message={pageError} /> : null}

      {customer ? (
        <div className="dashboard-board">
          <article className="card dashboard-panel dashboard-panel--wide">
            <div className="card__header">
              <h3>Profile details</h3>
              <p className="card__copy">Core customer information currently available in the active backend.</p>
            </div>

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
              <div>
                <dt>Registered</dt>
                <dd>{formatDate(customer.registeredAt)}</dd>
              </div>
              <div>
                <dt>Linked login</dt>
                <dd>{customer.userId ? `User #${customer.userId}` : "No login linked"}</dd>
              </div>
            </dl>
          </article>

          <article className="card dashboard-panel">
            <div className="card__header">
              <h3>Vehicle summary</h3>
              <p className="card__copy">Vehicles currently attached to this customer record.</p>
            </div>

            <dl className="detail-list">
              <div>
                <dt>Total vehicles</dt>
                <dd>{customer.vehicles.length}</dd>
              </div>
              <div>
                <dt>Profile type</dt>
                <dd>{customer.userId ? "Portal account" : "Staff-created profile"}</dd>
              </div>
            </dl>
          </article>

          <article className="card dashboard-panel dashboard-panel--wide">
            <div className="card__header">
              <h3>Vehicles</h3>
              <p className="card__copy">Vehicle identifiers and models linked to this customer.</p>
            </div>

            {customer.vehicles.length > 0 ? (
              <div className="dashboard-vehicle-list">
                {customer.vehicles.map((vehicle) => (
                  <article key={vehicle.vehicleId} className="dashboard-vehicle-card">
                    <div className="dashboard-vehicle-card__top">
                      <strong>{vehicle.vehicleNumber}</strong>
                      <span className="status-pill">Vehicle #{vehicle.vehicleId}</span>
                    </div>
                    <p>{vehicle.model ?? "Model not recorded"}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">No vehicles are attached to this customer yet.</p>
            )}
          </article>
        </div>
      ) : null}
    </section>
  );
}