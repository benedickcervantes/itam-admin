import { REFERENCE_DATA } from "@/lib/reference-data";

export type SupplierFormMode = "create" | "edit";
export type SupplierCategory = (typeof REFERENCE_DATA.supplierCategories)[number];
export type SupplierStatus = (typeof REFERENCE_DATA.supplierStatuses)[number];

export const SUPPLIER_CATEGORY_META: Record<SupplierCategory, { label: string; description: string }> = {
  SERVER: { label: "Server", description: "Rack servers, towers, and related hardware." },
  DESKTOP: { label: "Desktop", description: "Office desktops and workstations." },
  LAPTOP: { label: "Laptop", description: "Notebooks and mobile workstations." },
  ALL_IN_ONE: { label: "All-in-One", description: "AIO PCs and combined units." },
  NETWORK_EQUIPMENT: { label: "Network Equipment", description: "Switches, firewalls, APs, and routers." },
  PERIPHERALS: { label: "Peripherals", description: "Monitors, keyboards, mice, printers." },
  POWER_BACKUP: { label: "Power / Backup", description: "UPS, AVR, and power accessories." },
  CCTV: { label: "CCTV", description: "Cameras, DVRs, and surveillance gear." },
  STORAGE: { label: "Storage", description: "External drives, NAS, and media." },
  SOFTWARE_LICENSES: { label: "Software Licenses", description: "OS, productivity, and IT software." },
  OTHER: { label: "Other", description: "Other IT asset categories." },
};

export function parseCategoriesCsv(value?: string): string[] {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function validateSupplierForm(form: Record<string, string>): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = form.name?.trim() ?? "";
  const email = form.email?.trim() ?? "";
  const website = form.website?.trim() ?? "";

  if (!name) errors.name = "Supplier name is required.";
  else if (name.length < 2) errors.name = "Enter at least 2 characters.";

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (website && !/^https?:\/\/.+/i.test(website) && !/^[a-z0-9.-]+\.[a-z]{2,}/i.test(website)) {
    errors.website = "Enter a valid website (e.g. https://example.com).";
  }

  if (!form.status) errors.status = "Status is required.";

  return errors;
}

export function buildSupplierBody(form: Record<string, string>): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: form.name?.trim(),
    contactPerson: form.contactPerson?.trim() || undefined,
    email: form.email?.trim() || undefined,
    phone: form.phone?.trim() || undefined,
    address: form.address?.trim() || undefined,
    website: form.website?.trim() || undefined,
    status: form.status || "ACTIVE",
    notes: form.notes?.trim() || undefined,
    categories: parseCategoriesCsv(form.categories),
  };
  Object.keys(body).forEach((k) => {
    if (body[k] === undefined || body[k] === "") delete body[k];
  });
  return body;
}
