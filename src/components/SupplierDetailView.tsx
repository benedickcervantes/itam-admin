"use client";

import { Building2, Contact, Tags } from "lucide-react";
import { Badge } from "@/components/Badge";
import { DetailNotes, DetailRow, DetailSection } from "@/components/DetailViewParts";
import { labelEnum } from "@/lib/labels";
import type { Supplier } from "@/lib/types";

export function SupplierDetailView({ record }: { record: Supplier }) {
  const categories = record.categories ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#2E7D9A]/25 bg-gradient-to-br from-[#2E7D9A]/10 to-slate-900/40 p-4">
        <p className="font-mono text-sm font-medium text-[#2E7D9A]">{record.supplier_code}</p>
        <p className="mt-1 text-lg font-semibold text-white">{record.name}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {record.status && <Badge value={record.status} />}
          {record.contact_person && (
            <span className="text-sm text-slate-400">{record.contact_person}</span>
          )}
        </div>
      </div>

      <div className="grid min-w-0 gap-4">
        <DetailSection title="Company" icon={Building2}>
          <DetailRow label="Supplier Name" value={record.name} />
          <DetailRow label="Status" value={labelEnum(record.status)} />
          <DetailRow label="Website" value={record.website} />
        </DetailSection>

        <DetailSection title="Contact" icon={Contact}>
          <DetailRow label="Contact Person" value={record.contact_person} />
          <DetailRow label="Email" value={record.email} />
          <DetailRow label="Phone" value={record.phone} />
          <DetailRow label="Address" value={record.address} />
        </DetailSection>
      </div>

      <DetailSection title="Supply Categories" icon={Tags}>
        {categories.length === 0 ? (
          <p className="text-sm text-slate-500">No categories selected.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Badge key={c} value={c} />
            ))}
          </div>
        )}
      </DetailSection>

      <DetailNotes value={record.notes} />
    </div>
  );
}
