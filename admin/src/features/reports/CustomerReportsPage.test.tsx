import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomerReportsPage } from "./CustomerReportsPage";

const getCustomerReports = vi.fn();

vi.mock("../../app/auth", () => ({
  useAuth: () => ({
    token: "demo-token",
  }),
}));

vi.mock("../../app/api", () => ({
  ApiError: class ApiError extends Error {},
  api: {
    getCustomerReports: (...args: unknown[]) => getCustomerReports(...args),
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
});
