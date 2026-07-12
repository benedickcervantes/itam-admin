import {
  DESKTOP_POWER_CONNECTIONS,
  INPUT_ISSUE_CONDITIONS,
  OPERATING_SYSTEM_OPTIONS,
  WINDOWS_EDITIONS,
  WINDOWS_OS_OPTIONS,
  MACOS_VERSIONS,
  LINUX_DISTROS,
  PERIPHERAL_CONDITIONS,
  SCREEN_CONDITIONS,
} from "./constants";
import { REFERENCE_DATA } from "@/lib/reference-data";

export function isLaptopDevice(deviceType: string) {
  return deviceType === "LAPTOP";
}

export function hasBuiltInScreen(deviceType: string) {
  return deviceType === "LAPTOP" || deviceType === "ALL_IN_ONE";
}

export function isDesktopDevice(deviceType: string) {
  return deviceType === "DESKTOP";
}

export const END_USER_DEVICE_TYPES = ["DESKTOP", "LAPTOP", "ALL_IN_ONE", "OTHER"] as const;
export const INFRASTRUCTURE_DEVICE_TYPES = [
  "SERVER",
  "POE_SWITCH",
  "LOAD_BALANCER",
  "FIREWALL",
  "ACCESS_POINT",
  "CCTV_DVR",
  "CCTV_CAMERA",
  "OTHER",
] as const;

export type AssetCategory = "end_user" | "infrastructure";

// Standalone peripheral / component assets (split out from an audit). These are
// not full devices: they only carry their own brand/model, condition and
// assignment, so they must be edited with the compact peripheral form rather
// than the full device inventory form.
export const COMPONENT_ITEM_TYPES = [
  "KEYBOARD",
  "MOUSE",
  "MONITOR",
  "PRINTER",
  "UPS",
  "AVR",
] as const;

export function isComponentItemType(itemType: string | null | undefined): boolean {
  return !!itemType && (COMPONENT_ITEM_TYPES as readonly string[]).includes(itemType);
}

export function isInfrastructureDevice(deviceType: string, assetCategory?: AssetCategory) {
  if (assetCategory === "infrastructure") return true;
  if (assetCategory === "end_user") return false;
  return (
    deviceType === "SERVER" ||
    deviceType === "POE_SWITCH" ||
    deviceType === "LOAD_BALANCER" ||
    deviceType === "FIREWALL" ||
    deviceType === "ACCESS_POINT" ||
    deviceType === "CCTV_DVR" ||
    deviceType === "CCTV_CAMERA"
  );
}

export function isEndUserDevice(deviceType: string) {
  return (END_USER_DEVICE_TYPES as readonly string[]).includes(deviceType);
}

export function assetCategoryFromAsset(asset: {
  device_type?: string | null;
  assigned_to?: string | null;
  location?: string | null;
  management_ip?: string | null;
  rack_slot?: string | null;
  port_count?: number | null;
}): AssetCategory {
  const deviceType = asset.device_type ?? "";
  if (deviceType && deviceType !== "OTHER") {
    return assetCategoryFromDeviceType(deviceType);
  }
  const hasInfraFields = Boolean(
    asset.location || asset.management_ip || asset.rack_slot || asset.port_count != null,
  );
  if (hasInfraFields && !asset.assigned_to?.trim()) return "infrastructure";
  return "end_user";
}

export function assetCategoryFromDeviceType(deviceType: string): AssetCategory {
  if (!deviceType) return "end_user";
  if (
    deviceType === "SERVER" ||
    deviceType === "POE_SWITCH" ||
    deviceType === "LOAD_BALANCER" ||
    deviceType === "FIREWALL" ||
    deviceType === "ACCESS_POINT" ||
    deviceType === "CCTV_DVR" ||
    deviceType === "CCTV_CAMERA"
  ) {
    return "infrastructure";
  }
  return "end_user";
}

