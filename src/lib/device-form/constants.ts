import { ClipboardCheck, Monitor, Mouse, User } from "lucide-react";
import { isInfrastructureDevice, type AssetCategory } from "./helpers";

export const RAM_SIZES = ["4GB", "8GB", "12GB", "16GB", "32GB", "64GB"];
export const RAM_TYPES = ["DDR3", "DDR4", "DDR5"];
export const RAM_SPEEDS = ["1066MHz", "1333MHz", "1600MHz", "1866MHz", "2133MHz", "2400MHz", "2666MHz", "3200MHz", "4800MHz", "5600MHz"];
export const STORAGE_TYPES = ["HDD", "SATA SSD", "NVMe SSD"];
export const STORAGE_SIZES = ["128GB", "256GB", "512GB", "1TB", "2TB", "4TB"];
export const CHARGER_STATUSES = ["Good", "Failed", "Requires Replacement", "Missing", "Degraded"];
export const BATTERY_STATUSES = ["Good", "Failed", "Requires Replacement", "Degraded", "Not Holding Charge"];
export const SCREEN_CONDITIONS = [
  "GOOD",
  "FAIR",
  "DEAD_PIXELS",
  "FLICKERING",
  "DIM_BACKLIGHT",
  "CRACKED",
  "DISCOLORATION",
  "FAULTY",
  "NEEDS_REPLACEMENT",
];
export const WINDOWS_OS_OPTIONS = ["Windows 11", "Windows 10", "Windows 8.1", "Windows 7"];
export const WINDOWS_EDITIONS = [
  "Pro",
  "Home",
  "Home Single Language",
  "Enterprise",
  "Education",
  "Pro for Workstations",
];
export const MACOS_VERSIONS = [
  "Sequoia",
  "Sonoma",
  "Ventura",
  "Monterey",
  "Big Sur",
  "Catalina",
  "Mojave",
];
export const LINUX_DISTROS = [
  "Ubuntu",
  "Fedora",
  "Debian",
  "CentOS",
  "Rocky Linux",
  "AlmaLinux",
  "Linux Mint",
  "Red Hat Enterprise Linux",
  "openSUSE",
  "Arch Linux",
];
export const OPERATING_SYSTEM_OPTIONS = [...WINDOWS_OS_OPTIONS, "macOS", "Linux", "ChromeOS"];
export const INPUT_ISSUE_CONDITIONS = ["FADING_KEYS", "FAULTY", "NEEDS_REPLACEMENT"];
export const DESKTOP_POWER_CONNECTIONS = [
  { value: "UPS", label: "UPS", hint: "Uninterruptible Power Supply" },
  { value: "AVR", label: "AVR", hint: "Automatic Voltage Regulator" },
  { value: "DIRECT_PLUG_IN", label: "Direct Plug-in", hint: "Extension cord / wall outlet" },
] as const;
export const PERIPHERAL_CONDITIONS = ["GOOD", "FAIR", "FADING_KEYS", "FAULTY", "NEEDS_REPLACEMENT", "N_A"] as const;

export const FORM_SECTIONS = [
  { id: "audit-section-employee", label: "Employee", icon: User },
  { id: "audit-section-device", label: "Device", icon: Monitor },
  { id: "audit-section-peripherals", label: "Peripherals", icon: Mouse },
  { id: "audit-section-audit", label: "Audit", icon: ClipboardCheck },
] as const;

export function getFormSections(
  mode: "audit" | "asset",
  options?: { deviceType?: string; assetCategory?: AssetCategory },
) {
  if (mode === "asset") {
    const sections = FORM_SECTIONS.filter((s) => s.id !== "audit-section-audit");
    const infra =
      options?.assetCategory === "infrastructure" ||
      (options?.deviceType ? isInfrastructureDevice(options.deviceType) : false);
    if (infra) {
      return sections.filter((s) => s.id !== "audit-section-peripherals");
    }
    return sections;
  }
  return [...FORM_SECTIONS];
}

export function scrollToDeviceSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  const scrollContainer = target.closest("[data-drawer-scroll]") as HTMLElement | null;
  if (!scrollContainer) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const padding = 12;
  const top =
    scrollContainer.scrollTop +
    target.getBoundingClientRect().top -
    scrollContainer.getBoundingClientRect().top -
    padding;

  scrollContainer.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export const UI_ONLY_KEYS = [
  "assetCategory",
  "ramSize",
  "ramType",
  "ramSpeed",
  "ramSlotsUsedCount",
  "ramSlotsTotal",
  "ramFormFactor",
  "primaryStorageType",
  "primaryStorageSize",
  "primaryStorageModel",
  "hasSecondaryStorage",
  "secondaryStorageType",
  "secondaryStorageSize",
  "secondaryStorageModel",
  "powerChargerStatus",
  "powerBatteryStatus",
  "powerDesktopConnectionType",
  "powerDesktopDetails",
  "powerDesktopCondition",
  "operatingSystemEdition",
  "operatingSystemOther",
  "keyboardBuiltinCondition",
  "keyboardBuiltinNotes",
  "hasExternalKeyboard",
  "keyboardExternalModel",
  "keyboardExternalCondition",
  "desktopKeyboardModel",
  "trackpadCondition",
  "trackpadNotes",
  "hasExternalMouse",
  "mouseExternalModel",
  "desktopMouseModel",
  "monitorPrimary",
  "monitorPrimaryCondition",
  "hasSecondaryMonitor",
  "monitorSecondary",
  "monitorSecondaryCondition",
  "printerPrimary",
  "printerPrimaryCondition",
  "hasSecondaryPrinter",
  "printerSecondary",
  "printerSecondaryCondition",
  "screenNotes",
] as const;
