import { useMemo, useState } from "react";
import { ClipboardList, Edit3 } from "lucide-react";
import { toast } from "sonner";
import {
  useGetAllPartRequestsQuery,
  useUpdatePartRequestStatusMutation,
} from "../../redux/services/partRequests";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { ActionButton } from "../../shared/components/ActionButton";
import { DataTable, type Column } from "../../shared/components/DataTable";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { AlertBox } from "../../shared/components/AlertBox";
import { Toolbar } from "../../shared/components/Toolbar";
import { SearchInput } from "../../shared/components/SearchInput";
import { Segmented } from "../../shared/components/Segmented";
import { Modal } from "../../shared/components/Modal";
import { Field } from "../../shared/components/Field";
import { EmptyState } from "../../shared/components/EmptyState";

const STATUS_OPTIONS = ["Pending", "Fulfilled", "Rejected"] as const;
type RequestStatus = (typeof STATUS_OPTIONS)[number];
type StatusFilter = "all" | RequestStatus;

type MutationError = {
  data?: { detail?: string; message?: string; title?: string };
};

const badgeVariant = (status: string) => {
  switch (status) {
    case "Pending":
      return "warning" as const;
    case "Fulfilled":
      return "success" as const;
    case "Rejected":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
};

const extractUpdateErrorMessage = (error: unknown) => {
  if (!error || typeof error !== "object") return "Failed to update status.";
  const payload = error as MutationError;
  const message =
    payload.data?.message ?? payload.data?.detail ?? payload.data?.title;
  return typeof message === "string" && message.trim().length > 0
    ? message
    : "Failed to update status.";
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
  const [updateStatus, { isLoading: updating }] = useUpdatePartRequestStatusMutation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<PartRequestRow | null>(null);
  const [pendingStatus, setPendingStatus] = useState<RequestStatus | "">("");

  const counts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      all: requests.length,
      Pending: 0,
      Fulfilled: 0,
      Rejected: 0,
    };
    requests.forEach((r) => {
      const key = r.status as StatusFilter;
      if (key in base) base[key] += 1;
    });
    return base;
  }, [requests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (q) {
        const haystack = [
          row.customerName,
          row.requestedPartName,
          row.vehicleNumber ?? "",
          row.requestDetails ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [requests, search, statusFilter]);

  const openEdit = (row: PartRequestRow) => {
    setEditing(row);
    setPendingStatus(row.status as RequestStatus);
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
        requestId: editing.requestId,
        status: pendingStatus,
      }).unwrap();
      toast.success("Status updated");
      closeEdit();
    } catch (mutationError) {
      toast.error(extractUpdateErrorMessage(mutationError));
    }
  };

  const columns: Column<PartRequestRow>[] = [
    {
      key: "request",
      header: "Request",
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)] truncate">
            {row.requestedPartName}
          </p>
          <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] truncate">
            {row.customerName}
            {row.vehicleNumber ? ` · ${row.vehicleNumber}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "details",
      header: "Details",
      cell: (row) => (
        <span className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] line-clamp-1">
          {row.requestDetails ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge variant={badgeVariant(row.status)} dot>{row.status}</Badge>,
      width: "130px",
    },
    {
      key: "requested",
      header: "Requested",
      cell: (row) => (
        <span className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
          {new Date(row.requestedAt).toLocaleDateString()}
        </span>
      ),
      width: "130px",
    },
    {
      key: "resolved",
      header: "Resolved",
      cell: (row) => (
        <span className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
          {row.resolvedAt ? new Date(row.resolvedAt).toLocaleDateString() : "—"}
        </span>
      ),
      width: "130px",
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
          aria-label={`Update request #${row.requestId}`}
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

  if (error) {
    return (
      <PageShell>
        <AlertBox tone="error" message="Failed to load part requests." />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Part requests"
        description={`${requests.length} total · ${counts.Pending} pending`}
      />

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
                    placeholder="Search part, customer, vehicle"
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
                    { value: "Fulfilled", label: "Fulfilled", count: counts.Fulfilled },
                    { value: "Rejected", label: "Rejected", count: counts.Rejected },
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
              icon={ClipboardList}
              title={requests.length === 0 ? "No part requests yet" : "No matches"}
              description={
                requests.length === 0
                  ? "Customer-submitted requests will appear here."
                  : "Try a different filter or search term."
              }
            />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(r) => r.requestId}
            caption="Part requests"
          />
        )}
      </Card>

      <Modal
        open={editing !== null}
        onClose={closeEdit}
        size="sm"
        title="Update request status"
        description={
          editing
            ? `${editing.customerName} · ${editing.requestedPartName}`
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
            {editing.requestDetails ? (
              <p className="text-[13px] text-[var(--md-sys-color-on-surface-variant)] leading-5">
                {editing.requestDetails}
              </p>
            ) : null}
            <Field label="New status" required htmlFor="request-status">
              <select
                id="request-status"
                value={pendingStatus}
                onChange={(e) => setPendingStatus(e.target.value as RequestStatus)}
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
