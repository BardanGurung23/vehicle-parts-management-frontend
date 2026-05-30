import { useEffect, useRef, useState } from "react";
import { Monitor, Moon, Sun, Check } from "lucide-react";
import { useTheme, type ThemePreference } from "../../app/theme";

/**
 * ThemeToggle — header control for switching between Light, Dark, and System.
 *
 * The trigger is a small icon button that reflects the resolved theme. The
 * three-option menu lets users explicitly pick a preference (System tracks
 * the OS-level setting and updates live).
 *
 * Documentation: /doc/admin-design-system.md#theming
 */
const options: Array<{
  value: ThemePreference;
  label: string;
  Icon: React.ElementType;
}> = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const ResolvedIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Theme: ${theme}`}
        title="Change theme"
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]"
      >
        <ResolvedIcon className="w-4 h-4" aria-hidden="true" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] shadow-level3 py-1 origin-top-right animate-scaleIn"
        >
          {options.map((opt) => {
            const isActive = theme === opt.value;
            const Icon = opt.Icon;
            return (
              <button
                key={opt.value}
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => {
                  setTheme(opt.value);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors"
              >
                <Icon className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" aria-hidden="true" />
                <span className="flex-1 text-left">{opt.label}</span>
                {isActive ? (
                  <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
