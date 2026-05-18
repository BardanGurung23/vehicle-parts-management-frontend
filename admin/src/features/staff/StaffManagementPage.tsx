import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCw } from "lucide-react";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { RoleOption, StaffUser } from "../../app/types";
import { PageShell } from "../../shared/components/PageShell";
import { PageHeader } from "../../shared/components/PageHeader";
import { Card } from "../../shared/components/Card";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { Field } from "../../shared/components/Field";
import { Badge } from "../../shared/components/Badge";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { toast } from "sonner";

const staffSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters.").trim(),
  email: z.string().email("Enter a valid email address.").trim(),
  phoneNumber: z.string().min(7, "Phone number must be at least 7 characters.").trim(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  roleId: z.coerce.number().int().min(1, "Choose a role."),
});

type StaffFormValues = z.infer<typeof staffSchema>;

export function StaffManagementPage() {
  const { token } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
  });
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [roleDrafts, setRoleDrafts] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);

  const loadPageData = useCallback(async (showPageLoader = false) => {
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
      setRoleDrafts(Object.fromEntries(usersResponse.map((u) => [u.userId, u.roleId])));
      setPageError(null);
    } catch (error) {
      setPageError(error instanceof ApiError ? error.message : "Could not load staff management data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => { void loadPageData(true); }, [loadPageData]);

  const onSubmit = handleSubmit(async (values) => {
    if (!token) return;
    try {
      setPageError(null);
      setPageSuccess(null);
      await api.createStaffUser(token, values);
      const msg = "Staff account created successfully.";
      setPageSuccess(msg);
      toast.success(msg);
      reset();
      await loadPageData();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not create the staff account.";
      setPageError(message);
      toast.error(message);
    }
  });

  const roleOptions = useMemo(() => roles.map((r) => ({ value: r.roleId, label: r.name })), [roles]);
  const formatCreatedAt = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const saveRole = async (userId: number) => {
    if (!token) return;
    try {
      setSavingUserId(userId);
      setPageError(null);
      setPageSuccess(null);
      const updatedUser = await api.updateStaffRole(token, userId, { roleId: roleDrafts[userId] });
      setStaffUsers((prev) => prev.map((u) => (u.userId === userId ? updatedUser : u)));
      const msg = `Updated role for ${updatedUser.fullName}.`;
      setPageSuccess(msg);
      toast.success(msg);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not update the role.";
      setPageError(message);
      toast.error(message);
    } finally {
      setSavingUserId(null);
    }
  };

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
        eyebrow="Admin Only"
        title="Staff Management"
        description="Create staff accounts and update role assignments."
      />

      {pageError ? <AlertBox tone="error" message={pageError} dismissible /> : null}
      {pageSuccess ? <AlertBox tone="success" message={pageSuccess} dismissible /> : null}

      <div className="grid grid-cols-1 lg:grid-cols-[20rem_1fr] gap-6 items-start">
        <Card
          header={
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Admin Only</p>
              <h2 className="text-base font-semibold text-on-surface mt-1">Register staff</h2>
              <p className="text-sm text-on-surface-variant">Create staff accounts with one of the seeded SQL roles.</p>
            </div>
          }
        >
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Full name" error={errors.fullName?.message} required htmlFor="staff-name">
              <input id="staff-name" className="input" type="text" placeholder="Taylor Walker" {...register("fullName")} />
            </Field>
            <Field label="Email" error={errors.email?.message} required htmlFor="staff-email">
              <input id="staff-email" className="input" type="email" placeholder="staff@example.com" {...register("email")} />
            </Field>
            <Field label="Phone number" error={errors.phoneNumber?.message} required htmlFor="staff-phone">
              <input id="staff-phone" className="input" type="tel" placeholder="+9779800000001" {...register("phoneNumber")} />
            </Field>
            <Field label="Password" error={errors.password?.message} required htmlFor="staff-password">
              <input id="staff-password" className="input" type="password" placeholder="Minimum 8 characters" {...register("password")} />
            </Field>
            <Field label="Role" error={errors.roleId?.message} required htmlFor="staff-role">
              <select id="staff-role" className="input" defaultValue="" {...register("roleId")}>
                <option value="" disabled>Choose a role</option>
                {roleOptions.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </Field>
            <ActionButton type="submit" disabled={isSubmitting || isRefreshing} className="w-full">
              {isSubmitting ? "Creating staff account..." : "Create staff account"}
            </ActionButton>
          </form>
        </Card>

        <Card
          header={
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Current Staff</p>
                <h2 className="text-base font-semibold text-on-surface mt-1">Manage role assignment</h2>
                <p className="text-sm text-on-surface-variant">{staffUsers.length} staff account{staffUsers.length === 1 ? "" : "s"} available.</p>
              </div>
              <ActionButton tone="secondary" size="sm" icon={RefreshCw} disabled={isRefreshing} onClick={() => void loadPageData()}>
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </ActionButton>
            </div>
          }
        >
          {staffUsers.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-8">No staff accounts are available yet.</p>
          ) : (
            <div className="space-y-3">
              {staffUsers.map((u) => {
                const draftRoleId = roleDrafts[u.userId] ?? u.roleId;
                const isDirty = draftRoleId !== u.roleId;
                return (
                  <div key={u.userId} className="rounded-lg ring-1 ring-white/[0.06] bg-surface-container-lowest p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-on-surface">{u.fullName}</h3>
                        <p className="text-xs text-on-surface-variant">{u.email}</p>
                      </div>
                      <Badge variant={u.isActive ? "success" : "neutral"}>{u.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-on-surface-variant">Phone</span>
                        <p className="text-on-surface font-medium">{u.phoneNumber}</p>
                      </div>
                      <div>
                        <span className="text-on-surface-variant">Role</span>
                        <p className="text-on-surface font-medium">{u.role}</p>
                      </div>
                      <div>
                        <span className="text-on-surface-variant">Created</span>
                        <p className="text-on-surface font-medium">{formatCreatedAt(u.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label htmlFor={`role-${u.userId}`} className="block text-xs font-medium text-on-surface-variant mb-1">Role</label>
                        <select
                          id={`role-${u.userId}`}
                          className="input h-9 text-sm"
                          value={draftRoleId}
                          onChange={(e) => setRoleDrafts((prev) => ({ ...prev, [u.userId]: Number(e.target.value) }))}
                        >
                          {roleOptions.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                      <ActionButton
                        tone="secondary"
                        size="sm"
                        disabled={!isDirty || savingUserId === u.userId || isRefreshing}
                        onClick={() => void saveRole(u.userId)}
                      >
                        {savingUserId === u.userId ? "Saving..." : "Save role"}
                      </ActionButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
