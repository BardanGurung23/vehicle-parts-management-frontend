import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PartsPage from "./PartsPage";

const getParts = vi.fn();
const getPartCategories = vi.fn();
const deletePart = vi.fn();
const toastError = vi.fn();
const toastSuccess = vi.fn();

vi.mock("../../app/auth", () => ({
  useAuth: () => ({
    isAdmin: true,
    token: "demo-token",
  }),
}));

vi.mock("../../app/api", () => ({
  ApiError: class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  resolveBackendAssetUrl: () => null,
  api: {
    getParts: (...args: unknown[]) => getParts(...args),
    getPartCategories: (...args: unknown[]) => getPartCategories(...args),
    deletePart: (...args: unknown[]) => deletePart(...args),
  },
}));

vi.mock("react-toastify", () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
    success: (...args: unknown[]) => toastSuccess(...args),
  },
}));

describe("PartsPage", () => {
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
    getPartCategories.mockResolvedValue([]);
  });

  it("shows the normalized ApiError message when deleting a referenced part fails", async () => {
    deletePart.mockRejectedValueOnce(new (await import("../../app/api")).ApiError(
      "This part cannot be deleted because it is already referenced by sales or purchase invoices.",
      400,
    ));

    render(
      <MemoryRouter>
        <PartsPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("12V Maintenance-Free Battery")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        "This part cannot be deleted because it is already referenced by sales or purchase invoices.",
      );
    });
  });
});