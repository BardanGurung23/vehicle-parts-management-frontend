import { api } from "../store/api";

export interface StaffUser {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  roleId: number;
  isActive: boolean;
  createdAt: string;
}

export interface RoleOption {
  roleId: number;
  name: string;
  description?: string;
}

export interface CreateStaffRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  roleId: number;
}

const staffApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStaff: builder.query<StaffUser[], void>({
      query: () => "admin/staff",
      providesTags: ["staff"],
    }),
    createStaff: builder.mutation<StaffUser, CreateStaffRequest>({
      query: (body) => ({ url: "admin/staff", method: "POST", body }),
      invalidatesTags: ["staff"],
    }),
    updateStaffRole: builder.mutation<StaffUser, { userId: number; roleId: number }>({
      query: ({ userId, roleId }) => ({
        url: `admin/staff/${userId}/role`,
        method: "PUT",
        body: { roleId },
      }),
      invalidatesTags: ["staff"],
    }),
    getAssignableRoles: builder.query<RoleOption[], void>({
      query: () => "admin/staff/roles",
      providesTags: ["staff"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffRoleMutation,
  useGetAssignableRolesQuery,
} = staffApi;
