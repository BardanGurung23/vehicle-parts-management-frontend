import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShopPage } from "./ShopPage";

/**
 * The shop catalog and customer picker were redesigned in the polish pass:
 *   - the inline "AI Shop Insights" panel was replaced with an integrated
 *     low-stock watchlist beside the catalog;
 *   - the customer picker is an inline dropdown anchored to the cart card,
 *     not a modal.
 *
 * These tests cover the new contract:
 *   - the catalog renders parts and the low-stock watchlist surfaces signal
 *     items;
 *   - clicking the picker trigger opens a listbox; selecting a row swaps
 *     the cart's customer chip.
 */

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
        topCategories: [],
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
        activeAlertCount: 0,
        lowStockAlertCount: 1,
        overdueCreditAlertCount: 0,
        predictiveAlertCount: 0,
        generatedAt: "2026-05-19T05:00:00Z",
        lowStockAlerts: [],
        overdueCreditAlerts: [],
        predictiveAlerts: [],
      },
      currentCustomer: null,
    });
  });

  it("renders the catalog and the low-stock watchlist", async () => {
    render(
      <MemoryRouter>
        <ShopPage />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getAllByText("12V Maintenance-Free Battery").length,
      ).toBeGreaterThan(0),
    );
    expect(screen.getByText("Low-stock watchlist")).toBeInTheDocument();
  });

  it("selects a customer through the dropdown picker", async () => {
    render(
      <MemoryRouter>
        <ShopPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Cart")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /select customer/i }));

    const option = await screen.findByRole("option", { name: /demo customer one/i });
    fireEvent.click(option);

    await waitFor(() =>
      expect(screen.getByText("Demo Customer One")).toBeInTheDocument(),
    );
    expect(screen.getByText(/#1 ·/)).toBeInTheDocument();
  });
});
