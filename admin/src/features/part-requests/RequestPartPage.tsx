import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreatePartRequestMutation } from "../../redux/services/partRequests";
import { toast } from "react-toastify";

export function RequestPartPage() {
  const navigate = useNavigate();
  const [createPartRequest, { isLoading }] = useCreatePartRequestMutation();

  const [requestedPartName, setRequestedPartName] = useState("");
  const [requestDetails, setRequestDetails] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requestedPartName.trim()) {
      toast.error("Please enter the part name.");
      return;
    }

    try {
      await createPartRequest({
        requestedPartName: requestedPartName.trim(),
        requestDetails: requestDetails.trim() || undefined,
      }).unwrap();

      toast.success("Part request submitted successfully!");
      navigate("/app/my-part-requests");
    } catch {
      toast.error("Failed to submit part request. Please try again.");
    }
  };

  return (
    <div className="p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Request Unavailable Part</h1>
      <p className="text-gray-600 mb-6">
        Can't find the part you need? Let us know and we'll try to source it for you.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Part Name *
          </label>
          <input
            type="text"
            required
            className="w-full border rounded p-2"
            placeholder="e.g., Brake pads for Honda Civic"
            value={requestedPartName}
            onChange={(e) => setRequestedPartName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Details (Optional)
          </label>
          <textarea
            className="w-full border rounded p-2"
            rows={4}
            placeholder="Any additional details about the part you need..."
            value={requestDetails}
            onChange={(e) => setRequestDetails(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="button button--primary"
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Submit Request"}
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
