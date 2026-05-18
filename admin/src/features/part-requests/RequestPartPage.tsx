import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { Field } from "../../shared/components/Field";
import { ActionButton } from "../../shared/components/ActionButton";
import { toast } from "sonner";

export function RequestPartPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [requestedPartName, setRequestedPartName] = useState("");
  const [requestDetails, setRequestDetails] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedPartName.trim()) { toast.error("Please enter the part name."); return; }
    try {
      if (!token) {
        toast.error("Your session has expired. Please sign in again.");
        return;
      }

      setIsLoading(true);
      await api.createPartRequest(token, { requestedPartName: requestedPartName.trim(), requestDetails: requestDetails.trim() || undefined });
      toast.success("Part request submitted successfully!");
      navigate("/app/my-part-requests");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to submit part request.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell maxWidth="sm">
      <PageHeader eyebrow="Request" title="Request Unavailable Part" description="Can't find the part you need? Let us know and we'll try to source it." />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Part Name" required htmlFor="req-part-name">
            <input id="req-part-name" className="input" type="text" required
              placeholder="e.g., Brake pads for Honda Civic"
              value={requestedPartName} onChange={(e) => setRequestedPartName(e.target.value)} />
          </Field>
          <Field label="Details (Optional)" htmlFor="req-details">
            <textarea id="req-details" className="input" rows={4}
              placeholder="Any additional details about the part you need..."
              value={requestDetails} onChange={(e) => setRequestDetails(e.target.value)} />
          </Field>
          <div className="flex items-center gap-3">
            <ActionButton type="submit" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Request"}
            </ActionButton>
            <ActionButton type="button" tone="secondary" onClick={() => navigate(-1)}>Cancel</ActionButton>
          </div>
        </form>
      </Card>
    </PageShell>
  );
}
