import { TrendingUp, TrendingDown } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  note?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  accent?: boolean;
};

export function StatCard({ label, value, note, trend, trendValue, accent }: StatCardProps) {
  return (
    <div
      className={`rounded-xl p-5 transition-all duration-200 ease-emphasized ${
        accent
          ? "bg-primary-container text-primary-on-container shadow-level1"
          : "bg-surface-container-low text-on-surface shadow-level1 ring-1 ring-white/[0.04] hover:shadow-level2 hover:bg-surface-container"
      }`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {accent && <span className="block w-1.5 h-1.5 rounded-full bg-primary-on-container/60" />}
          <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] leading-none ${
            accent ? "text-primary-on-container/60" : "text-on-surface-variant"
          }`}>
            {label}
          </p>
        </div>

        <div className="flex items-baseline gap-2">
          <strong className={`font-extrabold tracking-tight tabular-nums leading-none ${
            accent ? "text-primary-on-container" : "text-on-surface"
          } text-[clamp(1.5rem,2.5vw,2.25rem)]`}>
            {value}
          </strong>
          {trend && trendValue && (
            <span className={`flex items-center gap-0.5 text-[11px] font-bold ${
              trend === "up" ? "text-success" : trend === "down" ? "text-error" : "text-on-surface-variant"
            }`}>
              {trend === "up" ? <TrendingUp className="w-3.5 h-3.5" /> : trend === "down" ? <TrendingDown className="w-3.5 h-3.5" /> : null}
              {trendValue}
            </span>
          )}
        </div>

        {note && (
          <p className={`text-[11px] font-medium leading-snug ${
            accent ? "text-primary-on-container/50" : "text-on-surface-variant/70"
          }`}>
            {note}
          </p>
        )}
      </div>
    </div>
  );
}
