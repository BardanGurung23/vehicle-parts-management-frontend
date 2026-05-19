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
    return "bg-emerald-100 text-emerald-700";
  }

  if (paymentStatus === "Credit") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-200 text-slate-700";
}

type InvoiceDocumentProps = {
  sale: Sale;
  fallbackCustomerEmail?: string | null;
  contextNote?: string;
  className?: string;
};

export function InvoiceDocument({
  sale,
  fallbackCustomerEmail,
  contextNote = "Invoice created through the active sales workflow.",
  className,
}: InvoiceDocumentProps) {
  return (
    <div className={`overflow-hidden rounded-[28px] bg-white text-slate-900 shadow-level2${className ? ` ${className}` : ""}`}>
      <div className="border-b border-slate-200 px-8 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Autonix</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Invoice</h2>
            <p className="mt-2 text-sm text-slate-500">Parts and service sale summary</p>
          </div>

          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between gap-6">
              <span className="font-medium text-slate-500">Invoice #</span>
              <span className="font-semibold text-slate-900">{sale.invoiceNumber}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="font-medium text-slate-500">Issued</span>
              <span className="text-slate-900">{new Date(sale.saleDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="font-medium text-slate-500">Status</span>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getInvoiceStatusClasses(sale.paymentStatus)}`}>
                {sale.paymentStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-b border-slate-200 px-8 py-6 md:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Bill To</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">{sale.customerName}</p>
          <p className="mt-1 text-sm text-slate-500">{sale.customerEmail ?? fallbackCustomerEmail ?? "No email on file"}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Vehicle</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">{sale.vehicleNumber ?? "Not specified"}</p>
          <p className="mt-1 text-sm text-slate-500">{contextNote}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Payment</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">{sale.paymentStatus}</p>
          <p className="mt-1 text-sm text-slate-500">
            {sale.dueDate ? `Due ${new Date(sale.dueDate).toLocaleDateString()}` : "No due date required"}
          </p>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="border-b border-slate-200 px-4 py-3 font-medium">Part</th>
                <th className="border-b border-slate-200 px-4 py-3 font-medium text-right">Qty</th>
                <th className="border-b border-slate-200 px-4 py-3 font-medium text-right">Unit Price</th>
                <th className="border-b border-slate-200 px-4 py-3 font-medium text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => {
                const lineTotal = item.lineTotal ?? item.unitPrice * item.quantity;

                return (
                  <tr key={`${sale.saleId}-${item.partId}`}>
                    <td className="border-b border-slate-100 px-4 py-4 font-medium text-slate-900">{item.partName}</td>
                    <td className="border-b border-slate-100 px-4 py-4 text-right text-slate-600">{item.quantity}</td>
                    <td className="border-b border-slate-100 px-4 py-4 text-right text-slate-600">{formatInvoiceCurrency(item.unitPrice)}</td>
                    <td className="border-b border-slate-100 px-4 py-4 text-right font-medium text-slate-900">{formatInvoiceCurrency(lineTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Notes</p>
            <p className="text-sm leading-6 text-slate-600">{sale.notes ?? "No additional notes were added to this invoice."}</p>
          </div>

          <div className="w-full max-w-sm rounded-2xl bg-slate-100 p-5">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">{formatInvoiceCurrency(sale.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Discount</span>
                <span className={`font-medium ${sale.discountAmount > 0 ? "text-emerald-700" : "text-slate-900"}`}>
                  {sale.discountAmount > 0 ? `- ${formatInvoiceCurrency(sale.discountAmount)}` : formatInvoiceCurrency(0)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Payment status</span>
                <span className="font-medium text-slate-900">{sale.paymentStatus}</span>
              </div>
              {sale.dueDate ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Due date</span>
                  <span className="font-medium text-slate-900">{new Date(sale.dueDate).toLocaleDateString()}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3">
                <span className="text-base font-semibold text-slate-900">{sale.paymentStatus === "Paid" ? "Total paid" : "Invoice total"}</span>
                <span className="text-xl font-semibold text-slate-900">{formatInvoiceCurrency(sale.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}