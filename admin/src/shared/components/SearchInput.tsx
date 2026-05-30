import { forwardRef, type InputHTMLAttributes } from "react";
import { Search, X } from "lucide-react";

/**
 * SearchInput — single-line search field with leading icon and optional
 * clear (×) affordance. Keep these inside Toolbars for list pages.
 *
 * Documentation: /doc/admin-design-system.md#search
 */
type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: "sm" | "md";
  onClear?: () => void;
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    { size = "md", onClear, value, className, ...rest },
    ref,
  ) {
    const heightClass = size === "sm" ? "h-8" : "h-9";
    return (
      <div className="relative w-full">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]"
          aria-hidden="true"
        />
        <input
          ref={ref}
          type="search"
          value={value}
          {...rest}
          className={[
            heightClass,
            "w-full pl-9 pr-9 rounded-md",
            "border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]",
            "text-sm text-[var(--md-sys-color-on-surface)]",
            "placeholder:text-[var(--md-sys-color-on-surface-variant)]/70",
            "transition-colors",
            className ?? "",
          ].join(" ")}
        />
        {value && onClear ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>
    );
  },
);
