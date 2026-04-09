import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ActionButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: "primary" | "secondary";
  }
>;

export function ActionButton({
  children,
  className,
  tone = "primary",
  ...buttonProps
}: ActionButtonProps) {
  const toneClassName = tone === "secondary" ? "button button--secondary" : "button";

  return (
    <button {...buttonProps} className={`${toneClassName}${className ? ` ${className}` : ""}`}>
      {children}
    </button>
  );
}