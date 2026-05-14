import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppLayout } from "./AppLayout";

vi.mock("../auth", () => ({
  useAuth: () => ({
    user: { fullName: "Demo Admin", role: "Admin" },
    isAdmin: true,
    logout: vi.fn(),
  }),
}));

describe("AppLayout", () => {
  it("renders the active app shell navigation for admin users", () => {
    render(
      <MemoryRouter initialEntries={["/app/reports/customers"]}>
        <AppLayout />
      </MemoryRouter>,
    );

    expect(screen.getByText("Autonix")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /customer reports/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /purchase invoices/i })).toBeInTheDocument();
  });
});
