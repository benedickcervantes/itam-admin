"use client";

import { getFormSections, scrollToDeviceSection } from "@/lib/device-form";

type DeviceFormToolbarProps = {
  mode: "audit" | "asset";
  deviceType?: string;
  assetCategory?: string;
};

export function DeviceFormToolbar({ mode, deviceType, assetCategory }: DeviceFormToolbarProps) {
  return (
    <nav
      data-tour={
        mode === "asset" ? "assets-form-toolbar" : mode === "audit" ? "audit-form-toolbar" : undefined
      }
      className="flex gap-2 overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-900/90 p-1.5"
    >
      {getFormSections(mode, {
        deviceType,
        assetCategory: assetCategory as "end_user" | "infrastructure" | "spare_peripheral" | undefined,
      }).map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => scrollToDeviceSection(id)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          <Icon className="h-3.5 w-3.5 text-[#2E7D9A]" />
          {label}
        </button>
      ))}
    </nav>
  );
}

export default DeviceFormToolbar;
