import { useMemo, useRef, useState } from "react";
import PageContent from "@/components/PageContent";
import {
  AiOutlinePicture,
  AiOutlineSearch,
  AiOutlineIdcard,
  AiOutlineSetting,
} from "react-icons/ai";
import { HiOutlineUsers } from "react-icons/hi";
import { Link } from "react-router-dom";
import useTranslation from "@/locale/useTranslation";
import { useGetAllCountQuery } from "@/redux/services/authentication";
import {
  MEDIA_CATEGORY_LIST_ROUTE,
  ROLE_LIST_ROUTE,
  SEO_LIST_ROUTE,
  SETTINGS_ROUTE,
  USER_LIST_ROUTE,
} from "@/routes/routeNames";
import { checkViewAccessList } from "@/utils/accessHelper";
import PieChartComponent from "./PieChartComponent";
import BarChartComponent from "./BarChartComponent";
import LineChartComponent from "./LineChartComponent";

import {
  exportBatchToExcel,
  exportBatchToPDF,
  exportBatchToCSV,
  exportBatchToJSON,
} from "@/utils/batchExport";
import ExportToExcel from "@/components/ExportToExcel";
import { useGetApiQuery } from "@/redux/services/crudApi";
import moment from "moment";
import PageFilter from "@/components/PageFilter/PageFilter";
import NewDashboard from "./NewDashboard";
import Input from "@/components/Input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "@/components/Select";
import { PageFilterSchema, PageFilterType } from "./schema";
import MultiSelectCheckbox from "@/components/MultiSelectCheckbox";
import DateTimeRangePicker from "@/components/DateTimeRangePicker/DateTimeRangePicker";
interface ChartData {
  name: string;
  value?: number;
  [key: string]: unknown;
}

interface ChartExportData {
  id: string; // Unique identifier for the chart (e.g., 'line-chart-sales')
  title: string; // Human-readable title for the chart (e.g., 'Monthly Sales Trend')
  data: ChartData[]; // Array of chart data (matches your ChartData interface)
  dataKeys: string[]; // Keys for data values (e.g., ['sales', 'orders'] for Line/Bar, ['value'] for Pie)
  elementSelector: string; // CSS selector for the chart's DOM element (e.g., '#line-chart .recharts-responsive
}

// sample data
const lineData: ChartData[] = [
  { name: "Jan", sales: 4000 },
  { name: "Feb", sales: 3800 },
  { name: "Mar", sales: 4200 },
  { name: "Apr", sales: 4600 },
  { name: "May", sales: 4800 },
  { name: "Jun", sales: 5000 },
  { name: "Jul", sales: 5200 },
  { name: "Aug", sales: 5100 },
  { name: "Sep", sales: 4700 },
  { name: "Oct", sales: 4500 },
  { name: "Nov", sales: 4900 },
  { name: "Dec", sales: 5300 },
];

const barData: ChartData[] = [
  { name: "North", sales: 5000, orders: 3000 },
  { name: "South", sales: 4000, orders: 2500 },
];
const pieData: ChartData[] = [
  { name: "Chicken Momo", value: 4500 },
  { name: "Buff Momo", value: 3800 },
  { name: "Veg Momo", value: 3200 },
  { name: "Pork Momo", value: 2500 },
  { name: "Fried Momo", value: 2100 },
  { name: "Cheese Momo", value: 1700 },
  { name: "Steam Momo", value: 2900 },
];

