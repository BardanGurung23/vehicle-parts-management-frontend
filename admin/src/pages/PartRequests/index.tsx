import { useGetAllPartRequestsQuery, useUpdatePartRequestStatusMutation } from "../../redux/services/partRequests";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { DataTable, type Column } from "../../shared/components/DataTable";
import { Badge } from "../../shared/components/Badge";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { toast } from "sonner";

const statusOptions = ["Pending", "Fulfilled", "Rejected"];

type MutationError = {
  data?: {
    detail?: string;
    message?: string;
    title?: string;
  };
};

const badgeVariant = (status: string) => {
  switch (status) {
    case "Pending": return "warning";
    case "Fulfilled": return "success";
    case "Rejected": return "danger";
    default: return "neutral";
  }
};

const extractUpdateErrorMessage = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return "Failed to update status.";
  }

  const payload = error as MutationError;
  const message = payload.data?.message ?? payload.data?.detail ?? payload.data?.title;
  return typeof message === "string" && message.trim().length > 0 ? message : "Failed to update status.";
};

type PartRequestRow = {
  requestId: number;
  customerName: string;
  requestedPartName: string;
  vehicleNumber: string | null;
  requestDetails: string | null;
  status: string;
  requestedAt: string;
  resolvedAt: string | null;
};

export function PartRequestsPage() {
  const { data: requests = [], isLoading, error } = useGetAllPartRequestsQuery();
  const [updateStatus] = useUpdatePartRequestStatusMutation();

  const handleStatusChange = async (requestId: number, newStatus: string) => {
    try { await updateStatus({ requestId, status: newStatus }).unwrap(); toast.success("Status updated successfully!"); }
    catch (updateError) { toast.error(extractUpdateErrorMessage(updateError)); }
  };

  const columns: Column<PartRequestRow>[] = [
    { key: "id", header: "ID", cell: (row) => `#${row.requestId}` },
    { key: "customer", header: "Customer", cell: (row) => row.customerName },
    { key: "part", header: "Part Name", cell: (row) => row.requestedPartName },
    { key: "vehicle", header: "Vehicle", cell: (row) => row.vehicleNumber || "-" },
    { key: "details", header: "Details", cell: (row) => row.requestDetails || "-" },
    { key: "status", header: "Status", cell: (row) => <Badge variant={badgeVariant(row.status)}>{row.status}</Badge> },
    { key: "requested", header: "Requested", cell: (row) => new Date(row.requestedAt).toLocaleDateString() },
    { key: "resolved", header: "Resolved", cell: (row) => row.resolvedAt ? new Date(row.resolvedAt).toLocaleDateString() : "-" },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <select
          className="h-8 px-2 text-xs border border-outline-variant/20 rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary"
          value={row.status}
          onChange={(e) => handleStatusChange(row.requestId, e.target.value)}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      ),
    },
  ];

  if (isLoading) return <PageShell><SkeletonCard /></PageShell>;
  if (error) return <PageShell><div className="bg-danger-50 border border-danger-100 text-danger-700 rounded-lg p-3 text-sm">Failed to load part requests.</div></PageShell>;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Management"
        title="Part Requests"
        description="Manage customer part requests and update their status."
      />
      <DataTable columns={columns} data={requests} keyExtractor={(r) => r.requestId} emptyMessage="No part requests yet." />
    </PageShell>
  );
}