export function showsPortCount(deviceType: string) {
  return ["POE_SWITCH", "LOAD_BALANCER", "FIREWALL", "ACCESS_POINT", "CCTV_DVR", "OTHER"].includes(deviceType);
}

export function showsRackSlot(deviceType: string) {
  return ["SERVER", "POE_SWITCH", "LOAD_BALANCER", "FIREWALL", "CCTV_DVR", "OTHER"].includes(deviceType);
}

export function showsInfraOs(deviceType: string) {
  return deviceType === "SERVER" || deviceType === "OTHER";
}

export function showsInfraServerSpecs(deviceType: string) {
  return deviceType === "SERVER";
}

export function showsInfraNetworkSpecs(deviceType: string) {
  return (
    deviceType === "POE_SWITCH" ||
    deviceType === "LOAD_BALANCER" ||
    deviceType === "FIREWALL" ||
    deviceType === "ACCESS_POINT" ||
    deviceType === "CCTV_DVR" ||
    deviceType === "CCTV_CAMERA" ||
    deviceType === "OTHER"
  );
}

export function deviceTypesForCategory(category: AssetCategory): readonly string[] {
  return category === "infrastructure" ? INFRASTRUCTURE_DEVICE_TYPES : END_USER_DEVICE_TYPES;
}

export function emptyFormForCategory(category: AssetCategory): Partial<DeviceFormState> {
  if (category === "infrastructure") {
    return {
      assetCategory: category,
      deviceType: "",
      status: "AVAILABLE",
      employeeName: "",
      jobTitle: "",
      departmentId: "",
      serialNumber: "",
      location: "",
      managementIp: "",
      rackSlot: "",
      portCount: "",
      macAddress: "",
      hasSecondaryStorage: false,
      hasSecondaryMonitor: false,
      hasSecondaryPrinter: false,
      hasExternalKeyboard: false,
      hasExternalMouse: false,
    };
  }
  return {
    assetCategory: category,
    deviceType: "",
    status: "AVAILABLE",
  };
}

// Avoid circular import - DeviceFormState is defined in form-state.ts
type DeviceFormState = Record<string, string | boolean>;

export function desktopConnectionLabel(value: string) {
  return DESKTOP_POWER_CONNECTIONS.find((c) => c.value === value)?.label ?? value;
}

export function composeLaptopPower(charger: string, battery: string) {
  const parts: string[] = [];
  if (charger) parts.push(`${charger} Charger`);
  if (battery) parts.push(`Battery Status: ${battery}`);
  if (!parts.length) return "";
  return `Outlets/ Charger / Battery - ${parts.join(" / ")}`;
}

export function composeDesktopPower(connectionType: string, details: string, condition?: string) {
  const label = desktopConnectionLabel(connectionType);
  const detailText = details.trim();
  if (!label && !detailText) return "";
  let setup = label && detailText ? `${label} — ${detailText}` : label || detailText;
  if (condition && condition !== "N_A") {
    setup += ` — ${formatCondition(condition)}`;
  }
  return `Outlets/ Charger / Battery - ${setup}`;
}

function parsePeripheralSegment(segment: string) {
  const trimmed = segment.trim();
  if (!trimmed) return { model: "", condition: "" };

  const withoutLabel = trimmed.replace(
    /^(?:Primary|Secondary|External(?:\s+Primary|\s+Secondary)?)\s*[—-]\s*/i,
    "",
  );
  const pieces = withoutLabel.split(/\s*[—-]\s*/).map((p) => p.trim()).filter(Boolean);
  if (!pieces.length) return { model: "", condition: "" };

  const last = pieces[pieces.length - 1] ?? "";
  const maybeCond = normalizeConditionLabel(last);
  if (maybeCond) {
    return { model: pieces.slice(0, -1).join(" — "), condition: maybeCond };
  }
  return { model: withoutLabel, condition: "" };
}

function appendPeripheralCondition(model: string, condition: string) {
  const trimmed = model.trim();
  if (!trimmed) return "";
  if (condition && condition !== "N_A") return `${trimmed} — ${formatCondition(condition)}`;
  return trimmed;
}

