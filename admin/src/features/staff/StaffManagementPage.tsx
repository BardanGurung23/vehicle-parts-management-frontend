import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RefreshCw,
  Plus,
  Edit3,
  Shield,
  UserMinus,
  Users as UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type {
  RoleOption,
  StaffUser,
  UpdateStaffUserInput,
} from "../../app/types";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { Field } from "../../shared/components/Field";
import { Badge } from "../../shared/components/Badge";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { Modal, ConfirmDialog } from "../../shared/components/Modal";
import { Toolbar } from "../../shared/components/Toolbar";
import { SearchInput } from "../../shared/components/SearchInput";
import { Segmented } from "../../shared/components/Segmented";
import { DataTable, type Column } from "../../shared/components/DataTable";
import { EmptyState } from "../../shared/components/EmptyState";
import { FormSection } from "../../shared/components/FormSection";
import { staffSchema } from "./schema";

type StaffFormValues = z.infer<typeof staffSchema>;
type ActivityFilter = "all" | "active" | "inactive";

export function StaffManagementPage() {
  const { token } = useAuth();

  /* -------- Page data -------- */
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");

  /* -------- Create modal -------- */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors, isSubmitting: isCreating },
  } = useForm<StaffFormValues>({ resolver: zodResolver(staffSchema) });

  /* -------- Edit modal -------- */
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [editDraft, setEditDraft] = useState<UpdateStaffUserInput & { roleId?: number }>({});
  const [savingEdit, setSavingEdit] = useState(false);

  /* -------- Deactivate confirmation -------- */
  const [confirmDeactivateUser, setConfirmDeactivateUser] = useState<StaffUser | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  /* -------- Loaders -------- */
  const loadPageData = useCallback(
    async (showPageLoader = false) => {
      if (!token) return;
      if (showPageLoader) setIsLoading(true);
      else setIsRefreshing(true);
      try {
        const [rolesResponse, usersResponse] = await Promise.all([
          api.getAssignableRoles(token),
          api.getStaffUsers(token),
        ]);
        setRoles(rolesResponse);
        setStaffUsers(usersResponse);
        setPageError(null);
      } catch (error) {
        setPageError(
          error instanceof ApiError
            ? error.message
            : "Could not load staff management data.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadPageData(true);
  }, [loadPageData]);

  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: r.roleId, label: r.name })),
    [roles],
  );

  /* -------- Filters -------- */
  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staffUsers.filter((user) => {
      if (activityFilter === "active" && !user.isActive) return false;
      if (activityFilter === "inactive" && user.isActive) return false;
      if (q) {
        const haystack = [user.fullName, user.email, user.phoneNumber, user.role]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [staffUsers, search, activityFilter]);

  const activeCount = staffUsers.filter((u) => u.isActive).length;

  /* -------- Create staff -------- */
  const openCreate = () => {
    resetCreate();
    setIsCreateOpen(true);
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    resetCreate();
  };

  const submitCreate = handleCreateSubmit(async (values) => {
    if (!token) return;
    try {
      await api.createStaffUser(token, values);
      toast.success("Staff account created");
      resetCreate();
      setIsCreateOpen(false);
      await loadPageData();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Could not create the staff account.";
      toast.error(message);
    }
  });

  /* -------- Edit staff (full edit including role) -------- */
  const openEdit = (user: StaffUser) => {
    setEditingUser(user);
    setEditDraft({
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      roleId: user.roleId,
    });
  };

  const closeEdit = () => {
    setEditingUser(null);
    setEditDraft({});
  };

  const submitEdit = async () => {
    if (!token || !editingUser) return;
    try {
      setSavingEdit(true);
      const updates = await api.updateStaffUser(token, editingUser.userId, {
        fullName: editDraft.fullName?.trim() || undefined,
        email: editDraft.email?.trim() || undefined,
        phoneNumber: editDraft.phoneNumber?.trim() || undefined,
      });
      let merged: StaffUser = updates;
      if (editDraft.roleId && editDraft.roleId !== editingUser.roleId) {
        merged = await api.updateStaffRole(token, editingUser.userId, {
          roleId: editDraft.roleId,
        });
      }
      setStaffUsers((prev) =>
        prev.map((u) => (u.userId === editingUser.userId ? merged : u)),
      );
      toast.success("Staff account updated");
      closeEdit();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Could not update the staff account.";
      toast.error(message);
    } finally {
      setSavingEdit(false);
    }
  };

  /* -------- Deactivate -------- */
  const submitDeactivate = async () => {
    if (!token || !confirmDeactivateUser) return;
    try {
      setDeactivating(true);
      const updated = await api.deactivateStaffUser(token, confirmDeactivateUser.userId);
      setStaffUsers((prev) =>
        prev.map((u) => (u.userId === confirmDeactivateUser.userId ? updated : u)),
      );
      toast.success(`${updated.fullName} deactivated`);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Could not deactivate the staff account.";
      toast.error(message);
    } finally {
      setDeactivating(false);
      setConfirmDeactivateUser(null);
    }
  };

  /* -------- Table columns -------- */
  const formatCreatedAt = (d: string) =>
    new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const columns: Column<StaffUser>[] = [
    {
      key: "user",
      header: "Staff",
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)] truncate">
            {row.fullName}
          </p>
          <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] truncate">
            {row.email}
          </p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (row) => <Badge variant="brand">{row.role}</Badge>,
      width: "140px",
    },
    {
      key: "phone",
      header: "Phone",
      cell: (row) => (
        <span className="text-[var(--md-sys-color-on-surface)] tabular">
          {row.phoneNumber || "—"}
        </span>
      ),
      width: "160px",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) =>
        row.isActive ? (
          <Badge variant="success" dot>Active</Badge>
        ) : (
          <Badge variant="neutral" dot>Inactive</Badge>
        ),
      width: "120px",
    },
    {
      key: "created",
      header: "Created",
      cell: (row) => (
        <span className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
          {formatCreatedAt(row.createdAt)}
        </span>
      ),
      width: "140px",
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "150px",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <ActionButton
            tone="ghost"
            size="sm"
            icon={Edit3}
            onClick={() => openEdit(row)}
            aria-label={`Edit ${row.fullName}`}
            disabled={!row.isActive}
          >
            Edit
          </ActionButton>
          <ActionButton
            tone="ghost"
            size="sm"
            icon={UserMinus}
            onClick={() => setConfirmDeactivateUser(row)}
            aria-label={`Deactivate ${row.fullName}`}
            disabled={!row.isActive}
          >
            <span className="sr-only">Deactivate</span>
          </ActionButton>
        </div>
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
        title="Staff"
        description={`${activeCount} active of ${staffUsers.length}`}
        actions={
          <>
            <ActionButton
              tone="secondary"
              size="md"
              icon={RefreshCw}
              disabled={isRefreshing}
              onClick={() => void loadPageData()}
            >
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </ActionButton>
            <ActionButton icon={Plus} onClick={openCreate}>
              New staff
            </ActionButton>
          </>
        }
      />

      {pageError ? <AlertBox tone="error" message={pageError} dismissible /> : null}

      <Card bodyless>
        <div className="px-5 py-3 border-b border-[var(--md-sys-color-outline-variant)]">
          <Toolbar
            leading={
              <>
                <div className="w-full sm:w-72">
                  <SearchInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, role"
                    onClear={() => setSearch("")}
                    size="sm"
                  />
                </div>
                <Segmented
                  size="sm"
                  ariaLabel="Filter by activity"
                  value={activityFilter}
                  onChange={setActivityFilter}
                  options={[
                    { value: "all", label: "All", count: staffUsers.length },
                    { value: "active", label: "Active", count: activeCount },
                    { value: "inactive", label: "Inactive", count: staffUsers.length - activeCount },
                  ]}
                />
              </>
            }
          />
        </div>
        {filteredStaff.length === 0 ? (
          <div className="p-5">
            <EmptyState
              embedded
              icon={UsersIcon}
              title={staffUsers.length === 0 ? "No staff accounts yet" : "No matches"}
              description={
                staffUsers.length === 0
                  ? "Create your first staff member to get started."
                  : "Try a different search term or filter."
              }
              action={
                staffUsers.length === 0 ? (
                  <ActionButton icon={Plus} onClick={openCreate}>Add staff</ActionButton>
                ) : null
              }
            />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredStaff}
            keyExtractor={(r) => r.userId}
            caption="Staff accounts"
          />
        )}
      </Card>

      {/* ---------------- Create modal ---------------- */}
      <Modal
        open={isCreateOpen}
        onClose={closeCreate}
        size="md"
        title="New staff account"
        description="Provide the staff member’s details and assign a role."
        footer={
          <>
            <ActionButton tone="secondary" onClick={closeCreate} disabled={isCreating}>
              Cancel
            </ActionButton>
            <ActionButton
              type="submit"
              form="staff-create-form"
              isLoading={isCreating}
            >
              Create account
            </ActionButton>
          </>
        }
      >
        <form id="staff-create-form" onSubmit={submitCreate} className="space-y-5">
          <FormSection title="Identity">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Field label="Full name" required error={createErrors.fullName?.message} htmlFor="staff-name">
                  <input id="staff-name" type="text" placeholder="Taylor Walker" {...registerCreate("fullName")} />
                </Field>
              </div>
              <Field label="Email" required error={createErrors.email?.message} htmlFor="staff-email">
                <input id="staff-email" type="email" placeholder="taylor@example.com" autoComplete="email" {...registerCreate("email")} />
              </Field>
              <Field label="Phone" required error={createErrors.phoneNumber?.message} htmlFor="staff-phone">
                <input id="staff-phone" type="tel" placeholder="+1 555 123 4567" autoComplete="tel" {...registerCreate("phoneNumber")} />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Access">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Password" required error={createErrors.password?.message} htmlFor="staff-password" hint="At least 8 characters.">
                <input id="staff-password" type="password" autoComplete="new-password" {...registerCreate("password")} />
              </Field>
              <Field label="Role" required error={createErrors.roleId?.message} htmlFor="staff-role">
                <select id="staff-role" defaultValue="" {...registerCreate("roleId")}>
                  <option value="" disabled>Choose a role</option>
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </FormSection>
        </form>
      </Modal>

      {/* ---------------- Edit modal ---------------- */}
      <Modal
        open={editingUser !== null}
        onClose={closeEdit}
        size="md"
        title="Edit staff account"
        description={editingUser?.email ? `Updating ${editingUser.email}` : undefined}
        footer={
          <>
            <ActionButton tone="secondary" onClick={closeEdit} disabled={savingEdit}>
              Cancel
            </ActionButton>
            <ActionButton onClick={() => void submitEdit()} isLoading={savingEdit}>
              Save changes
            </ActionButton>
          </>
        }
      >
        {editingUser ? (
          <div className="space-y-5">
            <FormSection title="Profile">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Field label="Full name" htmlFor="edit-name">
                    <input
                      id="edit-name"
                      type="text"
                      value={editDraft.fullName ?? ""}
                      onChange={(e) =>
                        setEditDraft((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                    />
                  </Field>
                </div>
                <Field label="Email" htmlFor="edit-email">
                  <input
                    id="edit-email"
                    type="email"
                    value={editDraft.email ?? ""}
                    onChange={(e) =>
                      setEditDraft((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Phone" htmlFor="edit-phone">
                  <input
                    id="edit-phone"
                    type="tel"
                    value={editDraft.phoneNumber ?? ""}
                    onChange={(e) =>
                      setEditDraft((prev) => ({ ...prev, phoneNumber: e.target.value }))
                    }
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Role">
              <Field label="Assigned role" htmlFor="edit-role">
                <select
                  id="edit-role"
                  value={editDraft.roleId ?? editingUser.roleId}
                  onChange={(e) =>
                    setEditDraft((prev) => ({ ...prev, roleId: Number(e.target.value) }))
                  }
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </Field>
            </FormSection>
          </div>
        ) : null}
      </Modal>

      {/* ---------------- Deactivate confirmation ---------------- */}
      <ConfirmDialog
        open={confirmDeactivateUser !== null}
        onClose={() => setConfirmDeactivateUser(null)}
        onConfirm={submitDeactivate}
        title="Deactivate staff account?"
        message={
          confirmDeactivateUser ? (
            <div className="space-y-2">
              <p className="text-sm text-[var(--md-sys-color-on-surface)]">
                <strong>{confirmDeactivateUser.fullName}</strong> will lose access immediately.
              </p>
              <p className="text-[13px] text-[var(--md-sys-color-on-surface-variant)] flex items-start gap-2">
                <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                Their historical activity remains visible in reports.
              </p>
            </div>
          ) : null
        }
        confirmLabel={deactivating ? "Deactivating…" : "Deactivate"}
        tone="danger"
        isLoading={deactivating}
      />
    </PageShell>
  );
}
