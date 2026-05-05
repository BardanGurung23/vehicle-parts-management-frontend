import { StatCard } from "../../../shared/components/StatCard";

type MetricCard = {
  label: string;
  value: string;
  note: string;
};

type KpiGridProps = {
  cards: MetricCard[];
  accentIndex?: number;
};

export function KpiGrid({ cards, accentIndex = 0 }: KpiGridProps) {
  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card, idx) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.value}
          note={card.note}
          accent={idx === accentIndex}
        />
      ))}
    </div>
  );
}
