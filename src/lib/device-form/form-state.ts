import type { Asset, AuditRegister } from "@/lib/types";
import { UI_ONLY_KEYS } from "./constants";
import {
  assetCategoryFromAsset,
  composeOperatingSystem,
  composeDesktopPower,
  composeLaptopKeyboard,
  composeLaptopPointer,
  composeLaptopPower,
  composeGpuPair,
  composeMonitorRecord,
  composePeripheralPair,
  composeRam,
  composeRamSlots,
  composeStorage,
  hasBuiltInScreen,
  isComponentItemType,
  showsInfraServerSpecs,
  showsInfraStorageSpecs,
  showsInfraMonitorSpecs,
  showsInfraNetworkSpecs,
  isLaptopDevice,
  parseLaptopKeyboard,
  parseLaptopPointer,
  parseGpuPair,
  parseMonitorRecord,
  parseOperatingSystem,
  parsePeripheralPair,
  parsePower,
  parseRam,
  parseRamSlots,
  parseStorage,
  ramSlotDefaults,
  resolveLaptopKeyboardCondition,
} from "./helpers";

export type DeviceFormState = Record<string, string | boolean>;

type AssetHardwareFields = Asset & {
  processor?: string | null;
  ram?: string | null;
  ram_slots_used?: string | null;
  primary_storage?: string | null;
  secondary_storage?: string | null;
  gpu?: string | null;
  os?: string | null;
  os_license_status?: string | null;
  network?: string | null;
  printer?: string | null;
  monitor?: string | null;
  keyboard?: string | null;
  keyboard_condition?: string | null;
  mouse?: string | null;
  mouse_type?: string | null;
  mouse_condition?: string | null;
  power_avr_charger_battery?: string | null;
  screen?: string | null;
  screen_condition?: string | null;
};

function normalizeAssetRecord(row: Asset): AssetHardwareFields {
  const raw = row as AssetHardwareFields & Record<string, unknown>;
  return {
    ...(row as AssetHardwareFields),
    screen: row.screen ?? (raw.screen as string | null | undefined) ?? null,
    screen_condition:
      row.screen_condition ?? (raw.screenCondition as string | null | undefined) ?? null,
    ram_slots_used: row.ram_slots_used ?? (raw.ramSlotsUsed as string | null | undefined) ?? null,
    power_avr_charger_battery:
      row.power_avr_charger_battery ??
      (raw.powerAvrChargerBattery as string | null | undefined) ??
      null,
    keyboard_condition:
      row.keyboard_condition ?? (raw.keyboardCondition as string | null | undefined) ?? null,
    mouse_type: row.mouse_type ?? (raw.mouseType as string | null | undefined) ?? null,
    mouse_condition:
      row.mouse_condition ?? (raw.mouseCondition as string | null | undefined) ?? null,
  };
}

function assetHardwareWithAuditFallback(row: Asset): AssetHardwareFields {
  const hardware = normalizeAssetRecord(row);
  const audit = row.audit_register;
  if (!audit) return hardware;

  return {
    ...hardware,
    screen: hardware.screen ?? audit.screen,
    screen_condition: hardware.screen_condition ?? audit.screen_condition,
    ram_slots_used: hardware.ram_slots_used ?? audit.ram_slots_used,
    power_avr_charger_battery: hardware.power_avr_charger_battery ?? audit.power_avr_charger_battery,
    keyboard: hardware.keyboard ?? audit.keyboard,
    keyboard_condition: hardware.keyboard_condition ?? audit.keyboard_condition,
    mouse: hardware.mouse ?? audit.mouse,
    mouse_type: hardware.mouse_type ?? audit.mouse_type,
    mouse_condition: hardware.mouse_condition ?? audit.mouse_condition,
    gpu: hardware.gpu ?? audit.graphics_gpu,
    network: hardware.network ?? audit.network,
  };
}

