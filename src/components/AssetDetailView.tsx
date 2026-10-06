"use client";

import { useEffect, useState } from "react";
import { History, Monitor, Mouse, User } from "lucide-react";
import { Badge } from "@/components/Badge";
import { DetailNotes, DetailRow, DetailSection, fmtLabel } from "@/components/DetailViewParts";
import { fetchAllDeviceHistory } from "@/lib/api/device-history";
import { assetCategoryFromAsset, formatCondition, isComponentItemType, isLaptopDevice, isInfrastructureDevice, showsInfraNetworkSpecs, showsInfraServerSpecs, showsInfraStorageSpecs, showsInfraMonitorSpecs } from "@/lib/device-form";
import type { Asset, DeviceHistory } from "@/lib/types";

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
    webcam: asset.webcam ?? audit.webcam,
    webcam_condition: asset.webcam_condition ?? audit.webcam_condition,
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
  const infraStorage = infra && showsInfraStorageSpecs(asset.device_type ?? "");
  const infraMonitor = infra && showsInfraMonitorSpecs(asset.device_type ?? "");
  const showsComputerHardware = !infra || infraServer || infraStorage;
  const isLaptop = isLaptopDevice(asset.device_type ?? "");
  const displayGpu = asset.gpu?.trim() || asset.audit_register?.graphics_gpu?.trim() || null;
  const displayNetwork = asset.network?.trim() || asset.audit_register?.network?.trim() || null;
  const screenDisplay = [asset.screen_condition ? formatCondition(asset.screen_condition) : "", asset.screen?.trim()]
    .filter(Boolean)
    .join(" — ");
  const hasPeripherals =
    !infra &&
    !isComponent &&
    [asset.keyboard, asset.mouse, asset.printer, asset.webcam].some((v) => v?.trim());
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
          {screenDisplay && <DetailRow label={infraMonitor ? "Display" : "Built-in Display"} value={screenDisplay} />}
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
          <DetailRow label="Webcam" value={asset.webcam} />
          <DetailRow
            label="Webcam Condition"
            value={asset.webcam_condition ? formatCondition(asset.webcam_condition) : null}
          />
          <DetailRow label="Printer" value={asset.printer} />
        </DetailSection>
      )}

      <DetailNotes value={asset.notes} />
      <AssetDeviceHistory asset={asset} />
    </div>
  );
}

function fmtHistoryDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

function isReleasedToStock(row: DeviceHistory): boolean {
  if (!row.returned_date) return false;
  const notes = (row.notes ?? "").toLowerCase();
  return /released to available|released to reserved|moved to spare|spare stock|available from/i.test(notes);
}

function historyStatus(row: DeviceHistory): { label: string; className: string } {
  if (!row.returned_date) {
    return { label: "Current", className: "bg-emerald-950/50 text-emerald-300" };
  }
  if (isReleasedToStock(row)) {
    return { label: "Available", className: "bg-sky-950/60 text-sky-300" };
  }
  return { label: "Previous", className: "bg-amber-950/40 text-amber-300" };
}

function displayAssignee(row: DeviceHistory): string {
  if (isReleasedToStock(row)) return "Available (spare)";
  return row.assigned_to?.trim() || "—";
}

function displayLastUser(row: DeviceHistory): string {
  if (isReleasedToStock(row)) return row.assigned_to?.trim() || row.last_user?.trim() || "—";
  return row.last_user?.trim() || "—";
}

function AssetDeviceHistory({ asset }: { asset: Asset }) {
  const [rows, setRows] = useState<DeviceHistory[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError("");
    fetchAllDeviceHistory({ assetId: asset.id, status: "all" })
      .then((items) => {
        if (!cancelled) setRows(items);
      })
      .catch(() => {
        if (!cancelled) {
          setRows([]);
          setError("Could not load device history.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [asset.id]);

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/30">
      <div className="flex items-center gap-2.5 border-b border-slate-700/50 bg-slate-800/35 px-4 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2E7D9A]/15">
          <History className="h-3.5 w-3.5 text-[#2E7D9A]" />
        </span>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Device History</h3>
        {rows && rows.length > 0 && (
          <span className="ml-auto text-[11px] font-medium text-slate-500">{rows.length}</span>
        )}
      </div>
      <div className="px-4 py-3">
        {rows === null && !error && <p className="py-2 text-sm text-slate-500">Loading device history...</p>}
        {error && <p className="py-2 text-sm text-red-400">{error}</p>}
        {rows && rows.length === 0 && !error && (
          <p className="py-2 text-sm text-slate-500">No device history recorded for this asset.</p>
        )}
        {rows && rows.length > 0 && (
          <ul className="divide-y divide-slate-700/40">
            {rows.map((row) => {
              const status = historyStatus(row);
              const computer = row.computer_name?.trim();
              const showComputer = Boolean(computer && computer !== asset.computer_name?.trim());
              return (
                <li key={row.id} className="py-3 first:pt-1 last:pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-medium text-[#2E7D9A]">{row.record_code}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <dl className="mt-2 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                    <HistoryFact label="Assigned To" value={displayAssignee(row)} />
                    <HistoryFact label="Last User" value={displayLastUser(row)} />
                    <HistoryFact label="Department" value={row.department?.name} />
                    {showComputer && <HistoryFact label="Computer" value={computer} />}
                    <HistoryFact label="Assigned" value={fmtHistoryDate(row.assigned_date)} />
                    {row.returned_date && <HistoryFact label="Returned" value={fmtHistoryDate(row.returned_date)} />}
                    {row.assigned_by?.trim() && <HistoryFact label="Assigned By" value={row.assigned_by} />}
                  </dl>
                  {row.notes?.trim() && (
                    <p className="mt-2 text-sm leading-relaxed break-words whitespace-pre-wrap text-slate-400">
                      {row.notes}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function HistoryFact({ label, value }: { label: string; value?: string | null }) {
  const text = value?.trim();
  if (!text || text === "—") return null;
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm break-words text-slate-200">{text}</dd>
    </div>
  );
}
