"use client";

import { FileText, Trash2 } from "lucide-react";
import { DetailNotes, DetailRow, DetailSection } from "@/components/DetailViewParts";
import { labelEnum } from "@/lib/labels";
import type { DisposalRecord } from "@/lib/types";

export function DisposalDetailView({ record }: { record: DisposalRecord }) {
  const assetLabel = record.asset
    ? `${record.asset.asset_code} — ${record.asset.computer_name}`
    : null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#2E7D9A]/25 bg-gradient-to-br from-[#2E7D9A]/10 to-slate-900/40 p-4">
        <p className="font-mono text-sm font-medium text-[#2E7D9A]">{record.record_code}</p>
        <p className="mt-1 text-lg font-semibold text-white">{assetLabel ?? "Disposed asset"}</p>
        <p className="mt-1 text-sm text-slate-400">{record.disposal_date.slice(0, 10)}</p>
        {record.disposal_method && (
          <p className="mt-2 text-sm text-slate-300">{labelEnum(record.disposal_method)}</p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailSection title="Disposal" icon={Trash2}>
          <DetailRow label="Asset" value={assetLabel} />
          <DetailRow label="Department" value={record.asset?.department?.name} />
          <DetailRow label="Disposal Date" value={record.disposal_date.slice(0, 10)} />
          <DetailRow label="Reason" value={record.disposal_reason} />
          <DetailRow label="Method" value={labelEnum(record.disposal_method)} />
        </DetailSection>

        <DetailSection title="Documentation" icon={FileText}>
          <DetailRow label="Certificate / Doc No." value={record.certificate_doc_no} />
          <DetailRow label="Approved By" value={record.approved_by} />
          <DetailRow label="Witness" value={record.witness} />
        </DetailSection>
      </div>

      <DetailNotes value={record.notes} />
    </div>
  );
}
