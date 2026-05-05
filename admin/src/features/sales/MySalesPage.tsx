import { Receipt } from "lucide-react";
import { useGetMySalesQuery } from "../../redux/services/sales";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { SkeletonCard } from "../../shared/components/Skeleton";

export function MySalesPage() {
  const { data: sales = [], isLoading, error } = useGetMySalesQuery();

  if (isLoading) return <PageShell><SkeletonCard /></PageShell>;
  if (error) return <PageShell><div className="bg-danger-50 border border-danger-100 text-danger-700 rounded-lg p-3 text-sm">Failed to load purchase history.</div></PageShell>;

  return (
    <PageShell>
      <PageHeader eyebrow="Purchases" title="My Purchase History" description="View your past purchases and service history." />

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
                  {sale.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between text-xs text-on-surface-variant">
                      <span>{item.partName} x {item.quantity}</span>
                      <span>${item.subtotal.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <dl className="mt-3 pt-3 border-t border-white/[0.06] space-y-1 text-xs">
                <div className="flex justify-between"><dt className="text-on-surface-variant">Subtotal</dt><dd className="text-on-surface-variant">${sale.subtotal.toFixed(2)}</dd></div>
                {sale.discountAmount > 0 && <div className="flex justify-between text-success-600"><dt>Discount</dt><dd>- ${sale.discountAmount.toFixed(2)}</dd></div>}
                <div className="flex justify-between font-semibold text-sm text-on-surface"><dt>Total paid</dt><dd>${sale.totalAmount.toFixed(2)}</dd></div>
              </dl>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
