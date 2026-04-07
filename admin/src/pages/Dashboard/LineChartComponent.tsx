import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import chroma from "chroma-js";
import { VerticalAlignmentType } from "recharts/types/component/DefaultLegendContent";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

// Default color scale anchors for chroma-js
const DEFAULT_COLOR_SCALE = ["#0088FE", "#FF8042"];

// Interface for data shape
interface ChartData {
  name: string;
  [key: string]: unknown; // Allow additional properties
}

// Props interface
interface LineChartProps {
  data: ChartData[];
  dataKeys: string[]; // Array of keys for multiple lines (e.g., ['uv', 'pv'])
  width?: number;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  legendPosition?: VerticalAlignmentType;
  showTooltip?: boolean;
  tooltipFormatter?: (payload: { name: NameType; value: ValueType }) => string;
  colorScale?: string[];
  nameKey?: keyof ChartData;
  xAxisLabel?: string;
  yAxisLabel?: string;
  responsive?: boolean;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  lineType?: "monotone" | "linear" | "natural" | "step";
  dotSize?: number; // Size of active dot
}

// Utility to generate dynamic colors with WCAG contrast
const generateColors = (
  count: number,
  colorScale: string[] = DEFAULT_COLOR_SCALE,
): string[] => {
  const colors = chroma.scale(colorScale).mode("lch").colors(count);
  return colors.map((color) => {
    const contrast = chroma.contrast(color, "#fff");
    if (contrast < 4.5) {
      return chroma(color).luminance(0.5).hex(); // Adjust luminance for better contrast
    }
    return color;
  });
};

const LineChartComponent: React.FC<LineChartProps> = ({
  data,
  dataKeys,
  width = 400,
  height = 300,
  showGrid = true,
  showLegend = true,
  legendPosition = "bottom",
  showTooltip = true,
  tooltipFormatter,
  colorScale = DEFAULT_COLOR_SCALE,
  nameKey = "name",
  xAxisLabel,
  yAxisLabel,
  responsive = true,
  margin = { top: 5, right: 30, left: 20, bottom: 5 },
  lineType = "monotone",
  dotSize = 4,
}) => {
  // Memoize colors for performance
  const colors = useMemo(
    () => generateColors(dataKeys.length, colorScale),
    [dataKeys.length, colorScale],
  );

  // Render the chart inside ResponsiveContainer if responsive is true
  const ChartContainer = responsive ? ResponsiveContainer : React.Fragment;
  const containerProps = responsive ? { width: "100%", height } : {};

  // Validate data
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }
  const isValidData = data.every((item) =>
    dataKeys.every(
      (key) =>
        item[key] == null || (typeof item[key] === "number" && item[key] >= 0),
    ),
  );
  if (!isValidData) {
    return <div>Invalid data format</div>;
  }

  return (
    <ChartContainer
      id="bar-chart"
      className="recharts-responsive-container"
      {...containerProps}
    >
      <LineChart
        width={responsive ? undefined : width}
        height={height}
        data={data}
        margin={margin}
        role="img"
        aria-label="Line chart displaying eCommerce analytics"
      >
        {showGrid && <CartesianGrid strokeDasharray="0" opacity={0.4} />}
        <XAxis
          dataKey={nameKey}
          label={{
            value: xAxisLabel,
            position: "bottom",
            offset: -6,
          }}
          padding={{ left: 20 }}
        />
        <YAxis
          label={{
            value: yAxisLabel,
            angle: -90,
            position: "center",
            dx: -13, // negative value moves it further left
            style: {
              fontWeight: "bold", // Make the label bold
              fill: "#444", // Optional: change text color
              fontSize: 10, // Optional: increase size for better visibility
            },
          }}
          interval="preserveStartEnd"
        />
        {showTooltip && (
          <Tooltip
            formatter={
              tooltipFormatter
                ? (value, name) => tooltipFormatter({ value, name })
                : undefined
            }
          />
        )}
        {showLegend && (
          <Legend
            verticalAlign={legendPosition}
            align={
              legendPosition === "bottom" || legendPosition === "top"
                ? "center"
                : "left"
            }
          />
        )}
        {dataKeys.map((key, index) => (
          <Line
            key={`line-${key}`}
            type={lineType}
            dataKey={key}
            stroke={colors[index]}
            activeDot={{ r: dotSize }}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
};

export default LineChartComponent;