export function emptyForm(): DeviceFormState {
  return {
    assetCategory: "end_user",
    employeeName: "",
    departmentId: "",
    jobTitle: "",
    employeeStatus: "ACTIVE",
    deviceType: "",
    itemType: "",
    computerName: "",
    laptopBrandModel: "",
    screenCondition: "",
    screenNotes: "",
    screen: "",
    processor: "",
    macAddress: "",
    ram: "",
    ramSize: "",
    ramType: "",
    ramSpeed: "",
    ramSlotsUsedCount: "",
    ramSlotsTotal: "2",
    ramFormFactor: "SODIMM",
    ramSlotsUsed: "",
    primaryStorageType: "",
    primaryStorageSize: "",
    primaryStorageModel: "",
    primaryStorage: "",
    hasSecondaryStorage: false,
    secondaryStorageType: "",
    secondaryStorageSize: "",
    secondaryStorageModel: "",
    secondaryStorage: "",
    graphicsGpu: "",
    hasSecondaryGpu: false,
    graphicsGpuSecondary: "",
    network: "",
    operatingSystem: "",
    operatingSystemEdition: "",
    operatingSystemOther: "",
    osLicenseStatus: "",
    monitorPrimary: "",
    monitorPrimaryCondition: "",
    hasSecondaryMonitor: false,
    monitorSecondary: "",
    monitorSecondaryCondition: "",
    monitor: "",
    printerPrimary: "",
    printerPrimaryCondition: "",
    hasSecondaryPrinter: false,
    printerSecondary: "",
    printerSecondaryCondition: "",
    printer: "",
    keyboardBuiltinCondition: "",
    keyboardBuiltinNotes: "",
    hasExternalKeyboard: false,
    keyboardExternalModel: "",
    keyboardExternalCondition: "",
    keyboard: "",
    keyboardCondition: "",
    mouseCondition: "",
    desktopKeyboardModel: "",
    trackpadCondition: "",
    trackpadNotes: "",
    hasExternalMouse: false,
    mouseExternalModel: "",
    mouse: "",
    mouseType: "",
    desktopMouseModel: "",
    powerChargerStatus: "",
    powerBatteryStatus: "",
    powerDesktopConnectionType: "",
    powerDesktopDetails: "",
    powerDesktopCondition: "",
    powerAvrChargerBattery: "",
    auditDate: "",
    auditStatus: "PENDING",
    overallAssessment: "",
    priority: "",
    immediateAction: false,
    immediateActionNotes: "",
    findingsSummary: "",
    detailedFindings: "",
    recommendedAction: "",
    upgradeComponents: "",
    upgradeNotes: "",
    internalNotes: "",
    auditedBy: "",
    status: "AVAILABLE",
    condition: "",
    notes: "",
    serialNumber: "",
    location: "",
    managementIp: "",
    rackSlot: "",
    portCount: "",
  };
}

