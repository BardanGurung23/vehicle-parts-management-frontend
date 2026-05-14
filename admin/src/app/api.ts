import type {
  AddVehicleInput,
  AuthResponse,
  CreateAppointmentRequest,
  CreatePartRequestInput,
  CreatePartInput,
  CreatePurchaseInvoiceRequest,
  CreateSaleInput,
  CreateCustomerInput,
  CreateReviewRequest,
  CustomerReports,
  CustomerDetail,
  CustomerSearchInput,
  CustomerSearchResult,
  DashboardSummary,
  FinancialReport,
  CreateStaffUserInput,
  LoginInput,
  Part,
  PartRequest,
  PartCategory,
  PurchaseInvoice,
  RegisterCustomerInput,
  RegisterCustomerResponse,
  RoleOption,
  ServiceReview,
  StaffUser,
  UpdateCustomerProfileInput,
  UpdatePartInput,
  UpdateStaffRoleInput,
  UserProfile,
  Vendor,
  Vehicle,
  Appointment,
  Sale,
} from "./types";

const configuredBaseUrl = (import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:5154").replace(/\/+$/, "");

const apiBaseUrl = configuredBaseUrl.endsWith("/api")
  ? configuredBaseUrl
  : `${configuredBaseUrl}/api`;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ProblemDetailsBody = {
  detail?: unknown;
  title?: unknown;
  message?: unknown;
  errors?: unknown;
};

function asMessage(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (typeof body === "string") {
    return asMessage(body) ?? fallback;
  }

  if (!body || typeof body !== "object") {
    return fallback;
  }

  const payload = body as ProblemDetailsBody;
  const directMessage =
    asMessage(payload.detail) ??
    asMessage(payload.message) ??
    asMessage(payload.title);

  if (directMessage) {
    return directMessage;
  }

  if (payload.errors && typeof payload.errors === "object") {
    const messages: string[] = [];

    for (const value of Object.values(payload.errors as Record<string, unknown>)) {
      if (typeof value === "string") {
        const message = asMessage(value);
        if (message) {
          messages.push(message);
        }
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          const message = asMessage(item);
          if (message) {
            messages.push(message);
          }
        }
      }
    }

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return fallback;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = "Request failed.";

    const responseText = await response.text();

    try {
      const errorBody = responseText ? (JSON.parse(responseText) as unknown) : responseText;
      message = extractErrorMessage(errorBody, message);
    } catch {
      message = asMessage(responseText) ?? message;
    }

    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export const api = {
  login: (payload: LoginInput) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getCurrentUser: (token: string) => request<UserProfile>("/auth/me", {}, token),

  getDashboardSummary: (token: string) => request<DashboardSummary>("/dashboard/summary", {}, token),

  getParts: (token: string) => request<Part[]>("/parts", {}, token),

  getPartCategories: (token: string) => request<PartCategory[]>("/parts/categories", {}, token),

  createPart: (token: string, payload: CreatePartInput) =>
    request<Part>("/parts", {
      method: "POST",
      body: JSON.stringify(payload),
    }, token),

  updatePart: (token: string, partId: number, payload: UpdatePartInput) =>
    request<Part>(`/parts/${partId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }, token),

  deletePart: (token: string, partId: number) =>
    request<void>(`/parts/${partId}`, {
      method: "DELETE",
    }, token),

  registerCustomer: (payload: RegisterCustomerInput) =>
    request<RegisterCustomerResponse>("/customers/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  createCustomer: (token: string, payload: CreateCustomerInput) =>
    request<CustomerDetail>("/customers", {
      method: "POST",
      body: JSON.stringify(payload),
    }, token),

  getCurrentCustomer: (token: string) => request<CustomerDetail>("/customers/me", {}, token),

  updateCurrentCustomer: (token: string, payload: UpdateCustomerProfileInput) =>
    request<CustomerDetail>("/customers/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    }, token),

  addCurrentCustomerVehicle: (token: string, payload: AddVehicleInput) =>
    request<Vehicle>("/customers/me/vehicles", {
      method: "POST",
      body: JSON.stringify({
        vehicleNumber: payload.vehicleNumber,
        model: payload.vehicleModel,
      }),
    }, token),

  updateCurrentCustomerVehicle: (token: string, vehicleId: number, payload: AddVehicleInput) =>
    request<Vehicle>(`/customers/me/vehicles/${vehicleId}`, {
      method: "PUT",
      body: JSON.stringify({
        vehicleNumber: payload.vehicleNumber,
        model: payload.vehicleModel,
      }),
    }, token),

  removeCurrentCustomerVehicle: (token: string, vehicleId: number) =>
    request<CustomerDetail>(`/customers/me/vehicles/${vehicleId}`, {
      method: "DELETE",
    }, token),

  getCustomerById: (token: string, customerId: number) =>
    request<CustomerDetail>(`/customers/${customerId}`, {}, token),

  getCustomerAppointments: (token: string, customerId: number) =>
    request<Appointment[]>(`/customers/${customerId}/appointments`, {}, token),

  getCustomerSales: (token: string, customerId: number) =>
    request<Sale[]>(`/customers/${customerId}/sales`, {}, token),

  searchCustomers: (token: string, payload: CustomerSearchInput) => {
    const searchParams = new URLSearchParams();

    if (payload.customerId) {
      searchParams.set("customerId", String(payload.customerId));
    }

    if (payload.phoneNumber) {
      searchParams.set("phoneNumber", payload.phoneNumber);
    }

    if (payload.vehicleNumber) {
      searchParams.set("vehicleNumber", payload.vehicleNumber);
    }

    if (payload.name) {
      searchParams.set("name", payload.name);
    }

    const queryString = searchParams.toString();
    const path = queryString ? `/customers/search?${queryString}` : "/customers/search";

    return request<CustomerSearchResult[]>(path, {}, token);
  },

  getStaffUsers: (token: string) => request<StaffUser[]>("/admin/staff", {}, token),

  getAssignableRoles: (token: string) =>
    request<RoleOption[]>("/admin/staff/roles", {}, token),

  createStaffUser: (token: string, payload: CreateStaffUserInput) =>
    request<StaffUser>("/admin/staff", {
      method: "POST",
      body: JSON.stringify(payload),
    }, token),

  updateStaffRole: (token: string, userId: number, payload: UpdateStaffRoleInput) =>
    request<StaffUser>(`/admin/staff/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }, token),

  getMyVehicles: (token: string) =>
    request<Vehicle[]>("/customers/me/vehicles", {}, token),

  getMyAppointments: (token: string) =>
    request<Appointment[]>("/appointments/me", {}, token),

  getMySales: (token: string) =>
    request<Sale[]>("/sales/me", {}, token),

  createSale: (token: string, payload: CreateSaleInput) =>
    request<Sale>("/sales", {
      method: "POST",
      body: JSON.stringify(payload),
    }, token),

  createAppointment: (token: string, payload: CreateAppointmentRequest) =>
    request<Appointment>("/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    }, token),

  createVehicle: (token: string, payload: { vehicleNumber: string; model?: string }) =>
    request<Vehicle>("/customers/me/vehicles", {
      method: "POST",
      body: JSON.stringify(payload),
    }, token),

  createReview: (token: string, payload: CreateReviewRequest) =>
    request<ServiceReview>("/reviews", {
      method: "POST",
      body: JSON.stringify(payload),
    }, token),

  getDailyFinancialReport: (token: string, params: { date?: string }) => {
    const searchParams = new URLSearchParams();

    if (params.date) {
      searchParams.set("date", params.date);
    }

    const queryString = searchParams.toString();
    const path = queryString ? `/admin/reports/financial/daily?${queryString}` : "/admin/reports/financial/daily";

    return request<FinancialReport>(path, {}, token);
  },

  getMonthlyFinancialReport: (token: string, params: { year?: number; month?: number }) => {
    const searchParams = new URLSearchParams();

    if (typeof params.year === "number" && Number.isFinite(params.year)) {
      searchParams.set("year", String(params.year));
    }

    if (typeof params.month === "number" && Number.isFinite(params.month)) {
      searchParams.set("month", String(params.month));
    }

    const queryString = searchParams.toString();
    const path = queryString ? `/admin/reports/financial/monthly?${queryString}` : "/admin/reports/financial/monthly";

    return request<FinancialReport>(path, {}, token);
  },

  getYearlyFinancialReport: (token: string, params: { year?: number }) => {
    const searchParams = new URLSearchParams();

    if (typeof params.year === "number" && Number.isFinite(params.year)) {
      searchParams.set("year", String(params.year));
    }

    const queryString = searchParams.toString();
    const path = queryString ? `/admin/reports/financial/yearly?${queryString}` : "/admin/reports/financial/yearly";

    return request<FinancialReport>(path, {}, token);
  },

  getVendors: (token: string) => request<Vendor[]>("/admin/vendors", {}, token),

  getPurchaseInvoices: (token: string) => request<PurchaseInvoice[]>("/admin/purchase-invoices", {}, token),

  createPurchaseInvoice: (token: string, payload: CreatePurchaseInvoiceRequest) =>
    request<PurchaseInvoice>("/admin/purchase-invoices", {
      method: "POST",
      body: JSON.stringify(payload),
    }, token),

  createPartRequest: (token: string, payload: CreatePartRequestInput) =>
    request<PartRequest>("/part-requests", {
      method: "POST",
      body: JSON.stringify(payload),
    }, token),

  getMyPartRequests: (token: string) => request<PartRequest[]>("/part-requests/me", {}, token),

  getCustomerReports: (
    token: string,
    params: { startDate?: string; endDate?: string; highSpenderThreshold?: number },
  ) => {
    const searchParams = new URLSearchParams();

    if (params.startDate) {
      searchParams.set("startDate", params.startDate);
    }

    if (params.endDate) {
      searchParams.set("endDate", params.endDate);
    }

    if (typeof params.highSpenderThreshold === "number" && Number.isFinite(params.highSpenderThreshold)) {
      searchParams.set("highSpenderThreshold", String(params.highSpenderThreshold));
    }

    const queryString = searchParams.toString();
    const path = queryString ? `/reports/customers?${queryString}` : "/reports/customers";

    return request<CustomerReports>(path, {}, token);
  },

  getMyReviews: (token: string) =>
    request<ServiceReview[]>("/reviews/me", {}, token),

  getReviewByAppointment: (token: string, appointmentId: number) =>
    request<ServiceReview>(`/reviews/appointment/${appointmentId}`, {}, token),

  createCustomerWithVehicle: (token: string, payload: {
    fullName: string;
    phoneNumber: string;
    email?: string;
    address?: string;
    vehicleNumber: string;
    vehicleModel?: string;
  }) =>
    request<{ customerId: number; vehicleId: number }>("/customers", {
      method: "POST",
      body: JSON.stringify(payload),
    }, token),
};