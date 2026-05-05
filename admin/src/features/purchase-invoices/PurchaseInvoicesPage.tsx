import { useMemo, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { useGetAllVendorsQuery } from "../../redux/services/vendors";
import { useGetPartsQuery } from "../../redux/services/parts";
import { useCreatePurchaseInvoiceMutation, useGetPurchaseInvoicesQuery } from "../../redux/services/purchaseInvoices";
import { AlertBox } from "../../shared/components/AlertBox";
import { ActionButton } from "../../shared/components/ActionButton";
import { Field } from "../../shared/components/Field";
import { LoadingScreen } from "../../shared/components/LoadingScreen";

type DraftInvoiceItem = {
  id: number;
  partId: string;
  quantity: string;
  unitCost: string;
};

type RtqErrorShape = {
  data?: unknown;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US");

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function asMessage(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const payload = error as RtqErrorShape;
  const body = payload.data;
  if (!body || typeof body !== "object") {
    return fallback;
  }

  const details = body as { detail?: unknown; title?: unknown; message?: unknown };
  return asMessage(details.detail) ?? asMessage(details.message) ?? asMessage(details.title) ?? fallback;
}

function createDraftItem(id: number): DraftInvoiceItem {
  return {
    id,
    partId: "",
    quantity: "1",
    unitCost: "",
  };
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
    () => purchaseInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
    [purchaseInvoices],
  );

  const draftTotal = useMemo(
    () => items.reduce((sum, item) => {
      const quantity = Number(item.quantity);
      const unitCost = Number(item.unitCost);
      if (!Number.isFinite(quantity) || !Number.isFinite(unitCost)) {
        return sum;
      }

      return sum + quantity * unitCost;
    }, 0),
    [items],
  );

  const resetForm = () => {
    setVendorId("");
    setStatus("Completed");
    setItems([createDraftItem(1)]);
    setNextItemId(2);
    setPageError(null);
  };

  const updateItem = (id: number, field: keyof Omit<DraftInvoiceItem, "id">, value: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const addItem = () => {
    setItems((current) => [...current, createDraftItem(nextItemId)]);
    setNextItemId((current) => current + 1);
  };

  const removeItem = (id: number) => {
    setItems((current) => (current.length === 1 ? current : current.filter((item) => item.id !== id)));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedVendorId = Number(vendorId);
    if (!Number.isInteger(parsedVendorId) || parsedVendorId <= 0) {
      const message = "Choose a vendor before creating the purchase invoice.";
      setPageError(message);
      toast.error(message);
      return;
    }

    const normalizedItems = items.map((item) => ({
      partId: Number(item.partId),
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
    }));

    const invalidItem = normalizedItems.find(
      (item) => !Number.isInteger(item.partId)
        || item.partId <= 0
        || !Number.isInteger(item.quantity)
        || item.quantity <= 0
        || !Number.isFinite(item.unitCost)
        || item.unitCost < 0,
    );

    if (invalidItem) {
      const message = "Each line item must include a part, a quantity greater than zero, and a valid unit cost.";
      setPageError(message);
      toast.error(message);
      return;
    }

    try {
      setPageError(null);
      await createPurchaseInvoice({
        vendorId: parsedVendorId,
        status: status.trim() || undefined,
        items: normalizedItems,
      }).unwrap();

      toast.success("Purchase invoice created and stock updated.");
      resetForm();
    } catch (error) {
      const message = extractErrorMessage(error, "Could not create the purchase invoice.");
      setPageError(message);
      toast.error(message);
    }
  };

  if (vendorsLoading || partsLoading || invoicesLoading) {
    return <LoadingScreen message="Loading purchase invoice workspace..." />;
  }

  return (
    <section className="page-stack">
      {pageError ? <AlertBox tone="error" message={pageError} /> : null}

      <article className="card parts-overview">
        <div className="parts-overview__top">
          <div className="card__header">
            <p className="eyebrow">Admin Finance</p>
            <h2>Record inbound stock from vendors</h2>
            <p className="card__copy">
              Create purchase invoices, update part stock automatically, and keep a recent view of vendor-supplied inventory movements.
            </p>
          </div>
        </div>

        <dl className="parts-stats">
          <div>
            <dt>Total invoices</dt>
            <dd>{formatNumber(purchaseInvoices.length)}</dd>
          </div>
          <div>
            <dt>Total purchase spend</dt>
            <dd>{formatCurrency(totalPurchaseSpend)}</dd>
          </div>
          <div>
            <dt>Available vendors</dt>
            <dd>{formatNumber(vendors.length)}</dd>
          </div>
          <div>
            <dt>Draft total</dt>
            <dd>{formatCurrency(draftTotal)}</dd>
          </div>
        </dl>
      </article>

      <div className="parts-layout">
        <article className="card parts-form-card">
          <div className="card__header">
            <p className="eyebrow">New Purchase Invoice</p>
            <h2>Capture vendor stock updates</h2>
            <p className="card__copy">
              Each submitted invoice increases stock for the selected parts using the purchased quantities.
            </p>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <Field label="Vendor">
              <select className="input" value={vendorId} onChange={(event) => setVendorId(event.target.value)}>
                <option value="">Choose a vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.vendorId} value={vendor.vendorId}>
                    {vendor.vendorName}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Status" hint="Completed invoices are included in financial reports.">
              <input
                className="input"
                type="text"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                placeholder="Completed"
              />
            </Field>

            <div className="form-grid__full-width dashboard-panel__section">
              <div className="parts-list-card__header">
                <div className="card__header">
                  <p className="eyebrow">Invoice Items</p>
                  <h2>{items.length === 1 ? "1 line item" : `${items.length} line items`}</h2>
                  <p className="card__copy">Select the parts received from the vendor and the unit cost for each line.</p>
                </div>

                <ActionButton type="button" tone="secondary" onClick={addItem}>
                  Add line item
                </ActionButton>
              </div>

              <div className="staff-user-list">
                {items.map((item, index) => (
                  <article key={item.id} className="staff-user-card">
                    <div className="staff-user-card__top">
                      <div className="staff-user-card__identity">
                        <h3>Line {index + 1}</h3>
                        <p>Choose a part, quantity, and unit cost.</p>
                      </div>

                      <ActionButton
                        type="button"
                        tone="secondary"
                        disabled={items.length === 1}
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </ActionButton>
                    </div>

                    <div className="form-grid form-grid--three-columns">
                      <Field label="Part">
                        <select className="input" value={item.partId} onChange={(event) => updateItem(item.id, "partId", event.target.value)}>
                          <option value="">Choose a part</option>
                          {parts.map((part) => (
                            <option key={part.partId} value={part.partId}>
                              {part.partName} ({part.partNumber})
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Quantity">
                        <input
                          className="input"
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(event) => updateItem(item.id, "quantity", event.target.value)}
                        />
                      </Field>

                      <Field label="Unit cost">
                        <input
                          className="input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(event) => updateItem(item.id, "unitCost", event.target.value)}
                        />
                      </Field>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="form-grid__full-width parts-list-card__header">
              <div className="card__header">
                <p className="eyebrow">Draft Summary</p>
                <h2>{formatCurrency(draftTotal)}</h2>
                <p className="card__copy">This total is calculated from the current draft line items.</p>
              </div>

              <ActionButton type="submit" disabled={isCreating}>
                {isCreating ? "Creating invoice..." : "Create purchase invoice"}
              </ActionButton>
            </div>
          </form>
        </article>

        <section className="card parts-list-card">
          <div className="parts-list-card__header">
            <div className="card__header">
              <p className="eyebrow">Recent Purchase Invoices</p>
              <h2>{purchaseInvoices.length === 0 ? "No invoices recorded yet" : "Latest vendor stock updates"}</h2>
              <p className="card__copy">
                {purchaseInvoices.length === 0
                  ? "Create your first purchase invoice to start tracking vendor receipts."
                  : "Review recently created purchase invoices and the parts received in each batch."}
              </p>
            </div>
          </div>

          {purchaseInvoices.length === 0 ? (
            <p className="empty-state">No purchase invoices are available yet.</p>
          ) : (
            <div className="parts-list">
              {purchaseInvoices.map((invoice) => (
                <article key={invoice.purchaseInvoiceId} className="parts-item-card">
                  <div className="parts-item-card__top">
                    <div className="parts-item-card__identity">
                      <div className="parts-item-card__title-row">
                        <h3>{invoice.invoiceNumber}</h3>
                        <span className="status-pill">{invoice.status}</span>
                      </div>
                      <p className="parts-item-card__subtitle">
                        <span>{invoice.vendorName}</span>
                        <span aria-hidden="true">/</span>
                        <span>{new Date(invoice.invoiceDate).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>

                  <dl className="parts-item-card__meta">
                    <div>
                      <dt>Total amount</dt>
                      <dd>{formatCurrency(invoice.totalAmount)}</dd>
                    </div>
                    <div>
                      <dt>Created by</dt>
                      <dd>{invoice.createdByName}</dd>
                    </div>
                    <div>
                      <dt>Items</dt>
                      <dd>{formatNumber(invoice.items.length)}</dd>
                    </div>
                  </dl>

                  <div className="dashboard-panel__section">
                    <ul className="detail-list">
                      {invoice.items.map((item) => (
                        <li key={item.purchaseInvoiceItemId} className="staff-user-card__meta">
                          <div>
                            <dt>{item.partName}</dt>
                            <dd>{item.partNumber}</dd>
                          </div>
                          <div>
                            <dt>Quantity</dt>
                            <dd>{formatNumber(item.quantity)}</dd>
                          </div>
                          <div>
                            <dt>Unit cost</dt>
                            <dd>{formatCurrency(item.unitCost)}</dd>
                          </div>
                          <div>
                            <dt>Line total</dt>
                            <dd>{formatCurrency(item.lineTotal)}</dd>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}