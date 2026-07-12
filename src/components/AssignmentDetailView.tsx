"use client";

import { History, User } from "lucide-react";
import { Badge } from "@/components/Badge";
import { DetailNotes, DetailRow, DetailSection } from "@/components/DetailViewParts";
import type { Assignment } from "@/lib/types";

function assignmentStatus(row: Assignment) {
  return row.returned_date ? "RETURNED" : "ACTIVE";
}

export function AssignmentDetailView({ record }: { record: Assignment }) {
  const assetLabel = record.asset
    ? `${record.asset.asset_code} — ${record.asset.computer_name}`
    : null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#2E7D9A]/25 bg-gradient-to-br from-[#2E7D9A]/10 to-slate-900/40 p-4">
        <p className="font-mono text-sm font-medium text-[#2E7D9A]">{record.record_code}</p>
        <p className="mt-1 text-lg font-semibold text-white">{record.assigned_to}</p>
        <p className="mt-1 text-sm text-slate-400">{assetLabel ?? "Assigned asset"}</p>
        <div className="mt-3">
          <Badge value={assignmentStatus(record)} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailSection title="Assignment" icon={User}>
          <DetailRow label="Assigned To" value={record.assigned_to} />
          <DetailRow label="Asset" value={assetLabel} />
          <DetailRow label="Department" value={record.department?.name} />
          <DetailRow label="Assigned By" value={record.assigned_by} />
        </DetailSection>

        <DetailSection title="Timeline" icon={History}>
          <DetailRow label="Assigned Date" value={record.assigned_date.slice(0, 10)} />
          <DetailRow label="Returned Date" value={record.returned_date?.slice(0, 10)} />
        </DetailSection>
      </div>

      <DetailNotes value={record.notes} />
    </div>
  );
}
