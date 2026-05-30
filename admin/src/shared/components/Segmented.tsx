import type { ReactNode } from "react";

/**
 * Segmented — pill-style toggle group for binary or short-list filters.
 *
 * Renders a group of mutually exclusive controls inside a single rounded
 * frame. Use for "All / Registered / Staff" style filters.
 *
 * Accessibility:
 *   - Container is role="radiogroup".
 *   - Each option is a button with role="radio" and aria-checked.
 *
 * Documentation: /doc/admin-design-system.md#segmented
 */
export type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
  /** Optional helper count rendered after the label (e.g. "All (12)"). */
  count?: number;
};

type SegmentedProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  size?: "sm" | "md";
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "md",
}: SegmentedProps<T>) {
  const heightClass = size === "sm" ? "h-7 text-[12px]" : "h-8 text-[13px]";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        const labelIsString = typeof option.label === "string";
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={labelIsString ? (option.label as string) : undefined}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={[
              heightClass,
              "px-3 rounded-[6px] font-medium transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]",
              isActive
                ? "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-level1"
                : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]",
            ].join(" ")}
          >
            <span className="leading-none">
              {option.label}
              {typeof option.count === "number" ? (
                <span
                  aria-hidden="true"
                  className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] tabular ${
                    isActive
                      ? "bg-[var(--brand-50)] text-[var(--brand-700)]"
                      : "bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]"
                  }`}
                >
                  {option.count}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
