import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, ApiError } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { RoleOption, StaffUser } from "../../app/types";
import { ActionButton } from "../../shared/components/ActionButton";
import { AlertBox } from "../../shared/components/AlertBox";
import { Field } from "../../shared/components/Field";
import { LoadingScreen } from "../../shared/components/LoadingScreen";

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
    if (!token) {
      return;
    }

    if (showPageLoader) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const [rolesResponse, usersResponse] = await Promise.all([
        api.getAssignableRoles(token),
        api.getStaffUsers(token),
      ]);

      setRoles(rolesResponse);
      setStaffUsers(usersResponse);
      setRoleDrafts(
        Object.fromEntries(usersResponse.map((user) => [user.userId, user.roleId])),
      );
      setPageError(null);
    } catch (error) {
      setPageError(error instanceof ApiError ? error.message : "Could not load staff management data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    void loadPageData(true);
  }, [loadPageData]);

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      return;
    }

    try {
      setPageError(null);
      setPageSuccess(null);

      await api.createStaffUser(token, values);
      setPageSuccess("Staff account created successfully.");
      reset();
      await loadPageData();
    } catch (error) {
      setPageError(error instanceof ApiError ? error.message : "Could not create the staff account.");
    }
  });

  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: role.roleId, label: role.name })),
    [roles],
  );

  const staffCountLabel = `${staffUsers.length} staff account${staffUsers.length === 1 ? "" : "s"}`;

  const formatCreatedAt = (createdAt: string) =>
    new Date(createdAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const saveRole = async (userId: number) => {
    if (!token) {
      return;
    }

    try {
      setSavingUserId(userId);
      setPageError(null);
      setPageSuccess(null);

      const updatedUser = await api.updateStaffRole(token, userId, {
        roleId: roleDrafts[userId],
      });

      setStaffUsers((current) =>
        current.map((user) => (user.userId === userId ? updatedUser : user)),
      );
      setPageSuccess(`Updated role for ${updatedUser.fullName}.`);
    } catch (error) {
      setPageError(error instanceof ApiError ? error.message : "Could not update the role.");
    } finally {
      setSavingUserId(null);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading staff management..." />;
  }

  return (
    <section className="page-stack">
      {pageError ? <AlertBox tone="error" message={pageError} /> : null}
      {pageSuccess ? <AlertBox tone="success" message={pageSuccess} /> : null}

      <div className="staff-layout">
        <article className="card staff-form-card">
          <div className="card__header">
            <p className="eyebrow">Admin Only</p>
            <h2>Register staff</h2>
            <p className="card__copy">
              Create staff accounts with one of the seeded SQL roles. Role creation stays out of scope here.
            </p>
          </div>

          <form className="form-grid" onSubmit={onSubmit}>
            <Field label="Full name" error={errors.fullName?.message}>
              <input className="input" type="text" placeholder="Taylor Walker" {...register("fullName")} />
            </Field>

            <Field label="Email" error={errors.email?.message}>
              <input className="input" type="email" placeholder="staff@example.com" {...register("email")} />
            </Field>

            <Field label="Phone number" error={errors.phoneNumber?.message}>
              <input className="input" type="tel" placeholder="+9779800000001" {...register("phoneNumber")} />
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <input className="input" type="password" placeholder="Minimum 8 characters" {...register("password")} />
            </Field>

            <Field label="Role" error={errors.roleId?.message}>
              <select className="input" defaultValue="" {...register("roleId")}>
                <option value="" disabled>
                  Choose a role
                </option>
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </Field>

            <ActionButton type="submit" disabled={isSubmitting || isRefreshing}>
              {isSubmitting ? "Creating staff account..." : "Create staff account"}
            </ActionButton>
          </form>
        </article>

        <section className="card staff-list-card">
          <div className="staff-list-card__header">
            <div className="card__header">
              <p className="eyebrow">Current Staff</p>
              <h2>Manage role assignment</h2>
              <p className="card__copy">{staffCountLabel} available for review and updates.</p>
            </div>

            <ActionButton type="button" tone="secondary" disabled={isRefreshing} onClick={() => void loadPageData()}>
              {isRefreshing ? "Refreshing..." : "Refresh list"}
            </ActionButton>
          </div>

          {staffUsers.length === 0 ? (
            <p className="empty-state">No staff accounts are available yet.</p>
          ) : (
            <div className="staff-user-list">
              {staffUsers.map((user) => {
                const draftRoleId = roleDrafts[user.userId] ?? user.roleId;
                const isDirty = draftRoleId !== user.roleId;

                return (
                  <article key={user.userId} className="staff-user-card">
                    <div className="staff-user-card__top">
                      <div className="staff-user-card__identity">
                        <h3>{user.fullName}</h3>
                        <p>{user.email}</p>
                      </div>

                      <span className={user.isActive ? "status-pill" : "status-pill status-pill--muted"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <dl className="staff-user-card__meta">
                      <div>
                        <dt>Phone</dt>
                        <dd>{user.phoneNumber}</dd>
                      </div>
                      <div>
                        <dt>Current role</dt>
                        <dd>{user.role}</dd>
                      </div>
                      <div>
                        <dt>Created</dt>
                        <dd>{formatCreatedAt(user.createdAt)}</dd>
                      </div>
                    </dl>

                    <div className="staff-user-card__actions">
                      <Field label="Role">
                        <select
                          className="input"
                          value={draftRoleId}
                          onChange={(event) => {
                            const nextRoleId = Number(event.target.value);
                            setRoleDrafts((current) => ({
                              ...current,
                              [user.userId]: nextRoleId,
                            }));
                          }}
                        >
                          {roleOptions.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <ActionButton
                        type="button"
                        tone="secondary"
                        className="staff-user-card__save"
                        disabled={!isDirty || savingUserId === user.userId || isRefreshing}
                        onClick={() => void saveRole(user.userId)}
                      >
                        {savingUserId === user.userId ? "Saving..." : "Save role"}
                      </ActionButton>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}