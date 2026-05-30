import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

/**
 * Theme system
 * ----------------------------------------------------------------------------
 * The admin console supports three modes:
 *   - "light"  → off-white surfaces, warm gray text
 *   - "dark"   → deep slate surfaces, calm blue accent
 *   - "system" → follows the user's OS preference
 *
 * The selected mode is persisted in localStorage so it survives reloads.
 * The current resolved theme ("light" | "dark") is applied as a class on
 * <html> (`theme-dark` for dark mode; nothing for light) so it can be
 * targeted from CSS without recompiling Tailwind classes.
 *
 * Documentation: /doc/admin-design-system.md#theming
 */

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (next: ThemePreference) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "autonix.admin.theme";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemeClass(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("theme-dark", resolved === "dark");
  root.classList.toggle("theme-light", resolved === "light");
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<ThemePreference>(readStoredTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  // Keep system preference in sync if user toggles OS-level theme.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };
    if (media.addEventListener) {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }
    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  const resolvedTheme: ResolvedTheme =
    theme === "system" ? systemTheme : theme;

  // Apply the resolved theme to <html>.
  useEffect(() => {
    applyThemeClass(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage unavailable; ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    // Cycle: light → dark → system → light
    setThemeState((current) => {
      const next: ThemePreference =
        current === "light" ? "dark" : current === "dark" ? "system" : "light";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context) return context;

  // Graceful no-op default for tests and non-wrapped trees so consumers
  // (like ThemeToggle) never crash. The toggle still renders; it just does
  // not modify any global state.
  const noop = () => {};
  return {
    theme: "system",
    resolvedTheme: "light",
    setTheme: noop,
    toggleTheme: noop,
  };
}
