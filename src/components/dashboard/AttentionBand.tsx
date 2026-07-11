"use client";

import {
  TriangleAlert,
  Siren,
  Wrench,
  Hammer,
  ShieldOff,
  Flame,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

type AttentionItem = {
  key: string;
  label: string;
  value: number;
  icon: LucideIcon;
};

export function AttentionBand({
  criticalAudits,
  immediateActions,
  assetsUnderRepair,
  openMaintenance,
  highPriority,
  crackedOs,
}: {
  criticalAudits: number;
  immediateActions: number;
  assetsUnderRepair: number;
  openMaintenance: number;
  highPriority: number;
  crackedOs: number;
}) {
  const items: AttentionItem[] = [
    { key: "critical", label: "Critical Audits", value: criticalAudits, icon: TriangleAlert },
    { key: "immediate", label: "Immediate Actions", value: immediateActions, icon: Siren },
    { key: "repair", label: "Assets Under Repair", value: assetsUnderRepair, icon: Wrench },
    { key: "maintenance", label: "Open Maintenance", value: openMaintenance, icon: Hammer },
    { key: "priority", label: "High Priority", value: highPriority, icon: Flame },
    { key: "os", label: "Cracked OS", value: crackedOs, icon: ShieldOff },
  ];

  const active = items.filter((item) => item.value > 0);

  if (active.length === 0) {
    return (
      <div className="card flex items-center gap-3 border-emerald-500/30 bg-emerald-500/5 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-emerald-300">All Clear</p>
          <p className="text-xs text-slate-400">No critical assets or urgent actions right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-red-500/25 bg-red-500/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <TriangleAlert className="h-4 w-4 text-red-400" />
        <h3 className="text-sm font-semibold text-red-300">Attention Required</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {active.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="flex items-center gap-2.5 rounded-lg bg-slate-900/50 px-3 py-2.5 ring-1 ring-red-500/20"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-300">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-tight text-white tabular-nums">{item.value}</p>
                <p className="truncate text-[11px] leading-tight text-slate-400">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
