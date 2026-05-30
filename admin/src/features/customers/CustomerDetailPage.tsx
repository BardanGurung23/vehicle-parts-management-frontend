import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { Appointment, CustomerDetail, Sale } from "../../app/types";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { AlertBox } from "../../shared/components/AlertBox";
import { EmptyState } from "../../shared/components/EmptyState";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { ActionButton } from "../../shared/components/ActionButton";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function asMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (!error || typeof error !== "object") return fallback;
  const payload = error as {
    data?: { detail?: unknown; title?: unknown; message?: unknown };
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

const formatDate = (value: string) => dateFormatter.format(new Date(value));
const formatMoney = (value: number) => currencyFormatter.format(value);

export function CustomerDetailPage() {
  const { customerId } = useParams();
  const { token } = useAuth();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
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
    void Promise.all([
      api.getCustomerById(token, parsedCustomerId),
      api.getCustomerAppointments(token, parsedCustomerId),
      api.getCustomerSales(token, parsedCustomerId),
    ])
      .then(([customerResponse, appointmentsResponse, salesResponse]) => {
        if (isActive) {
          setCustomer(customerResponse);
          setAppointments(appointmentsResponse);
          setSales(salesResponse);
          setPageError(null);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setCustomer(null);
          setPageError(
            extractErrorMessage(error, "Could not load the customer profile."),
          );
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [isValidCustomerId, parsedCustomerId, token]);

  const totalSpent = useMemo(
    () => sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    [sales],
  );

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
        title={customer?.fullName ?? "Customer details"}
        description={
          customer
            ? `Customer #${customer.customerId} · ${customer.phoneNumber}`
            : "Profile, vehicles, and history"
        }
        actions={
          <Link to="/app/customers/search">
            <ActionButton tone="secondary" size="sm" icon={ArrowLeft}>
              Back
            </ActionButton>
          </Link>
        }
      />

      {pageError ? <AlertBox tone="error" message={pageError} /> : null}

      {customer ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Summary rail */}
          <div className="space-y-4 lg:order-2">
            <Card
              header={
                <div>
                  <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
                    Summary
                  </h3>
                  <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                    Quick overview
                  </p>
                </div>
              }
            >
              <dl className="space-y-3 text-sm">
                <SummaryRow label="Profile type">
                  <Badge variant={customer.userId ? "success" : "neutral"} dot>
                    {customer.userId ? "Portal account" : "Staff-created"}
                  </Badge>
                </SummaryRow>
                <SummaryRow label="Vehicles">
                  <span className="tabular">{customer.vehicles.length}</span>
                </SummaryRow>
                <SummaryRow label="Appointments">
                  <span className="tabular">{appointments.length}</span>
                </SummaryRow>
                <SummaryRow label="Purchases">
                  <span className="tabular">{sales.length}</span>
                </SummaryRow>
                <SummaryRow label="Total spent">
                  <span className="tabular font-semibold">
                    {formatMoney(totalSpent)}
                  </span>
                </SummaryRow>
              </dl>
            </Card>

            <Card
              header={
                <div>
                  <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
                    Profile
                  </h3>
                  <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                    Core contact details
                  </p>
                </div>
              }
            >
              <dl className="space-y-3 text-sm">
                <SummaryRow label="Customer ID">
                  <span className="tabular">#{customer.customerId}</span>
                </SummaryRow>
                <SummaryRow label="Phone">
                  <span className="tabular">{customer.phoneNumber}</span>
                </SummaryRow>
                <SummaryRow label="Email">
                  <span>{customer.email ?? "—"}</span>
                </SummaryRow>
                <SummaryRow label="Address">
                  <span className="text-right">
                    {customer.address ?? "—"}
                  </span>
                </SummaryRow>
                <SummaryRow label="Registered">
                  <span className="tabular">
                    {formatDate(customer.registeredAt)}
                  </span>
                </SummaryRow>
                <SummaryRow label="Linked login">
                  <span>
                    {customer.userId ? `User #${customer.userId}` : "Not linked"}
                  </span>
                </SummaryRow>
              </dl>
            </Card>
          </div>

          {/* Main panels */}
          <div className="lg:col-span-2 space-y-4 lg:order-1">
            <Card
              header={
                <div>
                  <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
                    Vehicles
                  </h3>
                  <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                    {customer.vehicles.length} linked
                  </p>
                </div>
              }
            >
              {customer.vehicles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customer.vehicles.map((vehicle) => (
                    <div
                      key={vehicle.vehicleId}
                      className="rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] tabular">
                          {vehicle.vehicleNumber}
                        </p>
                        <Badge variant="neutral">#{vehicle.vehicleId}</Badge>
                      </div>
                      <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
                        {vehicle.model ?? "Model not recorded"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  embedded
                  title="No vehicles"
                  description="Vehicles linked to this customer will appear here."
                />
              )}
            </Card>

            <Card
              header={
                <div>
                  <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
                    Purchase history
                  </h3>
                  <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                    Sales invoices and payment status
                  </p>
                </div>
              }
              bodyless
            >
              {sales.length > 0 ? (
                <ul className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                  {sales.map((sale) => (
                    <li
                      key={sale.saleId}
                      className="px-5 py-3 hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                            {sale.invoiceNumber}
                          </p>
                          <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
                            {formatDate(sale.saleDate)}
                            {sale.vehicleNumber ? ` · ${sale.vehicleNumber}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              sale.paymentStatus === "Paid"
                                ? "success"
                                : sale.paymentStatus === "Credit"
                                  ? "warning"
                                  : "info"
                            }
                            dot
                          >
                            {sale.paymentStatus}
                          </Badge>
                          <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] tabular">
                            {formatMoney(sale.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-5">
                  <EmptyState
                    embedded
                    icon={FileText}
                    title="No purchases yet"
                    description="Sales for this customer will appear here."
                  />
                </div>
              )}
            </Card>

            <Card
              header={
                <div>
                  <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
                    Service history
                  </h3>
                  <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                    Appointments and progress
                  </p>
                </div>
              }
              bodyless
            >
              {appointments.length > 0 ? (
                <ul className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                  {appointments.map((appointment) => (
                    <li
                      key={appointment.appointmentId}
                      className="px-5 py-3 hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                            {appointment.serviceType}
                          </p>
                          <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
                            {formatDate(appointment.appointmentDate)} ·{" "}
                            {appointment.vehicleNumber}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              appointment.status === "Completed"
                                ? "success"
                                : appointment.status === "Cancelled"
                                  ? "danger"
                                  : "warning"
                            }
                            dot
                          >
                            {appointment.status}
                          </Badge>
                          {appointment.hasReview ? (
                            <Badge variant="neutral">Reviewed</Badge>
                          ) : null}
                        </div>
                      </div>
                      {appointment.notes?.trim() ? (
                        <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] mt-2 leading-5">
                          {appointment.notes}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-5">
                  <EmptyState
                    embedded
                    title="No service history"
                    description="Appointments for this customer will appear here."
                  />
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[12px] uppercase tracking-[0.06em] text-[var(--md-sys-color-on-surface-variant)]">
        {label}
      </dt>
      <dd className="text-sm text-[var(--md-sys-color-on-surface)] text-right">
        {children}
      </dd>
    </div>
  );
}
