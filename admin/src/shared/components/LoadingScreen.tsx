import { Loader2 } from "lucide-react";

/**
 * LoadingScreen — full-viewport loading indicator used while the app
 * bootstraps or validates a session.
 *
 * Documentation: /doc/admin-design-system.md#loading-states
 */
type LoadingScreenProps = { message?: string };

export function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-3 p-8 bg-[var(--md-sys-color-background)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2
        className="w-7 h-7 text-[var(--md-sys-color-primary)] animate-spin"
        aria-hidden="true"
      />
      <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{message}</p>
    </div>
  );
}
