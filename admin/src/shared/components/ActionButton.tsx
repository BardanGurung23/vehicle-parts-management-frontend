import {
  forwardRef,
  type ButtonHTMLAttributes,
  type PropsWithChildren,
} from "react";
import { Loader2 } from "lucide-react";

/**
 * ActionButton — primary call-to-action component for the admin console.
 *
 * Tones (semantic, not decorative):
 *   - primary   : main page action (Save, Submit, Search).
 *   - secondary : neutral counter-action (Cancel, Reset). Outlined.
 *   - ghost     : low-emphasis text button (toolbar, in-card actions).
 *   - danger    : destructive action (Delete, Remove). Outlined red.
 *
 * Backwards-compatible aliases:
 *   - filled = primary
 *   - tonal  = secondary
 *   - text   = ghost
 *   - error  = danger
 *
 * Accessibility:
 *   - aria-busy reflected when isLoading.
 *   - aria-disabled mirrors disabled state.
 *   - Visible focus ring uses the brand accent and respects light/dark.
 *
 * Documentation: /doc/admin-design-system.md#buttons
 */
type Tone =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "filled"
  | "tonal"
  | "text"
  | "error";

type ActionButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: Tone;
    size?: "sm" | "md" | "lg";
    icon?: React.ElementType;
    iconPosition?: "leading" | "trailing";
    isLoading?: boolean;
    fullWidth?: boolean;
  }
>;

const sizeStyles: Record<NonNullable<ActionButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-[12.5px] gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-10 px-5 text-sm gap-2",
};

/**
 * Tone styles use semantic tokens (so dark mode works automatically).
 *
 * The hover state is intentionally subtle: a slight surface or border shift,
 * never a saturation jump. Active state is one step darker.
 */
const toneStyles: Record<Tone, string> = {
  primary:
    "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 active:opacity-95 shadow-level1",
  filled:
    "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 active:opacity-95 shadow-level1",
  secondary:
    "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-outline)]",
  tonal:
    "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-outline)]",
  ghost:
    "bg-transparent text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]",
  text:
    "bg-transparent text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]",
  danger:
    "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-error)] border border-[color:color-mix(in_srgb,var(--md-sys-color-error)_30%,var(--md-sys-color-outline-variant))] hover:bg-[var(--md-sys-color-error-container)]",
  error:
    "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-error)] border border-[color:color-mix(in_srgb,var(--md-sys-color-error)_30%,var(--md-sys-color-outline-variant))] hover:bg-[var(--md-sys-color-error-container)]",
};

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  function ActionButton(
    {
      children,
      className,
      tone = "primary",
      size = "md",
      icon: Icon,
      iconPosition = "leading",
      isLoading,
      disabled,
      fullWidth,
      type = "button",
      ...buttonProps
    },
    ref,
  ) {
    const trailing = iconPosition === "trailing";
    return (
      <button
        ref={ref}
        type={type}
        {...buttonProps}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading || undefined}
        aria-busy={isLoading || undefined}
        className={[
          "inline-flex items-center justify-center font-medium rounded-md tracking-tight",
          "transition-[opacity,background-color,border-color,color,box-shadow] duration-150 ease-standard",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--md-sys-color-background)]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
          sizeStyles[size],
          toneStyles[tone],
          fullWidth ? "w-full" : "",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        ) : Icon && !trailing ? (
          <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
        ) : null}
        <span className="leading-none">{children}</span>
        {!isLoading && Icon && trailing ? (
          <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
        ) : null}
      </button>
    );
  },
);
