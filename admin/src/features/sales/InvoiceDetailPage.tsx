import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, Mail } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { Sale } from "../../app/types";
import { AlertBox } from "../../shared/components/AlertBox";
import { ActionButton } from "../../shared/components/ActionButton";
import { PageHeader } from "../../shared/components/PageHeader";
import { PageShell } from "../../shared/components/PageShell";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { downloadElementPdf } from "../../shared/utils/downloadElementPdf";
import { InvoiceDocument } from "./components/InvoiceDocument";

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

    void api
      .getSaleById(token, parsedSaleId)
      .then((response) => {
        if (!isActive) return;
        setSale(response);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!isActive) return;
        setSale(null);
        setError(
          loadError instanceof ApiError ? loadError.message : "Could not load the invoice.",
        );
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [saleId, token]);

  const handleDownloadPdf = async () => {
    if (!sale || !invoiceRef.current) {
      setFeedback({ tone: "error", message: "Invoice is not ready to export yet." });
      return;
    }
    try {
      setIsExportingPdf(true);
      setFeedback(null);
      await downloadElementPdf({
        container: invoiceRef.current,
        fileName: `invoice-${sale.invoiceNumber}.pdf`,
      });
      setFeedback({ tone: "success", message: `PDF download started for ${sale.invoiceNumber}.` });
    } catch {
      setFeedback({ tone: "error", message: "Could not generate the invoice PDF." });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSendEmail = async () => {
    if (!token || !sale) return;
    try {
      setIsSendingEmail(true);
      const response = await api.sendSaleInvoiceEmail(token, sale.saleId);
      setFeedback({
        tone: "success",
        message: `${response.message} Sent to ${response.recipientEmail}.`,
      });
    } catch (sendError: unknown) {
      setFeedback({
        tone: "error",
        message:
          sendError instanceof ApiError
            ? sendError.message
            : "Could not send the invoice email.",
      });
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
      <PageHeader
        title={sale ? `Invoice ${sale.invoiceNumber}` : "Invoice"}
        description={
          sale
            ? `Issued ${new Date(sale.saleDate).toLocaleString()}`
            : "Review line items, export a PDF, or email a copy."
        }
        actions={
          sale ? (
            <>
              <ActionButton tone="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
                Back
              </ActionButton>
              <ActionButton
                tone="secondary"
                size="sm"
                icon={Download}
                onClick={handleDownloadPdf}
                isLoading={isExportingPdf}
              >
                Download PDF
              </ActionButton>
              <ActionButton
                size="sm"
                icon={Mail}
                onClick={handleSendEmail}
                isLoading={isSendingEmail}
              >
                Email invoice
              </ActionButton>
            </>
          ) : undefined
        }
      />

      {error ? <AlertBox tone="error" message={error} dismissible /> : null}
      {feedback ? <AlertBox tone={feedback.tone} message={feedback.message} dismissible /> : null}

      {sale ? (
        <div ref={invoiceRef}>
          <InvoiceDocument sale={sale} fallbackCustomerEmail={user?.email} />
        </div>
      ) : null}
    </PageShell>
  );
}
