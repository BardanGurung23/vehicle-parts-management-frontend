import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { Sale } from "../../app/types";
import { ActionButton } from "../../shared/components/ActionButton";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { AlertBox } from "../../shared/components/AlertBox";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { EmptyState } from "../../shared/components/EmptyState";
import { SkeletonCard } from "../../shared/components/Skeleton";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const formatMoney = (value: number) => currencyFormatter.format(value);

const paymentVariant = (status: string) => {
  if (status === "Paid") return "success" as const;
  if (status === "Credit") return "warning" as const;
  return "info" as const;
};

export function MySalesPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setSales([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    let isActive = true;
    setIsLoading(true);
    void api
      .getMySales(token)
      .then((response) => {
        if (!isActive) return;
        setSales(response);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!isActive) return;
        setSales([]);
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "Could not load your purchases.",
        );
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [token]);

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
        title="My purchases"
        description={`${sales.length} invoice${sales.length === 1 ? "" : "s"}`}
      />

      {error ? <AlertBox tone="error" message={error} dismissible /> : null}

      {sales.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No purchases yet"
          description="Once you complete a purchase, your invoice will appear here."
        />
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => (
            <Card key={sale.saleId}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                    {sale.invoiceNumber || `Sale #${sale.saleId}`}
                  </h3>
                  <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
                    {new Date(sale.saleDate).toLocaleDateString()}
                    {sale.vehicleNumber ? ` · ${sale.vehicleNumber}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
                    Total
                  </p>
                  <span className="text-base font-semibold text-[var(--md-sys-color-on-surface)] tabular">
                    {formatMoney(sale.totalAmount)}
                  </span>
                </div>
              </div>

              {sale.notes ? (
                <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] mt-3">
                  {sale.notes}
                </p>
              ) : null}

              <ul className="mt-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)] space-y-1">
                {sale.items.map((item) => (
                  <li
                    key={`${sale.saleId}-${item.partId}`}
                    className="flex justify-between text-[12px] text-[var(--md-sys-color-on-surface-variant)]"
                  >
                    <span className="truncate">
                      {item.partName} × {item.quantity}
                    </span>
                    <span className="tabular ml-3 shrink-0">
                      {formatMoney(item.lineTotal ?? item.unitPrice * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)] space-y-1 text-[12px]">
                <Row label="Subtotal" value={formatMoney(sale.subtotal)} />
                {sale.discountAmount > 0 ? (
                  <Row
                    label="Discount"
                    value={`− ${formatMoney(sale.discountAmount)}`}
                    valueClassName="text-[var(--success-700)]"
                  />
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">
                    Status
                  </span>
                  <Badge variant={paymentVariant(sale.paymentStatus)} dot>
                    {sale.paymentStatus}
                  </Badge>
                </div>
                {sale.dueDate ? (
                  <Row
                    label="Due"
                    value={new Date(sale.dueDate).toLocaleDateString()}
                  />
                ) : null}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                  <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                    {sale.paymentStatus === "Paid" ? "Total paid" : "Invoice total"}
                  </span>
                  <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] tabular">
                    {formatMoney(sale.totalAmount)}
                  </span>
                </div>
              </dl>

              <div className="mt-4 flex justify-end">
                <ActionButton
                  tone="secondary"
                  size="sm"
                  onClick={() => navigate(`/app/sales/${sale.saleId}`)}
                >
                  View invoice
                </ActionButton>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function Row({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--md-sys-color-on-surface-variant)]">{label}</span>
      <span className={`tabular ${valueClassName ?? "text-[var(--md-sys-color-on-surface)]"}`}>
        {value}
      </span>
    </div>
  );
}
