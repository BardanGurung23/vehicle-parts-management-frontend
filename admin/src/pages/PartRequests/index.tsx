import { useGetAllPartRequestsQuery, useUpdatePartRequestStatusMutation } from "../../redux/services/partRequests";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { DataTable, type Column } from "../../shared/components/DataTable";
import { Badge } from "../../shared/components/Badge";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { toast } from "react-toastify";

const statusOptions = ["Pending", "Ordered", "Available"];

const badgeVariant = (status: string) => {
  switch (status) {
    case "Pending": return "warning";
    case "Ordered": return "info";
    case "Available": return "success";
    default: return "neutral";
  }
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
    catch { toast.error("Failed to update status."); }
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