export function parsePower(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { charger: "", battery: "", desktopConnectionType: "", desktopDetails: "", desktopCondition: "" };
  }

  const prefix = "Outlets/ Charger / Battery - ";
  const body = trimmed.startsWith(prefix) ? trimmed.slice(prefix.length) : trimmed;

  if (/Battery\s*Status:/i.test(body) || /\bCharger\b/i.test(body)) {
    const chargerM = body.match(/(Good|Failed|Requires Replacement|Missing|Degraded)\s+Charger/i);
    const batteryM = body.match(/Battery\s*Status:\s*(.+)$/i);
    return {
      charger: chargerM?.[1] ?? "",
      battery: batteryM?.[1]?.trim() ?? "",
      desktopConnectionType: "",
      desktopDetails: "",
      desktopCondition: "",
    };
  }

  const splitDesktopBody = (rest: string) => {
    const pieces = rest.split(/\s*[—-]\s*/).map((p) => p.trim()).filter(Boolean);
    if (!pieces.length) return { details: "", condition: "" };
    const last = pieces[pieces.length - 1] ?? "";
    const maybeCond = normalizeConditionLabel(last);
    if (maybeCond) {
      return { details: pieces.slice(0, -1).join(" — "), condition: maybeCond };
    }
    return { details: rest.trim(), condition: "" };
  };

  for (const option of DESKTOP_POWER_CONNECTIONS) {
    const re = new RegExp(`^${option.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s*[—-]\\s*(.+))?$`, "i");
    const m = body.match(re);
    if (m) {
      const parsed = splitDesktopBody(m[1]?.trim() ?? "");
      return {
        charger: "",
        battery: "",
        desktopConnectionType: option.value,
        desktopDetails: parsed.details,
        desktopCondition: parsed.condition,
      };
    }
  }

  if (/ups/i.test(body)) {
    const parsed = splitDesktopBody(body.replace(/^ups\s*[—-]?\s*/i, ""));
    return {
      charger: "",
      battery: "",
      desktopConnectionType: "UPS",
      desktopDetails: parsed.details,
      desktopCondition: parsed.condition,
    };
  }
  if (/avr/i.test(body)) {
    const parsed = splitDesktopBody(body.replace(/^avr\s*[—-]?\s*/i, ""));
    return {
      charger: "",
      battery: "",
      desktopConnectionType: "AVR",
      desktopDetails: parsed.details,
      desktopCondition: parsed.condition,
    };
  }
  if (/direct\s*plug/i.test(body)) {
    return {
      charger: "",
      battery: "",
      desktopConnectionType: "DIRECT_PLUG_IN",
      desktopDetails: body.replace(/^direct\s*plug-?in\s*[—-]?\s*/i, ""),
      desktopCondition: "",
    };
  }

  return { charger: "", battery: "", desktopConnectionType: "", desktopDetails: body, desktopCondition: "" };
}

export function ramSlotDefaults(deviceType: string) {
  if (deviceType === "LAPTOP" || deviceType === "ALL_IN_ONE") return { total: "2", formFactor: "SODIMM" };
  if (deviceType === "DESKTOP") return { total: "4", formFactor: "DIMM" };
  return { total: "2", formFactor: "DIMM" };
}

export function parseRam(ram: string) {
  const m = ram.trim().match(/^(\d+\s*GB)\s*(DDR\d)?\s*(\d+\s*MHz)?/i);
  return {
    ramSize: m?.[1]?.replace(/\s+/g, "") ?? "",
    ramType: m?.[2]?.toUpperCase() ?? "",
    ramSpeed: m?.[3]?.replace(/\s+/g, "") ?? "",
  };
}

export function parseRamSlots(value: string) {
  const m = value.trim().match(/^(\d+)\s*of\s*(\d+)\s*(SODIMM|DIMM)?/i);
  return {
    ramSlotsUsedCount: m?.[1] ?? "",
    ramSlotsTotal: m?.[2] ?? "",
    ramFormFactor: m?.[3]?.toUpperCase() ?? "",
  };
}

