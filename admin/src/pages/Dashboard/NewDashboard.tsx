import { useAppSelector } from "@/redux/store/hooks";
import { format, getHours, subDays } from "date-fns";
import { ExternalLink, TrendingDown, TrendingUp } from "lucide-react";
import CurrencyIcon from "@/assets/pound-sign.png";
import ShoppingCart from "@/assets/shopping-cart.png";
import Money from "@/assets/money.png";
import { useNavigate } from "react-router-dom";
import { CurrencySign, FRONTEND_BASE_URL } from "@/constants";
import LineChartComponent from "./LineChartComponent";
import BarChartComponent from "./BarChartComponent";
import { useGetApiQuery } from "@/redux/services/crudApi";

const trendObj = {
  UP: {
    color: "var(--accent)",
    icon: <TrendingUp size={14} color="var(--accent)" />,
  },
  DOWN: {
    color: "var(--danger)",
    icon: <TrendingDown size={14} color="var(--danger)" />,
  },
};

interface ChartData {
  name: string;
  value?: number;
  [key: string]: unknown;
}

const getPartOfDay = (date: Date = new Date()): string => {
  const hour = getHours(date); 
  if (hour >= 0 && hour < 6) return "Night";
  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 18) return "Afternoon";
  return "Evening";
};

export default function NewDashboard() {
  const { data, isLoading } = useGetApiQuery({
    url: `analytics/weekday-comparison?include=summary,hourly_orders,weekly_sales`,
  });

  if (isLoading) {
    return <div className="p-4 text-muted animate-pulse uppercase font-bold text-[10px]">Loading Control Panel...</div>;
  }

  const {
    summary: {
      metadata: summaryMetadata,
      revenue,
      order_count,
      average_order_value,
    },
    hourly_orders,
    weekly_sales,
  } = data.data;

  const lastDay = format(hourly_orders.metadata.previous_date, "eeee");

  const lineData: ChartData[] = hourly_orders.data.map((data) => ({
    name: data.hour + ":00",
    ["Last " + lastDay]: data.previous_orders,
    today: data.current_orders,
  }));

  const barData: ChartData[] = weekly_sales.data.map((data) => ({
    name: data.day.slice(0, 3).toUpperCase(),
    ["Last Week"]: data.previous_revenue,
    ["This Week"]: data.current_revenue,
  }));

  return (
    <div className="flex flex-col gap-4">
      <Header />
      
      {/* KPI Section */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          lastDate={summaryMetadata.previous_date}
          icon={CurrencyIcon}
          title={"REVENUE"}
          value={revenue.today_revenue}
          isPrice={true}
          percent={revenue.percent_change}
        />
        <StatsCard
          icon={ShoppingCart}
          title={"ORDERS"}
          value={order_count.today_order_count}
          isPrice={false}
          percent={order_count.percent_change}
        />
        <StatsCard
          icon={Money}
          title={"AVG ORDER VALUE"}
          value={average_order_value.today_average_order_value}
          isPrice={true}
          percent={average_order_value.percent_change}
        />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartContainer title="HOURLY ORDER STATISTICS">
          <LineChartComponent
            data={lineData}
            dataKeys={["Last " + lastDay, "today"]}
            height={260}
            showGrid={true}
            legendPosition="bottom"
            responsive={true}
            tooltipFormatter={({ value }) => `${value}`}
            yAxisLabel=""
            lineType="monotone"
            dotSize={3}
            margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
          />
        </ChartContainer>

        <ChartContainer title="WEEKLY SALES STATISTICS">
          <BarChartComponent
            data={barData}
            dataKeys={["Last Week", "This Week"]}
            height={260}
            barSize={16}
            showGrid={true}
            legendPosition="bottom"
            responsive={true}
            yAxisLabel=""
            tooltipFormatter={({ value }) => `${CurrencySign}${Number(value).toLocaleString()}`}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          />
        </ChartContainer>
      </div>
    </div>
  );
}

function ChartContainer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-line p-4 rounded-sm shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-10"></div>
      <div className="text-[10px] uppercase font-bold tracking-widest text-muted mb-6 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
        {title}
      </div>
      {children}
    </div>
  );
}

function Header() {
  const navigate = useNavigate();
  const userName = useAppSelector((state) => state.profile.username);
  const todayDate = format(new Date(), "PPP");
  return (
    <div className="w-full flex justify-between items-end border-b border-line pb-4">
      <div className="flex flex-col gap-1">
        <div className="text-xs uppercase tracking-widest text-muted font-bold">
          System Overview
        </div>
        <div className="text-xl font-bold tracking-tight">
          WELCOME, {userName.toUpperCase()}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="text-[10px] font-bold text-accent uppercase tracking-widest">
          {todayDate.toUpperCase()}
        </div>
        <a
          href="https://staging.unimomo.co.uk"
          target="_blank"
          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted hover:text-accent transition-colors"
        >
          VIEW LIVE STORE
          <ExternalLink size={12} strokeWidth={2.5} />
        </a>
      </div>
    </div>
  );
}

function StatsCard({
  icon = "",
  title = "REVENUE",
  value = 0,
  percent = 0,
  isPrice = false,
  lastDate = subDays(new Date(), 7),
}) {
  const trend = percent >= 0 ? "UP" : "DOWN";

  return (
    <div className="bg-surface border border-line p-4 rounded-sm flex items-center justify-between relative shadow-sm hover:border-accent/30 transition-all">
      <div className="flex flex-col gap-1">
        <div className="text-[10px] font-bold text-muted uppercase tracking-widest">
          {title}
        </div>
        <div className="text-xl font-bold tracking-tight">
          {isPrice && <span className="text-accent mr-0.5">{CurrencySign}</span>}
          {value.toLocaleString()}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {trendObj[trend].icon}
          <span className={`text-[11px] font-bold ${trend === "UP" ? "text-accent" : "text-danger"}`}>
            {Math.abs(Number(percent)).toFixed(1)}%
          </span>
          <span className="text-[9px] uppercase font-bold text-muted/60 tracking-tighter">
            vs {format(lastDate, "EEE").toUpperCase()}
          </span>
        </div>
      </div>
      <div className="bg-bg p-2 rounded-md border border-line">
        <img className="size-6 grayscale opacity-80" src={icon} alt="icon" />
      </div>
    </div>
  );
}
