import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field } from "./Field";

describe("Field", () => {
  it("toggles password visibility for password inputs", () => {
    render(
      <Field label="Password" htmlFor="test-password">
        <input className="input" type="password" />
      </Field>,
    );

    const passwordInput = screen.getByLabelText("Password", { selector: "input" });
    const toggleButton = screen.getByRole("button", { name: /show password/i });

    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: /hide password/i })).toBeInTheDocument();
  });
});