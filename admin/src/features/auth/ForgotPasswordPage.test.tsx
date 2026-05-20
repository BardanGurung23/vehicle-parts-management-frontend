import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForgotPasswordPage } from "./ForgotPasswordPage";

const requestPasswordReset = vi.fn();

vi.mock("../../app/api", () => ({
  ApiError: class ApiError extends Error {},
  api: {
    requestPasswordReset: (...args: unknown[]) => requestPasswordReset(...args),
  },
}));

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    requestPasswordReset.mockReset();
    requestPasswordReset.mockResolvedValue({
      message: "If an active account matches that email, a password reset link has been sent.",
    });
  });

  it("submits the email and shows the generic success response", async () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/^Email/i), {
      target: { value: "portal@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(requestPasswordReset).toHaveBeenCalledWith({ email: "portal@example.com" });
    });

    expect(
      screen.getByText("If an active account matches that email, a password reset link has been sent."),
    ).toBeInTheDocument();
  });
});