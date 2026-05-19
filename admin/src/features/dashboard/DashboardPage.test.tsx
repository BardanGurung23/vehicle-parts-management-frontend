import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./DashboardPage";

const getDashboardSummary = vi.fn();

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.mock("../../app/auth", () => ({
  useAuth: () => ({
    token: "demo-token",
    user: { role: "Staff", isActive: true },
  }),
}));

vi.mock("../../app/api", () => ({
  ApiError: class ApiError extends Error {},
  api: {
    getDashboardSummary: (...args: unknown[]) => getDashboardSummary(...args),
    searchCustomers: vi.fn(),
  },
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);

    getDashboardSummary.mockResolvedValue({
      inventory: {
        trackedPartCount: 1,
        lowStockCount: 1,
        outOfStockCount: 0,
        totalUnitsOnHand: 3,
        inventoryCost: 240,
        stockStatus: [],
        topCategories: [],
        lowStockParts: [],
        recentParts: [],
      },
      alerts: {
        activeAlertCount: 0,
        lowStockAlertCount: 0,
        overdueCreditAlertCount: 0,
        predictiveAlertCount: 0,
        generatedAt: "2026-05-19T05:00:00Z",
        lowStockAlerts: [],
        overdueCreditAlerts: [],
        predictiveAlerts: [],
      },
      recentRegisteredCustomers: [
        {
          customerId: 7,
          userId: 77,
          fullName: "Nina Driver",
          phoneNumber: "+9779800000077",
          email: "nina@example.com",
          vehicleCount: 1,
          vehicles: [{ vehicleId: 91, vehicleNumber: "BA 1 PA 1234", model: "Model S" }],
        },
      ],
    });
  });

  it("renders recent registered accounts for staff", async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Recent Registered Accounts")).toBeInTheDocument());

    expect(screen.getByText("Nina Driver")).toBeInTheDocument();
    expect(screen.getByText("Portal account")).toBeInTheDocument();
  });
});