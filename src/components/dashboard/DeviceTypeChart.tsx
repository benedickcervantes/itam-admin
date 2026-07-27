"use client";

import { labelEnum } from "@/lib/labels";
import { REFERENCE_DATA } from "@/lib/reference-data";

const COMPONENT_CHART_TYPES = ["KEYBOARD", "MOUSE", "PRINTER", "PROJECTOR", "UPS", "AVR"] as const;

/** All device / item types shown on the dashboard chart (includes zero-count rows). */
const ALL_CHART_DEVICE_TYPES = [
  ...new Set([...REFERENCE_DATA.deviceTypes, ...COMPONENT_CHART_TYPES]),
].filter((type) => type !== "OTHER");

const DEVICE_TYPE_COLORS: Record<string, string> = {
  DESKTOP: "#2E7D9A",
  LAPTOP: "#8B5CF6",
  ALL_IN_ONE: "#06B6D4",
  SERVER: "#F59E0B",
  POE_SWITCH: "#10B981",
  SWITCH_HUB: "#34D399",
  LOAD_BALANCER: "#3B82F6",
  FIREWALL: "#EF4444",
  ACCESS_POINT: "#EC4899",
  CCTV_DVR: "#F97316",
  CCTV_CAMERA: "#14B8A6",
  EXTERNAL_HDD_SSD: "#64748B",
  KEYBOARD: "#A855F7",
  MOUSE: "#22C55E",
  MONITOR: "#0EA5E9",
  UPS: "#CA8A04",
  PRINTER: "#EAB308",
  PROJECTOR: "#F472B6",
};

const FALLBACK_COLOR = "#475569";

type DeviceTypeRow = { deviceType: string; count: number };

export function DeviceTypeChart({ data = [] }: { data?: DeviceTypeRow[] }) {
  const countByType = new Map(data.map((row) => [row.deviceType, row.count]));
  const rows = ALL_CHART_DEVICE_TYPES.map((deviceType) => ({
    deviceType,
    count: countByType.get(deviceType) ?? 0,
  })).sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return labelEnum(a.deviceType).localeCompare(labelEnum(b.deviceType));
    });

  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const maxCount = Math.max(1, ...rows.map((row) => row.count));

  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-500">No device types configured</div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {rows.length} device type{rows.length === 1 ? "" : "s"}
        </p>
        <p className="text-sm text-slate-400">
          <span className="text-lg font-bold text-white">{total}</span> total devices
        </p>
      </div>

      <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {rows.map((row) => {
          const color = DEVICE_TYPE_COLORS[row.deviceType] ?? FALLBACK_COLOR;
          const isEmpty = row.count === 0;
          const barWidth = isEmpty ? 0 : Math.max(4, (row.count / maxCount) * 100);
          const share = total === 0 ? 0 : Math.round((row.count / total) * 100);

          return (
            <div key={row.deviceType}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className={`truncate ${isEmpty ? "text-slate-500" : "text-slate-300"}`}>
                  {labelEnum(row.deviceType)}
                </span>
                <span className="shrink-0 tabular-nums">
                  <span className={`font-semibold ${isEmpty ? "text-slate-500" : "text-white"}`}>{row.count}</span>
                  <span className="ml-1.5 text-xs text-slate-500">{share}%</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800/80">
                {!isEmpty && (
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${barWidth}%`, backgroundColor: color }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
