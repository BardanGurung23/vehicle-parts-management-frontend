import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { CustomerDetail } from "../../app/types";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { AlertBox } from "../../shared/components/AlertBox";
import { SkeletonCard } from "../../shared/components/Skeleton";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric", month: "short", day: "numeric",
});

function asMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (!error || typeof error !== "object") return fallback;
  const payload = error as { data?: { detail?: unknown; title?: unknown; message?: unknown }; error?: unknown };
  if (payload.data) {
    return asMessage(payload.data.detail) ?? asMessage(payload.data.message) ?? asMessage(payload.data.title) ?? fallback;
  }
  return asMessage(payload.error) ?? fallback;
}

function formatDate(value: string) { return dateFormatter.format(new Date(value)); }

export function CustomerDetailPage() {
  const { customerId } = useParams();
  const { token } = useAuth();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const parsedCustomerId = Number(customerId);
  const isValidCustomerId = Number.isInteger(parsedCustomerId) && parsedCustomerId > 0;

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }
    if (!isValidCustomerId) { setPageError("The customer ID in the route is invalid."); setIsLoading(false); return; }

    let isActive = true;
    setIsLoading(true);
    void api.getCustomerById(token, parsedCustomerId)
      .then((response) => { if (isActive) { setCustomer(response); setPageError(null); } })
      .catch((error: unknown) => { if (isActive) { setCustomer(null); setPageError(extractErrorMessage(error, "Could not load the customer profile.")); } })
      .finally(() => { if (isActive) setIsLoading(false); });
    return () => { isActive = false; };
  }, [isValidCustomerId, parsedCustomerId, token]);

  if (isLoading) {
    return (
      <PageShell>
        <SkeletonCard />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Customer record"
        title={customer?.fullName ?? "Customer details"}
        description="Review the selected customer profile, contact details, and linked vehicles."
        actions={
          <Link to="/app/customers/search">
            <span className="inline-flex items-center gap-1 text-sm text-primary hover:text-accent-700 font-medium">
              <ArrowLeft className="w-4 h-4" /> Back to search
            </span>
          </Link>
        }
      />

      {pageError ? <AlertBox tone="error" message={pageError} /> : null}

      {customer && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card
              header={
                <div>
                  <h3 className="text-base font-semibold text-on-surface">Profile details</h3>
                  <p className="text-sm text-on-surface-variant">Core customer information.</p>
                </div>
              }
            >
              <dl className="space-y-3 text-sm">
                {[
                  { label: "Customer ID", value: `#${customer.customerId}` },
                  { label: "Phone", value: customer.phoneNumber },
                  { label: "Email", value: customer.email ?? "No email recorded" },
                  { label: "Address", value: customer.address ?? "No address recorded" },
                  { label: "Registered", value: formatDate(customer.registeredAt) },
                  { label: "Linked login", value: customer.userId ? `User #${customer.userId}` : "No login linked" },
                ].map((item) => (
                  <div key={item.label} className="flex gap-3">
                    <dt className="w-28 text-on-surface-variant shrink-0">{item.label}</dt>
                    <dd className="text-on-surface">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card
              header={
                <div>
                  <h3 className="text-base font-semibold text-on-surface">Vehicles</h3>
                  <p className="text-sm text-on-surface-variant">Vehicle identifiers and models linked to this customer.</p>
                </div>
              }
            >
              {customer.vehicles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customer.vehicles.map((vehicle) => (
                    <div key={vehicle.vehicleId} className="rounded-lg ring-1 ring-white/[0.06] bg-surface-container-low/50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-on-surface">{vehicle.vehicleNumber}</p>
                        <Badge variant="neutral">#{vehicle.vehicleId}</Badge>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">{vehicle.model ?? "Model not recorded"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">No vehicles attached to this customer yet.</p>
              )}
            </Card>
          </div>

          <Card
            header={
              <div>
                <h3 className="text-base font-semibold text-on-surface">Summary</h3>
                <p className="text-sm text-on-surface-variant">Quick overview.</p>
              </div>
            }
          >
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-on-surface-variant">Total vehicles</dt>
                <dd className="font-semibold text-on-surface">{customer.vehicles.length}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant">Profile type</dt>
                <dd className="font-semibold text-on-surface">
                  {customer.userId ? "Portal account" : "Staff-created profile"}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