export default function Dashboard() {
  const [query, setQuery] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PageFilterType>({
    resolver: zodResolver(PageFilterSchema),
    defaultValues: {
      search: "search input",
      sortOrder: "asc",
      hobby: [],
      date: [null, null],
    },
  });

  const selectOptions = [
    { label: "low to high price", value: "asc" },
    { label: "high to low price", value: "desc" },
  ];

  const checkboxOptions = [
    { label: "Reading", value: "reading" },
    { label: "Gaming", value: "gaming" },
    { label: "Traveling", value: "traveling" },
  ];

  // new pageFilter:
  const filterField = useMemo(
    () => [
      { name: "search", label: "Search", Component: Input, control },
      {
        name: "sortOrder",
        options: selectOptions,
        label: "SortBy",
        Component: Select,
        control,
      },
      {
        name: "hobby",
        options: checkboxOptions,
        label: "Hobby",
        Component: MultiSelectCheckbox,
        control,
      },
      {
        name: "date",
        label: "Date",
        Component: DateTimeRangePicker,
        control,
      },
    ],
    [control],
  );

  const { Module, apiQuery } = PageFilter(
    filterField,
    handleSubmit,
    reset,
    (query) => setQuery(query),
  );

  const viewAccess = checkViewAccessList();
  const translate = useTranslation();
  const { data } = useGetAllCountQuery("");
  const { data: allCustomers, isSuccess: customerSuccess } = useGetApiQuery(
    "/customer-auth/list",
  );

  const reportHeaders = [
    "Username",
    "Email",
    "Phone Number",
    "Email Verified",
    "Created At",
  ];

  const reportData =
    customerSuccess && allCustomers?.data?.data
      ? allCustomers?.data?.data.map(
          ({
            username,
            email,
            mobileNo,
            isEmailVerified,
            createdAt,
          }: {
            username: string;
            email: string;
            mobileNo: string;
            isEmailVerified: boolean;
            createdAt: string;
          }): string[] => [
            username,
            email,
            mobileNo,
            isEmailVerified ? "Yes" : "No",
            moment(createdAt).format("YYYY/MM/DD"),
          ],
        )
      : [];

  const lineChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);

  const handleBatchExport = (format: "excel" | "pdf" | "csv" | "json") => {
    const charts: ChartExportData[] = [
      {
        id: "line-chart",
        title: "Monthly Sales Trend",
        data: lineData,
        dataKeys: ["sales", "orders"],
        elementSelector: "#line-chart .recharts-responsive-container",
      },
      {
        id: "bar-chart",
        title: "Regional Sales",
        data: barData,
        dataKeys: ["sales", "orders"],
        elementSelector: "#bar-chart .recharts-responsive-container",
      },
      {
        id: "pie-chart",
        title: "Category Sales",
        data: pieData,
        dataKeys: ["value"],
        elementSelector: "#pie-chart .recharts-responsive-container",
      },
    ];

    switch (format) {
      case "excel":
        exportBatchToExcel(charts);
        break;
      case "pdf":
        exportBatchToPDF(charts);
        break;
      case "csv":
        exportBatchToCSV(charts);
        break;
      case "json":
        exportBatchToJSON(charts);
        break;
    }
  };

  return (
    <PageContent>
      <NewDashboard />
    </PageContent>
  );

  return (
    <PageContent>
      <NewDashboard />
      <div className="mt-[2rem] text-3xl font-bold">Quick Links</div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4  justify-center gap-[2rem] items-center py-[2rem]">
        {viewAccess.includes("Users") && (
          <Link to={USER_LIST_ROUTE}>
            <div className="flex flex-col gap-[0.5rem] items-center text-xl font-normal border-[1px] p-[0.8rem] rounded-md hover:bg-[#ffffff]">
              <HiOutlineUsers className="text-[3rem]" />
              <span>{translate("Users")}</span>
              <span>{data ? data.data.countUser : "Loading..."}</span>
            </div>
          </Link>
        )}

        {viewAccess.includes("Roles") && (
          <Link to={ROLE_LIST_ROUTE}>
            <div className="flex flex-col gap-[0.5rem] items-center text-xl font-normal border-[1px] p-[0.8rem] rounded-md hover:bg-[#ffffff]">
              <AiOutlineIdcard className="text-[3rem]" />
              <span>{translate("Roles")}</span>
              <span>{data ? data.data.countRole : "Loading..."}</span>
            </div>
          </Link>
        )}

        {viewAccess.includes("Media") && (
          <Link to={MEDIA_CATEGORY_LIST_ROUTE}>
            <div className="flex flex-col gap-[0.5rem] items-center text-xl font-normal border-[1px] p-[0.8rem] rounded-md hover:bg-[#ffffff]">
              <AiOutlinePicture className="text-[3rem]" />
              <span>{translate("Media")}</span>
              <span>{data ? data.data.countMedia : "Loading..."}</span>
            </div>
          </Link>
        )}

        {viewAccess.includes("SEO") && (
          <Link to={SEO_LIST_ROUTE}>
            <div className="flex flex-col gap-[0.5rem] items-center text-xl font-normal border-[1px] p-[0.8rem] rounded-md hover:bg-[#ffffff]">
              <AiOutlineSearch className="text-[3rem]" />
              <span>{translate("SEO")}</span>
              <span>{data ? data.data.countSeo : "Loading..."}</span>
            </div>
          </Link>
        )}

        {viewAccess.includes("Company Settings") && (
          <Link to={SETTINGS_ROUTE}>
            <div className="flex flex-col gap-[0.5rem] items-center text-xl font-normal border-[1px] p-[0.8rem] rounded-md hover:bg-[#ffffff]">
              <AiOutlineSetting className="text-[3rem]" />
              <span>{translate("Settings")}</span>
              <span>1</span>
            </div>
          </Link>
        )}
      </div>
      <div style={{ marginBottom: "20px" }}>
        <button
          className="bg-blue-600 mr-4 p-3 text-white font-semibold"
          onClick={() => handleBatchExport("excel")}
        >
          Export All to Excel
        </button>
        <button
          className="bg-blue-600 mr-4 p-3 text-white font-semibold"
          onClick={() => handleBatchExport("pdf")}
        >
          Export All to PDF
        </button>
        <button
          className="bg-blue-600 mr-4 p-3 text-white font-semibold"
          onClick={() => handleBatchExport("csv")}
        >
          Export All to CSV
        </button>
        <button
          className="bg-blue-600 mr-4 p-3 text-white font-semibold"
          onClick={() => handleBatchExport("json")}
        >
          Export All to JSON
        </button>
      </div>
      <div className="flex flex-wrap">
        <div id="line-chart" ref={lineChartRef} className="size-[45rem]">
          <LineChartComponent
            data={lineData}
            dataKeys={["sales"]}
            height={300}
            showGrid={true}
            legendPosition="bottom"
            responsive={true}
            tooltipFormatter={({ name, value }) => `${name}: $${value}`}
            xAxisLabel="Month"
            lineType="monotone"
            dotSize={4}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          />
        </div>
        <div id="bar-chart" ref={barChartRef} className="size-[35rem]">
          <BarChartComponent
            data={barData}
            dataKeys={["sales", "orders"]}
            height={300}
            barSize={40}
            showGrid={true}
            legendPosition="bottom"
            responsive={true}
            tooltipFormatter={({ name, value }) => `${name}: $${value}`}
            xAxisLabel="Month"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          />
        </div>
        <div id="pie-chart" ref={pieChartRef} className="size-[35rem]">
          <PieChartComponent
            data={pieData}
            width={500}
            height={300}
            outerRadius={100}
            showLabels={true}
            legendPosition="bottom"
            responsive={true}
            tooltipFormatter={({ name, value }) => `${name}: $${value}`}
          />
        </div>
      </div>
      <div>
        {reportData && reportData?.length > 0 && (
          <ExportToExcel
            title="user data"
            data={reportData}
            headers={reportHeaders}
          />
        )}
      </div>
      <div className="pagefilter component">{Module}</div>
    </PageContent>
  );
}
