import { useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2, Building2 } from "lucide-react";
import { toast } from "react-toastify";
import { useGetAllVendorsQuery } from "../../redux/services/vendors";
import { useGetPartsQuery } from "../../redux/services/parts";
import { useCreatePurchaseInvoiceMutation, useGetPurchaseInvoicesQuery } from "../../redux/services/purchaseInvoices";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { StatCard } from "../../shared/components/StatCard";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { Badge } from "../../shared/components/Badge";

type DraftInvoiceItem = {
  id: number;
  partId: string;
  quantity: string;
  unitCost: string;
};

type RtqErrorShape = { data?: unknown };

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const numberFormatter = new Intl.NumberFormat("en-US");
function formatCurrency(value: number) { return currencyFormatter.format(value); }
function formatNumber(value: number) { return numberFormatter.format(value); }
function asMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
function extractErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") return fallback;
  const payload = error as RtqErrorShape;
  const body = payload.data;
  if (!body || typeof body !== "object") return fallback;
  const details = body as { detail?: unknown; title?: unknown; message?: unknown };
  return asMessage(details.detail) ?? asMessage(details.message) ?? asMessage(details.title) ?? fallback;
}
function createDraftItem(id: number): DraftInvoiceItem {
  return { id, partId: "", quantity: "1", unitCost: "" };
}