export function normalizeStorageType(type: string) {
  const t = type.trim().toUpperCase();
  if (t === "NVME" || t === "NVME SSD") return "NVMe SSD";
  if (t === "SATA SSD" || t === "SATA") return "SATA SSD";
  if (t === "SSD") return "SATA SSD";
  if (t === "HDD") return "HDD";
  return type.trim();
}

export function parseStorage(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { size: "", type: "", model: "" };

  const sizeMatch = trimmed.match(/^(\d+(?:\.\d+)?\s*(?:GB|TB))\s*/i);
  const size = sizeMatch?.[1]?.replace(/\s+/g, "") ?? "";
  let rest = sizeMatch ? trimmed.slice(sizeMatch[0].length) : trimmed;

  let type = "";
  for (const pattern of ["NVMe SSD", "SATA SSD", "HDD"]) {
    const re = new RegExp(`^${pattern.replace(/\s+/g, "\\s+")}\\s*`, "i");
    if (re.test(rest)) {
      type = normalizeStorageType(pattern);
      rest = rest.replace(re, "");
      break;
    }
  }
  if (!type && /^SSD\s*/i.test(rest)) {
    type = "SATA SSD";
    rest = rest.replace(/^SSD\s*/i, "");
  }
  if (!type && /^HDD\s*/i.test(rest)) {
    type = "HDD";
    rest = rest.replace(/^HDD\s*/i, "");
  }

  return { size, type, model: rest.trim() };
}

export function composeRam(form: Record<string, string | boolean>) {
  const parts = [form.ramSize, form.ramType, form.ramSpeed].filter(Boolean);
  return parts.join(" ").trim();
}

export function composeRamSlots(form: Record<string, string | boolean>) {
  const used = form.ramSlotsUsedCount;
  const total = form.ramSlotsTotal;
  const factor = form.ramFormFactor;
  if (!used && !total && !factor) return "";
  if (used && total && factor) return `${used} of ${total} ${factor}`;
  return [used && total ? `${used} of ${total}` : used || total, factor].filter(Boolean).join(" ");
}

export function composeStorage(type: string, size: string, model?: string) {
  const base = [size, type].filter(Boolean).join(" ").trim();
  const modelTrimmed = model?.trim();
  if (!base && !modelTrimmed) return "";
  if (!modelTrimmed) return base;
  if (!base) return modelTrimmed;
  return `${base} ${modelTrimmed}`;
}

export function formatCondition(value: string) {
  if (value === "N_A") return "N/A";
  return value.replace(/_/g, " ");
}

