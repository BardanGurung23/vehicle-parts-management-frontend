import { useState } from "react";
import { useGetAllAppointmentsQuery, useUpdateAppointmentStatusMutation } from "../../redux/services/appointments";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Badge } from "../../shared/components/Badge";
import { DataTable, type Column } from "../../shared/components/DataTable";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { toast } from "sonner";

const STATUS_OPTIONS = ["Pending", "Confirmed", "Completed", "Cancelled"];

const badgeVariant = (status: string) => {
  switch (status) {
    case "Pending": return "warning";
    case "Confirmed": return "info";
    case "Completed": return "success";
    case "Cancelled": return "danger";
    default: return "neutral";
  }
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

type AppointmentRow = {
  appointmentId: number;
  customerName: string;
  vehicleNumber: string;
  vehicleModel: string;
  appointmentDate: string;
  serviceType: string;
  status: string;
  notes: string | null;
};

export default function Appointments() {
  const { data: appointments = [], isLoading, error, refetch } = useGetAllAppointmentsQuery();
  const [updateStatus, { isLoading: updating }] = useUpdateAppointmentStatusMutation();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = statusFilter === "all"
    ? appointments
    : appointments.filter((a) => a.status === statusFilter);

  const columns: Column<AppointmentRow>[] = [
    { key: "id", header: "ID", cell: (row) => `#${row.appointmentId}` },
    { key: "customer", header: "Customer", cell: (row) => row.customerName },
    { key: "vehicle", header: "Vehicle", cell: (row) => `${row.vehicleNumber} (${row.vehicleModel})` },
    { key: "date", header: "Date", cell: (row) => formatDate(row.appointmentDate) },
    { key: "service", header: "Service Type", cell: (row) => row.serviceType },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge variant={badgeVariant(row.status)}>{row.status}</Badge>,
    },
    { key: "notes", header: "Notes", cell: (row) => row.notes || "-" },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <select
          className="h-8 px-2 text-xs border border-outline-variant/20 rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary"
          defaultValue=""
          onChange={async (e) => {
            const newStatus = e.target.value;
            if (!newStatus) return;
            try {
              await updateStatus({ appointmentId: row.appointmentId, status: newStatus }).unwrap();
              toast.success(`Appointment #${row.appointmentId} marked as ${newStatus}`);
            } catch { toast.error("Failed to update status"); }
          }}
          disabled={updating}
        >
          <option value="" disabled>Change status</option>
          {STATUS_OPTIONS.filter((s) => s !== row.status).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      ),
    },
  ];

  if (isLoading) return <PageShell><SkeletonCard /></PageShell>;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Management"
        title="Appointments"
        description={`${appointments.length} total appointment${appointments.length !== 1 ? "s" : ""}`}
      />

      {error && (
        <div className="bg-danger-50 border border-danger-100 text-danger-700 rounded-lg p-3 text-sm flex items-center gap-2">
          <span>Failed to load appointments.</span>
          <button onClick={() => refetch()} className="text-primary font-medium underline">Retry</button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <label htmlFor="filter-status" className="text-xs font-medium text-on-surface-variant">Filter by status:</label>
        <select id="filter-status"
          className="h-8 px-3 text-sm border border-outline-variant/20 rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary"
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={filtered} keyExtractor={(r) => r.appointmentId} emptyMessage="No appointments found." />
    </PageShell>
  );
}