export function formStateFromAudit(row: AuditRegister): DeviceFormState {
  const ramParsed = parseRam(row.ram ?? "");
  const slotsParsed = parseRamSlots(row.ram_slots_used ?? "");
  const primaryParsed = parseStorage(row.primary_storage ?? "");
  const secondaryParsed = parseStorage(row.secondary_storage ?? "");
  const powerParsed = parsePower(row.power_avr_charger_battery ?? "");
  const deviceType = row.device_type ?? "";
  const slotDefaults = ramSlotDefaults(deviceType);
  const kbParsed = isLaptopDevice(deviceType) ? parseLaptopKeyboard(row.keyboard ?? "") : null;
  const pointerParsed = isLaptopDevice(deviceType) ? parseLaptopPointer(row.mouse ?? "") : null;
  const monitorParsed = parseMonitorRecord(row.monitor ?? "");
  const printerParsed = parsePeripheralPair(row.printer ?? "");
  const gpuParsed = parseGpuPair(row.graphics_gpu ?? "");
  const osParsed = parseOperatingSystem(row.operating_system ?? "");
  const savedKeyboardCondition = row.keyboard_condition ?? "";

  return {
    employeeName: row.employee_name,
    departmentId: row.department_id ?? row.department?.id ?? "",
    jobTitle: row.job_title ?? "",
    employeeStatus: row.employee_status ?? "ACTIVE",
    deviceType,
    computerName: row.computer_name,
    laptopBrandModel: row.laptop_brand_model ?? "",
    screenCondition: row.screen_condition ?? "",
    screenNotes: row.screen ?? "",
    screen: row.screen ?? "",
    processor: row.processor ?? "",
    ram: row.ram ?? "",
    ramSize: ramParsed.ramSize,
    ramType: ramParsed.ramType,
    ramSpeed: ramParsed.ramSpeed,
    ramSlotsUsedCount: slotsParsed.ramSlotsUsedCount,
    ramSlotsTotal: slotsParsed.ramSlotsTotal || slotDefaults.total,
    ramFormFactor: slotsParsed.ramFormFactor || slotDefaults.formFactor,
    ramSlotsUsed: row.ram_slots_used ?? "",
    primaryStorageType: primaryParsed.type,
    primaryStorageSize: primaryParsed.size,
    primaryStorageModel: primaryParsed.model,
    primaryStorage: row.primary_storage ?? "",
    hasSecondaryStorage: Boolean(row.secondary_storage),
    secondaryStorageType: secondaryParsed.type,
    secondaryStorageSize: secondaryParsed.size,
    secondaryStorageModel: secondaryParsed.model,
    secondaryStorage: row.secondary_storage ?? "",
    graphicsGpu: gpuParsed.primary,
    hasSecondaryGpu: gpuParsed.hasSecondary,
    graphicsGpuSecondary: gpuParsed.secondary,
    network: row.network ?? "",
    operatingSystem: osParsed.os,
    operatingSystemEdition: osParsed.edition,
    operatingSystemOther: osParsed.other,
    osLicenseStatus: row.os_license_status ?? "",
    monitorPrimary: monitorParsed.primary,
    monitorPrimaryCondition: monitorParsed.primaryCondition,
    hasSecondaryMonitor: monitorParsed.hasSecondary,
    monitorSecondary: monitorParsed.secondary,
    monitorSecondaryCondition: monitorParsed.secondaryCondition,
    monitor: row.monitor ?? "",
    printerPrimary: printerParsed.primary,
    printerPrimaryCondition: printerParsed.primaryCondition,
    hasSecondaryPrinter: printerParsed.hasSecondary,
    printerSecondary: printerParsed.secondary,
    printerSecondaryCondition: printerParsed.secondaryCondition,
    printer: row.printer ?? "",
    keyboardBuiltinCondition:
      kbParsed?.builtin ||
      (isLaptopDevice(deviceType) && savedKeyboardCondition && savedKeyboardCondition !== "BUILT_IN_LAPTOP"
        ? savedKeyboardCondition
        : ""),
    keyboardBuiltinNotes: kbParsed?.builtinNotes ?? "",
    hasExternalKeyboard: kbParsed?.hasExternal ?? false,
    keyboardExternalModel: kbParsed?.externalModel ?? "",
    keyboardExternalCondition: kbParsed?.externalCond ?? "",
    keyboard: row.keyboard ?? "",
    keyboardCondition: isLaptopDevice(deviceType) ? "" : savedKeyboardCondition,
    mouseCondition: isLaptopDevice(deviceType) ? "" : (row.mouse_condition ?? ""),
    desktopKeyboardModel: isLaptopDevice(deviceType) ? "" : (row.keyboard ?? ""),
    trackpadCondition: pointerParsed?.trackpad ?? "",
    trackpadNotes: pointerParsed?.trackpadNotes ?? "",
    hasExternalMouse: pointerParsed?.hasExternal ?? false,
    mouseExternalModel: pointerParsed?.externalModel ?? "",
    mouse: row.mouse ?? "",
    mouseType: isLaptopDevice(deviceType) ? (pointerParsed?.mouseType ?? "") : (row.mouse_type ?? ""),
    desktopMouseModel: isLaptopDevice(deviceType) ? "" : (row.mouse ?? ""),
    powerChargerStatus: powerParsed.charger,
    powerBatteryStatus: powerParsed.battery,
    powerDesktopConnectionType: powerParsed.desktopConnectionType,
    powerDesktopDetails: powerParsed.desktopDetails,
    powerDesktopCondition: powerParsed.desktopCondition,
    powerAvrChargerBattery: row.power_avr_charger_battery ?? "",
    auditDate: row.audit_date ? row.audit_date.slice(0, 10) : "",
    auditStatus: row.audit_status ?? "PENDING",
    overallAssessment: row.overall_assessment ?? "",
    priority: row.priority ?? "",
    immediateAction: row.immediate_action ?? false,
    immediateActionNotes: row.immediate_action_notes ?? "",
    findingsSummary: row.findings_summary ?? "",
    detailedFindings: row.detailed_findings ?? "",
    recommendedAction: row.recommended_action ?? "",
    upgradeComponents: (row.upgrade_components ?? []).join(","),
    upgradeNotes: row.upgrade_notes ?? "",
    internalNotes: row.internal_notes ?? "",
    auditedBy: row.audited_by ?? "",
    status: "IN_USE",
    condition: row.condition ?? "",
    notes: "",
  };
}

