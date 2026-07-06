"use client";

import { Monitor, Mouse, User } from "lucide-react";
import { Badge } from "@/components/Badge";
import { DetailNotes, DetailRow, DetailSection, fmtLabel } from "@/components/DetailViewParts";
import { assetCategoryFromAsset, isInfrastructureDevice, showsInfraNetworkSpecs, showsInfraServerSpecs } from "@/lib/device-form";
import type { Asset } from "@/lib/types";

export function AssetDetailView({ asset }: { asset: Asset }) {
  const department = asset.department?.name ?? null;
  const assetCategory = assetCategoryFromAsset(asset);
  const infra = isInfrastructureDevice(asset.device_type ?? "", assetCategory);
  const infraServer = infra && showsInfraServerSpecs(asset.device_type ?? "");
  const infraNetwork = infra && showsInfraNetworkSpecs(asset.device_type ?? "");
  const hasPeripherals =
    !infra && [asset.keyboard, asset.mouse, asset.printer].some((v) => v?.trim());
  const hasInfraFields = [asset.location, asset.management_ip, asset.rack_slot, asset.port_count].some(
    (v) => v != null && v !== "",
  );
  const hasDeviceSpecs = [
    asset.processor,
    asset.ram,
    asset.primary_storage,
    asset.secondary_storage,
    asset.gpu,
    asset.os,
    asset.os_license_status,
    asset.brand_model,
    asset.device_type,
    asset.monitor,
  ].some((v) => v?.trim());

  const assignmentTitle = infra ? "Ownership" : "Assignment";
  const assigneeLabel = asset.assigned_to?.trim() || (infra ? "Unassigned" : "—");
  const subtitleParts = infra
    ? [department, asset.location].filter(Boolean)
    : [asset.assigned_to, department].filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#2E7D9A]/25 bg-gradient-to-br from-[#2E7D9A]/10 to-slate-900/40 p-4">
        <p className="font-mono text-sm font-medium text-[#2E7D9A]">{asset.asset_code}</p>
        <p className="mt-1 text-lg font-semibold text-white">{asset.computer_name}</p>
        <p className="mt-1 text-sm text-slate-400">{subtitleParts.join(" · ") || (infra ? "Unassigned" : "—")}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge value={asset.status} />
          <Badge value={asset.condition} />
          {(asset.item_type || asset.device_type) && (
            <Badge value={asset.item_type ?? asset.device_type} />
          )}
        </div>
        {asset.audit_register?.audit_code && (
          <p className="mt-3 text-xs text-slate-500">
            Linked audit:{" "}
            <span className="font-mono text-slate-400">{asset.audit_register.audit_code}</span>
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailSection title={assignmentTitle} icon={User}>
          <DetailRow label="Assigned To" value={assigneeLabel} />
          {!infra && <DetailRow label="Job Title" value={asset.job_title} />}
          <DetailRow label={infra ? "Owning Department" : "Department"} value={department} />
          <DetailRow label="Status" value={fmtLabel(asset.status)} />
          <DetailRow label="Condition" value={fmtLabel(asset.condition)} />
          <DetailRow label="Serial No." value={asset.serial_number} />
        </DetailSection>

        <DetailSection title="Device" icon={Monitor}>
          <DetailRow label={infra ? "Asset Name / Hostname" : "Computer"} value={asset.computer_name} />
          {asset.item_type && <DetailRow label="Type" value={fmtLabel(asset.item_type)} />}
          <DetailRow label="Device Type" value={fmtLabel(asset.device_type)} />
          <DetailRow label="Brand / Model" value={asset.brand_model} />
          {infra && hasInfraFields && (
            <>
              <DetailRow label="Location" value={asset.location} />
              <DetailRow label="Management IP" value={asset.management_ip} />
              <DetailRow label="Rack / Slot" value={asset.rack_slot} />
              <DetailRow
                label="Port Count"
                value={asset.port_count != null ? String(asset.port_count) : null}
              />
            </>
          )}
          {hasDeviceSpecs ? (
            <>
              {(!infra || infraServer) && <DetailRow label="Processor" value={asset.processor} />}
              {infraNetwork && <DetailRow label="MAC Address" value={asset.mac_address} />}
              {(!infra || infraServer) && <DetailRow label="Memory (RAM)" value={asset.ram} />}
              {(!infra || infraServer) && <DetailRow label="Primary Storage" value={asset.primary_storage} />}
              {(!infra || infraServer) && <DetailRow label="Secondary Storage" value={asset.secondary_storage} />}
              <DetailRow label="GPU" value={asset.gpu} />
              <DetailRow label="Operating System" value={asset.os} />
              {!infra && <DetailRow label="OS License" value={fmtLabel(asset.os_license_status)} />}
              {!infra && <DetailRow label="Monitor" value={asset.monitor} />}
            </>
          ) : (
            !hasInfraFields && <p className="py-3 text-sm text-slate-500">No detailed hardware specs recorded.</p>
          )}
        </DetailSection>
      </div>

      {hasPeripherals && (
        <DetailSection title="Peripherals" icon={Mouse}>
          <DetailRow label="Keyboard" value={asset.keyboard} />
          <DetailRow label="Mouse" value={asset.mouse} />
          <DetailRow label="Printer" value={asset.printer} />
        </DetailSection>
      )}

      <DetailNotes value={asset.notes} />
    </div>
  );
}
