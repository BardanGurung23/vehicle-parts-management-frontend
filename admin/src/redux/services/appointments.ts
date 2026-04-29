import { APPOINTMENTS_URL } from "../../constants/apiUrlConstants";
import type { Appointment } from "../../app/types";
import { api } from "../store/api";

export const appointmentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllAppointments: builder.query<Appointment[], void>({
      query: () => `${APPOINTMENTS_URL}list`,
      providesTags: ["appointments"],
    }),
    updateAppointmentStatus: builder.mutation<
      void,
      { appointmentId: number; status: string }
    >({
      query: ({ appointmentId, status }) => ({
        url: `appointments/${appointmentId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["appointments"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetAllAppointmentsQuery,
  useUpdateAppointmentStatusMutation,
} = appointmentsApi;
