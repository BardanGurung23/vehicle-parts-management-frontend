import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { Loader2 } from "lucide-react";

type ActionButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: "filled" | "tonal" | "text" | "error";
    size?: "sm" | "md" | "lg";
    icon?: React.ElementType;
    isLoading?: boolean;
  }
>;

const sizeStyles = {
  sm: "h-8 px-4 text-label-medium gap-1.5",
  md: "h-10 px-6 text-label-large gap-2",
  lg: "h-12 px-8 text-label-large gap-2",
};

const toneStyles = {
  filled:
    "bg-primary text-primary-on hover:bg-primary-fixed-dim shadow-level1 hover:shadow-level2 active:shadow-level1",
  tonal:
    "bg-secondary-container text-secondary-on-container hover:bg-secondary shadow-level0 active:shadow-level0",
  text:
    "bg-transparent text-primary hover:bg-primary/10",
  error:
    "bg-error-container text-error-on-container hover:bg-error hover:text-error-on shadow-level1 hover:shadow-level2",
};

export function ActionButton({
  children,
  className,
  tone = "filled",
  size = "md",
  icon: Icon,
  isLoading,
  disabled,
  ...buttonProps
}: ActionButtonProps) {
  return (
    <button
      {...buttonProps}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-semibold rounded-full border-none transition-all duration-200 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40 disabled:cursor-not-allowed ${sizeStyles[size]} ${toneStyles[tone]}${className ? ` ${className}` : ""}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
