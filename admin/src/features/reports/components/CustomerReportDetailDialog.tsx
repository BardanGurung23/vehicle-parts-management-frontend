import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText } from "lucide-react";
import { api, ApiError } from "../../../app/api";
import type { CustomerDetail, CustomerReportEntry, Sale } from "../../../app/types";
import { AlertBox } from "../../../shared/components/AlertBox";
import { ActionButton } from "../../../shared/components/ActionButton";
import { Badge } from "../../../shared/components/Badge";
import { Card } from "../../../shared/components/Card";
import { EmptyState } from "../../../shared/components/EmptyState";
import { SkeletonCard } from "../../../shared/components/Skeleton";
import { Modal } from "../../../shared/components/Modal";
import { downloadElementPdf } from "../../../shared/utils/downloadElementPdf";
import {
  InvoiceDocument,
  formatInvoiceCurrency,
} from "../../sales/components/InvoiceDocument";

type CustomerReportDetailDialogProps = {
  token: string | null;
  customer: CustomerReportEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "—";

const extractErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

export function CustomerReportDetailDialog({
  token,
  customer,
  open,
  onOpenChange,
}: CustomerReportDetailDialogProps) {
  const invoiceRef = useRef<HTMLDivElement | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!open || !token || !customer) return;
    let isActive = true;
    setIsLoading(true);
    setError(null);
    setFeedback(null);

    void Promise.all([
      api.getCustomerById(token, customer.customerId),
      api.getCustomerSales(token, customer.customerId),
    ])
      .then(([detailResponse, salesResponse]) => {
        if (!isActive) return;
        const orderedSales = [...salesResponse].sort(
          (left, right) =>
            new Date(right.saleDate).getTime() - new Date(left.saleDate).getTime(),
        );
        setCustomerDetail(detailResponse);
        setSales(orderedSales);
        setSelectedSaleId(
          (currentSaleId) => currentSaleId ?? orderedSales[0]?.saleId ?? null,
        );
      })
      .catch((loadError: unknown) => {
        if (!isActive) return;
        setCustomerDetail(null);
        setSales([]);
        setSelectedSaleId(null);
        setError(extractErrorMessage(loadError, "Could not load the customer."));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [customer, open, token]);

  const selectedSale = useMemo(
    () => sales.find((sale) => sale.saleId === selectedSaleId) ?? sales[0] ?? null,
    [sales, selectedSaleId],
  );

  const handleDownload = async () => {
    if (!selectedSale || !invoiceRef.current) {
      setFeedback({
        tone: "error",
        message: "Select an invoice before downloading.",
      });
      return;
    }
    try {
      setIsExporting(true);
      setFeedback(null);
      await downloadElementPdf({
        container: invoiceRef.current,
        fileName: `invoice-${selectedSale.invoiceNumber}.pdf`,
      });
      setFeedback({
        tone: "success",
        message: `PDF download started for ${selectedSale.invoiceNumber}.`,
      });
    } catch {
      setFeedback({ tone: "error", message: "Could not generate the invoice PDF." });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      size="2xl"
      title={customer ? `${customer.fullName} invoice details` : "Invoice details"}
      description="Activity, summary, and a downloadable PDF preview."
      footer={
        <>
          <ActionButton
            tone="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Close
          </ActionButton>
          <ActionButton
            icon={Download}
            onClick={handleDownload}
            isLoading={isExporting}
            disabled={!selectedSale || isLoading}
          >
            Download invoice
          </ActionButton>
        </>
      }
    >
      <div className="space-y-5">
        {error ? <AlertBox tone="error" message={error} dismissible /> : null}
        {feedback ? <AlertBox tone={feedback.tone} message={feedback.message} dismissible /> : null}

        {isLoading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard className="h-[24rem]" />
          </div>
        ) : customer ? (
          <>
            {/* Customer summary header */}
            <Card>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                      {customer.fullName}
                    </p>
                    <Badge variant={customerDetail?.userId ? "success" : "neutral"} dot>
                      {customerDetail?.userId ? "Portal account" : "Staff-created profile"}
                    </Badge>
                    <span className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
                      Customer #{customer.customerId}
                    </span>
                  </div>
                  <dl className="grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
                    <Row label="Phone">{customer.phoneNumber}</Row>
                    <Row label="Email">
                      <span className="truncate" title={customerDetail?.email ?? customer.email ?? "—"}>
                        {customerDetail?.email ?? customer.email ?? "—"}
                      </span>
                    </Row>
                    <Row label="Registered">
                      {formatDate(customerDetail?.registeredAt)}
                    </Row>
                    <Row label="Vehicles">
                      {customerDetail?.vehicles.length
                        ? customerDetail.vehicles
                            .map((v) => v.vehicleNumber)
                            .join(" · ")
                        : "—"}
                    </Row>
                  </dl>
                </div>
              </div>
            </Card>

            {/* Metrics strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric
                label="Total spent"
                value={formatInvoiceCurrency(customer.totalSpent)}
              />
              <Metric
                label="Outstanding"
                value={formatInvoiceCurrency(customer.outstandingAmount)}
              />
              <Metric label="Sales" value={String(customer.saleCount)} />
              <Metric
                label="Pending"
                value={`${customer.pendingInvoiceCount}`}
              />
            </div>

            {/* Invoice picker + document */}
            <Card
              header={
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
                      Invoices
                    </h3>
                    <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                      Choose an invoice to preview the full document.
                    </p>
                  </div>
                  {sales.length > 0 ? (
                    <span className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
                      {sales.length} record{sales.length === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>
              }
              bodyless
            >
              {sales.length > 0 ? (
                <>
                  <div className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)]">
                    <ul
                      className="flex gap-2 overflow-x-auto px-4 py-3"
                      role="tablist"
                      aria-label="Invoices"
                    >
                      {sales.map((sale) => {
                        const isActive = selectedSale?.saleId === sale.saleId;
                        return (
                          <li key={sale.saleId} className="shrink-0">
                            <button
                              type="button"
                              role="tab"
                              aria-selected={isActive}
                              onClick={() => setSelectedSaleId(sale.saleId)}
                              className={[
                                "flex flex-col gap-1 rounded-md border px-3 py-2 text-left transition-colors min-w-[200px]",
                                isActive
                                  ? "border-[var(--md-sys-color-primary)] bg-[var(--brand-50)] text-[var(--md-sys-color-on-surface)]"
                                  : "border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-low)]",
                              ].join(" ")}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[13px] font-semibold tabular truncate">
                                  {sale.invoiceNumber}
                                </span>
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
                              </div>
                              <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--md-sys-color-on-surface-variant)] tabular">
                                <span>{formatDate(sale.saleDate)}</span>
                                <span>{formatInvoiceCurrency(sale.totalAmount)}</span>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="bg-[var(--md-sys-color-surface-container-lowest)] p-4 sm:p-5">
                    {selectedSale ? (
                      <div ref={invoiceRef}>
                        <InvoiceDocument
                          sale={selectedSale}
                          fallbackCustomerEmail={customerDetail?.email ?? customer.email}
                          contextNote="Invoice preview opened from Customer Reports."
                        />
                      </div>
                    ) : (
                      <EmptyState
                        embedded
                        icon={FileText}
                        title="Select an invoice"
                        description="Choose one from the list to preview the full document."
                      />
                    )}
                  </div>
                </>
              ) : (
                <div className="p-5">
                  <EmptyState
                    embedded
                    icon={FileText}
                    title="No invoices"
                    description="No invoice records to preview."
                  />
                </div>
              )}
            </Card>
          </>
        ) : null}
      </div>
    </Modal>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <dt className="text-[11px] uppercase tracking-[0.06em] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
        {label}
      </dt>
      <dd className="text-[13px] text-[var(--md-sys-color-on-surface)] truncate">
        {children}
      </dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] p-3">
      <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
        {label}
      </p>
      <p className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-1 tabular">
        {value}
      </p>
    </div>
  );
}