export function normalizeConditionLabel(label: string) {
  const normalized = label.trim().toUpperCase().replace(/\s+/g, "_").replace(/\//g, "_");
  if (normalized === "N/A" || normalized === "NA") return "N_A";
  return PERIPHERAL_CONDITIONS.find((c) => c === normalized) ?? "";
}

export function peripheralConditions() {
  return REFERENCE_DATA.keyboardConditions.filter((c) => c !== "BUILT_IN_LAPTOP");
}

export function screenConditions() {
  return REFERENCE_DATA.screenConditions.length > 0
    ? [...REFERENCE_DATA.screenConditions]
    : [...SCREEN_CONDITIONS];
}

export function isInputIssueCondition(condition: string) {
  return INPUT_ISSUE_CONDITIONS.includes(condition);
}

export function isWindowsOs(os: string) {
  return WINDOWS_OS_OPTIONS.includes(os);
}

export function isMacOs(os: string) {
  return os === "macOS";
}

export function isLinuxOs(os: string) {
  return os === "Linux";
}

export function hasOsEdition(os: string) {
  return isWindowsOs(os) || isMacOs(os) || isLinuxOs(os);
}

export function getOsEditionOptions(os: string): readonly string[] {
  if (isWindowsOs(os)) return WINDOWS_EDITIONS;
  if (isMacOs(os)) return MACOS_VERSIONS;
  if (isLinuxOs(os)) return LINUX_DISTROS;
  return [];
}

export function getOsEditionLabel(os: string) {
  if (isWindowsOs(os)) return "Windows Edition";
  if (isMacOs(os)) return "macOS Version";
  if (isLinuxOs(os)) return "Linux Distribution";
  return "Edition";
}

export function getOsEditionPlaceholder(os: string) {
  if (isWindowsOs(os)) return "Select edition...";
  if (isMacOs(os)) return "Select version...";
  if (isLinuxOs(os)) return "Select distribution...";
  return "Select...";
}

export function parseOperatingSystem(value: string) {
  const v = value.trim();
  if (!v) return { os: "", edition: "", other: "" };
  if (OPERATING_SYSTEM_OPTIONS.includes(v)) return { os: v, edition: "", other: "" };

  for (const version of WINDOWS_OS_OPTIONS) {
    if (v === version) return { os: version, edition: "", other: "" };
    if (v.startsWith(`${version} `)) {
      const edition = v.slice(version.length + 1).trim();
      if (WINDOWS_EDITIONS.includes(edition)) return { os: version, edition, other: "" };
      return { os: "Other", edition: "", other: v };
    }
  }

  if (v === "macOS") return { os: "macOS", edition: "", other: "" };
  if (v.startsWith("macOS ")) {
    const edition = v.slice("macOS ".length).trim();
    if (MACOS_VERSIONS.includes(edition)) return { os: "macOS", edition, other: "" };
    return { os: "Other", edition: "", other: v };
  }

  if (v === "Linux") return { os: "Linux", edition: "", other: "" };
  if (v.startsWith("Linux ")) {
    const edition = v.slice("Linux ".length).trim();
    if (LINUX_DISTROS.includes(edition)) return { os: "Linux", edition, other: "" };
    return { os: "Other", edition: "", other: v };
  }

  return { os: "Other", edition: "", other: v };
}

export function composeOperatingSystem(os: string, edition: string, other: string) {
  const base = os.trim();
  if (!base) return "";
  if (base === "Other") return other.trim();
  if (hasOsEdition(base)) {
    const ed = edition.trim();
    return ed ? `${base} ${ed}` : base;
  }
  return base;
}

export function composeLaptopKeyboard(
  builtin: string,
  builtinNotes: string,
  hasExternal: boolean,
  model: string,
  externalCond: string,
) {
  const parts: string[] = [];
  if (builtin && builtin !== "N_A") {
    let builtIn = `Built-in — ${formatCondition(builtin)}`;
    if (isInputIssueCondition(builtin) && builtinNotes.trim()) {
      builtIn += ` — Notes: ${builtinNotes.trim()}`;
    }
    parts.push(builtIn);
  }
  if (hasExternal) {
    const ext: string[] = ["External USB"];
    if (model.trim()) ext.push(model.trim());
    if (externalCond && externalCond !== "N_A") ext.push(formatCondition(externalCond));
    parts.push(ext.join(" — "));
  }
  return parts.join(" | ");
}

export function composeLaptopPointer(
  trackpad: string,
  trackpadNotes: string,
  hasExternal: boolean,
  model: string,
  mouseType: string,
) {
  const parts: string[] = [];
  if (trackpad && trackpad !== "N_A") {
    let builtIn = `Built-in Trackpad — ${formatCondition(trackpad)}`;
    if (isInputIssueCondition(trackpad) && trackpadNotes.trim()) {
      builtIn += ` — Notes: ${trackpadNotes.trim()}`;
    }
    parts.push(builtIn);
  }
  if (hasExternal) {
    const ext: string[] = ["External USB"];
    if (model.trim()) ext.push(model.trim());
    if (mouseType) ext.push(formatCondition(mouseType));
    parts.push(ext.join(" — "));
  }
  return parts.join(" | ");
}

export function resolveLaptopKeyboardCondition(builtin: string, hasExternal: boolean, externalCond: string) {
  const issueOrder = ["FAULTY", "NEEDS_REPLACEMENT", "FADING_KEYS", "FAIR", "NEW", "GOOD", "N_A"];
  const candidates = [builtin, hasExternal ? externalCond : ""].filter((c) => c && c !== "N_A");
  if (!candidates.length) return "";
  return candidates.sort((a, b) => issueOrder.indexOf(a) - issueOrder.indexOf(b))[0];
}

export function parseLaptopKeyboard(value: string) {
  const result = {
    builtin: "",
    builtinNotes: "",
    hasExternal: false,
    externalModel: "",
    externalCond: "",
  };
  const trimmed = value.trim();
  if (!trimmed) return result;

  if (/Built-in|External USB/i.test(trimmed)) {
    trimmed.split("|").forEach((part) => {
      const segment = part.trim();
      if (/^Built-in/i.test(segment)) {
        const notesM = segment.match(/\s*[—-]\s*Notes:\s*(.+)$/i);
        const withoutNotes = notesM ? segment.replace(/\s*[—-]\s*Notes:\s*.+$/i, "") : segment;
        const m = withoutNotes.match(/Built-in\s*[—-]\s*(.+)$/i);
        if (m) {
          result.builtin = normalizeConditionLabel(m[1]);
          result.builtinNotes = notesM?.[1]?.trim() ?? "";
        }
      } else if (/^External USB/i.test(segment)) {
        result.hasExternal = true;
        const rest = segment.replace(/^External USB\s*(?:[—-]\s*)?/i, "");
        const pieces = rest.split(/\s*[—-]\s*/);
        const last = pieces[pieces.length - 1] ?? "";
        const maybeCond = normalizeConditionLabel(last);
        if (maybeCond) {
          result.externalCond = maybeCond;
          result.externalModel = pieces.slice(0, -1).join(" — ");
        } else {
          result.externalModel = rest;
        }
      }
    });
    return result;
  }

  result.hasExternal = true;
  result.externalModel = trimmed;
  return result;
}

export function parseLaptopPointer(value: string) {
  const result = {
    trackpad: "",
    trackpadNotes: "",
    hasExternal: false,
    externalModel: "",
    mouseType: "",
  };
  const trimmed = value.trim();
  if (!trimmed) return result;

  if (/Built-in Trackpad|External USB/i.test(trimmed)) {
    trimmed.split("|").forEach((part) => {
      const segment = part.trim();
      if (/^Built-in Trackpad/i.test(segment)) {
        const notesM = segment.match(/\s*[—-]\s*Notes:\s*(.+)$/i);
        const withoutNotes = notesM ? segment.replace(/\s*[—-]\s*Notes:\s*.+$/i, "") : segment;
        const m = withoutNotes.match(/Built-in Trackpad\s*[—-]\s*(.+)$/i);
        if (m) {
          result.trackpad = normalizeConditionLabel(m[1]);
          result.trackpadNotes = notesM?.[1]?.trim() ?? "";
        }
      } else if (/^External USB/i.test(segment)) {
        result.hasExternal = true;
        const rest = segment.replace(/^External USB\s*(?:[—-]\s*)?/i, "");
        const pieces = rest.split(/\s*[—-]\s*/);
        const last = pieces[pieces.length - 1] ?? "";
        if (["COMPANY_PROVIDED", "PERSONAL_BYOD", "NONE"].includes(last)) {
          result.mouseType = last;
          result.externalModel = pieces.slice(0, -1).join(" — ");
        } else {
          result.externalModel = rest;
        }
      }
    });
    return result;
  }

  result.hasExternal = true;
  result.externalModel = trimmed;
  return result;
}

export function composePeripheralPair(
  primary: string,
  hasSecondary: boolean,
  secondary: string,
  primaryCondition = "",
  secondaryCondition = "",
) {
  const p = appendPeripheralCondition(primary, primaryCondition);
  const s = appendPeripheralCondition(secondary, secondaryCondition);
  if (!p && !(hasSecondary && s)) return "";
  if (!hasSecondary || !s) return p;
  if (!p) return `Secondary — ${s}`;
  return `Primary — ${p} | Secondary — ${s}`;
}

export function composeMonitorRecord(
  deviceType: string,
  primary: string,
  hasSecondary: boolean,
  secondary: string,
  primaryCondition = "",
  secondaryCondition = "",
) {
  const p = appendPeripheralCondition(primary, primaryCondition);
  const s = appendPeripheralCondition(secondary, secondaryCondition);
  if (!p && !(hasSecondary && s)) return "";

  if (hasBuiltInScreen(deviceType)) {
    if (!hasSecondary || !s) return `External — ${p}`;
    if (!p) return `External Secondary — ${s}`;
    return `External Primary — ${p} | External Secondary — ${s}`;
  }

  return composePeripheralPair(primary, hasSecondary, secondary, primaryCondition, secondaryCondition);
}

export function parseMonitorRecord(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      primary: "",
      primaryCondition: "",
      hasSecondary: false,
      secondary: "",
      secondaryCondition: "",
    };
  }

  if (/External/i.test(trimmed)) {
    const primaryM = trimmed.match(/External Primary\s*[—-]\s*([^|]+)/i);
    const secondaryM = trimmed.match(/External Secondary\s*[—-]\s*(.+)$/i);
    if (primaryM || secondaryM) {
      const primaryParsed = parsePeripheralSegment(primaryM?.[1] ?? "");
      const secondaryParsed = parsePeripheralSegment(secondaryM?.[1] ?? "");
      return {
        primary: primaryParsed.model,
        primaryCondition: primaryParsed.condition,
        hasSecondary: Boolean(secondaryParsed.model),
        secondary: secondaryParsed.model,
        secondaryCondition: secondaryParsed.condition,
      };
    }
    const singleM = trimmed.match(/^External\s*[—-]\s*(.+)$/i);
    if (singleM) {
      const parsed = parsePeripheralSegment(singleM[1]);
      return {
        primary: parsed.model,
        primaryCondition: parsed.condition,
        hasSecondary: false,
        secondary: "",
        secondaryCondition: "",
      };
    }
  }

  return parsePeripheralPair(trimmed);
}

