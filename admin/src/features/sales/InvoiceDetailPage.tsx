import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, Mail } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { Sale } from "../../app/types";
import { AlertBox } from "../../shared/components/AlertBox";
import { ActionButton } from "../../shared/components/ActionButton";
import { PageHeader } from "../../shared/components/PageHeader";
import { PageShell } from "../../shared/components/PageShell";
import { SkeletonCard } from "../../shared/components/Skeleton";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function getStatusClasses(paymentStatus: string) {
  if (paymentStatus === "Paid") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (paymentStatus === "Credit") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-200 text-slate-700";
}

export function InvoiceDetailPage() {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const invoiceRef = useRef<HTMLDivElement | null>(null);
  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    if (!token) {
      setSale(null);
      setError("Your session expired. Sign in again.");
      setIsLoading(false);
      return;
    }

    const parsedSaleId = Number(saleId);
    if (!Number.isInteger(parsedSaleId) || parsedSaleId <= 0) {
      setSale(null);
      setError("Invalid invoice reference.");
      setIsLoading(false);
      return;
    }

    let isActive = true;
    setIsLoading(true);

    void api.getSaleById(token, parsedSaleId)
      .then((response) => {
        if (!isActive) {
          return;
        }

        setSale(response);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!isActive) {
          return;
        }

        setSale(null);
        setError(loadError instanceof ApiError ? loadError.message : "Could not load the invoice.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [saleId, token]);

  const handleDownloadPdf = async () => {
    if (!sale) {
      setFeedback({ tone: "error", message: "Invoice details are not ready for export yet." });
      return;
    }

    if (!invoiceRef.current) {
      setFeedback({ tone: "error", message: "Could not find the invoice preview to export." });
      return;
    }

    try {
      setIsExportingPdf(true);
      setFeedback(null);

      const canvas = await html2canvas(invoiceRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });

      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 190;
      const pageHeight = 277;
      const imageHeight = (canvas.height * pageWidth) / canvas.width;
      let heightLeft = imageHeight;
      let position = 10;

      pdf.addImage(imageData, "PNG", 10, position, pageWidth, imageHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imageHeight + 10;
        pdf.addPage();
        pdf.addImage(imageData, "PNG", 10, position, pageWidth, imageHeight);
        heightLeft -= pageHeight;
      }

      const blob = pdf.output("blob");
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = `invoice-${sale.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 1000);

      setFeedback({ tone: "success", message: `PDF download started for ${sale.invoiceNumber}.` });
    } catch {
      setFeedback({ tone: "error", message: "Could not generate the invoice PDF." });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSendEmail = async () => {
    if (!token || !sale) {
      return;
    }

    try {
      setIsSendingEmail(true);
      const response = await api.sendSaleInvoiceEmail(token, sale.saleId);
      setFeedback({ tone: "success", message: `${response.message} Sent to ${response.recipientEmail}.` });
    } catch (sendError: unknown) {
      setFeedback({ tone: "error", message: sendError instanceof ApiError ? sendError.message : "Could not send the invoice email." });
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard className="h-[28rem]" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Invoice"
          title={sale ? `Invoice ${sale.invoiceNumber}` : "Invoice"}
          description={sale ? `Issued ${new Date(sale.saleDate).toLocaleString()}` : "Review line items, export a PDF, or email a copy."}
          actions={sale ? (
            <>
              <ActionButton tone="text" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
                Back
              </ActionButton>
              <ActionButton tone="tonal" size="sm" icon={Download} onClick={handleDownloadPdf} isLoading={isExportingPdf}>
                Download PDF
              </ActionButton>
              <ActionButton size="sm" icon={Mail} onClick={handleSendEmail} isLoading={isSendingEmail}>
                Email Invoice
              </ActionButton>
            </>
          ) : undefined}
        />

        {error ? <AlertBox tone="error" message={error} dismissible /> : null}
        {feedback ? <AlertBox tone={feedback.tone} message={feedback.message} dismissible /> : null}

        {sale ? (
          <div ref={invoiceRef} className="overflow-hidden rounded-[28px] bg-white text-slate-900 shadow-level2">
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
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(sale.paymentStatus)}`}>
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
                <p className="mt-1 text-sm text-slate-500">{sale.customerEmail ?? user?.email ?? "No email on file"}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Vehicle</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{sale.vehicleNumber ?? "Not specified"}</p>
                <p className="mt-1 text-sm text-slate-500">Invoice created through the active sales workflow.</p>
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
                          <td className="border-b border-slate-100 px-4 py-4 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                          <td className="border-b border-slate-100 px-4 py-4 text-right font-medium text-slate-900">{formatCurrency(lineTotal)}</td>
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
                      <span className="font-medium text-slate-900">{formatCurrency(sale.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Discount</span>
                      <span className={`font-medium ${sale.discountAmount > 0 ? "text-emerald-700" : "text-slate-900"}`}>
                        {sale.discountAmount > 0 ? `- ${formatCurrency(sale.discountAmount)}` : formatCurrency(0)}
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
                      <span className="text-xl font-semibold text-slate-900">{formatCurrency(sale.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}