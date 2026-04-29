import { api } from "../../redux/store/api";
import type { Vendor, CreateVendorRequest } from "../../app/types";

export const vendorsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllVendors: builder.query<Vendor[], void>({
      query: () => "admin/vendors",
      providesTags: ["vendors"],
    }),
    getVendorById: builder.query<Vendor, number>({
      query: (id) => `admin/vendors/${id}`,
      providesTags: (_result, _error, id) => [{ type: "vendors", id }],
    }),
    createVendor: builder.mutation<Vendor, CreateVendorRequest>({
      query: (body) => ({
        url: "admin/vendors",
        method: "POST",
        body,
      }),
      invalidatesTags: ["vendors"],
    }),
    updateVendor: builder.mutation<Vendor, { id: number; body: Partial<CreateVendorRequest> }>({
      query: ({ id, body }) => ({
        url: `admin/vendors/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "vendors", id }],
    }),
    deleteVendor: builder.mutation<void, number>({
      query: (id) => ({
        url: `admin/vendors/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["vendors"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetAllVendorsQuery,
  useGetVendorByIdQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
} = vendorsApi;
