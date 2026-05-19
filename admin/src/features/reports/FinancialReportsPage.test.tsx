import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FinancialReportsPage } from "./FinancialReportsPage";

const getDailyFinancialReport = vi.fn();
const getMonthlyFinancialReport = vi.fn();
const getYearlyFinancialReport = vi.fn();
const getAllTimeFinancialReport = vi.fn();

vi.mock("../../app/auth", () => ({
  useAuth: () => ({
    token: "demo-token",
  }),
}));

vi.mock("../../app/api", () => ({
  ApiError: class ApiError extends Error {},
  api: {
    getDailyFinancialReport: (...args: unknown[]) => getDailyFinancialReport(...args),
    getMonthlyFinancialReport: (...args: unknown[]) => getMonthlyFinancialReport(...args),
    getYearlyFinancialReport: (...args: unknown[]) => getYearlyFinancialReport(...args),
    getAllTimeFinancialReport: (...args: unknown[]) => getAllTimeFinancialReport(...args),
  },
}));

describe("FinancialReportsPage", () => {
  beforeEach(() => {
    const monthlyReport = {
      reportType: "Monthly",
      periodLabel: "2026-05",
      rangeStart: "2026-05-01T00:00:00Z",
      rangeEndExclusive: "2026-06-01T00:00:00Z",
      revenue: 5400,
      discounts: 400,
      purchaseCosts: 2200,
      grossProfit: 3200,
      saleCount: 12,
      purchaseInvoiceCount: 4,
      entries: [
        {
          label: "2026-05-01",
          revenue: 1200,
          discounts: 100,
          purchaseCosts: 400,
          grossProfit: 800,
          saleCount: 3,
          purchaseInvoiceCount: 1,
        },
      ],
    };

    const allTimeReport = {
      ...monthlyReport,
      reportType: "All Time",
      periodLabel: "All time · 2025-2026",
      rangeStart: "2025-01-01T00:00:00Z",
      rangeEndExclusive: "2027-01-01T00:00:00Z",
      entries: [
        {
          label: "2025",
          revenue: 3500,
          discounts: 200,
          purchaseCosts: 1200,
          grossProfit: 2300,
          saleCount: 8,
          purchaseInvoiceCount: 2,
        },
        {
          label: "2026",
          revenue: 5400,
          discounts: 400,
          purchaseCosts: 2200,
          grossProfit: 3200,
          saleCount: 12,
          purchaseInvoiceCount: 4,
        },
      ],
    };

    getMonthlyFinancialReport.mockResolvedValue(monthlyReport);
    getDailyFinancialReport.mockResolvedValue(monthlyReport);
    getYearlyFinancialReport.mockResolvedValue(monthlyReport);
    getAllTimeFinancialReport.mockResolvedValue(allTimeReport);
  });

  it("loads the default monthly report and switches to all-time with export actions", async () => {
    render(
      <MemoryRouter>
        <FinancialReportsPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Financial Reports")).toBeInTheDocument());
    expect(getMonthlyFinancialReport).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "All Time" }));

    await waitFor(() => expect(getAllTimeFinancialReport).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText("All time · 2025-2026")).toBeInTheDocument());

    expect(screen.getByRole("button", { name: "Export CSV" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeInTheDocument();
  });
});