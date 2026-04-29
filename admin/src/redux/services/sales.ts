import { api } from "../store/api";

export interface SaleItem {
  partId: number;
  partName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  saleId: number;
  invoiceNumber: string;
  customerName: string;
  vehicleNumber: string | null;
  saleDate: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  notes: string | null;
  items: SaleItem[];
}

export interface CreateSaleItemRequest {
  partId: number;
  quantity: number;
}

export interface CreateSaleRequest {
  customerId?: number;
  vehicleId?: number;
  items: CreateSaleItemRequest[];
  notes?: string;
}

const salesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMySales: builder.query<Sale[], void>({
      query: () => "/sales/me",
      providesTags: ["Sale"],
    }),
    getSaleById: builder.query<Sale, number>({
      query: (saleId) => `/sales/${saleId}`,
      providesTags: (result, error, id) => [{ type: "Sale", id }],
    }),
    createSale: builder.mutation<Sale, CreateSaleRequest>({
      query: (body) => ({
        url: "/sales",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sale"],
    }),
  }),
});

export const { useGetMySalesQuery, useGetSaleByIdQuery, useCreateSaleMutation } = salesApi;
