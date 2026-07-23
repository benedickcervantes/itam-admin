const LABELS: Record<string, string> = {
  ACTIVE: "Active",
  CREATE: "Create",
  UPDATE: "Update",
  DELETE: "Delete",
  LOGIN_SUCCESS: "Login success",
  LOGIN_FAILURE: "Login failure",
  PASSWORD_VERIFY_SUCCESS: "Password verified",
  PASSWORD_VERIFY_FAILURE: "Password verify failed",
  CURRENTLY_ASSIGNED: "Currently assigned",
  REPLACED: "Replaced",
  RETURNED: "Returned",
  RESIGNED: "Resigned",
  NEW_HIRE: "New Hire",
  ON_LEAVE: "On Leave",
  DESKTOP: "Desktop",
  LAPTOP: "Laptop",
  ALL_IN_ONE: "All-in-One",
  OTHER: "Other",
  SERVER: "Server",
  POE_SWITCH: "PoE Switch",
  SWITCH_HUB: "Switch Hub",
  LOAD_BALANCER: "Load Balancer",
  FIREWALL: "Firewall",
  ACCESS_POINT: "Access Point",
  CCTV_DVR: "CCTV NVR/DVR",
  CCTV_CAMERA: "CCTV Camera",
  EXTERNAL_HDD_SSD: "External HDD/SSD",
  KEYBOARD: "Keyboard",
  MOUSE: "Mouse",
  MONITOR: "Monitor",
  PRINTER: "Printer",
  UPS: "UPS",
  AVR: "AVR",
  STORAGE: "Storage",
  RAM: "RAM",
  MOTHERBOARD: "Motherboard",
  WIFI: "Wi-Fi",
  TOUCHPAD: "Touchpad",
  LAPTOP_SCREEN: "Laptop Screen",
  POWER_SUPPLY: "Power Supply",
  NEW_LAPTOP: "New Laptop",
  NEW_DESKTOP: "New Desktop",
  LICENSED: "Licensed",
  CRACKED: "Cracked",
  NOT_ACTIVATED: "Not Activated",
  UNKNOWN: "Unknown",
  COMPLETE: "Complete",
  PENDING: "Pending",
  INCOMPLETE: "Incomplete",
  OK_NO_ISSUES: "OK - No Issues",
  NEEDS_UPGRADE: "Needs Upgrade",
  NEEDS_REPLACEMENT: "Needs Replacement",
  CRITICAL_IMMEDIATE_ACTION: "Critical - Immediate Action",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  IMMEDIATE: "Immediate",
  NO_ACTION: "No Action",
  UPGRADE: "Upgrade",
  REPLACE_UNIT: "Replace Unit",
  SOFTWARE_REFRESH: "Software Refresh",
  IMMEDIATE_REPAIR: "Immediate Repair",
  NETWORK_EQUIPMENT: "Network Equipment",
  POWER_BACKUP: "Power / Backup",
  SOFTWARE_LICENSES: "Software Licenses",
  IN_USE: "In Use",
  AVAILABLE: "Available",
  UNDER_REPAIR: "Under Repair",
  RESERVED: "Reserved",
  RETIRED: "Retired",
  DISPOSED: "Disposed",
  NEW: "New",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
  NON_FUNCTIONAL: "Non-Functional",
  FADING_KEYS: "Fading Keys",
  FAULTY: "Faulty",
  BUILT_IN_LAPTOP: "Built-in (Laptop)",
  COMPANY_PROVIDED: "Company Provided",
  PERSONAL_BYOD: "Personal (BYOD)",
  NONE: "None",
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  SOLD: "Sold",
  DONATED: "Donated",
  RECYCLED: "Recycled",
  DESTROYED: "Destroyed",
  LOST: "Lost",
  STOLEN: "Stolen",
  TRADE_IN: "Trade-In",
  IT_ADMIN: "IT Admin",
  VIEWER: "Viewer",
  SUPER_ADMIN: "Super Admin",
  Auth: "Auth",
  User: "User",
  Asset: "Asset",
  AssetPeripheralMove: "Peripheral move",
  AuditRegister: "Audit register",
  DeviceHistory: "Device history",
  DeviceHistoryTransfer: "Device transfer",
  MaintenanceRecord: "Maintenance",
  DisposalRecord: "Disposal",
  Supplier: "Supplier",
  RecommendationSpec: "Recommendation spec",
};

const COMPACT_LABELS: Record<string, string> = {
  OK_NO_ISSUES: "OK",
  NEEDS_UPGRADE: "Upgrade",
  NEEDS_REPLACEMENT: "Replace",
  CRITICAL_IMMEDIATE_ACTION: "Critical",
  IN_PROGRESS: "In Prog.",
  IMMEDIATE_REPAIR: "Repair",
  SOFTWARE_REFRESH: "Refresh",
  REPLACE_UNIT: "Replace",
};

export function labelEnum(value: string | null | undefined): string {
  if (!value) return "—";
  return LABELS[value] ?? value.replace(/_/g, " ");
}

export function labelEnumCompact(value: string | null | undefined): string {
  if (!value) return "—";
  return COMPACT_LABELS[value] ?? LABELS[value] ?? value.replace(/_/g, " ");
}

/** Comma-separated list for audit table (single-line truncate). */
export function formatItemsNeededList(components?: string[] | null): string {
  if (!components?.length) return "";
  return components.map((c) => labelEnum(c)).join(", ");
}

/** Table column — covers both parts (upgrade) and whole units (replacement). */
export const ITEMS_NEEDED_TABLE_LABEL = "Items Needed";

/** Form / detail heading — depends on overall assessment. */
export function upgradeChecklistLabel(assessment?: string | null): string {
  if (assessment === "NEEDS_REPLACEMENT") return "Items to Replace";
  return "Parts to Upgrade";
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
