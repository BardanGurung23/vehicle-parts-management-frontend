import type { PropsWithChildren, ReactNode } from "react";
import { GraduationCap } from "lucide-react";

/**
 * AuthShell — chrome shared by sign-in, registration, and password recovery.
 *
 * Two-column layout on large viewports: a calm brand panel on the left,
 * a focused content card on the right. On smaller screens the brand panel
 * collapses to a compact header above the form.
 *
 * Documentation: /doc/admin-design-system.md#auth
 */
type AuthShellProps = PropsWithChildren<{
  headline: ReactNode;
  tagline?: ReactNode;
  highlights?: { icon: React.ElementType; text: string }[];
  size?: "sm" | "md" | "lg";
}>;

const sizeStyles = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };

export function AuthShell({
  headline,
  tagline,
  highlights = [],
  size = "sm",
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-screen flex bg-[var(--md-sys-color-background)]">
      {/* Brand panel */}
      <aside className="hidden lg:flex lg:w-[44%] xl:w-2/5 flex-col justify-between p-12 bg-[var(--brand-700)] text-white relative">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-none text-white">Autonix</h1>
              <p className="text-[11px] text-white/70 mt-1.5 uppercase tracking-wider font-medium">
                Admin Console
              </p>
            </div>
          </div>

          <div className="mt-16 max-w-md">
            <h2 className="text-2xl xl:text-[28px] font-semibold leading-tight tracking-tight text-white">
              {headline}
            </h2>
            {tagline ? (
              <p className="mt-4 text-sm leading-relaxed text-white/80">{tagline}</p>
            ) : null}
          </div>

          {highlights.length > 0 ? (
            <ul className="mt-12 space-y-3 max-w-md">
              {highlights.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                  </span>
                  <span className="text-[13px] text-white/90">{text}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <p className="text-[11px] text-white/50">
          &copy; {new Date().getFullYear()} Autonix. All rights reserved.
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className={`w-full ${sizeStyles[size]} animate-slideUp`}>
          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-md bg-[var(--brand-50)] border border-[var(--brand-100)] flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-[var(--brand-700)]" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">
                Autonix
              </h1>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-medium">
                Admin Console
              </p>
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
