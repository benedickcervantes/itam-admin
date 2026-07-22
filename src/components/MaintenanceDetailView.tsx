"use client";

import { Calendar, User, Wrench } from "lucide-react";
import { Badge } from "@/components/Badge";
import { DetailNotes, DetailRow, DetailSection } from "@/components/DetailViewParts";
import { labelEnum } from "@/lib/labels";
import type { MaintenanceRecord } from "@/lib/types";

function fmtDate(value?: string | null) {
  if (!value) return null;
  return value.slice(0, 10);
}

export function MaintenanceDetailView({ record }: { record: MaintenanceRecord }) {
  const subtitle = [record.computer_name, record.employee].filter(Boolean).join(" · ");

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#2E7D9A]/25 bg-gradient-to-br from-[#2E7D9A]/10 to-slate-900/40 p-4">
        <p className="font-mono text-sm font-medium text-[#2E7D9A]">{record.record_code}</p>
        <p className="mt-1 text-lg font-semibold text-white">{record.issue}</p>
        <p className="mt-1 text-sm text-slate-400">{subtitle || "—"}</p>
        <div className="mt-3">
          <Badge value={record.status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailSection title="Asset & User" icon={User}>
          <DetailRow label="Computer" value={record.computer_name} />
          <DetailRow label="Employee / User" value={record.employee} />
          <DetailRow label="Department" value={record.audit_register?.department?.name} />
          <DetailRow label="Performed By" value={record.performed_by} />
          <DetailRow label="Status" value={labelEnum(record.status)} />
        </DetailSection>

        <DetailSection title="Timeline" icon={Calendar}>
          <DetailRow label="Date Opened" value={fmtDate(record.date_opened)} />
          <DetailRow label="Date Closed" value={fmtDate(record.date_closed)} />
        </DetailSection>
      </div>

      <DetailSection title="Service / Repair Details" icon={Wrench}>
        <DetailRow label="Issue" value={record.issue} />
        <DetailRow label="Action Taken" value={record.action_taken} />
      </DetailSection>

      <DetailNotes value={record.notes} />
    </div>
  );
}
