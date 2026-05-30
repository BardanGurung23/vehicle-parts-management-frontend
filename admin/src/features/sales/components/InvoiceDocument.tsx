import type { Sale } from "../../../app/types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatInvoiceCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function getInvoiceStatusClasses(paymentStatus: string) {
  if (paymentStatus === "Paid") {
    return "bg-[var(--success-50)] text-[var(--success-700)] border border-[var(--success-100)]";
  }
  if (paymentStatus === "Credit") {
    return "bg-[var(--warning-50)] text-[var(--warning-700)] border border-[var(--warning-100)]";
  }
  return "bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]";
}

type InvoiceDocumentProps = {
  sale: Sale;
  fallbackCustomerEmail?: string | null;
  contextNote?: string;
  className?: string;
};

/**
 * InvoiceDocument — printable invoice surface used by the detail page,
 * the customer report dialog, and the PDF export.
 *
 * The component is theme-aware (uses semantic tokens) so the same markup
 * works in both light and dark modes and is safe to print.
 */
export function InvoiceDocument({
  sale,
  fallbackCustomerEmail,
  contextNote = "Invoice generated from the active sales workflow.",
  className,
}: InvoiceDocumentProps) {
  return (
    <div
      className={[
        "overflow-hidden rounded-lg",
        "bg-[var(--md-sys-color-surface)]",
        "border border-[var(--md-sys-color-outline-variant)]",
        "text-[var(--md-sys-color-on-surface)]",
        "shadow-level1",
        className ?? "",
      ].join(" ")}
    >
      {/* Header */}
      <div className="border-b border-[var(--md-sys-color-outline-variant)] px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--md-sys-color-primary)]">
              Autonix
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Invoice
            </h2>
            <p className="mt-1 text-[13px] text-[var(--md-sys-color-on-surface-variant)]">
              Parts and service summary
            </p>
          </div>

          <dl className="space-y-2 text-[13px] lg:min-w-[280px]">
            <RowItem label="Invoice #" value={sale.invoiceNumber} tabular />
            <RowItem
              label="Issued"
              value={new Date(sale.saleDate).toLocaleDateString()}
            />
            <div className="flex justify-between gap-6 items-center">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Status</span>
              <span
                className={`inline-flex rounded-full px-3 py-0.5 text-[11px] font-semibold ${getInvoiceStatusClasses(sale.paymentStatus)}`}
              >
                {sale.paymentStatus}
              </span>
            </div>
          </dl>
        </div>
      </div>

      {/* Bill / Vehicle / Payment */}
      <div className="grid gap-5 border-b border-[var(--md-sys-color-outline-variant)] px-6 py-5 sm:px-8 sm:py-6 sm:grid-cols-3">
        <SummaryColumn label="Bill to">
          <p className="text-[14px] font-semibold text-[var(--md-sys-color-on-surface)] break-words">
            {sale.customerName}
          </p>
          <p className="mt-1 text-[12px] text-[var(--md-sys-color-on-surface-variant)] break-words">
            {sale.customerEmail ?? fallbackCustomerEmail ?? "No email on file"}
          </p>
        </SummaryColumn>
        <SummaryColumn label="Vehicle">
          <p className="text-[14px] font-semibold text-[var(--md-sys-color-on-surface)] tabular">
            {sale.vehicleNumber ?? "Not specified"}
          </p>
          <p className="mt-1 text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
            {contextNote}
          </p>
        </SummaryColumn>
        <SummaryColumn label="Payment">
          <p className="text-[14px] font-semibold text-[var(--md-sys-color-on-surface)]">
            {sale.paymentStatus}
          </p>
          <p className="mt-1 text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
            {sale.dueDate
              ? `Due ${new Date(sale.dueDate).toLocaleDateString()}`
              : "No due date"}
          </p>
        </SummaryColumn>
      </div>

      {/* Items */}
      <div className="px-6 py-6 sm:px-8 sm:py-7">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.06em] text-[var(--md-sys-color-on-surface-variant)]">
                <th className="border-b border-[var(--md-sys-color-outline-variant)] px-4 py-3 text-left font-semibold">
                  Part
                </th>
                <th className="border-b border-[var(--md-sys-color-outline-variant)] px-4 py-3 text-right font-semibold whitespace-nowrap">
                  Qty
                </th>
                <th className="border-b border-[var(--md-sys-color-outline-variant)] px-4 py-3 text-right font-semibold whitespace-nowrap">
                  Unit price
                </th>
                <th className="border-b border-[var(--md-sys-color-outline-variant)] px-4 py-3 text-right font-semibold whitespace-nowrap">
                  Line total
                </th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => {
                const lineTotal = item.lineTotal ?? item.unitPrice * item.quantity;
                return (
                  <tr key={`${sale.saleId}-${item.partId}`}>
                    <td className="border-b border-[var(--md-sys-color-outline-variant)] px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]">
                      {item.partName}
                    </td>
                    <td className="border-b border-[var(--md-sys-color-outline-variant)] px-4 py-3 text-right text-[var(--md-sys-color-on-surface)] tabular whitespace-nowrap">
                      {item.quantity}
                    </td>
                    <td className="border-b border-[var(--md-sys-color-outline-variant)] px-4 py-3 text-right text-[var(--md-sys-color-on-surface)] tabular whitespace-nowrap">
                      {formatInvoiceCurrency(item.unitPrice)}
                    </td>
                    <td className="border-b border-[var(--md-sys-color-outline-variant)] px-4 py-3 text-right font-semibold text-[var(--md-sys-color-on-surface)] tabular whitespace-nowrap">
                      {formatInvoiceCurrency(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notes + totals */}
        <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="lg:max-w-md space-y-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
              Notes
            </p>
            <p className="text-[13px] leading-6 text-[var(--md-sys-color-on-surface)]">
              {sale.notes ?? "No additional notes."}
            </p>
          </div>

          <div className="w-full lg:max-w-sm rounded-md bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] p-5">
            <dl className="space-y-2.5 text-[13px]">
              <RowItem label="Subtotal" value={formatInvoiceCurrency(sale.subtotal)} tabular />
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--md-sys-color-on-surface-variant)]">Discount</dt>
                <dd
                  className={`tabular ${
                    sale.discountAmount > 0
                      ? "text-[var(--success-700)]"
                      : "text-[var(--md-sys-color-on-surface)]"
                  }`}
                >
                  {sale.discountAmount > 0
                    ? `− ${formatInvoiceCurrency(sale.discountAmount)}`
                    : formatInvoiceCurrency(0)}
                </dd>
              </div>
              <RowItem label="Payment" value={sale.paymentStatus} />
              {sale.dueDate ? (
                <RowItem
                  label="Due"
                  value={new Date(sale.dueDate).toLocaleDateString()}
                  tabular
                />
              ) : null}
              <div className="flex items-center justify-between gap-4 border-t border-[var(--md-sys-color-outline-variant)] pt-3">
                <dt className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
                  {sale.paymentStatus === "Paid" ? "Total paid" : "Invoice total"}
                </dt>
                <dd className="text-[18px] font-semibold text-[var(--md-sys-color-on-surface)] tabular">
                  {formatInvoiceCurrency(sale.totalAmount)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryColumn({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function RowItem({
  label,
  value,
  tabular,
}: {
  label: string;
  value: React.ReactNode;
  tabular?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-[var(--md-sys-color-on-surface-variant)]">{label}</span>
      <span
        className={`text-[var(--md-sys-color-on-surface)] font-medium ${tabular ? "tabular" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
