"use client";

import { Monitor, Mouse, User } from "lucide-react";
import { Badge } from "@/components/Badge";
import { DetailNotes, DetailRow, DetailSection, fmtLabel } from "@/components/DetailViewParts";
import { assetCategoryFromAsset, formatCondition, isComponentItemType, isLaptopDevice, isInfrastructureDevice, showsInfraNetworkSpecs, showsInfraServerSpecs } from "@/lib/device-form";
import type { Asset } from "@/lib/types";

function assetWithAuditFallback(asset: Asset): Asset {
  const audit = asset.audit_register;
  if (!audit) return asset;
  return {
    ...asset,
    screen: asset.screen ?? audit.screen,
    screen_condition: asset.screen_condition ?? audit.screen_condition,
    ram_slots_used: asset.ram_slots_used ?? audit.ram_slots_used,
    power_avr_charger_battery: asset.power_avr_charger_battery ?? audit.power_avr_charger_battery,
    keyboard: asset.keyboard ?? audit.keyboard,
    keyboard_condition: asset.keyboard_condition ?? audit.keyboard_condition,
    mouse: asset.mouse ?? audit.mouse,
    mouse_type: asset.mouse_type ?? audit.mouse_type,
    mouse_condition: asset.mouse_condition ?? audit.mouse_condition,
    gpu: asset.gpu ?? audit.graphics_gpu,
    network: asset.network ?? audit.network,
  };
}

export function AssetDetailView({ asset: rawAsset }: { asset: Asset }) {
  const isComponent = isComponentItemType(rawAsset.item_type ?? "");
  const asset = isComponent ? rawAsset : assetWithAuditFallback(rawAsset);
  const department = asset.department?.name ?? null;
  const assetCategory = assetCategoryFromAsset(asset);
  const infra = isInfrastructureDevice(asset.device_type ?? "", assetCategory);
  const infraServer = infra && showsInfraServerSpecs(asset.device_type ?? "");
  const infraNetwork = infra && showsInfraNetworkSpecs(asset.device_type ?? "");
  const showsComputerHardware = !infra || infraServer;
  const isLaptop = isLaptopDevice(asset.device_type ?? "");
  const displayGpu = asset.gpu?.trim() || asset.audit_register?.graphics_gpu?.trim() || null;
  const displayNetwork = asset.network?.trim() || asset.audit_register?.network?.trim() || null;
  const screenDisplay = [asset.screen_condition ? formatCondition(asset.screen_condition) : "", asset.screen?.trim()]
    .filter(Boolean)
    .join(" — ");
  const hasPeripherals =
    !infra && !isComponent && [asset.keyboard, asset.mouse, asset.printer].some((v) => v?.trim());
  const hasInfraFields = [asset.location, asset.management_ip, asset.rack_slot, asset.port_count].some(
    (v) => v != null && v !== "",
  );
  const hasDeviceSpecs = !isComponent && [
    asset.processor,
    asset.ram,
    asset.ram_slots_used,
    asset.primary_storage,
    asset.secondary_storage,
    displayGpu,
    displayNetwork,
    asset.os,
    asset.os_license_status,
    asset.brand_model,
    asset.device_type,
    asset.monitor,
    asset.power_avr_charger_battery,
    screenDisplay,
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
          {asset.device_type && <DetailRow label="Device Type" value={fmtLabel(asset.device_type)} />}
          <DetailRow label="Brand / Model" value={asset.brand_model} />
          {screenDisplay && <DetailRow label="Built-in Display" value={screenDisplay} />}
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
              {!infra && <DetailRow label="RAM Slots Used" value={asset.ram_slots_used} />}
              {showsComputerHardware && <DetailRow label="Primary Storage" value={asset.primary_storage} />}
              {showsComputerHardware && <DetailRow label="Secondary Storage" value={asset.secondary_storage} />}
              {showsComputerHardware && <DetailRow label="Graphics Card / GPU" value={displayGpu} />}
              <DetailRow label="Operating System" value={asset.os} />
              {!infra && <DetailRow label="OS License" value={fmtLabel(asset.os_license_status)} />}
              {showsComputerHardware && (
                <DetailRow label="Network (Wi-Fi/Ethernet)" value={displayNetwork} />
              )}
              {isLaptop && <DetailRow label="Power & Charging" value={asset.power_avr_charger_battery} />}
              {!infra && <DetailRow label="Monitor" value={asset.monitor} />}
            </>
          ) : (
            !hasInfraFields && !isComponent && (
              <p className="py-3 text-sm text-slate-500">No detailed hardware specs recorded.</p>
            )
          )}
        </DetailSection>
      </div>

      {hasPeripherals && (
        <DetailSection title="Peripherals" icon={Mouse}>
          {isLaptop ? (
            <>
              <DetailRow label="Built-in Keyboard" value={asset.keyboard} />
              <DetailRow label="Built-in Trackpad" value={asset.mouse} />
            </>
          ) : (
            <>
              <DetailRow label="Keyboard" value={asset.keyboard} />
              <DetailRow
                label="Keyboard Condition"
                value={asset.keyboard_condition ? formatCondition(asset.keyboard_condition) : null}
              />
              <DetailRow label="Mouse" value={asset.mouse} />
              <DetailRow
                label="Mouse Condition"
                value={asset.mouse_condition ? formatCondition(asset.mouse_condition) : null}
              />
            </>
          )}
          <DetailRow label="Printer" value={asset.printer} />
        </DetailSection>
      )}

      <DetailNotes value={asset.notes} />
    </div>
  );
}
