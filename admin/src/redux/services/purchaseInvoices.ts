import { api } from "../store/api";
import type {
  CreatePurchaseInvoiceRequest,
  PurchaseInvoice,
} from "../../app/types";

const purchaseInvoicesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPurchaseInvoices: builder.query<PurchaseInvoice[], void>({
      query: () => "admin/purchase-invoices",
      providesTags: ["purchase-invoices"],
    }),
    getPurchaseInvoiceById: builder.query<PurchaseInvoice, number>({
      query: (purchaseInvoiceId) => `admin/purchase-invoices/${purchaseInvoiceId}`,
      providesTags: (_result, _error, purchaseInvoiceId) => [{ type: "purchase-invoices", id: purchaseInvoiceId }],
    }),
    createPurchaseInvoice: builder.mutation<PurchaseInvoice, CreatePurchaseInvoiceRequest>({
      query: (body) => ({
        url: "admin/purchase-invoices",
        method: "POST",
        body,
      }),
      invalidatesTags: ["purchase-invoices", "parts"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPurchaseInvoicesQuery,
  useGetPurchaseInvoiceByIdQuery,
  useCreatePurchaseInvoiceMutation,
} = purchaseInvoicesApi;