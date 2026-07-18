export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type Department = { id: string; name: string };

export type AuditRegister = {
  id: string;
  audit_code: string;
  employee_name: string;
  department_id: string;
  department?: Department;
  job_title?: string | null;
  employee_status?: string;
  device_type?: string | null;
  computer_name: string;
  laptop_brand_model?: string | null;
  condition?: string | null;
  screen?: string | null;
  screen_condition?: string | null;
  processor?: string | null;
  ram?: string | null;
  ram_slots_used?: string | null;
  primary_storage?: string | null;
  secondary_storage?: string | null;
  graphics_gpu?: string | null;
  network?: string | null;
  operating_system?: string | null;
  os_license_status?: string | null;
  printer?: string | null;
  monitor?: string | null;
  keyboard?: string | null;
  keyboard_condition?: string | null;
  mouse?: string | null;
  mouse_type?: string | null;
  mouse_condition?: string | null;
  power_avr_charger_battery?: string | null;
  audit_date?: string | null;
  audit_status?: string;
  overall_assessment?: string | null;
  priority?: string | null;
  immediate_action?: boolean;
  immediate_action_notes?: string | null;
  findings_summary?: string | null;
  detailed_findings?: string | null;
  recommended_action?: string | null;
  upgrade_components?: string[] | null;
  upgrade_notes?: string | null;
  internal_notes?: string | null;
  audited_by?: string | null;
  assets?: Asset[];
  assets_created?: number;
};

export type Asset = {
  id: string;
  asset_code: string;
  audit_id?: string | null;
  computer_name: string;
  device_type?: string | null;
  item_type?: string | null;
  brand_model?: string | null;
  assigned_to?: string | null;
  job_title?: string | null;
  department_id?: string | null;
  department?: Department | null;
  serial_number?: string | null;
  processor?: string | null;
  mac_address?: string | null;
  ram?: string | null;
  primary_storage?: string | null;
  secondary_storage?: string | null;
  gpu?: string | null;
  network?: string | null;
  os?: string | null;
  os_license_status?: string | null;
  printer?: string | null;
  monitor?: string | null;
  keyboard?: string | null;
  keyboard_condition?: string | null;
  mouse?: string | null;
  mouse_type?: string | null;
  mouse_condition?: string | null;
  screen?: string | null;
  screen_condition?: string | null;
  ram_slots_used?: string | null;
  power_avr_charger_battery?: string | null;
  status?: string;
  condition?: string | null;
  notes?: string | null;
  location?: string | null;
  management_ip?: string | null;
  rack_slot?: string | null;
  port_count?: number | null;
  last_audit_date?: string | null;
  audit_register?: {
    audit_code: string;
    network?: string | null;
    graphics_gpu?: string | null;
    screen?: string | null;
    screen_condition?: string | null;
    ram_slots_used?: string | null;
    power_avr_charger_battery?: string | null;
    keyboard?: string | null;
    keyboard_condition?: string | null;
    mouse?: string | null;
    mouse_type?: string | null;
    mouse_condition?: string | null;
  } | null;
};

export type DeviceHistory = {
  id: string;
  record_code: string;
  asset_id: string;
  asset?: { asset_code: string; computer_name: string };
  assigned_to: string;
  last_user?: string | null;
  department_id?: string | null;
  department?: { name: string } | null;
  assigned_date: string;
  returned_date?: string | null;
  assigned_by?: string | null;
  notes?: string | null;
};

/** @deprecated Use DeviceHistory */
export type Assignment = DeviceHistory;

export type MaintenanceRecord = {
  id: string;
  record_code: string;
  audit_id?: string | null;
  audit_register?: {
    department?: { name: string } | null;
  } | null;
  computer_name?: string | null;
  employee?: string | null;
  issue: string;
  action_taken?: string | null;
  status?: string;
  date_opened?: string | null;
  date_closed?: string | null;
  performed_by?: string | null;
  notes?: string | null;
};

export type DisposalRecord = {
  id: string;
  record_code: string;
  asset_id: string;
  asset?: {
    asset_code: string;
    computer_name: string;
    department?: { name: string } | null;
  };
  computer_name?: string | null;
  disposal_date: string;
  disposal_reason: string;
  disposal_method?: string | null;
  approved_by?: string | null;
  witness?: string | null;
  certificate_doc_no?: string | null;
  notes?: string | null;
};

export type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department_id?: string | null;
  department?: { name: string } | null;
  is_active: boolean;
  created_at?: string;
};

function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export { qs };
