import { api } from "../store/api";
import type { FinancialReport } from "../../app/types";

type DailyFinancialReportQuery = {
  date?: string;
};

type MonthlyFinancialReportQuery = {
  year?: number;
  month?: number;
};

type YearlyFinancialReportQuery = {
  year?: number;
};

function toQueryString(entries: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

const financialReportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDailyFinancialReport: builder.query<FinancialReport, DailyFinancialReportQuery | void>({
      query: (arg) => `admin/reports/financial/daily${toQueryString({ date: arg?.date })}`,
      providesTags: ["financial-reports"],
    }),
    getMonthlyFinancialReport: builder.query<FinancialReport, MonthlyFinancialReportQuery | void>({
      query: (arg) => `admin/reports/financial/monthly${toQueryString({ year: arg?.year, month: arg?.month })}`,
      providesTags: ["financial-reports"],
    }),
    getYearlyFinancialReport: builder.query<FinancialReport, YearlyFinancialReportQuery | void>({
      query: (arg) => `admin/reports/financial/yearly${toQueryString({ year: arg?.year })}`,
      providesTags: ["financial-reports"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDailyFinancialReportQuery,
  useGetMonthlyFinancialReportQuery,
  useGetYearlyFinancialReportQuery,
} = financialReportsApi;