"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

// OXDA Brand Colors
const COLORS = {
  primary: "#003087",
  secondary: "#00a0e3",
  accent: "#60a5fa",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.success,
  COLORS.warning,
  COLORS.purple,
  COLORS.pink,
];

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "var(--panel, rgba(10, 22, 40, 0.95))",
          border: "1px solid var(--glass-border, rgba(0, 160, 227, 0.3))",
          borderRadius: "12px",
          padding: "12px 16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
          backdropFilter: "blur(12px)",
        }}
      >
        <p style={{ color: "var(--text, #fff)", margin: "0 0 8px 0", fontWeight: 600 }}>
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            style={{
              color: entry.color,
              margin: "4px 0",
              fontSize: "13px",
            }}
          >
            {entry.name}: {entry.value?.toLocaleString("es-MX")}
            {entry.unit || ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Area Chart Component
export function AreaChartComponent({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
}: {
  data: any[];
  dataKeys: { key: string; name: string; color?: string }[];
  xAxisKey: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          {dataKeys.map((dk, i) => (
            <linearGradient key={dk.key} id={`color${dk.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={dk.color || CHART_COLORS[i]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={dk.color || CHART_COLORS[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border, rgba(255,255,255,0.1))" />
        <XAxis
          dataKey={xAxisKey}
          stroke="var(--text-muted, rgba(255,255,255,0.5))"
          fontSize={12}
          tickLine={false}
        />
        <YAxis stroke="var(--text-muted, rgba(255,255,255,0.5))" fontSize={12} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: "20px" }} />
        {dataKeys.map((dk, i) => (
          <Area
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            name={dk.name}
            stroke={dk.color || CHART_COLORS[i]}
            fillOpacity={1}
            fill={`url(#color${dk.key})`}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Bar Chart Component
export function BarChartComponent({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  stacked = false,
}: {
  data: any[];
  dataKeys: { key: string; name: string; color?: string }[];
  xAxisKey: string;
  height?: number;
  stacked?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border, rgba(255,255,255,0.1))" />
        <XAxis
          dataKey={xAxisKey}
          stroke="var(--text-muted, rgba(255,255,255,0.5))"
          fontSize={12}
          tickLine={false}
        />
        <YAxis stroke="var(--text-muted, rgba(255,255,255,0.5))" fontSize={12} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: "20px" }} />
        {dataKeys.map((dk, i) => (
          <Bar
            key={dk.key}
            dataKey={dk.key}
            name={dk.name}
            fill={dk.color || CHART_COLORS[i]}
            radius={[4, 4, 0, 0]}
            stackId={stacked ? "stack" : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// Line Chart Component
export function LineChartComponent({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
}: {
  data: any[];
  dataKeys: { key: string; name: string; color?: string }[];
  xAxisKey: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border, rgba(255,255,255,0.1))" />
        <XAxis
          dataKey={xAxisKey}
          stroke="var(--text-muted, rgba(255,255,255,0.5))"
          fontSize={12}
          tickLine={false}
        />
        <YAxis stroke="var(--text-muted, rgba(255,255,255,0.5))" fontSize={12} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: "20px" }} />
        {dataKeys.map((dk, i) => (
          <Line
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            name={dk.name}
            stroke={dk.color || CHART_COLORS[i]}
            strokeWidth={3}
            dot={{ fill: dk.color || CHART_COLORS[i], r: 4 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// Pie Chart Component
export function PieChartComponent({
  data,
  dataKey,
  nameKey,
  height = 300,
  donut = false,
}: {
  data: any[];
  dataKey: string;
  nameKey: string;
  height?: number;
  donut?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={donut ? 60 : 0}
          outerRadius={80}
          paddingAngle={5}
          dataKey={dataKey}
          nameKey={nameKey}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: "20px" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Radar Chart Component
export function RadarChartComponent({
  data,
  dataKeys,
  height = 300,
}: {
  data: any[];
  dataKeys: { key: string; name: string; color?: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid stroke="var(--glass-border, rgba(255,255,255,0.2))" />
        <PolarAngleAxis dataKey="subject" stroke="var(--text-muted, rgba(255,255,255,0.7))" fontSize={11} />
        <PolarRadiusAxis stroke="var(--glass-border, rgba(255,255,255,0.3))" fontSize={10} />
        <Tooltip content={<CustomTooltip />} />
        {dataKeys.map((dk, i) => (
          <Radar
            key={dk.key}
            name={dk.name}
            dataKey={dk.key}
            stroke={dk.color || CHART_COLORS[i]}
            fill={dk.color || CHART_COLORS[i]}
            fillOpacity={0.3}
          />
        ))}
        <Legend wrapperStyle={{ paddingTop: "20px" }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// Stat Card Component
export function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendUp,
  icon,
  color = "blue",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "orange" | "red" | "purple";
}) {
  const colorStyles = {
    blue: { border: "#003087", glow: "rgba(0,48,135,0.3)" },
    green: { border: "#22c55e", glow: "rgba(34,197,94,0.3)" },
    orange: { border: "#f59e0b", glow: "rgba(245,158,11,0.3)" },
    red: { border: "#ef4444", glow: "rgba(239,68,68,0.3)" },
    purple: { border: "#8b5cf6", glow: "rgba(139,92,246,0.3)" },
  };

  const style = colorStyles[color];

  return (
    <div
      style={{
        background: "var(--panel, rgba(255,255,255,0.07))",
        backdropFilter: "blur(28px) saturate(180%)",
        border: "1px solid var(--glass-border, rgba(255,255,255,0.13))",
        borderTop: `3px solid ${style.border}`,
        borderRadius: "16px",
        padding: "20px",
        boxShadow: `var(--glass-shadow), 0 -1px 20px ${style.glow}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-muted, rgba(255,255,255,0.6))",
              marginBottom: "8px",
            }}
          >
            {title}
          </p>
          <p
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "var(--text, #fff)",
              lineHeight: 1,
              marginBottom: "4px",
            }}
          >
            {value}
          </p>
          {subtitle && (
            <p style={{ fontSize: "13px", color: "var(--text-muted, rgba(255,255,255,0.5))", marginTop: "4px" }}>
              {subtitle}
            </p>
          )}
          {trend && (
            <p
              style={{
                fontSize: "12px",
                color: trendUp ? "#4ade80" : "#f87171",
                marginTop: "8px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
        </div>
        {icon && (
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: `linear-gradient(135deg, ${style.border}40, ${style.border}20)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// Chart Card Component
export function ChartCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--panel, rgba(255,255,255,0.07))",
        backdropFilter: "blur(28px) saturate(180%)",
        border: "1px solid var(--glass-border, rgba(255,255,255,0.13))",
        borderRadius: "22px",
        padding: "24px",
        boxShadow: "var(--glass-shadow-lg)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--text, #fff)",
              margin: "0 0 4px 0",
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p style={{ fontSize: "13px", color: "var(--text-muted, rgba(255,255,255,0.5))", margin: 0 }}>{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}

export { COLORS, CHART_COLORS };
