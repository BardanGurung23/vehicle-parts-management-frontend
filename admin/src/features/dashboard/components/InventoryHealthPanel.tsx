import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { SkeletonCard } from "../../../shared/components/Skeleton";
import { EmptyState } from "../../../shared/components/EmptyState";
import { Package } from "lucide-react";

type StatusSegment = {
  label: string;
  count: number;
  color: string;
};

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

const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

export function InventoryHealthPanel({
  isLoading,
  isUnavailable,
  trackedPartCount,
  segments,
  lowStockWatchlist,
}: InventoryHealthPanelProps) {
  if (isLoading) return <SkeletonCard />;

  if (isUnavailable) {
    return <EmptyState icon={Package} title="Inventory unavailable" description="Inventory summary is unavailable right now." />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-xl bg-surface-container-lowest shadow-level1 p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-on-surface">Inventory Health</h3>
          <p className="text-xs text-on-surface-variant">{formatNumber(trackedPartCount)} tracked parts</p>
        </div>

        {trackedPartCount === 0 ? (
          <p className="text-xs text-on-surface-variant">No parts tracked yet.</p>
        ) : (
          <div className="flex items-start gap-6">
            <div className="shrink-0">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={segments} cx="50%" cy="50%" innerRadius={40} outerRadius={56} paddingAngle={2} dataKey="count">
                    {segments.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-2 min-w-0">
              {segments.map((segment) => (
                <div key={segment.label} className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: segment.color }} />
                  <span className="text-xs text-on-surface-variant flex-1">{segment.label}</span>
                  <span className="text-xs font-medium text-on-surface">{formatNumber(segment.count)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-surface-container-lowest shadow-level1 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-on-surface">Low-stock Watchlist</h3>
        {lowStockWatchlist.length === 0 ? (
          <p className="text-xs text-on-surface-variant">Everything sits above its reorder threshold.</p>
        ) : (
          <div className="space-y-1.5">
            {lowStockWatchlist.slice(0, 6).map((part) => (
              <div key={part.partId} className="flex items-center justify-between gap-2 py-1.5">
                <span className="text-xs text-on-surface truncate">{part.partName}</span>
                <span className={`text-xs font-medium shrink-0 ${part.stockQuantity === 0 ? "text-error" : "text-warning"}`}>
                  {part.stockQuantity}/{part.reorderLevel}
                </span>
              </div>
            ))}
            {lowStockWatchlist.length > 6 && (
              <p className="text-xs text-on-surface-variant pt-1">+{lowStockWatchlist.length - 6} more</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