export function formStateFromAsset(row: Asset): DeviceFormState {
  const hardware = assetHardwareWithAuditFallback(row);
  const deviceType = hardware.device_type ?? "";
  const slotDefaults = ramSlotDefaults(deviceType);
  const ramParsed = parseRam(hardware.ram ?? "");
  const slotsParsed = parseRamSlots(hardware.ram_slots_used ?? "");
  const primaryParsed = parseStorage(hardware.primary_storage ?? "");
  const secondaryParsed = parseStorage(hardware.secondary_storage ?? "");
  const powerParsed = parsePower(hardware.power_avr_charger_battery ?? "");
  const kbParsed = isLaptopDevice(deviceType) ? parseLaptopKeyboard(hardware.keyboard ?? "") : null;
  const pointerParsed = isLaptopDevice(deviceType) ? parseLaptopPointer(hardware.mouse ?? "") : null;
  const monitorParsed = parseMonitorRecord(hardware.monitor ?? "");
  const printerParsed = parsePeripheralPair(hardware.printer ?? "");
  const gpuParsed = parseGpuPair(hardware.gpu ?? "");
  const osParsed = parseOperatingSystem(hardware.os ?? "");
  const savedKeyboardCondition = hardware.keyboard_condition ?? "";

  return {
    ...emptyForm(),
    assetCategory: assetCategoryFromAsset(hardware),
    employeeName: hardware.assigned_to ?? "",
    jobTitle: hardware.job_title ?? "",
    departmentId: hardware.department_id ?? "",
    deviceType,
    itemType: hardware.item_type ?? "",
    computerName: hardware.computer_name,
    laptopBrandModel: hardware.brand_model ?? "",
    serialNumber: hardware.serial_number ?? "",
    location: hardware.location ?? "",
    managementIp: hardware.management_ip ?? "",
    rackSlot: hardware.rack_slot ?? "",
    portCount: hardware.port_count != null ? String(hardware.port_count) : "",
    screenCondition: hardware.screen_condition ?? "",
    screenNotes: hardware.screen ?? "",
    screen: hardware.screen ?? "",
    processor: hardware.processor ?? "",
    macAddress: hardware.mac_address ?? "",
    ram: hardware.ram ?? "",
    ramSize: ramParsed.ramSize,
    ramType: ramParsed.ramType,
    ramSpeed: ramParsed.ramSpeed,
    ramSlotsUsedCount: slotsParsed.ramSlotsUsedCount,
    ramSlotsTotal: slotsParsed.ramSlotsTotal || slotDefaults.total,
    ramFormFactor: slotsParsed.ramFormFactor || slotDefaults.formFactor,
    ramSlotsUsed: hardware.ram_slots_used ?? "",
    primaryStorageType: primaryParsed.type,
    primaryStorageSize: primaryParsed.size,
    primaryStorageModel: primaryParsed.model,
    primaryStorage: hardware.primary_storage ?? "",
    hasSecondaryStorage: Boolean(hardware.secondary_storage),
    secondaryStorageType: secondaryParsed.type,
    secondaryStorageSize: secondaryParsed.size,
    secondaryStorageModel: secondaryParsed.model,
    secondaryStorage: hardware.secondary_storage ?? "",
    graphicsGpu: gpuParsed.primary,
    hasSecondaryGpu: gpuParsed.hasSecondary,
    graphicsGpuSecondary: gpuParsed.secondary,
    network: hardware.network ?? "",
    operatingSystem: osParsed.os,
    operatingSystemEdition: osParsed.edition,
    operatingSystemOther: osParsed.other,
    osLicenseStatus: hardware.os_license_status ?? "",
    monitorPrimary: monitorParsed.primary,
    monitorPrimaryCondition: monitorParsed.primaryCondition,
    hasSecondaryMonitor: monitorParsed.hasSecondary,
    monitorSecondary: monitorParsed.secondary,
    monitorSecondaryCondition: monitorParsed.secondaryCondition,
    monitor: hardware.monitor ?? "",
    printerPrimary: printerParsed.primary,
    printerPrimaryCondition: printerParsed.primaryCondition,
    hasSecondaryPrinter: printerParsed.hasSecondary,
    printerSecondary: printerParsed.secondary,
    printerSecondaryCondition: printerParsed.secondaryCondition,
    printer: hardware.printer ?? "",
    keyboardBuiltinCondition:
      kbParsed?.builtin ||
      (isLaptopDevice(deviceType) && savedKeyboardCondition && savedKeyboardCondition !== "BUILT_IN_LAPTOP"
        ? savedKeyboardCondition
        : ""),
    keyboardBuiltinNotes: kbParsed?.builtinNotes ?? "",
    hasExternalKeyboard: kbParsed?.hasExternal ?? false,
    keyboardExternalModel: kbParsed?.externalModel ?? "",
    keyboardExternalCondition: kbParsed?.externalCond ?? "",
    keyboard: hardware.keyboard ?? "",
    keyboardCondition: isLaptopDevice(deviceType) ? "" : (hardware.keyboard_condition ?? ""),
    mouseCondition: isLaptopDevice(deviceType) ? "" : (hardware.mouse_condition ?? ""),
    desktopKeyboardModel: isLaptopDevice(deviceType) ? "" : (hardware.keyboard ?? ""),
    trackpadCondition: pointerParsed?.trackpad ?? "",
    trackpadNotes: pointerParsed?.trackpadNotes ?? "",
    hasExternalMouse: pointerParsed?.hasExternal ?? false,
    mouseExternalModel: pointerParsed?.externalModel ?? "",
    mouse: hardware.mouse ?? "",
    mouseType: isLaptopDevice(deviceType) ? (pointerParsed?.mouseType ?? "") : (hardware.mouse_type ?? ""),
    desktopMouseModel: isLaptopDevice(deviceType) ? "" : (hardware.mouse ?? ""),
    powerChargerStatus: powerParsed.charger,
    powerBatteryStatus: powerParsed.battery,
    powerDesktopConnectionType: powerParsed.desktopConnectionType,
    powerDesktopDetails: powerParsed.desktopDetails,
    powerDesktopCondition: powerParsed.desktopCondition,
    powerAvrChargerBattery: hardware.power_avr_charger_battery ?? "",
    status: hardware.status ?? "IN_USE",
    condition: hardware.condition ?? "",
    notes: hardware.notes ?? "",
  };
}

