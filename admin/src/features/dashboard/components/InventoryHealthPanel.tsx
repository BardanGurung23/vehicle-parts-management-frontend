import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Package } from "lucide-react";
import { Card } from "../../../shared/components/Card";
import { SkeletonCard } from "../../../shared/components/Skeleton";
import { EmptyState } from "../../../shared/components/EmptyState";

type StatusSegment = { label: string; count: number; color: string };
type LowStockPart = {
  partId: number;
  partName: string;
  stockQuantity: number;
  reorderLevel: number;
};

type InventoryHealthPanelProps = {
  isLoading: boolean;
  isUnavailable: boolean;
  trackedPartCount: number;
  segments: StatusSegment[];
  lowStockWatchlist: LowStockPart[];
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

export function InventoryHealthPanel({
  isLoading,
  isUnavailable,
  trackedPartCount,
  segments,
  lowStockWatchlist,
}: InventoryHealthPanelProps) {
  if (isLoading) return <SkeletonCard />;
  if (isUnavailable) {
    return (
      <EmptyState
        icon={Package}
        title="Inventory unavailable"
        description="Inventory summary could not be loaded right now."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card
        header={
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
              Inventory health
            </h3>
            <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] tabular">
              {formatNumber(trackedPartCount)} tracked parts
            </p>
          </div>
        }
      >
        {trackedPartCount === 0 ? (
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
            No parts tracked yet.
          </p>
        ) : (
          <div className="flex items-center gap-6">
            <div className="shrink-0">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={segments}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={56}
                    paddingAngle={2}
                    dataKey="count"
                    stroke="var(--md-sys-color-surface)"
                    strokeWidth={2}
                  >
                    {segments.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-2 min-w-0">
              {segments.map((segment) => (
                <li key={segment.label} className="flex items-center gap-3 text-sm">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: segment.color }}
                    aria-hidden="true"
                  />
                  <span className="text-[var(--md-sys-color-on-surface)] flex-1">{segment.label}</span>
                  <span className="text-[var(--md-sys-color-on-surface)] font-semibold tabular">
                    {formatNumber(segment.count)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card
        header={
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)]">
              Low-stock watchlist
            </h3>
            <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
              Items at or below reorder threshold.
            </p>
          </div>
        }
      >
        {lowStockWatchlist.length === 0 ? (
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Everything is above its threshold.
          </p>
        ) : (
          <ul className="-mt-2 divide-y divide-[var(--md-sys-color-outline-variant)]">
            {lowStockWatchlist.slice(0, 6).map((part) => (
              <li
                key={part.partId}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span className="text-[var(--md-sys-color-on-surface)] truncate">
                  {part.partName}
                </span>
                <span
                  className={`text-[12px] font-semibold tabular shrink-0 ${
                    part.stockQuantity === 0
                      ? "text-[var(--danger-700)]"
                      : "text-[var(--warning-700)]"
                  }`}
                >
                  {part.stockQuantity}/{part.reorderLevel}
                </span>
              </li>
            ))}
            {lowStockWatchlist.length > 6 ? (
              <li className="pt-2 text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                + {lowStockWatchlist.length - 6} more
              </li>
            ) : null}
          </ul>
        )}
      </Card>
    </div>
  );
}
