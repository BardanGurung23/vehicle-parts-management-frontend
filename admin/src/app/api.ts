import type {
  AuthResponse,
  CreateAppointmentRequest,
  CreateStaffUserInput,
  LoginInput,
  RegisterCustomerInput,
  RegisterCustomerResponse,
  RoleOption,
  StaffUser,
  UpdateStaffRoleInput,
  UserProfile,
  Vehicle,
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

  registerCustomer: (payload: RegisterCustomerInput) =>
    request<RegisterCustomerResponse>("/customers/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

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
    request<import("./types").Appointment[]>("/appointments/me", {}, token),

  createAppointment: (token: string, payload: CreateAppointmentRequest) =>
    request<import("./types").Appointment>("/appointments", {
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