export function PurchaseInvoicesPage() {
  const { data: vendors = [], isLoading: vendorsLoading } = useGetAllVendorsQuery();
  const { data: parts = [], isLoading: partsLoading } = useGetPartsQuery();
  const { data: purchaseInvoices = [], isLoading: invoicesLoading } = useGetPurchaseInvoicesQuery();
  const [createPurchaseInvoice, { isLoading: isCreating }] = useCreatePurchaseInvoiceMutation();
  const [vendorId, setVendorId] = useState("");
  const [status, setStatus] = useState("Completed");
  const [pageError, setPageError] = useState<string | null>(null);
  const [nextItemId, setNextItemId] = useState(2);
  const [items, setItems] = useState<DraftInvoiceItem[]>([createDraftItem(1)]);

  const totalPurchaseSpend = useMemo(
    () => purchaseInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    [purchaseInvoices],
  );
  const draftTotal = useMemo(
    () => items.reduce((sum, item) => {
      const qty = Number(item.quantity);
      const cost = Number(item.unitCost);
      return Number.isFinite(qty) && Number.isFinite(cost) ? sum + qty * cost : sum;
    }, 0),
    [items],
  );

  const resetForm = () => { setVendorId(""); setStatus("Completed"); setItems([createDraftItem(1)]); setNextItemId(2); setPageError(null); };
  const updateItem = (id: number, field: keyof Omit<DraftInvoiceItem, "id">, value: string) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  const addItem = () => { setItems((prev) => [...prev, createDraftItem(nextItemId)]); setNextItemId((id) => id + 1); };
  const removeItem = (id: number) => setItems((prev) => (prev.length === 1 ? prev : prev.filter((i) => i.id !== id)));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedVendorId = Number(vendorId);
    if (!Number.isInteger(parsedVendorId) || parsedVendorId <= 0) {
      const msg = "Choose a vendor before creating the purchase invoice.";
      setPageError(msg); toast.error(msg); return;
    }
    const normalizedItems = items.map((i) => ({ partId: Number(i.partId), quantity: Number(i.quantity), unitCost: Number(i.unitCost) }));
    const invalid = normalizedItems.find((i) => !Number.isInteger(i.partId) || i.partId <= 0 || !Number.isInteger(i.quantity) || i.quantity <= 0 || !Number.isFinite(i.unitCost) || i.unitCost < 0);
    if (invalid) {
      const msg = "Each line item must include a part, quantity > 0, and valid unit cost.";
      setPageError(msg); toast.error(msg); return;
    }
    try {
      setPageError(null);
      await createPurchaseInvoice({ vendorId: parsedVendorId, status: status.trim() || undefined, items: normalizedItems }).unwrap();
      toast.success("Purchase invoice created and stock updated.");
      resetForm();
    } catch (error) {
      const msg = extractErrorMessage(error, "Could not create the purchase invoice.");
      setPageError(msg); toast.error(msg);
    }
  };

  if (vendorsLoading || partsLoading || invoicesLoading) {
    return <PageShell><SkeletonCard /></PageShell>;
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Admin Finance"
        title="Purchase Invoices"
        description="Record vendor stock receipts and increase inventory."
      />

      {pageError ? <AlertBox tone="error" message={pageError} dismissible /> : null}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total invoices" value={formatNumber(purchaseInvoices.length)} note="All recorded invoices." />
        <StatCard label="Purchase spend" value={formatCurrency(totalPurchaseSpend)} note="Total cost of all invoices." />
        <StatCard label="Vendors" value={formatNumber(vendors.length)} note="Available suppliers." />
        <StatCard label="Draft total" value={formatCurrency(draftTotal)} note="Current draft estimate." accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[24rem_1fr] gap-6 items-start">
        <Card
          header={
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">New Purchase Invoice</p>
              <h2 className="text-base font-semibold text-on-surface mt-1">Capture vendor stock updates</h2>
              <p className="text-sm text-on-surface-variant">Each invoice increases stock for selected parts.</p>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Vendor" required htmlFor="pi-vendor">
              <select id="pi-vendor" className="input" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                <option value="">Choose a vendor</option>
                {vendors.map((v) => <option key={v.vendorId} value={v.vendorId}>{v.vendorName}</option>)}
              </select>
            </Field>
            <Field label="Status" hint="Completed invoices are included in financial reports." htmlFor="pi-status">
              <input id="pi-status" className="input" type="text" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Completed" />
            </Field>

            <div className="pt-2 border-t border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">Invoice Items</p>
                  <p className="text-sm text-on-surface-variant">{items.length} line item{items.length === 1 ? "" : "s"}</p>
                </div>
                <ActionButton type="button" tone="secondary" size="sm" icon={Plus} onClick={addItem}>Add line item</ActionButton>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={item.id} className="rounded-lg ring-1 ring-white/[0.06] p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-on-surface">Line {idx + 1}</h3>
                      <ActionButton type="button" tone="secondary" size="sm" icon={Trash2} disabled={items.length === 1} onClick={() => removeItem(item.id)}>Remove</ActionButton>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Part" htmlFor={`pi-part-${item.id}`}>
                        <select id={`pi-part-${item.id}`} className="input" value={item.partId} onChange={(e) => updateItem(item.id, "partId", e.target.value)}>
                          <option value="">Choose</option>
                          {parts.map((p) => <option key={p.partId} value={p.partId}>{p.partName} ({p.partNumber})</option>)}
                        </select>
                      </Field>
                      <Field label="Quantity" htmlFor={`pi-qty-${item.id}`}>
                        <input id={`pi-qty-${item.id}`} className="input" type="number" min="1" step="1" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", e.target.value)} />
                      </Field>
                      <Field label="Unit cost" htmlFor={`pi-cost-${item.id}`}>
                        <input id={`pi-cost-${item.id}`} className="input" type="number" min="0" step="0.01" value={item.unitCost} onChange={(e) => updateItem(item.id, "unitCost", e.target.value)} />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Draft total</p>
                <p className="text-lg font-bold text-on-surface">{formatCurrency(draftTotal)}</p>
              </div>
              <ActionButton type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create invoice"}
              </ActionButton>
            </div>
          </form>
        </Card>

        <Card
          header={
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Recent Purchase Invoices</p>
              <h2 className="text-base font-semibold text-on-surface mt-1">
                {purchaseInvoices.length === 0 ? "No invoices recorded yet" : "Latest vendor stock updates"}
              </h2>
              <p className="text-sm text-on-surface-variant">
                {purchaseInvoices.length === 0
                  ? "Create your first purchase invoice to start tracking vendor receipts."
                  : `Review ${purchaseInvoices.length} purchase invoice${purchaseInvoices.length === 1 ? "" : "s"}.`}
              </p>
            </div>
          }
        >
          {purchaseInvoices.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-8">No purchase invoices are available yet.</p>
          ) : (
            <div className="space-y-3">
              {purchaseInvoices.map((invoice) => (
                <div key={invoice.purchaseInvoiceId} className="rounded-lg ring-1 ring-white/[0.06] p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-on-surface">{invoice.invoiceNumber}</h3>
                        <Badge>{invoice.status}</Badge>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {invoice.vendorName} / {new Date(invoice.invoiceDate).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-on-surface-variant">Total</span>
                      <p className="font-semibold text-on-surface">{formatCurrency(invoice.totalAmount)}</p>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">Created by</span>
                      <p className="font-semibold text-on-surface">{invoice.createdByName}</p>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">Items</span>
                      <p className="font-semibold text-on-surface">{formatNumber(invoice.items.length)}</p>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-2 space-y-2">
                    {invoice.items.map((item) => (
                      <div key={item.purchaseInvoiceItemId} className="grid grid-cols-4 gap-3 text-xs bg-surface-container-low/50 rounded-lg p-2">
                        <div className="col-span-1">
                          <p className="font-medium text-on-surface">{item.partName}</p>
                          <p className="text-on-surface-variant">{item.partNumber}</p>
                        </div>
                        <div>
                          <span className="text-on-surface-variant">Qty</span>
                          <p className="font-medium text-on-surface">{formatNumber(item.quantity)}</p>
                        </div>
                        <div>
                          <span className="text-on-surface-variant">Unit cost</span>
                          <p className="font-medium text-on-surface">{formatCurrency(item.unitCost)}</p>
                        </div>
                        <div>
                          <span className="text-on-surface-variant">Total</span>
                          <p className="font-medium text-on-surface">{formatCurrency(item.lineTotal)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
