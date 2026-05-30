import type { ElementType, ReactNode } from "react";
import { StatCard } from "../../../shared/components/StatCard";

type MetricCard = {
  label: string;
  value: ReactNode;
  note: string;
  icon?: ElementType;
  accent?: boolean;
};

type KpiGridProps = {
  cards: MetricCard[];
  /** Override which card should be visually accented. Defaults to per-card flag. */
  accentIndex?: number;
};

export function KpiGrid({ cards, accentIndex }: KpiGridProps) {
  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card, idx) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.value}
          note={card.note}
          icon={card.icon}
          accent={
            typeof accentIndex === "number" ? idx === accentIndex : Boolean(card.accent)
          }
        />
      ))}
    </div>
  );
}
