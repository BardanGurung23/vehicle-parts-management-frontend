import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomerDetailPage } from "./CustomerDetailPage";

const getCustomerById = vi.fn();
const getCustomerAppointments = vi.fn();
const getCustomerSales = vi.fn();

vi.mock("../../app/auth", () => ({
  useAuth: () => ({
    token: "demo-token",
  }),
}));

vi.mock("../../app/api", () => ({
  ApiError: class ApiError extends Error {},
  api: {
    getCustomerById: (...args: unknown[]) => getCustomerById(...args),
    getCustomerAppointments: (...args: unknown[]) => getCustomerAppointments(...args),
    getCustomerSales: (...args: unknown[]) => getCustomerSales(...args),
  },
}));

describe("CustomerDetailPage", () => {
  beforeEach(() => {
    getCustomerById.mockResolvedValue({
      customerId: 1,
      userId: 10,
      fullName: "Ava Driver",
      phoneNumber: "555-0100",
      email: "ava@example.com",
      address: "123 Main St",
      registeredAt: "2026-05-01T00:00:00Z",
      vehicles: [{ vehicleId: 5, vehicleNumber: "BA-2-CHA-9999", model: "Civic" }],
    });
    getCustomerAppointments.mockResolvedValue([
      {
        appointmentId: 22,
        customerId: 1,
        customerName: "Ava Driver",
        vehicleId: 5,
        vehicleNumber: "BA-2-CHA-9999",
        vehicleModel: "Civic",
        appointmentDate: "2026-05-10T09:00:00Z",
        serviceType: "Brake inspection",
        status: "Completed",
        notes: "Pads replaced",
        createdAt: "2026-05-01T00:00:00Z",
        hasReview: true,
      },
    ]);
    getCustomerSales.mockResolvedValue([
      {
        saleId: 33,
        invoiceNumber: "SAL-20260510090000000",
        customerName: "Ava Driver",
        vehicleNumber: "BA-2-CHA-9999",
        saleDate: "2026-05-10T09:30:00Z",
        subtotal: 320,
        discountAmount: 0,
        totalAmount: 320,
        paymentStatus: "Paid",
        dueDate: null,
        notes: "Front brake set",
        items: [{ partId: 2, partName: "Brake Pad", quantity: 1, unitPrice: 320 }],
      },
    ]);
  });

  it("renders the consolidated purchase and service history", async () => {
    render(
      <MemoryRouter initialEntries={["/app/customers/1"]}>
        <Routes>
          <Route path="/app/customers/:customerId" element={<CustomerDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Ava Driver")).toBeInTheDocument());

    expect(screen.getByText("Purchase history")).toBeInTheDocument();
    expect(screen.getByText("Service history")).toBeInTheDocument();
    expect(screen.getByText("Brake inspection")).toBeInTheDocument();
    expect(screen.getByText("SAL-20260510090000000")).toBeInTheDocument();
  });
});
