import type { PropsWithChildren } from "react";

/**
 * PageShell — top-level wrapper for every admin page.
 *
 * Centers the content, applies a sensible max-width, and stacks children with
 * consistent vertical rhythm so individual pages do not need to manage spacing.
 *
 * Documentation: /doc/admin-design-system.md#layout
 */
type MaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

type PageShellProps = PropsWithChildren<{
  maxWidth?: MaxWidth;
  className?: string;
  /** Tighter spacing between children (e.g. for dense pages). */
  dense?: boolean;
}>;

const maxWidths: Record<MaxWidth, string> = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
  full: "max-w-full",
};

export function PageShell({
  children,
  maxWidth = "2xl",
  className,
  dense = false,
}: PageShellProps) {
  return (
    <div className={`mx-auto ${maxWidths[maxWidth]} ${className ?? ""}`}>
      <div className={dense ? "space-y-4" : "space-y-6"}>{children}</div>
    </div>
  );
}
