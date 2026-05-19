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
import { EmptyState } from "../../shared/components/EmptyState";
import { SkeletonCard } from "../../shared/components/Skeleton";

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

    void api.getMySales(token)
      .then((response) => {
        if (!isActive) {
          return;
        }

        setSales(response);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!isActive) {
          return;
        }

        setSales([]);
        setError(loadError instanceof ApiError ? loadError.message : "Failed to load purchase history.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  if (isLoading) return <PageShell><SkeletonCard /></PageShell>;

  return (
    <PageShell>
      <PageHeader eyebrow="Purchases" title="My Purchase History" description="View your past purchases and service history." />

      {error ? <AlertBox tone="error" message={error} dismissible /> : null}

      {sales.length === 0 ? (
        <EmptyState icon={Receipt} title="No purchases" description="You haven't made any purchases yet." />
      ) : (
        <div className="space-y-4">
          {sales.map((sale) => (
            <Card key={sale.saleId}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-on-surface">{sale.invoiceNumber || `Sale #${sale.saleId}`}</h3>
                  <p className="text-xs text-on-surface-variant">{new Date(sale.saleDate).toLocaleDateString()}</p>
                  {sale.vehicleNumber && <p className="text-xs text-on-surface-variant">Vehicle: {sale.vehicleNumber}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-on-surface-variant">Total</p>
                  <span className="text-lg font-bold text-on-surface">${sale.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {sale.notes && <p className="text-xs text-on-surface-variant">Notes: {sale.notes}</p>}

              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <p className="text-xs font-semibold text-on-surface-variant mb-2">
                  {sale.discountAmount > 0 ? "Items (before discount):" : "Items:"}
                </p>
                <ul className="space-y-1">
                  {sale.items.map((item) => (
                    <li key={`${sale.saleId}-${item.partId}`} className="flex justify-between text-xs text-on-surface-variant">
                      <span>{item.partName} x {item.quantity}</span>
                      <span>${((item.lineTotal ?? item.unitPrice * item.quantity)).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <dl className="mt-3 pt-3 border-t border-white/[0.06] space-y-1 text-xs">
                <div className="flex justify-between"><dt className="text-on-surface-variant">Subtotal</dt><dd className="text-on-surface-variant">${sale.subtotal.toFixed(2)}</dd></div>
                {sale.discountAmount > 0 && <div className="flex justify-between text-success-600"><dt>Discount</dt><dd>- ${sale.discountAmount.toFixed(2)}</dd></div>}
                <div className="flex justify-between"><dt className="text-on-surface-variant">Payment status</dt><dd className="text-on-surface">{sale.paymentStatus}</dd></div>
                {sale.dueDate && <div className="flex justify-between"><dt className="text-on-surface-variant">Due date</dt><dd className="text-on-surface">{new Date(sale.dueDate).toLocaleDateString()}</dd></div>}
                <div className="flex justify-between font-semibold text-sm text-on-surface"><dt>{sale.paymentStatus === "Paid" ? "Total paid" : "Invoice total"}</dt><dd>${sale.totalAmount.toFixed(2)}</dd></div>
              </dl>

              <div className="mt-4 flex justify-end border-t border-white/[0.06] pt-3">
                <ActionButton tone="tonal" size="sm" onClick={() => navigate(`/app/sales/${sale.saleId}`)}>
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
