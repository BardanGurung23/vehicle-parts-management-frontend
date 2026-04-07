import { api } from "../store/api";

const crudApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createApi: builder.mutation({
      query: ({ url, body }) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: (_, __, { url }) => {
        const tag = url.split("/");
        return [{ type: tag[0] }];
      },
    }),

    getApi: builder.query({
      query: ({ url, page = 1, limit = 10 }) => url,
      providesTags: (_, __, args) => {
        const tag =
          typeof args === "string" ? args.split("/") : args.url.split("/");
        return [{ type: tag[0] }];
      },
    }),
    updateApi: builder.mutation({
      query: ({ url, body }) => ({
        url,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_, __, { url }) => {
        const tag = url.split("/");
        return [{ type: tag[0] }];
      },
    }),
    patchApi: builder.mutation({
      query: ({ url, body }) => ({
        url,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_, __, { url }) => {
        const tag = url.split("/");
        return [{ type: tag[0] }];
      },
    }),
    deleteApi: builder.mutation({
      query: (url) => ({
        url,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, args) => {
        const tag = args.split("/");
        return [{ type: tag[0] }];
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
  useDeleteApiMutation,
  usePatchApiMutation,
} = crudApi;
