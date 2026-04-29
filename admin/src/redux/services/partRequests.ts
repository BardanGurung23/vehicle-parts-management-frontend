import { api } from "../store/api";

export interface PartRequestResponse {
  requestId: number;
  customerId: number;
  customerName: string;
  vehicleId?: number;
  vehicleNumber?: string;
  requestedPartName: string;
  requestDetails?: string;
  status: string;
  requestedAt: string;
  resolvedAt?: string;
}

export interface CreatePartRequestRequest {
  vehicleId?: number;
  requestedPartName: string;
  requestDetails?: string;
}

export interface UpdatePartRequestStatusRequest {
  status: string;
}

const partRequestsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createPartRequest: builder.mutation<PartRequestResponse, CreatePartRequestRequest>({
      query: (body) => ({
        url: "/part-requests",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PartRequest"],
    }),
    getMyPartRequests: builder.query<PartRequestResponse[], void>({
      query: () => "/part-requests/me",
      providesTags: ["PartRequest"],
    }),
    getAllPartRequests: builder.query<PartRequestResponse[], void>({
      query: () => "/part-requests",
      providesTags: ["PartRequest"],
    }),
    getPartRequestById: builder.query<PartRequestResponse, number>({
      query: (requestId) => `/part-requests/${requestId}`,
      providesTags: (result, error, id) => [{ type: "PartRequest", id }],
    }),
    updatePartRequestStatus: builder.mutation<
      PartRequestResponse,
      { requestId: number; status: string }
    >({
      query: ({ requestId, status }) => ({
        url: `/part-requests/${requestId}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["PartRequest"],
    }),
  }),
});

export const {
  useCreatePartRequestMutation,
  useGetMyPartRequestsQuery,
  useGetAllPartRequestsQuery,
  useGetPartRequestByIdQuery,
  useUpdatePartRequestStatusMutation,
} = partRequestsApi;
