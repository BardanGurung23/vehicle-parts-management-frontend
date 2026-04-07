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
    color: "#40c057",
    icon: <TrendingUp color="#40c057" />,
  },
  DOWN: {
    color: "#f00",
    icon: <TrendingDown color="#f00" />,
  },
};

interface ChartData {
  name: string;
  value?: number;
  [key: string]: unknown;
}

const getPartOfDay = (date: Date = new Date()): string => {
  const hour = getHours(date); // Get hour (0–23) from the provided or current date
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
    return <div>Loading...</div>;
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
    name: data.hour + " : 00",
    ["Last " + lastDay]: data.previous_orders,
    today: data.current_orders,
  }));

  const barData: ChartData[] = weekly_sales.data.map((data) => ({
    name: data.day.slice(0, 3),
    ["Last Week"]: data.previous_revenue,
    ["This Week"]: data.current_revenue,
  }));

  return (
    <div>
      <Header />
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-[1rem] mt-4">
        <StatsCard
          lastDate={summaryMetadata.previous_date}
          icon={CurrencyIcon}
          title={"Revenue"}
          value={revenue.today_revenue}
          isPrice={true}
          percent={revenue.percent_change}
        />
        <StatsCard
          icon={ShoppingCart}
          title={"Orders"}
          value={order_count.today_order_count}
          isPrice={false}
          percent={order_count.percent_change}
        />
        <StatsCard
          icon={Money}
          title={"Average Order Value"}
          value={average_order_value.today_average_order_value}
          isPrice={true}
          percent={average_order_value.percent_change}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 mt-4 gap-4">
        <div className="bg-white p-4">
          <div className="text-xl font-semibold text-left w-[94%] mx-auto mb-4 leading-8 py-4">
            <div className="border-gray-300 border-b">
              Hourly Order Statistics
            </div>
          </div>
          <LineChartComponent
            data={lineData}
            dataKeys={["Last " + lastDay, "today"]}
            height={300}
            showGrid={true}
            legendPosition="bottom"
            responsive={true}
            tooltipFormatter={({ value }) => `${value}`}
            yAxisLabel="Hourly Order Count"
            lineType="monotone"
            dotSize={4}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          />
        </div>
        <div className="bg-white p-4">
          <div className="text-xl font-semibold text-left w-[94%] mx-auto mb-4 leading-8 py-4">
            <div className="border-gray-300 border-b">
              Weekly Sales Statistics
            </div>
          </div>
          <BarChartComponent
            data={barData}
            dataKeys={["Last Week", "This Week"]}
            height={300}
            barSize={40}
            showGrid={true}
            legendPosition="bottom"
            responsive={true}
            yAxisLabel="Sales sum by weekdays"
            tooltipFormatter={({ value }) => `$${value}`}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          />
        </div>
      </div>
    </div>
  );
}

function Header() {
  const navigate = useNavigate();
  const userName = useAppSelector((state) => state.profile.username);
  const todayDate = format(new Date(), "PPP");
  return (
    <div className="w-full flex justify-between">
      <div className="flex flex-col">
        <div className="text-left text-2xl font-bold">
          Good {getPartOfDay()}, {userName}
        </div>
        <div>
          Here are your stats for today{" "}
          <span className="text-blue-500 font-semibold">{todayDate}</span>
        </div>
      </div>
      <a
        href={FRONTEND_BASE_URL}
        target="_blank"
        className="flex items-center gap-4"
      >
        <a
          href="https://staging.unimomo.co.uk"
          target="_blank"
          className=" flex gap-3 text-base font-semibold"
        >
          GOTO YOUR WEBSITE
          <span>
            {" "}
            <ExternalLink className="size-5" />
          </span>
        </a>
      </a>
    </div>
  );
}

function StatsCard({
  icon = "",
  title = "Revenue",
  value = 0,
  percent = 0,
  isPrice = false,
  lastDate = subDays(new Date(), 7),
}) {
  const trend = percent >= 0 ? "UP" : "DOWN";

  return (
    <div className="border border-[#eee8ff] p-5 bg-white flex flex-col gap-3">
      <img className="size-11" src={icon} alt="icon" />
      <div className="text-[#adb5bd] font-semibold text-base text-left">
        {title}
      </div>
      <div className="text-left text-[1.75rem] font-semibold">
        {isPrice && <span>{CurrencySign}</span>} {value}
      </div>
      <div className={`flex items-center gap-2`}>
        {trendObj[trend].icon}
        <div>
          <span className={trend === "UP" ? "text-[#40c057]" : "text-[#f00]"}>
            {Number(percent).toFixed(2) + "%"}{" "}
          </span>
          <span className="text-black">
            from last {format(lastDate, "eeee")}
          </span>
        </div>
      </div>
    </div>
  );
}
