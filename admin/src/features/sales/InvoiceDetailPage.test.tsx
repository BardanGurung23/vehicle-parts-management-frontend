import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvoiceDetailPage } from "./InvoiceDetailPage";

const getSaleById = vi.fn();

const addImage = vi.fn();
const addPage = vi.fn();
const output = vi.fn();

vi.mock("../../app/auth", () => ({
  useAuth: () => ({
    token: "demo-token",
    user: { role: "Admin" },
  }),
}));

vi.mock("../../app/api", () => ({
  ApiError: class ApiError extends Error {},
  api: {
    getSaleById: (...args: unknown[]) => getSaleById(...args),
    sendSaleInvoiceEmail: vi.fn(),
  },
}));

vi.mock("html2canvas", () => ({
  default: vi.fn().mockResolvedValue({
    width: 1200,
    height: 1600,
    toDataURL: () => "data:image/png;base64,invoice",
  }),
}));

vi.mock("jspdf", () => ({
  default: vi.fn().mockImplementation(() => ({
    addImage,
    addPage,
    output,
  })),
}));

describe("InvoiceDetailPage", () => {
  let createObjectUrl: ReturnType<typeof vi.fn>;
  let revokeObjectUrl: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    getSaleById.mockResolvedValue({
      saleId: 2,
      invoiceNumber: "SAL-20260519052843590",
      customerName: "Demo Customer One",
      customerEmail: "demo.customer1@autonix.local",
      vehicleNumber: null,
      saleDate: "2026-05-19T05:28:43Z",
      subtotal: 9800,
      discountAmount: 980,
      totalAmount: 8820,
      paymentStatus: "Paid",
      dueDate: null,
      notes: null,
      items: [{ partId: 6, partName: "12V Maintenance-Free Battery", quantity: 1, unitPrice: 9800 }],
    });

    output.mockReturnValue(new Blob(["pdf"], { type: "application/pdf" }));
    createObjectUrl = vi.fn(() => "blob:invoice-pdf");
    revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      value: revokeObjectUrl,
    });
  });

  it("starts an explicit PDF download and shows success feedback", async () => {
    render(
      <MemoryRouter initialEntries={["/app/sales/2"]}>
        <Routes>
          <Route path="/app/sales/:saleId" element={<InvoiceDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Invoice SAL-20260519052843590")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));

    await waitFor(() => {
      expect(screen.getByText("PDF download started for SAL-20260519052843590.")).toBeInTheDocument();
    });

    expect(output).toHaveBeenCalledWith("blob");
    expect(createObjectUrl).toHaveBeenCalled();
  });
});