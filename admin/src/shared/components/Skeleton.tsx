/**
 * Skeleton primitives — neutral placeholders for loading states.
 * Uses opacity pulse, no gradient shimmer, to match the calm aesthetic.
 *
 * Documentation: /doc/admin-design-system.md#loading-states
 */
type SkeletonLineProps = { width?: string; className?: string };

export function SkeletonLine({ width = "100%", className }: SkeletonLineProps) {
  return (
    <div
      className={`h-3.5 rounded-md bg-[var(--md-sys-color-surface-container-high)] animate-pulseSoft ${className ?? ""}`}
      style={{ width }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] p-5 space-y-3 ${className ?? ""}`}
      aria-hidden="true"
    >
      <SkeletonLine width="40%" />
      <SkeletonLine width="80%" />
      <SkeletonLine width="60%" />
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
}: { rows?: number; columns?: number }) {
  return (
    <div
      className="rounded-lg overflow-hidden bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]"
      aria-hidden="true"
    >
      <div className="h-11 bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)] px-4 flex items-center gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonLine key={i} width={`${100 / columns}%`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="h-12 px-4 flex items-center gap-4 border-b border-[var(--md-sys-color-outline-variant)] last:border-0"
        >
          {Array.from({ length: columns }).map((_, c) => (
            <SkeletonLine key={c} width={`${100 / columns}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}
