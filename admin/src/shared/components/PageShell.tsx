import type { PropsWithChildren } from "react";

type PageShellProps = PropsWithChildren<{ maxWidth?: "sm" | "md" | "lg" | "xl" | "full"; className?: string }>;

const maxWidths = { sm: "max-w-2xl", md: "max-w-4xl", lg: "max-w-6xl", xl: "max-w-7xl", full: "max-w-full" };

export function PageShell({ children, maxWidth = "xl", className }: PageShellProps) {
  return (
    <div className={`mx-auto ${maxWidths[maxWidth]} ${className ?? ""}`}>
      <div className="space-y-5">{children}</div>
    </div>
  );
}
