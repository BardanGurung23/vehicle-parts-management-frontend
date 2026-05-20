import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppLayout } from "./AppLayout";

const authState = {
  user: { fullName: "Demo Admin", role: "Admin" },
  isAdmin: true,
  logout: vi.fn(),
};

vi.mock("../auth", () => ({
  useAuth: () => authState,
}));

describe("AppLayout", () => {
  beforeEach(() => {
    authState.user = { fullName: "Demo Admin", role: "Admin" };
    authState.isAdmin = true;
    authState.logout = vi.fn();
  });

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

  it("shows appointment management navigation for staff users", () => {
    authState.user = { fullName: "Demo Staff", role: "Staff" };
    authState.isAdmin = false;

    render(
      <MemoryRouter initialEntries={["/app/customers/search"]}>
        <AppLayout />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /^appointments$/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /purchase invoices/i })).not.toBeInTheDocument();
  });
});
