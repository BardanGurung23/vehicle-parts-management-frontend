import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import {
  useCreateStaffMutation,
  useGetAssignableRolesQuery,
  useUpdateStaffRoleMutation,
  StaffUser,
} from "@/redux/services/staff";
import { toast } from "react-toastify";

const createSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(7, "Phone number must be at least 7 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roleId: z.coerce.number().min(1, "Please select a role"),
});

const editRoleSchema = z.object({
  roleId: z.coerce.number().min(1, "Please select a role"),
});

type CreateFormType = z.infer<typeof createSchema>;
type EditRoleFormType = z.infer<typeof editRoleSchema>;

type Props = {
  editUser: StaffUser | null;
  onClose: () => void;
};

export default function StaffForm({ editUser, onClose }: Readonly<Props>) {
  const isEdit = editUser !== null;
  const { data: roles = [] } = useGetAssignableRolesQuery();
  const [createStaff, { isLoading: creating }] = useCreateStaffMutation();
  const [updateRole, { isLoading: updating }] = useUpdateStaffRoleMutation();

  const createForm = useForm<CreateFormType>({ resolver: zodResolver(createSchema) });
  const editForm = useForm<EditRoleFormType>({ resolver: zodResolver(editRoleSchema) });

  useEffect(() => {
    if (isEdit) {
      editForm.reset({ roleId: editUser.roleId });
    }
  }, [editUser]);

  const onCreateSubmit = async (data: CreateFormType) => {
    try {
      await createStaff(data).unwrap();
      toast.success("Staff member created successfully");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.title ?? err?.data?.message ?? "Failed to create staff");
    }
  };

  const onEditSubmit = async (data: EditRoleFormType) => {
    try {
      await updateRole({ userId: editUser!.userId, roleId: data.roleId }).unwrap();
      toast.success("Role updated successfully");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.title ?? err?.data?.message ?? "Failed to update role");
    }
  };

  if (isEdit) {
    return (
      <div className="mt-16 space-y-6">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Staff Member</p>
          <p className="font-semibold text-lg">{editUser.fullName}</p>
          <p className="text-sm text-gray-500">{editUser.email}</p>
        </div>
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Assign Role</label>
            <select
              {...editForm.register("roleId")}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.roleId} value={r.roleId}>{r.name}</option>
              ))}
            </select>
            {editForm.formState.errors.roleId && (
              <p className="text-red-500 text-xs mt-1">{editForm.formState.errors.roleId.message}</p>
            )}
          </div>
          <Button type="submit" className="submit-button" disabled={updating}>
            {updating ? "Saving..." : "Update Role"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="mt-16 space-y-4">
      <Input
        label="Full Name"
        placeholder="John Doe"
        {...createForm.register("fullName")}
        error={createForm.formState.errors.fullName?.message}
      />
      <Input
        label="Email"
        placeholder="staff@example.com"
        type="email"
        {...createForm.register("email")}
        error={createForm.formState.errors.email?.message}
      />
      <Input
        label="Phone Number"
        placeholder="9800000000"
        {...createForm.register("phoneNumber")}
        error={createForm.formState.errors.phoneNumber?.message}
      />
      <Input
        label="Password"
        placeholder="Min 8 characters"
        type="password"
        {...createForm.register("password")}
        error={createForm.formState.errors.password?.message}
      />
      <div>
        <label className="block text-sm font-medium mb-1">Role</label>
        <select
          {...createForm.register("roleId")}
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select role</option>
          {roles.map((r) => (
            <option key={r.roleId} value={r.roleId}>{r.name}</option>
          ))}
        </select>
        {createForm.formState.errors.roleId && (
          <p className="text-red-500 text-xs mt-1">{createForm.formState.errors.roleId.message}</p>
        )}
      </div>
      <Button type="submit" className="submit-button" disabled={creating}>
        {creating ? "Creating..." : "Create Staff"}
      </Button>
    </form>
  );
}