export function prepareComposedForm(form: DeviceFormState): DeviceFormState {
  const body: DeviceFormState = { ...form };
  body.ram = composeRam(body);
  body.ramSlotsUsed = composeRamSlots(body);
  body.primaryStorage = composeStorage(
    String(body.primaryStorageType),
    String(body.primaryStorageSize),
    String(body.primaryStorageModel),
  );
  body.secondaryStorage = body.hasSecondaryStorage
    ? composeStorage(
        String(body.secondaryStorageType),
        String(body.secondaryStorageSize),
        String(body.secondaryStorageModel),
      )
    : "";
  body.graphicsGpu = composeGpuPair(
    String(body.graphicsGpu),
    Boolean(body.hasSecondaryGpu),
    String(body.graphicsGpuSecondary),
  );
  body.operatingSystem = composeOperatingSystem(
    String(body.operatingSystem),
    String(body.operatingSystemEdition),
    String(body.operatingSystemOther),
  );
  body.powerAvrChargerBattery = isLaptopDevice(String(body.deviceType))
    ? composeLaptopPower(String(body.powerChargerStatus), String(body.powerBatteryStatus))
    : composeDesktopPower(
        String(body.powerDesktopConnectionType),
        String(body.powerDesktopDetails),
        ["AVR", "UPS"].includes(String(body.powerDesktopConnectionType))
          ? String(body.powerDesktopCondition)
          : "",
      );

  if (isLaptopDevice(String(body.deviceType))) {
    body.keyboard = composeLaptopKeyboard(
      String(body.keyboardBuiltinCondition),
      String(body.keyboardBuiltinNotes),
      Boolean(body.hasExternalKeyboard),
      String(body.keyboardExternalModel),
      String(body.keyboardExternalCondition),
    );
    body.keyboardCondition = resolveLaptopKeyboardCondition(
      String(body.keyboardBuiltinCondition),
      Boolean(body.hasExternalKeyboard),
      String(body.keyboardExternalCondition),
    );
    body.mouse = composeLaptopPointer(
      String(body.trackpadCondition),
      String(body.trackpadNotes),
      Boolean(body.hasExternalMouse),
      String(body.mouseExternalModel),
      String(body.mouseType),
    );
    if (!body.hasExternalMouse) body.mouseType = "";
    body.mouseCondition = "";
  } else {
    body.keyboard = String(body.desktopKeyboardModel);
    body.mouse = String(body.desktopMouseModel);
    body.mouseType = "";
  }

  body.monitor = composeMonitorRecord(
    String(body.deviceType),
    String(body.monitorPrimary),
    Boolean(body.hasSecondaryMonitor),
    String(body.monitorSecondary),
    String(body.monitorPrimaryCondition),
    String(body.monitorSecondaryCondition),
  );
  body.printer = composePeripheralPair(
    String(body.printerPrimary),
    Boolean(body.hasSecondaryPrinter),
    String(body.printerSecondary),
    String(body.printerPrimaryCondition),
    String(body.printerSecondaryCondition),
  );

  if (
    isLaptopDevice(String(body.deviceType)) ||
    hasBuiltInScreen(String(body.deviceType)) ||
    showsInfraMonitorSpecs(String(body.deviceType))
  ) {
    body.screen = String(body.screenNotes);
    body.screenCondition = String(body.screenCondition);
  } else {
    delete body.screen;
    delete body.screenCondition;
  }

  return body;
}

