"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { labelEnum } from "@/lib/labels";

const STATUS_COLORS: Record<string, string> = {
  IN_USE: "#0EA5E9",
  AVAILABLE: "#10B981",
  UNDER_REPAIR: "#F59E0B",
  RESERVED: "#8B5CF6",
  RETIRED: "#64748B",
  DISPOSED: "#EF4444",
};

const FALLBACK_COLOR = "#475569";

type AssetStatusRow = { status: string; count: number };

export function AssetStatusChart({ data = [] }: { data?: AssetStatusRow[] }) {
  const total = data.reduce((sum, row) => sum + row.count, 0);
  const chartData = data.filter((row) => row.count > 0);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
      <div className="relative mx-auto aspect-square w-full max-w-72 shrink-0 sm:mx-0 sm:h-full sm:w-auto sm:max-w-[min(50%,20rem)]">
        {chartData.length === 0 ? (
          <div className="flex h-full min-h-40 items-center justify-center text-center text-sm text-slate-500">
            No assets yet
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius="62%"
                  outerRadius="98%"
                  paddingAngle={2}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {chartData.map((row) => (
                    <Cell key={row.status} fill={STATUS_COLORS[row.status] ?? FALLBACK_COLOR} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value ?? 0} asset(s)`, labelEnum(String(name))]}
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid rgb(51 65 85 / 0.6)",
                    borderRadius: "0.5rem",
                    color: "#e2e8f0",
                    fontSize: "0.8125rem",
                  }}
                  itemStyle={{ color: "#e2e8f0" }}
                  labelStyle={{ color: "#94a3b8" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{total}</span>
              <span className="text-xs uppercase tracking-wide text-slate-400">Total Assets</span>
            </div>
          </>
        )}
      </div>

      <div className="grid flex-1 grid-cols-1 content-center gap-2 sm:grid-cols-2">
        {data.map((row) => (
          <div
            key={row.status}
            className="flex items-center justify-between gap-2 rounded-lg bg-slate-900/40 px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[row.status] ?? FALLBACK_COLOR }}
              />
              <span className="text-sm text-slate-300">{labelEnum(row.status)}</span>
            </div>
            <span className="text-sm font-semibold text-white">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
