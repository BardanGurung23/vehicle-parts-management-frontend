import { api } from "../store/api";

const testimonialApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createTestimonial: builder.mutation({
      query: (body) => ({
        url: "testimonial",
        method: "POST",
        body,
      }),
      invalidatesTags: ["testimonial"],
    }),
    listAllTestimonials: builder.query({
      query: ({ page, limit }) =>
        `testimonial/list?page=${page}&limit=${limit}`,
      providesTags: ["testimonial"],
    }),
    getTestimonialById: builder.query({
      query: (id) => `testimonial/${id}`,
      providesTags: ["testimonial"],
    }),
    updateTestimonialById: builder.mutation({
      query: ({ body, id }) => ({
        url: `testimonial/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["testimonial"],
    }),
    deleteTestimonial: builder.mutation({
      query: (id) => ({
        url: `testimonial/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["testimonial"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateTestimonialMutation,
  useListAllTestimonialsQuery,
  useGetTestimonialByIdQuery,
  useDeleteTestimonialMutation,
  useUpdateTestimonialByIdMutation,
} = testimonialApi;