const ASSET_ONLY_KEYS = [
  "macAddress",
  "serialNumber",
  "status",
  "notes",
  "location",
  "managementIp",
  "rackSlot",
  "portCount",
] as const;

export function validateAssetForm(form: DeviceFormState): string | null {
  if (!String(form.computerName ?? "").trim()) {
    return "Computer name is required.";
  }
  const assignedTo = String(form.employeeName ?? "").trim();
  const status = String(form.status ?? "");
  if (status === "IN_USE" && !assignedTo) {
    return "Assigned To is required when status is In Use.";
  }
  return null;
}

export function validateAuditForm(form: DeviceFormState): string | null {
  if (!String(form.employeeName ?? "").trim()) {
    return "Employee name is required.";
  }
  if (!String(form.departmentId ?? "").trim()) {
    return "Department is required.";
  }
  if (!String(form.computerName ?? "").trim()) {
    return "Computer name is required.";
  }
  return null;
}

export function prepareAuditPayload(form: DeviceFormState): Record<string, string | boolean | string[]> {
  const body = prepareComposedForm(form);
  UI_ONLY_KEYS.forEach((k) => delete body[k]);
  ASSET_ONLY_KEYS.forEach((k) => delete body[k]);

  const result: Record<string, string | boolean | string[]> = { ...body };
  const upgradeComponentsCsv = String(body.upgradeComponents ?? "");
  delete result.upgradeComponents;
  const upgradeComponents = upgradeComponentsCsv
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (upgradeComponents.length > 0) result.upgradeComponents = upgradeComponents;

  Object.keys(result).forEach((k) => {
    if (result[k] === "") delete result[k];
  });

  result.employeeName = String(form.employeeName ?? "").trim();
  result.computerName = String(form.computerName ?? "").trim();
  result.departmentId = String(form.departmentId ?? "").trim();

  return result;
}

const AUDIT_ONLY_KEYS = [
  "auditDate",
  "auditStatus",
  "overallAssessment",
  "priority",
  "immediateAction",
  "immediateActionNotes",
  "findingsSummary",
  "detailedFindings",
  "recommendedAction",
  "upgradeComponents",
  "upgradeNotes",
  "internalNotes",
  "auditedBy",
  "employeeStatus",
  "screen",
  "screenCondition",
  "keyboardCondition",
  "mouseType",
  "mouseCondition",
  "powerAvrChargerBattery",
  "ramSlotsUsed",
] as const;

