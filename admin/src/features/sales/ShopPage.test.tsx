import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShopPage } from "./ShopPage";

const getParts = vi.fn();
const getCustomers = vi.fn();
const getDashboardSummary = vi.fn();

vi.mock("../../app/auth", () => ({
  useAuth: () => ({
    token: "demo-token",
    user: { role: "Staff" },
  }),
}));

vi.mock("../../app/api", () => ({
  ApiError: class ApiError extends Error {},
  resolveBackendAssetUrl: () => null,
  api: {
    getParts: (...args: unknown[]) => getParts(...args),
    getCustomers: (...args: unknown[]) => getCustomers(...args),
    getDashboardSummary: (...args: unknown[]) => getDashboardSummary(...args),
    searchCustomers: vi.fn(),
    createSale: vi.fn(),
  },
}));

vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("ShopPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getParts.mockResolvedValue([
      {
        partId: 6,
        partNumber: "ELC-BAT-001",
        partName: "12V Maintenance-Free Battery",
        description: "Battery",
        imageUrl: null,
        unitPrice: 9800,
        costPrice: 7600,
        stockQuantity: 4,
        reorderLevel: 6,
        categoryName: "Electrical",
        createdAt: "2026-05-01T00:00:00Z",
      },
    ]);
    getCustomers.mockResolvedValue([
      {
        customerId: 1,
        userId: 101,
        fullName: "Demo Customer One",
        phoneNumber: "+9779803003001",
        email: "demo.customer1@autonix.local",
        vehicleCount: 1,
        vehicles: [{ vehicleId: 3, vehicleNumber: "BA 2 PA 3001", model: "Civic" }],
      },
    ]);
    getDashboardSummary.mockResolvedValue({
      inventory: {
        trackedPartCount: 12,
        lowStockCount: 2,
        outOfStockCount: 0,
        totalUnitsOnHand: 187,
        inventoryCost: 367810,
        stockStatus: [],
        topCategories: [
          { label: "Body Parts", count: 2 },
          { label: "Brakes", count: 2 },
        ],
        lowStockParts: [
          {
            partId: 6,
            partNumber: "ELC-BAT-001",
            partName: "12V Maintenance-Free Battery",
            stockQuantity: 4,
            reorderLevel: 6,
            categoryName: "Electrical",
            createdAt: "2026-05-01T00:00:00Z",
          },
        ],
        recentParts: [],
      },
      alerts: {
        activeAlertCount: 2,
        lowStockAlertCount: 1,
        overdueCreditAlertCount: 0,
        predictiveAlertCount: 1,
        generatedAt: "2026-05-19T05:00:00Z",
        lowStockAlerts: [],
        overdueCreditAlerts: [],
        predictiveAlerts: [
          {
            predictiveAlertId: 10,
            customerId: 1,
            customerName: "Demo Customer One",
            vehicleId: 3,
            vehicleNumber: "BA 2 PA 3001",
            partId: 8,
            partName: "Premium Brake Pad Set",
            alertMessage: "Brake pad wear indicates replacement may be needed soon.",
            riskLevel: "High",
            status: "Active",
            createdAt: "2026-05-19T05:00:00Z",
          },
        ],
      },
      currentCustomer: null,
    });
  });

  it("renders shop insights and updates customer signals when a customer is selected", async () => {
    render(
      <MemoryRouter>
        <ShopPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("AI Shop Insights")).toBeInTheDocument());

    expect(screen.getByText("Body Parts · 2")).toBeInTheDocument();
    expect(screen.getByText("Select a customer to unlock customer-specific maintenance and part-risk insights.")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } });

    await waitFor(() => {
      expect(screen.getByText("BA 2 PA 3001 · Premium Brake Pad Set")).toBeInTheDocument();
    });

    expect(screen.getByText("Portal account")).toBeInTheDocument();
    expect(screen.getByText("1 registered account prioritized for faster staff checkout.")).toBeInTheDocument();
  });
});