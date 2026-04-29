import { api } from "../store/api";

export interface CustomerDetailResponse {
  customerId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  createdAt: string;
  vehicles: VehicleResponse[];
}

export interface VehicleResponse {
  vehicleId: number;
  vehicleNumber: string;
  vehicleType: string;
  model?: string;
  year?: number;
  createdAt: string;
}

const customersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentCustomer: builder.query<CustomerDetailResponse, void>({
      query: () => "/customers/me",
      providesTags: ["Customer"],
    }),
    getCustomerById: builder.query<CustomerDetailResponse, number>({
      query: (customerId) => `/customers/${customerId}`,
      providesTags: (result, error, id) => [{ type: "Customer", id }],
    }),
    updateProfile: builder.mutation<CustomerDetailResponse, any>({
      query: (body) => ({
        url: "/customers/me",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Customer"],
    }),
    getCustomerAppointments: builder.query<any[], number>({
      query: (customerId) => `/customers/${customerId}/appointments`,
      providesTags: ["Appointment"],
    }),
    getCustomerSales: builder.query<any[], number>({
      query: (customerId) => `/customers/${customerId}/sales`,
      providesTags: ["Sale"],
    }),
  }),
});

export const {
  useGetCurrentCustomerQuery,
  useGetCustomerByIdQuery,
  useUpdateProfileMutation,
  useGetCustomerAppointmentsQuery,
  useGetCustomerSalesQuery,
} = customersApi;
