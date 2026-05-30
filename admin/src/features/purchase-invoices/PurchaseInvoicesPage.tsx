import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { Part, PurchaseInvoice, Vendor } from "../../app/types";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { StatCard } from "../../shared/components/StatCard";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { Badge } from "../../shared/components/Badge";
import { Modal } from "../../shared/components/Modal";
import { Toolbar } from "../../shared/components/Toolbar";
import { SearchInput } from "../../shared/components/SearchInput";
import { EmptyState } from "../../shared/components/EmptyState";
import { FormSection } from "../../shared/components/FormSection";

type DraftInvoiceItem = {
  id: number;
  partId: string;
  quantity: string;
  unitCost: string;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const numberFormatter = new Intl.NumberFormat("en-US");
const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatNumber = (value: number) => numberFormatter.format(value);

const extractErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

const createDraftItem = (id: number): DraftInvoiceItem => ({
  id,
  partId: "",
  quantity: "1",
  unitCost: "",
});

export function PurchaseInvoicesPage() {
  const { token } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form (modal) state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [vendorId, setVendorId] = useState("");
  const [status, setStatus] = useState("Completed");
  const [items, setItems] = useState<DraftInvoiceItem[]>([createDraftItem(1)]);
  const [nextItemId, setNextItemId] = useState(2);

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    let isActive = true;
    setIsLoading(true);

    void Promise.all([
      api.getVendors(token),
      api.getParts(token),
      api.getPurchaseInvoices(token),
    ])
      .then(([vendorsResponse, partsResponse, invoicesResponse]) => {
        if (!isActive) return;
        setVendors(vendorsResponse);
        setParts(partsResponse);
        setPurchaseInvoices(invoicesResponse);
        setPageError(null);
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setPageError(extractErrorMessage(error, "Could not load purchase invoices."));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  const totalPurchaseSpend = useMemo(
    () => purchaseInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    [purchaseInvoices],
  );
  const draftTotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const qty = Number(item.quantity);
        const cost = Number(item.unitCost);
        return Number.isFinite(qty) && Number.isFinite(cost) ? sum + qty * cost : sum;
      }, 0),
    [items],
  );

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return purchaseInvoices;
    return purchaseInvoices.filter((invoice) => {
      const haystack = [
        invoice.invoiceNumber,
        invoice.vendorName,
        invoice.status,
        invoice.createdByName,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [purchaseInvoices, search]);

  const resetForm = () => {
    setVendorId("");
    setStatus("Completed");
    setItems([createDraftItem(1)]);
    setNextItemId(2);
    setPageError(null);
  };

  const openForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isCreating) return;
    setIsFormOpen(false);
    resetForm();
  };

  const updateItem = (
    id: number,
    field: keyof Omit<DraftInvoiceItem, "id">,
    value: string,
  ) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    );
  const addItem = () => {
    setItems((prev) => [...prev, createDraftItem(nextItemId)]);
    setNextItemId((id) => id + 1);
  };
  const removeItem = (id: number) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((i) => i.id !== id)));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedVendorId = Number(vendorId);
    if (!Number.isInteger(parsedVendorId) || parsedVendorId <= 0) {
      const msg = "Choose a vendor before creating the purchase invoice.";
      setPageError(msg);
      toast.error(msg);
      return;
    }
    const normalizedItems = items.map((i) => ({
      partId: Number(i.partId),
      quantity: Number(i.quantity),
      unitCost: Number(i.unitCost),
    }));
    const invalid = normalizedItems.find(
      (i) =>
        !Number.isInteger(i.partId) ||
        i.partId <= 0 ||
        !Number.isInteger(i.quantity) ||
        i.quantity <= 0 ||
        !Number.isFinite(i.unitCost) ||
        i.unitCost < 0,
    );
    if (invalid) {
      const msg = "Each line needs a part, quantity > 0, and a valid unit cost.";
      setPageError(msg);
      toast.error(msg);
      return;
    }
    if (!token) return;
    try {
      setIsCreating(true);
      setPageError(null);
      await api.createPurchaseInvoice(token, {
        vendorId: parsedVendorId,
        status: status.trim() || undefined,
        items: normalizedItems,
      });
      const [partsResponse, invoicesResponse] = await Promise.all([
        api.getParts(token),
        api.getPurchaseInvoices(token),
      ]);
      setParts(partsResponse);
      setPurchaseInvoices(invoicesResponse);
      toast.success("Purchase invoice recorded");
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      const msg = extractErrorMessage(error, "Could not create the purchase invoice.");
      setPageError(msg);
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

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
        title="Purchase invoices"
        description="Record vendor stock receipts and update inventory levels."
        actions={
          <ActionButton icon={Plus} onClick={openForm}>
            New invoice
          </ActionButton>
        }
      />

      {pageError && !isFormOpen ? (
        <AlertBox tone="error" message={pageError} dismissible />
      ) : null}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total invoices"
          value={formatNumber(purchaseInvoices.length)}
          note="All recorded"
          accent
        />
        <StatCard
          label="Purchase spend"
          value={formatCurrency(totalPurchaseSpend)}
          note="Lifetime cost"
        />
        <StatCard
          label="Vendors"
          value={formatNumber(vendors.length)}
          note="Available suppliers"
        />
        <StatCard
          label="Last 30 days"
          value={formatNumber(
            purchaseInvoices.filter(
              (inv) =>
                Date.now() - new Date(inv.invoiceDate).getTime() <
                30 * 24 * 60 * 60 * 1000,
            ).length,
          )}
          note="Recent invoices"
        />
      </div>

      <Card bodyless>
        <div className="px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)]">
          <Toolbar
            leading={
              <div className="w-full sm:w-72">
                <SearchInput
                  size="sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search invoice, vendor"
                  onClear={() => setSearch("")}
                />
              </div>
            }
          />
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-5">
            <EmptyState
              embedded
              icon={FileText}
              title={
                purchaseInvoices.length === 0
                  ? "No invoices yet"
                  : "No matches"
              }
              description={
                purchaseInvoices.length === 0
                  ? "Record your first vendor receipt to start tracking purchases."
                  : "Try a different search term."
              }
              action={
                purchaseInvoices.length === 0 ? (
                  <ActionButton icon={Plus} onClick={openForm}>
                    New invoice
                  </ActionButton>
                ) : null
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-[var(--md-sys-color-outline-variant)]">
            {filteredInvoices.map((invoice) => (
              <li key={invoice.purchaseInvoiceId} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                        {invoice.invoiceNumber}
                      </h3>
                      <Badge variant="brand">{invoice.status}</Badge>
                    </div>
                    <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular mt-0.5">
                      {invoice.vendorName} ·{" "}
                      {new Date(invoice.invoiceDate).toLocaleDateString()} ·{" "}
                      {formatNumber(invoice.items.length)} item
                      {invoice.items.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-[var(--md-sys-color-on-surface)] tabular">
                      {formatCurrency(invoice.totalAmount)}
                    </p>
                    <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                      by {invoice.createdByName}
                    </p>
                  </div>
                </div>
                <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                  {invoice.items.map((item) => (
                    <li
                      key={item.purchaseInvoiceItemId}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]"
                    >
                      <div className="min-w-0">
                        <p className="text-[var(--md-sys-color-on-surface)] truncate font-medium">
                          {item.partName}
                        </p>
                        <p className="text-[var(--md-sys-color-on-surface-variant)] truncate">
                          <span className="font-mono">{item.partNumber}</span>
                          {" · "}qty {formatNumber(item.quantity)} ·{" "}
                          {formatCurrency(item.unitCost)}
                        </p>
                      </div>
                      <span className="font-semibold tabular text-[var(--md-sys-color-on-surface)] shrink-0">
                        {formatCurrency(item.lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={isFormOpen}
        onClose={closeForm}
        size="xl"
        title="New purchase invoice"
        description="Each line increases stock for the selected part."
        footer={
          <>
            <ActionButton tone="secondary" onClick={closeForm} disabled={isCreating}>
              Cancel
            </ActionButton>
            <ActionButton
              type="submit"
              form="purchase-invoice-form"
              isLoading={isCreating}
            >
              Create invoice
            </ActionButton>
          </>
        }
      >
        <form
          id="purchase-invoice-form"
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {pageError ? <AlertBox tone="error" message={pageError} dismissible /> : null}

          <FormSection title="Header">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Vendor" required htmlFor="pi-vendor">
                <select
                  id="pi-vendor"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                >
                  <option value="">Choose a vendor</option>
                  {vendors.map((v) => (
                    <option key={v.vendorId} value={v.vendorId}>
                      {v.vendorName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Status"
                hint="Completed invoices are included in financial reports."
                htmlFor="pi-status"
              >
                <input
                  id="pi-status"
                  type="text"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="Completed"
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title={`Line items (${items.length})`}>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--md-sys-color-on-surface-variant)]">
                      Line {idx + 1}
                    </h4>
                    <ActionButton
                      type="button"
                      tone="ghost"
                      size="sm"
                      icon={Trash2}
                      disabled={items.length === 1}
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </ActionButton>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Part" htmlFor={`pi-part-${item.id}`}>
                      <select
                        id={`pi-part-${item.id}`}
                        value={item.partId}
                        onChange={(e) => updateItem(item.id, "partId", e.target.value)}
                      >
                        <option value="">Choose a part</option>
                        {parts.map((p) => (
                          <option key={p.partId} value={p.partId}>
                            {p.partName} ({p.partNumber})
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Quantity" htmlFor={`pi-qty-${item.id}`}>
                      <input
                        id={`pi-qty-${item.id}`}
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                      />
                    </Field>
                    <Field label="Unit cost" htmlFor={`pi-cost-${item.id}`}>
                      <input
                        id={`pi-cost-${item.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitCost}
                        onChange={(e) => updateItem(item.id, "unitCost", e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
            <ActionButton
              type="button"
              tone="secondary"
              size="sm"
              icon={Plus}
              onClick={addItem}
            >
              Add line
            </ActionButton>
          </FormSection>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
            <span className="text-[11px] uppercase tracking-[0.06em] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
              Draft total
            </span>
            <span className="text-base font-semibold text-[var(--md-sys-color-on-surface)] tabular">
              {formatCurrency(draftTotal)}
            </span>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
