import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getToken } from "../../utils/tokenHandler";
import { BACKEND_BASE_URL } from "../../constants";

const configuredBaseUrl = (BACKEND_BASE_URL || "http://localhost:5154").replace(/\/+$/, "");

const apiBaseUrl = configuredBaseUrl.endsWith("/api")
  ? configuredBaseUrl
  : `${configuredBaseUrl}/api`;

const baseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  prepareHeaders: (headers) => {
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    } else {
      headers.delete("content-type");
    }

    const token = getToken("token");
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "users",
    "role",
    "media-category",
    "media",
    "department",
    "interview",
    "question",
    "cliparts",
    "seo",
    "social",
    "setting",
    "faq",
    "notification",
    "email-template",
    "smtp",
    "product-category",
    "product",
    "product-variant",
    "testimonial",
    "staff",
    "parts",
    "appointments",
    "vendors",
    "purchase-invoices",
    "financial-reports",
  ],
  endpoints: () => ({}),
});
