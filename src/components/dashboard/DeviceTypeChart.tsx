"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { labelEnum } from "@/lib/labels";

const DEVICE_TYPE_COLORS: Record<string, string> = {
  DESKTOP: "#2E7D9A",
  LAPTOP: "#8B5CF6",
  ALL_IN_ONE: "#06B6D4",
  SERVER: "#F59E0B",
  POE_SWITCH: "#10B981",
  LOAD_BALANCER: "#3B82F6",
  FIREWALL: "#EF4444",
  ACCESS_POINT: "#EC4899",
  CCTV_DVR: "#F97316",
  CCTV_CAMERA: "#14B8A6",
  OTHER: "#64748B",
};

const FALLBACK_COLOR = "#475569";

const ROW_HEIGHT = 40;
const MIN_HEIGHT = 220;
const MAX_HEIGHT = 480;

type DeviceTypeRow = { deviceType: string; count: number };

export function DeviceTypeChart({ data = [] }: { data?: DeviceTypeRow[] }) {
  const chartData = [...data]
    .sort((a, b) => b.count - a.count)
    .map((row) => ({ ...row, label: labelEnum(row.deviceType) }));

  const hasData = chartData.some((row) => row.count > 0);

  if (!hasData) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-500">No devices recorded yet</div>
    );
  }

  // Grows with the number of categories so bars stay readable; scrolls once it gets too tall.
  const naturalHeight = Math.max(MIN_HEIGHT, chartData.length * ROW_HEIGHT);
  const chartHeight = Math.min(MAX_HEIGHT, naturalHeight);
  const needsScroll = naturalHeight > MAX_HEIGHT;

  const longestLabel = chartData.reduce((max, row) => Math.max(max, row.label.length), 0);
  const yAxisWidth = Math.min(160, Math.max(90, longestLabel * 7 + 16));

  return (
    <div className="w-full" style={{ height: chartHeight, overflowY: needsScroll ? "auto" : "visible" }}>
      <div style={{ height: needsScroll ? naturalHeight : "100%", minHeight: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
            <CartesianGrid horizontal={false} stroke="rgb(51 65 85 / 0.4)" />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={{ stroke: "rgb(51 65 85 / 0.6)" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={yAxisWidth}
              tick={{ fill: "#cbd5e1", fontSize: 12 }}
              axisLine={{ stroke: "rgb(51 65 85 / 0.6)" }}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgb(51 65 85 / 0.2)" }}
              formatter={(value) => [`${value ?? 0} asset(s)`, "Count"]}
              contentStyle={{
                background: "#1e293b",
                border: "1px solid rgb(51 65 85 / 0.6)",
                borderRadius: "0.5rem",
                color: "#e2e8f0",
                fontSize: "0.8125rem",
              }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
              {chartData.map((row) => (
                <Cell key={row.deviceType} fill={DEVICE_TYPE_COLORS[row.deviceType] ?? FALLBACK_COLOR} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