export function parsePeripheralPair(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      primary: "",
      primaryCondition: "",
      hasSecondary: false,
      secondary: "",
      secondaryCondition: "",
    };
  }

  if (/Primary\s*[—-]/i.test(trimmed) || /Secondary\s*[—-]/i.test(trimmed)) {
    const primaryM = trimmed.match(/Primary\s*[—-]\s*([^|]+)/i);
    const secondaryM = trimmed.match(/Secondary\s*[—-]\s*(.+)$/i);
    const primaryParsed = parsePeripheralSegment(primaryM?.[1] ?? "");
    const secondaryParsed = parsePeripheralSegment(secondaryM?.[1] ?? "");
    return {
      primary: primaryParsed.model,
      primaryCondition: primaryParsed.condition,
      hasSecondary: Boolean(secondaryParsed.model),
      secondary: secondaryParsed.model,
      secondaryCondition: secondaryParsed.condition,
    };
  }

  const parts = trimmed.split("|").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const primaryParsed = parsePeripheralSegment(parts[0]);
    const secondaryParsed = parsePeripheralSegment(parts.slice(1).join(" | "));
    return {
      primary: primaryParsed.model,
      primaryCondition: primaryParsed.condition,
      hasSecondary: Boolean(secondaryParsed.model),
      secondary: secondaryParsed.model,
      secondaryCondition: secondaryParsed.condition,
    };
  }

  const parsed = parsePeripheralSegment(trimmed);
  return {
    primary: parsed.model,
    primaryCondition: parsed.condition,
    hasSecondary: false,
    secondary: "",
    secondaryCondition: "",
  };
}
