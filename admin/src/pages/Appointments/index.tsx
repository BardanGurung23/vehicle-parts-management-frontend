import { useState } from "react";
import PageTitle from "../../components/PageTitle";
import PageHeader from "../../components/PageHeader";
import { useGetAllAppointmentsQuery, useUpdateAppointmentStatusMutation } from "../../redux/services/appointments";
import Table from "../../components/Table";
import { toast } from "react-toastify";

const STATUS_OPTIONS = ["Pending", "Confirmed", "Completed", "Cancelled"];

const STATUS_CLASSES: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Appointments() {
  const { data: appointments = [], isLoading, error, refetch } = useGetAllAppointmentsQuery();
  const [updateStatus, { isLoading: updating }] = useUpdateAppointmentStatusMutation();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = statusFilter === "all"
    ? appointments
    : appointments.filter((a) => a.status === statusFilter);

  const headers = ["ID", "Customer", "Vehicle", "Date", "Service Type", "Status", "Notes", "Action"];

  const tableData = filtered.map((appointment) => [
    appointment.appointmentId,
    appointment.customerName,
    `${appointment.vehicleNumber} (${appointment.vehicleModel})`,
    formatDate(appointment.appointmentDate),
    appointment.serviceType,
    <span
      key={`status-${appointment.appointmentId}`}
      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CLASSES[appointment.status] || "bg-gray-100 text-gray-800"}`}
    >
      {appointment.status}
    </span>,
    appointment.notes || "-",
    <select
      key={`action-${appointment.appointmentId}`}
      className="px-2 py-1 text-xs border rounded"
      defaultValue=""
      onChange={async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        if (!newStatus) return;
        try {
          await updateStatus({ appointmentId: appointment.appointmentId, status: newStatus }).unwrap();
          toast.success(`Appointment #${appointment.appointmentId} marked as ${newStatus}`);
        } catch {
          toast.error("Failed to update status");
        }
      }}
      disabled={updating}
    >
      <option value="" disabled>Change status</option>
      {STATUS_OPTIONS.filter((s) => s !== appointment.status).map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>,
  ]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <p>Loading appointments...</p>
      </div>
    );
  }

  return (
    <div>
      <PageTitle title="Appointments" />
      <PageHeader
        title="Appointments"
        subtitle={`${appointments.length} total appointment${appointments.length !== 1 ? "s" : ""}`}
      />
      {error && (
        <div className="alert alert--error mb-4">
          <p>Failed to load appointments. <button onClick={() => refetch()} className="text-blue-600 underline">Retry</button></p>
        </div>
      )}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-medium">Filter by status:</label>
        <select
          className="px-2 py-1 border rounded text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {filtered.length === 0 && !error ? (
        <p className="empty-state">No appointments found.</p>
      ) : (
        <Table isSN headers={headers} data={tableData} />
      )}
    </div>
  );
}