function prepareComponentAssetPayload(
  form: DeviceFormState,
  itemType: string,
): Record<string, string | boolean | number> {
  const payload: Record<string, string | boolean | number> = {
    computerName: String(form.computerName ?? "").trim(),
    itemType,
    brandModel: String(form.laptopBrandModel ?? "").trim(),
    departmentId: String(form.departmentId ?? "").trim(),
    serialNumber: String(form.serialNumber ?? "").trim(),
    status: String(form.status ?? ""),
    condition: String(form.condition ?? ""),
    notes: String(form.notes ?? ""),
  };

  const assignedTo = String(form.employeeName ?? "").trim();
  if (assignedTo) {
    payload.assignedTo = assignedTo;
    const jobTitle = String(form.jobTitle ?? "").trim();
    if (jobTitle) payload.jobTitle = jobTitle;
  }

  Object.keys(payload).forEach((k) => {
    if (payload[k] === "") delete payload[k];
  });

  return payload;
}

export function prepareAssetPayload(form: DeviceFormState): Record<string, string | boolean | number> {
  const itemType = String(form.itemType || "");
  if (isComponentItemType(itemType)) {
    return prepareComponentAssetPayload(form, itemType);
  }

  const assetCategory = String(form.assetCategory || "end_user") as "end_user" | "infrastructure";
  const composed = prepareComposedForm(form);
  UI_ONLY_KEYS.forEach((k) => delete composed[k]);
  AUDIT_ONLY_KEYS.forEach((k) => delete composed[k]);

  const infra = assetCategory === "infrastructure";

  const payload: Record<string, string | boolean | number> = {
    computerName: composed.computerName,
    deviceType: composed.deviceType,
    brandModel: composed.laptopBrandModel,
    departmentId: composed.departmentId,
    serialNumber: composed.serialNumber,
    processor: composed.processor,
    ram: composed.ram,
    primaryStorage: composed.primaryStorage,
    secondaryStorage: composed.secondaryStorage,
    gpu: composed.graphicsGpu,
    network: composed.network,
    os: composed.operatingSystem,
    osLicenseStatus: composed.osLicenseStatus,
    status: composed.status,
    condition: composed.condition,
    notes: composed.notes,
  };

  if (composed.employeeName) payload.assignedTo = composed.employeeName;
  if (!infra && composed.jobTitle) payload.jobTitle = composed.jobTitle;

  if (infra) {
    if (composed.location) payload.location = composed.location;
    if (composed.managementIp) payload.managementIp = composed.managementIp;
    if (composed.rackSlot) payload.rackSlot = composed.rackSlot;
    const portCount = String(composed.portCount).trim();
    if (portCount !== "") payload.portCount = Number(portCount);
    if (!showsInfraServerSpecs(String(composed.deviceType))) {
      delete payload.processor;
      delete payload.ram;
      if (!showsInfraStorageSpecs(String(composed.deviceType))) {
        delete payload.primaryStorage;
        delete payload.secondaryStorage;
      }
      delete payload.gpu;
      delete payload.network;
      delete payload.os;
      delete payload.osLicenseStatus;
      if (showsInfraNetworkSpecs(String(composed.deviceType)) && composed.macAddress) {
        payload.macAddress = composed.macAddress;
      }
      if (showsInfraMonitorSpecs(String(composed.deviceType))) {
        if (composed.screen) payload.screen = composed.screen;
        if (composed.screenCondition) payload.screenCondition = composed.screenCondition;
      }
    }
  } else {
    payload.printer = composed.printer;
    payload.monitor = composed.monitor;
    payload.keyboard = composed.keyboard;
    payload.mouse = composed.mouse;
    if (composed.screen) payload.screen = composed.screen;
    if (composed.screenCondition) payload.screenCondition = composed.screenCondition;
    if (composed.ramSlotsUsed) payload.ramSlotsUsed = composed.ramSlotsUsed;
    if (composed.powerAvrChargerBattery) payload.powerAvrChargerBattery = composed.powerAvrChargerBattery;
    if (composed.keyboardCondition) payload.keyboardCondition = composed.keyboardCondition;
    if (composed.mouseType) payload.mouseType = composed.mouseType;
    if (composed.mouseCondition) payload.mouseCondition = composed.mouseCondition;
  }

  Object.keys(payload).forEach((k) => {
    if (payload[k] === "") delete payload[k];
  });

  return payload;
}
