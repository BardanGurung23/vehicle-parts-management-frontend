import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResetPasswordPage } from "./ResetPasswordPage";

const validatePasswordResetToken = vi.fn();
const resetPassword = vi.fn();
const toastSpy = vi.fn();

vi.mock("../../app/api", () => ({
  ApiError: class ApiError extends Error {
    status: number;

    constructor(message: string, status = 400) {
      super(message);
      this.status = status;
    }
  },
  api: {
    validatePasswordResetToken: (...args: unknown[]) => validatePasswordResetToken(...args),
    resetPassword: (...args: unknown[]) => resetPassword(...args),
  },
}));

vi.mock("../../components/Toast", () => ({
  default: (...args: unknown[]) => toastSpy(...args),
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    validatePasswordResetToken.mockReset();
    resetPassword.mockReset();
    toastSpy.mockReset();

    validatePasswordResetToken.mockResolvedValue({
      expiresAt: "2026-05-20T08:00:00Z",
    });
    resetPassword.mockResolvedValue({
      message: "Your password has been reset successfully.",
    });
  });

  it("validates the token and submits a new password", async () => {
    render(
      <MemoryRouter initialEntries={["/reset-password?token=reset-token"]}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(validatePasswordResetToken).toHaveBeenCalledWith({ token: "reset-token" });
    });

    const newPasswordInput = await screen.findByLabelText(/New password/i);
    const confirmPasswordInput = await screen.findByLabelText(/Confirm password/i);

    fireEvent.change(newPasswordInput, {
      target: { value: "NewPass123!" },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "NewPass123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save new password/i }));

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith({
        token: "reset-token",
        password: "NewPass123!",
        confirmPassword: "NewPass123!",
      });
    });

    expect(toastSpy).toHaveBeenCalledWith("Your password has been reset successfully.", "success");
  });

  it("shows the invalid-link state when token validation fails", async () => {
    validatePasswordResetToken.mockRejectedValueOnce(
      new Error("This password reset link is invalid or has expired."),
    );

    render(
      <MemoryRouter initialEntries={["/reset-password?token=expired-token"]}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("This password reset link is invalid or has expired."),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("link", { name: /request a new reset link/i }),
    ).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });
});