import { useMemo, useState } from "react";
import { CalendarCheck, Edit3 } from "lucide-react";
import { toast } from "sonner";
import {
  useGetAllAppointmentsQuery,
  useUpdateAppointmentStatusMutation,
} from "../../redux/services/appointments";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { ActionButton } from "../../shared/components/ActionButton";
import { DataTable, type Column } from "../../shared/components/DataTable";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { Toolbar } from "../../shared/components/Toolbar";
import { SearchInput } from "../../shared/components/SearchInput";
import { Segmented } from "../../shared/components/Segmented";
import { Modal } from "../../shared/components/Modal";
import { Field } from "../../shared/components/Field";
import { EmptyState } from "../../shared/components/EmptyState";
import { AlertBox } from "../../shared/components/AlertBox";

const STATUS_OPTIONS = ["Pending", "Confirmed", "Completed", "Cancelled"] as const;
type AppointmentStatus = (typeof STATUS_OPTIONS)[number];
type StatusFilter = "all" | AppointmentStatus;

const badgeVariant = (status: string) => {
  switch (status) {
    case "Pending":
      return "warning" as const;
    case "Confirmed":
      return "info" as const;
    case "Completed":
      return "success" as const;
    case "Cancelled":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
  const {
    data: appointments = [],
    isLoading,
    error,
    refetch,
  } = useGetAllAppointmentsQuery();
  const [updateStatus, { isLoading: updating }] = useUpdateAppointmentStatusMutation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<AppointmentRow | null>(null);
  const [pendingStatus, setPendingStatus] = useState<AppointmentStatus | "">("");

  const counts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      all: appointments.length,
      Pending: 0,
      Confirmed: 0,
      Completed: 0,
      Cancelled: 0,
    };
    appointments.forEach((a) => {
      const key = a.status as StatusFilter;
      if (key in base) base[key] += 1;
    });
    return base;
  }, [appointments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return appointments.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (q) {
        const haystack = [
          row.customerName,
          row.vehicleNumber,
          row.vehicleModel,
          row.serviceType,
          row.notes ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [appointments, search, statusFilter]);

  const openEdit = (row: AppointmentRow) => {
    setEditing(row);
    setPendingStatus(row.status as AppointmentStatus);
  };

  const closeEdit = () => {
    setEditing(null);
    setPendingStatus("");
  };

  const submitStatus = async () => {
    if (!editing || !pendingStatus || pendingStatus === editing.status) {
      closeEdit();
      return;
    }
    try {
      await updateStatus({
        appointmentId: editing.appointmentId,
        status: pendingStatus,
      }).unwrap();
      toast.success(
        `Appointment #${editing.appointmentId} marked as ${pendingStatus}`,
      );
      closeEdit();
    } catch {
      toast.error("Could not update the appointment status.");
    }
  };

  const columns: Column<AppointmentRow>[] = [
    {
      key: "customer",
      header: "Customer",
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)] truncate">
            {row.customerName}
          </p>
          <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] truncate">
            {row.vehicleNumber} · {row.vehicleModel}
          </p>
        </div>
      ),
    },
    {
      key: "service",
      header: "Service",
      cell: (row) => (
        <span className="text-[var(--md-sys-color-on-surface)]">{row.serviceType}</span>
      ),
      width: "180px",
    },
    {
      key: "date",
      header: "Scheduled",
      cell: (row) => (
        <span className="text-[12px] text-[var(--md-sys-color-on-surface)] tabular">
          {formatDate(row.appointmentDate)}
        </span>
      ),
      width: "180px",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge variant={badgeVariant(row.status)} dot>{row.status}</Badge>,
      width: "130px",
    },
    {
      key: "notes",
      header: "Notes",
      cell: (row) => (
        <span className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] line-clamp-1">
          {row.notes ?? "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "120px",
      cell: (row) => (
        <ActionButton
          tone="ghost"
          size="sm"
          icon={Edit3}
          onClick={() => openEdit(row)}
          aria-label={`Update status for appointment #${row.appointmentId}`}
        >
          Status
        </ActionButton>
      ),
    },
  ];

  if (isLoading) {
    return (
      <PageShell>
        <SkeletonCard />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Appointments"
        description={`${appointments.length} total · ${counts.Pending} pending`}
      />

      {error ? (
        <AlertBox
          tone="error"
          message="Could not load appointments."
          dismissible
          action={
            <ActionButton tone="secondary" size="sm" onClick={() => refetch()}>
              Retry
            </ActionButton>
          }
        />
      ) : null}

      <Card bodyless>
        <div className="px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)]">
          <Toolbar
            leading={
              <>
                <div className="w-full sm:w-72">
                  <SearchInput
                    size="sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search customer, vehicle, service"
                    onClear={() => setSearch("")}
                  />
                </div>
                <Segmented
                  size="sm"
                  ariaLabel="Filter by status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: "all", label: "All", count: counts.all },
                    { value: "Pending", label: "Pending", count: counts.Pending },
                    { value: "Confirmed", label: "Confirmed", count: counts.Confirmed },
                    { value: "Completed", label: "Completed", count: counts.Completed },
                    { value: "Cancelled", label: "Cancelled", count: counts.Cancelled },
                  ]}
                />
              </>
            }
          />
        </div>
        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              embedded
              icon={CalendarCheck}
              title={appointments.length === 0 ? "No appointments yet" : "No matches"}
              description={
                appointments.length === 0
                  ? "Customer bookings and walk-ins will appear here."
                  : "Try a different status or search term."
              }
            />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(r) => r.appointmentId}
            caption="Appointments"
          />
        )}
      </Card>

      <Modal
        open={editing !== null}
        onClose={closeEdit}
        size="sm"
        title="Update appointment status"
        description={
          editing
            ? `${editing.customerName} · ${editing.serviceType}`
            : undefined
        }
        footer={
          <>
            <ActionButton tone="secondary" onClick={closeEdit} disabled={updating}>
              Cancel
            </ActionButton>
            <ActionButton
              onClick={() => void submitStatus()}
              isLoading={updating}
              disabled={!pendingStatus || pendingStatus === editing?.status}
            >
              Save status
            </ActionButton>
          </>
        }
      >
        {editing ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.06em] text-[var(--md-sys-color-on-surface-variant)]">
                  Vehicle
                </dt>
                <dd className="text-[var(--md-sys-color-on-surface)] mt-0.5 tabular">
                  {editing.vehicleNumber}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.06em] text-[var(--md-sys-color-on-surface-variant)]">
                  Scheduled
                </dt>
                <dd className="text-[var(--md-sys-color-on-surface)] mt-0.5 tabular">
                  {formatDate(editing.appointmentDate)}
                </dd>
              </div>
            </dl>
            <Field label="New status" required htmlFor="appointment-status">
              <select
                id="appointment-status"
                value={pendingStatus}
                onChange={(e) =>
                  setPendingStatus(e.target.value as AppointmentStatus)
                }
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : null}
      </Modal>
    </PageShell>
  );
}
