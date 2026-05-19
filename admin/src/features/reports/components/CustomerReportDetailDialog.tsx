import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText } from "lucide-react";
import { api, ApiError } from "../../../app/api";
import type { CustomerDetail, CustomerReportEntry, Sale } from "../../../app/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { AlertBox } from "../../../shared/components/AlertBox";
import { ActionButton } from "../../../shared/components/ActionButton";
import { Badge } from "../../../shared/components/Badge";
import { Card } from "../../../shared/components/Card";
import { EmptyState } from "../../../shared/components/EmptyState";
import { SkeletonCard } from "../../../shared/components/Skeleton";
import { downloadElementPdf } from "../../../shared/utils/downloadElementPdf";
import { InvoiceDocument, formatInvoiceCurrency } from "../../sales/components/InvoiceDocument";

type CustomerReportDetailDialogProps = {
  token: string | null;
  customer: CustomerReportEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

function extractErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function CustomerReportDetailDialog({ token, customer, open, onOpenChange }: CustomerReportDetailDialogProps) {
  const invoiceRef = useRef<HTMLDivElement | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!open || !token || !customer) {
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setError(null);
    setFeedback(null);

    void Promise.all([
      api.getCustomerById(token, customer.customerId),
      api.getCustomerSales(token, customer.customerId),
    ])
      .then(([detailResponse, salesResponse]) => {
        if (!isActive) {
          return;
        }

        const orderedSales = [...salesResponse].sort(
          (left, right) => new Date(right.saleDate).getTime() - new Date(left.saleDate).getTime(),
        );

        setCustomerDetail(detailResponse);
        setSales(orderedSales);
        setSelectedSaleId((currentSaleId) => currentSaleId ?? orderedSales[0]?.saleId ?? null);
      })
      .catch((loadError: unknown) => {
        if (!isActive) {
          return;
        }

        setCustomerDetail(null);
        setSales([]);
        setSelectedSaleId(null);
        setError(extractErrorMessage(loadError, "Could not load the customer details."));
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
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
    if (!selectedSale) {
      setFeedback({ tone: "error", message: "Select an invoice before downloading it." });
      return;
    }

    if (!invoiceRef.current) {
      setFeedback({ tone: "error", message: "Could not find the invoice preview to export." });
      return;
    }

    try {
      setIsExporting(true);
      setFeedback(null);
      await downloadElementPdf({ container: invoiceRef.current, fileName: `invoice-${selectedSale.invoiceNumber}.pdf` });
      setFeedback({ tone: "success", message: `PDF download started for ${selectedSale.invoiceNumber}.` });
    } catch {
      setFeedback({ tone: "error", message: "Could not generate the invoice PDF." });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-7xl overflow-hidden border border-outline-variant/20 bg-surface-container-low p-0 text-on-surface">
        <div className="flex max-h-[92vh] flex-col">
          <div className="border-b border-outline-variant/20 px-6 py-5 pr-14">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <DialogHeader className="space-y-2 text-left">
                <DialogTitle>{customer ? `${customer.fullName} invoice details` : "Invoice details"}</DialogTitle>
                <DialogDescription>
                  Review customer activity, open invoice details, and download the currently selected invoice.
                </DialogDescription>
              </DialogHeader>

              <ActionButton
                tone="tonal"
                size="sm"
                icon={Download}
                onClick={handleDownload}
                isLoading={isExporting}
                disabled={!selectedSale || isLoading}
              >
                Download invoice
              </ActionButton>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {error ? <AlertBox tone="error" message={error} dismissible /> : null}
            {feedback ? <AlertBox tone={feedback.tone} message={feedback.message} dismissible /> : null}

            {isLoading ? (
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard className="h-[24rem]" />
              </div>
            ) : customer ? (
              <div className="grid gap-6 xl:grid-cols-[340px,minmax(0,1fr)]">
                <div className="space-y-4">
                  <Card
                    header={
                      <div>
                        <h3 className="text-base font-semibold text-on-surface">Customer summary</h3>
                        <p className="text-sm text-on-surface-variant">Profile, activity, and credit context for this report row.</p>
                      </div>
                    }
                  >
                    <div className="space-y-4 text-sm">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-on-surface">{customer.fullName}</p>
                          <Badge variant={customerDetail?.userId ? "success" : "neutral"}>
                            {customerDetail?.userId ? "Portal account" : "Staff-created profile"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-on-surface-variant">Customer #{customer.customerId}</p>
                      </div>

                      <dl className="space-y-3">
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-on-surface-variant">Phone</dt>
                          <dd className="mt-1 text-on-surface">{customer.phoneNumber}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-on-surface-variant">Email</dt>
                          <dd className="mt-1 text-on-surface">{customerDetail?.email ?? customer.email ?? "No email recorded"}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-on-surface-variant">Registered</dt>
                          <dd className="mt-1 text-on-surface">{formatDate(customerDetail?.registeredAt)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-on-surface-variant">Vehicles</dt>
                          <dd className="mt-1 text-on-surface">
                            {customerDetail?.vehicles.length ? customerDetail.vehicles.map((vehicle) => vehicle.vehicleNumber).join(" • ") : "No vehicles recorded"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </Card>

                  <Card
                    header={
                      <div>
                        <h3 className="text-base font-semibold text-on-surface">Report metrics</h3>
                        <p className="text-sm text-on-surface-variant">The same customer totals shown in the active report section.</p>
                      </div>
                    }
                  >
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-surface-container-low p-3">
                        <p className="text-xs uppercase tracking-wide text-on-surface-variant">Total spent</p>
                        <p className="mt-2 text-lg font-semibold text-on-surface">{formatInvoiceCurrency(customer.totalSpent)}</p>
                      </div>
                      <div className="rounded-2xl bg-surface-container-low p-3">
                        <p className="text-xs uppercase tracking-wide text-on-surface-variant">Outstanding</p>
                        <p className="mt-2 text-lg font-semibold text-on-surface">{formatInvoiceCurrency(customer.outstandingAmount)}</p>
                      </div>
                      <div className="rounded-2xl bg-surface-container-low p-3">
                        <p className="text-xs uppercase tracking-wide text-on-surface-variant">Sales</p>
                        <p className="mt-2 text-lg font-semibold text-on-surface">{customer.saleCount}</p>
                      </div>
                      <div className="rounded-2xl bg-surface-container-low p-3">
                        <p className="text-xs uppercase tracking-wide text-on-surface-variant">Credits</p>
                        <p className="mt-2 text-lg font-semibold text-on-surface">{customer.pendingInvoiceCount} pending</p>
                      </div>
                    </div>
                  </Card>

                  <Card
                    header={
                      <div>
                        <h3 className="text-base font-semibold text-on-surface">Invoices</h3>
                        <p className="text-sm text-on-surface-variant">Choose an invoice to preview it in the panel.</p>
                      </div>
                    }
                  >
                    {sales.length > 0 ? (
                      <div className="space-y-2">
                        {sales.map((sale) => (
                          <button
                            key={sale.saleId}
                            type="button"
                            onClick={() => setSelectedSaleId(sale.saleId)}
                            className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${selectedSale?.saleId === sale.saleId
                              ? "border-primary bg-primary/10"
                              : "border-outline-variant/20 bg-surface-container-low hover:bg-surface-container"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-on-surface">{sale.invoiceNumber}</p>
                                <p className="text-xs text-on-surface-variant">{formatDate(sale.saleDate)}</p>
                              </div>
                              <Badge variant={sale.paymentStatus === "Paid" ? "success" : sale.paymentStatus === "Credit" ? "warning" : "info"}>
                                {sale.paymentStatus}
                              </Badge>
                            </div>
                            <p className="mt-2 text-xs text-on-surface-variant">{sale.items.length} item{sale.items.length === 1 ? "" : "s"} · {formatInvoiceCurrency(sale.totalAmount)}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={FileText} title="No invoices yet" description="This customer does not have invoice records available to preview." />
                    )}
                  </Card>
                </div>

                <div className="space-y-4">
                  {selectedSale ? (
                    <div ref={invoiceRef}>
                      <InvoiceDocument
                        sale={selectedSale}
                        fallbackCustomerEmail={customerDetail?.email ?? customer.email}
                        contextNote="Invoice preview opened from Customer Reports."
                      />
                    </div>
                  ) : (
                    <Card>
                      <EmptyState icon={FileText} title="Select an invoice" description="Choose an invoice from the list to see the full detail preview here." />
                    </Card>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}