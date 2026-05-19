import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomerReportsPage } from "./CustomerReportsPage";

const getCustomerReports = vi.fn();
const getCustomerById = vi.fn();
const getCustomerSales = vi.fn();

vi.mock("../../app/auth", () => ({
  useAuth: () => ({
    token: "demo-token",
  }),
}));

vi.mock("../../app/api", () => ({
  ApiError: class ApiError extends Error {},
  api: {
    getCustomerReports: (...args: unknown[]) => getCustomerReports(...args),
    getCustomerById: (...args: unknown[]) => getCustomerById(...args),
    getCustomerSales: (...args: unknown[]) => getCustomerSales(...args),
  },
}));

describe("CustomerReportsPage", () => {
  beforeEach(() => {
    getCustomerReports.mockResolvedValue({
      reportType: "Customer",
      periodLabel: "2026-04-15 to 2026-05-14",
      rangeStart: "2026-04-15T00:00:00Z",
      rangeEndExclusive: "2026-05-15T00:00:00Z",
      highSpenderThreshold: 5000,
      regularCustomerCount: 4,
      highSpenderCount: 1,
      pendingCreditCustomerCount: 2,
      overdueCreditCustomerCount: 1,
      regularCustomers: [
        {
          customerId: 7,
          fullName: "Nina Driver",
          phoneNumber: "555-0199",
          email: "nina@example.com",
          totalSpent: 6200,
          saleCount: 3,
          appointmentCount: 2,
          pendingInvoiceCount: 1,
          overdueInvoiceCount: 1,
          outstandingAmount: 1200,
          lastActivityAt: "2026-05-12T10:00:00Z",
        },
      ],
      highSpenders: [
        {
          customerId: 7,
          fullName: "Nina Driver",
          phoneNumber: "555-0199",
          email: "nina@example.com",
          totalSpent: 6200,
          saleCount: 3,
          appointmentCount: 2,
          pendingInvoiceCount: 1,
          overdueInvoiceCount: 1,
          outstandingAmount: 1200,
          lastActivityAt: "2026-05-12T10:00:00Z",
        },
      ],
      pendingCredits: [
        {
          customerId: 7,
          fullName: "Nina Driver",
          phoneNumber: "555-0199",
          email: "nina@example.com",
          totalSpent: 6200,
          saleCount: 3,
          appointmentCount: 2,
          pendingInvoiceCount: 1,
          overdueInvoiceCount: 1,
          outstandingAmount: 1200,
          lastActivityAt: "2026-05-12T10:00:00Z",
        },
      ],
    });

    getCustomerById.mockResolvedValue({
      customerId: 7,
      userId: 77,
      fullName: "Nina Driver",
      phoneNumber: "555-0199",
      email: "nina@example.com",
      address: "Kathmandu",
      registeredAt: "2026-04-10T09:00:00Z",
      vehicles: [
        {
          vehicleId: 91,
          vehicleNumber: "BA 1 PA 1234",
          model: "Model S",
        },
      ],
    });

    getCustomerSales.mockResolvedValue([
      {
        saleId: 10,
        invoiceNumber: "SAL-202605120001",
        customerName: "Nina Driver",
        customerEmail: "nina@example.com",
        vehicleNumber: "BA 1 PA 1234",
        saleDate: "2026-05-12T10:00:00Z",
        subtotal: 1400,
        discountAmount: 200,
        totalAmount: 1200,
        paymentStatus: "Credit",
        dueDate: "2026-05-20T00:00:00Z",
        notes: "Invoice for brake service",
        items: [
          {
            partId: 4,
            partName: "Brake Pad Kit",
            quantity: 2,
            unitPrice: 700,
            lineTotal: 1400,
          },
        ],
      },
    ]);
  });

  it("renders customer report metrics and rows", async () => {
    render(
      <MemoryRouter>
        <CustomerReportsPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Customer Reports")).toBeInTheDocument());

    expect(screen.getByText("Regular customers")).toBeInTheDocument();
    expect(screen.getByText("Nina Driver")).toBeInTheDocument();
    expect(screen.getByText("$6,200.00")).toBeInTheDocument();
  });

  it("opens invoice details for a selected customer row", async () => {
    render(
      <MemoryRouter>
        <CustomerReportsPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Customer Reports")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "View details" }));

    await waitFor(() => expect(screen.getByText("Nina Driver invoice details")).toBeInTheDocument());

    expect(screen.getAllByText("SAL-202605120001")[0]).toBeInTheDocument();
    expect(screen.getByText("Portal account")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download invoice" })).toBeInTheDocument();
  });
});
