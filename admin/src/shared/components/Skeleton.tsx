type SkeletonLineProps = { width?: string; className?: string };
export function SkeletonLine({ width = "100%", className }: SkeletonLineProps) {
  return (
    <div
      className={`h-4 rounded-lg bg-gradient-to-r from-surface-container-high via-surface-container-highest to-surface-container-high bg-[length:200%_100%] animate-shimmer ${className ?? ""}`}
      style={{ width }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-surface-container-low shadow-level1 p-4 space-y-3 ${className ?? ""}`} aria-hidden="true">
      <SkeletonLine width="40%" />
      <SkeletonLine width="60%" />
      <SkeletonLine width="30%" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-xl overflow-hidden bg-surface-container-lowest shadow-level1" aria-hidden="true">
      <div className="h-11 bg-surface-container-low px-4 flex items-center gap-4">
        {Array.from({ length: columns }).map((_, i) => <SkeletonLine key={i} width={`${100 / columns}%`} />)}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={`h-12 px-4 flex items-center gap-4 ${r % 2 === 1 ? "bg-surface-container-low/35" : ""}`}>
          {Array.from({ length: columns }).map((_, c) => <SkeletonLine key={c} width={`${100 / columns}%`} />)}
        </div>
      ))}
    </div>
  );
}
