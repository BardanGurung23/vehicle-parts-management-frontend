import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { FormSection } from "../../shared/components/FormSection";

export function RequestPartPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [requestedPartName, setRequestedPartName] = useState("");
  const [requestDetails, setRequestDetails] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedPartName.trim()) {
      toast.error("Enter the part name.");
      return;
    }
    if (!token) {
      toast.error("Your session has expired. Please sign in again.");
      return;
    }
    try {
      setIsLoading(true);
      await api.createPartRequest(token, {
        requestedPartName: requestedPartName.trim(),
        requestDetails: requestDetails.trim() || undefined,
      });
      toast.success("Part request submitted");
      navigate("/app/my-part-requests");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not submit the request.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell maxWidth="md">
      <PageHeader
        title="Request a part"
        description="Tell us what you need and we will source it for you."
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormSection title="Part details">
            <Field label="Part name" required htmlFor="req-part-name">
              <input
                id="req-part-name"
                type="text"
                required
                placeholder="Brake pads for Honda Civic"
                value={requestedPartName}
                onChange={(e) => setRequestedPartName(e.target.value)}
              />
            </Field>
            <Field label="Notes" htmlFor="req-details" hint="Optional">
              <textarea
                id="req-details"
                rows={4}
                placeholder="Any extra details about the part you need…"
                value={requestDetails}
                onChange={(e) => setRequestDetails(e.target.value)}
              />
            </Field>
          </FormSection>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <ActionButton type="button" tone="secondary" onClick={() => navigate(-1)}>
              Cancel
            </ActionButton>
            <ActionButton type="submit" isLoading={isLoading} disabled={isLoading}>
              Submit request
            </ActionButton>
          </div>
        </form>
      </Card>
    </PageShell>
  );
}
