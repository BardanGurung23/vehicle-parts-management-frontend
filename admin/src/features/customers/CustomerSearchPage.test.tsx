import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomerSearchPage } from "./CustomerSearchPage";

const getCustomers = vi.fn();
const searchCustomers = vi.fn();

vi.mock("../../app/auth", () => ({
  useAuth: () => ({
    token: "demo-token",
  }),
}));

vi.mock("../../app/api", () => ({
  ApiError: class ApiError extends Error {},
  api: {
    getCustomers: (...args: unknown[]) => getCustomers(...args),
    searchCustomers: (...args: unknown[]) => searchCustomers(...args),
  },
}));

describe("CustomerSearchPage", () => {
  beforeEach(() => {
    getCustomers.mockResolvedValue([
      {
        customerId: 1,
        userId: 11,
        fullName: "Portal Customer",
        phoneNumber: "+9779800000011",
        email: "portal@example.com",
        vehicleCount: 1,
        vehicles: [{ vehicleId: 1, vehicleNumber: "BA 1 PA 1111", model: "Civic" }],
      },
      {
        customerId: 2,
        userId: null,
        fullName: "Staff Profile",
        phoneNumber: "+9779800000012",
        email: "staff@example.com",
        vehicleCount: 0,
        vehicles: [],
      },
    ]);
    searchCustomers.mockResolvedValue([]);
  });

  it("shows account badges and filters to registered accounts", async () => {
    render(
      <MemoryRouter>
        <CustomerSearchPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Browse Customers")).toBeInTheDocument());

    expect(screen.getByText("Portal account")).toBeInTheDocument();
    expect(screen.getByText("Staff-created profile")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Registered accounts" }));

    expect(screen.getByText("Portal Customer")).toBeInTheDocument();
    expect(screen.queryByText("Staff Profile")).not.toBeInTheDocument();
  });
});