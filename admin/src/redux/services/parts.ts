import { api } from "../store/api";

export interface PartCategory {
  partCategoryId: number;
  categoryName: string;
  description?: string;
}

export interface Part {
  partId: number;
  partNumber: string;
  partName: string;
  description?: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  partCategoryId?: number;
  categoryName?: string;
  createdAt: string;
}

export interface CreatePartRequest {
  partNumber: string;
  partName: string;
  description?: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  partCategoryId?: number | null;
}

export interface UpdatePartRequest {
  partName: string;
  description?: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  partCategoryId?: number | null;
}

const partsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getParts: builder.query<Part[], void>({
      query: () => "parts",
      providesTags: ["parts"],
    }),
    getPartById: builder.query<Part, number>({
      query: (id) => `parts/${id}`,
      providesTags: ["parts"],
    }),
    getPartCategories: builder.query<PartCategory[], void>({
      query: () => "parts/categories",
      providesTags: ["parts"],
    }),
    createPart: builder.mutation<Part, CreatePartRequest>({
      query: (body) => ({ url: "parts", method: "POST", body }),
      invalidatesTags: ["parts"],
    }),
    updatePart: builder.mutation<Part, { partId: number; body: UpdatePartRequest }>({
      query: ({ partId, body }) => ({ url: `parts/${partId}`, method: "PUT", body }),
      invalidatesTags: ["parts"],
    }),
    deletePart: builder.mutation<void, number>({
      query: (partId) => ({ url: `parts/${partId}`, method: "DELETE" }),
      invalidatesTags: ["parts"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPartsQuery,
  useGetPartByIdQuery,
  useGetPartCategoriesQuery,
  useCreatePartMutation,
  useUpdatePartMutation,
  useDeletePartMutation,
} = partsApi;
