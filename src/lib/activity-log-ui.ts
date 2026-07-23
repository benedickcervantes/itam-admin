export const ACTIVITY_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN_SUCCESS",
  "LOGIN_FAILURE",
  "PASSWORD_VERIFY_SUCCESS",
  "PASSWORD_VERIFY_FAILURE",
] as const;

export const ACTIVITY_ENTITY_TYPES = [
  "Auth",
  "User",
  "Asset",
  "AssetPeripheralMove",
  "AuditRegister",
  "DeviceHistory",
  "DeviceHistoryTransfer",
  "MaintenanceRecord",
  "DisposalRecord",
  "Supplier",
  "RecommendationSpec",
] as const;

const ENTITY_TYPE_LABELS: Record<string, string> = {
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

const ENTITY_ROUTES: Record<string, string> = {
  User: "/users",
  Asset: "/assets",
  AssetPeripheralMove: "/assets",
  AuditRegister: "/audit-register",
  DeviceHistory: "/device-history",
  DeviceHistoryTransfer: "/device-history",
  MaintenanceRecord: "/maintenance",
  DisposalRecord: "/disposals",
  Supplier: "/procurement",
  RecommendationSpec: "/recommendation-specs",
};

export function labelEntityType(type: string): string {
  if (!type) return "—";
  return ENTITY_TYPE_LABELS[type] ?? type.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function entityDeepLink(
  entityType: string,
  entityLabel?: string | null,
): string | null {
  const base = ENTITY_ROUTES[entityType];
  if (!base) return null;
  const q = entityLabel?.trim();
  if (!q) return base;
  return `${base}?search=${encodeURIComponent(q)}`;
}

/** Local calendar day → ISO (respects PH timezone). */
export function localDayStartIso(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

export function localDayEndIso(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

export function toLocalDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysAgoLocalDateInput(days: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return toLocalDateInput(date);
}
