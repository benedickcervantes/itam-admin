"use client";

import { ClipboardCheck, Monitor, Mouse, User } from "lucide-react";
import { Badge } from "@/components/Badge";
import { DetailNotes, DetailRow, DetailSection, fmtLabel } from "@/components/DetailViewParts";
import { formatCondition } from "@/lib/device-form";
import type { AuditRegister } from "@/lib/types";

export function AuditDetailView({ audit }: { audit: AuditRegister }) {
  const department = audit.department?.name ?? null;
  const hasPeripherals = [audit.keyboard, audit.mouse, audit.printer].some((v) => v?.trim());
  const hasDeviceSpecs = [
    audit.processor,
    audit.ram,
    audit.primary_storage,
    audit.secondary_storage,
    audit.graphics_gpu,
    audit.operating_system,
    audit.os_license_status,
    audit.laptop_brand_model,
    audit.device_type,
    audit.power_avr_charger_battery,
    audit.screen,
    audit.screen_condition,
    audit.monitor,
  ].some((v) => v?.trim());

  const screenDisplay = [audit.screen_condition ? formatCondition(audit.screen_condition) : "", audit.screen?.trim()]
    .filter(Boolean)
    .join(" — ");

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#2E7D9A]/25 bg-gradient-to-br from-[#2E7D9A]/10 to-slate-900/40 p-4">
        <p className="font-mono text-sm font-medium text-[#2E7D9A]">{audit.audit_code}</p>
        <p className="mt-1 text-lg font-semibold text-white">{audit.employee_name}</p>
        <p className="mt-1 text-sm text-slate-400">
          {[audit.computer_name, department].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge value={audit.audit_status} />
          <Badge value={audit.overall_assessment} />
          <Badge value={audit.priority} />
          {audit.device_type && <Badge value={audit.device_type} />}
        </div>
        {audit.asset?.asset_code && (
          <p className="mt-3 text-xs text-slate-500">
            Linked asset: <span className="font-mono text-slate-400">{audit.asset.asset_code}</span>
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailSection title="Employee" icon={User}>
          <DetailRow label="Employee Name" value={audit.employee_name} />
          <DetailRow label="Department" value={department} />
          <DetailRow label="Job Title" value={audit.job_title} />
          <DetailRow label="Employee Status" value={fmtLabel(audit.employee_status)} />
        </DetailSection>

        <DetailSection title="Device" icon={Monitor}>
          <DetailRow label="Computer" value={audit.computer_name} />
          <DetailRow label="Device Type" value={fmtLabel(audit.device_type)} />
          <DetailRow label="Brand / Model" value={audit.laptop_brand_model} />
          {screenDisplay && <DetailRow label="Display" value={screenDisplay} />}
          {hasDeviceSpecs ? (
            <>
              <DetailRow label="Processor" value={audit.processor} />
              <DetailRow label="Memory (RAM)" value={audit.ram} />
              <DetailRow label="RAM Slots" value={audit.ram_slots_used} />
              <DetailRow label="Primary Storage" value={audit.primary_storage} />
              <DetailRow label="Secondary Storage" value={audit.secondary_storage} />
              <DetailRow label="GPU" value={audit.graphics_gpu} />
              <DetailRow label="Operating System" value={audit.operating_system} />
              <DetailRow label="OS License" value={fmtLabel(audit.os_license_status)} />
              <DetailRow label="Network" value={audit.network} />
              <DetailRow label="Power / Charging" value={audit.power_avr_charger_battery} />
              <DetailRow label="Monitor" value={audit.monitor} />
            </>
          ) : (
            <p className="py-3 text-sm text-slate-500">No detailed hardware specs recorded.</p>
          )}
        </DetailSection>
      </div>

      {hasPeripherals && (
        <DetailSection title="Peripherals" icon={Mouse}>
          <DetailRow label="Keyboard" value={audit.keyboard} />
          <DetailRow label="Keyboard Condition" value={fmtLabel(audit.keyboard_condition)} />
          <DetailRow label="Mouse" value={audit.mouse} />
          <DetailRow label="Mouse Type" value={fmtLabel(audit.mouse_type)} />
          <DetailRow label="Printer" value={audit.printer} />
        </DetailSection>
      )}

      <DetailSection title="Audit" icon={ClipboardCheck}>
        <DetailRow
          label="Audit Date"
          value={audit.audit_date ? audit.audit_date.slice(0, 10) : null}
        />
        <DetailRow label="Audit Status" value={fmtLabel(audit.audit_status)} />
        <DetailRow label="Overall Assessment" value={fmtLabel(audit.overall_assessment)} />
        <DetailRow label="Priority" value={fmtLabel(audit.priority)} />
        <DetailRow label="Recommended Action" value={fmtLabel(audit.recommended_action)} />
        <DetailRow label="Audited By" value={audit.audited_by} />
      </DetailSection>

      <DetailNotes title="Findings Summary" value={audit.findings_summary} />
      <DetailNotes title="Detailed Findings" value={audit.detailed_findings} />
      <DetailNotes title="Upgrade Notes" value={audit.upgrade_notes} />
      <DetailNotes title="Internal Notes" value={audit.internal_notes} />
      {audit.immediate_action && (
        <DetailNotes title="Immediate Action Notes" value={audit.immediate_action_notes} />
      )}
    </div>
  );
}
