import { desktopConnectionLabel, isLaptopDevice, parsePower } from "./device-form";
import { formatItemsNeededList, labelEnum } from "./labels";
import type { AuditRegister } from "./types";

function powerParts(r: AuditRegister) {
  return parsePower(r.power_avr_charger_battery ?? "");
}

function isLaptop(r: AuditRegister): boolean {
  return isLaptopDevice(r.device_type ?? "");
}

export type AuditExportColumnKey =
  | "auditId"
  | "employee"
  | "department"
  | "jobTitle"
  | "computer"
  | "deviceType"
  | "brandModel"
  | "processor"
  | "ram"
  | "storage"
  | "graphicsCard"
  | "network"
  | "operatingSystem"
  | "osLicense"
  | "monitor"
  | "keyboard"
  | "mouse"
  | "printer"
  | "charger"
  | "battery"
  | "powerConnection"
  | "powerBrand"
  | "avrUpsCondition"
  | "auditDate"
  | "status"
  | "assessment"
  | "priority"
  | "itemsNeeded"
  | "recommendedAction"
  | "immediateAction";

type Column = {
  key: AuditExportColumnKey;
  header: string;
  required?: boolean;
  width?: number;
  value: (row: AuditRegister) => string;
};

export type AuditExportColumnSection = {
  title: string;
  columns: Array<{ key: AuditExportColumnKey; header: string; required?: boolean }>;
};

type ColumnSection = {
  title: string;
  columns: Column[];
};

function fmtDate(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function joinStorage(row: AuditRegister): string {
  return [row.primary_storage, row.secondary_storage].filter((v) => v?.trim()).join(" + ");
}

/** Combine a peripheral name with its condition/type, e.g. "Logitech (Good)". */
function joinWithCondition(name?: string | null, extra?: string | null): string {
  const label = name?.trim() ?? "";
  const detail = extra ? labelEnumOrBlank(extra) : "";
  if (label && detail) return `${label} (${detail})`;
  return label || detail;
}

/**
 * Column layout shared by CSV and PDF exports, grouped into the same four
 * sections as the IT Audit Register template so the PDF can render section
 * group headers.
 */
const COLUMN_SECTIONS: ColumnSection[] = [
  {
    title: "EMPLOYEE INFO",
    columns: [
      { key: "auditId", header: "Audit ID", required: true, width: 12, value: (r) => r.audit_code },
      { key: "employee", header: "Employee", required: true, width: 24, value: (r) => r.employee_name ?? "" },
      { key: "department", header: "Department", required: true, width: 18, value: (r) => r.department?.name ?? "" },
      { key: "jobTitle", header: "Job Title", width: 22, value: (r) => r.job_title ?? "" },
    ],
  },
  {
    title: "DEVICE SPECIFICATIONS",
    columns: [
      { key: "computer", header: "Computer", required: true, width: 22, value: (r) => r.computer_name ?? "" },
      { key: "deviceType", header: "Device Type", width: 12, value: (r) => labelEnumOrBlank(r.device_type) },
      { key: "brandModel", header: "Brand / Model", width: 20, value: (r) => r.laptop_brand_model ?? "" },
      { key: "processor", header: "Processor", width: 26, value: (r) => r.processor ?? "" },
      { key: "ram", header: "RAM", width: 18, value: (r) => r.ram ?? "" },
      { key: "storage", header: "Storage", width: 30, value: joinStorage },
      { key: "graphicsCard", header: "Graphics Card", width: 24, value: (r) => r.graphics_gpu ?? "" },
      { key: "network", header: "Network", width: 24, value: (r) => r.network ?? "" },
      { key: "operatingSystem", header: "Operating System", width: 18, value: (r) => r.operating_system ?? "" },
      { key: "osLicense", header: "OS License", width: 14, value: (r) => labelEnumOrBlank(r.os_license_status) },
    ],
  },
  {
    title: "PERIPHERALS",
    columns: [
      { key: "monitor", header: "Monitor", width: 28, value: (r) => r.monitor ?? "" },
      { key: "keyboard", header: "Keyboard", width: 22, value: (r) => joinWithCondition(r.keyboard, r.keyboard_condition) },
      { key: "mouse", header: "Mouse", width: 20, value: (r) => joinWithCondition(r.mouse, r.mouse_condition) },
      { key: "printer", header: "Printer", width: 26, value: (r) => r.printer ?? "" },
    ],
  },
  {
    title: "POWER & CHARGING",
    columns: [
      { key: "charger", header: "Charger", width: 18, value: (r) => (isLaptop(r) ? powerParts(r).charger : "") },
      { key: "battery", header: "Battery", width: 18, value: (r) => (isLaptop(r) ? powerParts(r).battery : "") },
      {
        key: "powerConnection",
        header: "Power Connection",
        width: 18,
        value: (r) => (isLaptop(r) ? "" : desktopConnectionLabel(powerParts(r).desktopConnectionType)),
      },
      { key: "powerBrand", header: "Brand", width: 22, value: (r) => (isLaptop(r) ? "" : powerParts(r).desktopDetails) },
      {
        key: "avrUpsCondition",
        header: "AVR / UPS Condition",
        width: 18,
        value: (r) =>
          isLaptop(r) || !powerParts(r).desktopCondition
            ? ""
            : labelEnumOrBlank(powerParts(r).desktopCondition),
      },
    ],
  },
  {
    title: "AUDIT & FINDINGS",
    columns: [
      { key: "auditDate", header: "Audit Date", width: 12, value: (r) => fmtDate(r.audit_date) },
      { key: "status", header: "Status", width: 14, value: (r) => labelEnumOrBlank(r.audit_status) },
      { key: "assessment", header: "Assessment", width: 16, value: (r) => labelEnumOrBlank(r.overall_assessment) },
      { key: "priority", header: "Priority", width: 12, value: (r) => labelEnumOrBlank(r.priority) },
      { key: "itemsNeeded", header: "Items Needed", width: 28, value: (r) => formatItemsNeededList(r.upgrade_components) },
      { key: "recommendedAction", header: "Recommended Action", width: 18, value: (r) => labelEnumOrBlank(r.recommended_action) },
      { key: "immediateAction", header: "Immediate Action", width: 12, value: (r) => (r.immediate_action ? "Yes" : "No") },
    ],
  },
];

export const AUDIT_EXPORT_COLUMN_SECTIONS: AuditExportColumnSection[] = COLUMN_SECTIONS.map((section) => ({
  title: section.title,
  columns: section.columns.map(({ key, header, required }) => ({ key, header, required })),
}));

export const ALL_AUDIT_EXPORT_COLUMN_KEYS: AuditExportColumnKey[] = COLUMN_SECTIONS.flatMap((section) =>
  section.columns.map((column) => column.key),
);

function resolveExportSections(selectedColumnKeys?: AuditExportColumnKey[]): ColumnSection[] {
  const selected = new Set(selectedColumnKeys ?? ALL_AUDIT_EXPORT_COLUMN_KEYS);
  return COLUMN_SECTIONS.map((section) => ({
    ...section,
    columns: section.columns.filter((column) => selected.has(column.key)),
  })).filter((section) => section.columns.length > 0);
}

function labelEnumOrBlank(value?: string | null): string {
  return value ? labelEnum(value) : "";
}

function csvCell(value: string): string {
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function timestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(
    now.getMinutes(),
  )}`;
}

export function exportAuditsCsv(rows: AuditRegister[], selectedColumnKeys?: AuditExportColumnKey[]): void {
  const columns = resolveExportSections(selectedColumnKeys).flatMap((section) => section.columns);
  const header = columns.map((c) => csvCell(c.header)).join(",");
  const lines = rows.map((row) => columns.map((c) => csvCell(c.value(row))).join(","));
  const csv = [header, ...lines].join("\r\n");
  // Prepend BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `audit-register-${timestamp()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function exportAuditsPdf(
  rows: AuditRegister[],
  filterSummary?: string,
  selectedColumnKeys?: AuditExportColumnKey[],
): void {
  const sections = resolveExportSections(selectedColumnKeys);
  const columns = sections.flatMap((section) => section.columns);
  const generatedAt = new Date().toLocaleString();
  const totalCols = columns.length;

  // Section group header row (colspan per section), alternating fills.
  const sectionCells = sections
    .map(
      (section, i) =>
        `<th colspan="${section.columns.length}" class="section ${i % 2 === 0 ? "sec-a" : "sec-b"}">${escapeHtml(
          section.title,
        )}</th>`,
    )
    .join("");

  // Column header row (required = navy, optional = teal).
  const headerCells = columns
    .map(
      (c) => `<th class="${c.required ? "req" : "opt"}">${escapeHtml(c.header)}${c.required ? " *" : ""}</th>`,
    )
    .join("");

  const bodyRows = rows
    .map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(c.value(row))}</td>`).join("")}</tr>`)
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>IT Audit Register</title>
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: #1e293b; margin: 0; }
  .banner { background: #2E7D9A; color: #fff; padding: 10px 14px; }
  .banner h1 { font-size: 16px; margin: 0; letter-spacing: 0.5px; }
  .meta { font-size: 9px; color: #64748b; padding: 6px 14px 10px; }
  .meta span { margin-right: 14px; }
  .table-wrap { padding: 0 14px 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 7.5px; table-layout: fixed; }
  th, td { border: 1px solid #cbd5e1; padding: 3px 4px; text-align: left; vertical-align: top; word-break: break-word; overflow-wrap: anywhere; }
  th.section { color: #fff; font-weight: 700; text-align: center; font-size: 8px; letter-spacing: 0.4px; }
  th.sec-a { background: #2E7D9A; }
  th.sec-b { background: #215C73; }
  th.req { background: #1F4E78; color: #fff; font-weight: 600; }
  th.opt { background: #3E8EAD; color: #fff; font-weight: 600; }
  tbody tr:nth-child(even) td { background: #EFF5F8; }
  .note { font-size: 8px; color: #64748b; font-style: italic; padding: 8px 14px 0; }
  @media print {
    @page { size: landscape; margin: 8mm; }
    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    th.section, th.sec-a, th.sec-b, th.req, th.opt, .banner { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    tbody tr:nth-child(even) td { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
</style>
</head>
<body>
  <div class="banner"><h1>IT AUDIT REGISTER</h1></div>
  <div class="meta">
    <span><strong>Total records:</strong> ${rows.length}</span>
    <span><strong>Generated:</strong> ${escapeHtml(generatedAt)}</span>
    ${filterSummary ? `<span><strong>Filters:</strong> ${escapeHtml(filterSummary)}</span>` : ""}
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>${sectionCells}</tr>
        <tr>${headerCells}</tr>
      </thead>
      <tbody>${bodyRows || `<tr><td colspan="${totalCols}">No records</td></tr>`}</tbody>
    </table>
  </div>
  <div class="note">Dark blue headers ( * ) = required fields  |  Link to Assets via Audit ID</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    throw new Error("Unable to open print window. Please allow pop-ups for this site.");
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  // Give the new window a tick to render before invoking the print dialog.
  setTimeout(() => {
    win.print();
  }, 300);
}

// ---------------------------------------------------------------------------
// Styled Excel (.xlsx) export — mirrors the IT Audit Register template layout:
// title banner, section group headers, dark-blue required column headers.
// ---------------------------------------------------------------------------

const COLOR = {
  brand: "FF2E7D9A",
  sectionA: "FF2E7D9A",
  sectionB: "FF215C73",
  requiredHeader: "FF1F4E78",
  optionalHeader: "FF3E8EAD",
  altRow: "FFEFF5F8",
  border: "FFCBD5E1",
  white: "FFFFFFFF",
  subtitle: "FF64748B",
} as const;

export async function exportAuditsExcel(
  rows: AuditRegister[],
  filterSummary?: string,
  selectedColumnKeys?: AuditExportColumnKey[],
): Promise<void> {
  const sections = resolveExportSections(selectedColumnKeys);
  const columns = sections.flatMap((section) => section.columns);

  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ITAM Admin";
  workbook.created = new Date();
  const ws = workbook.addWorksheet("IT Audit Register", {
    views: [{ state: "frozen", ySplit: 4, xSplit: 1 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  const colCount = columns.length;
  columns.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.width ?? 16;
  });

  const thinBorder = {
    top: { style: "thin" as const, color: { argb: COLOR.border } },
    left: { style: "thin" as const, color: { argb: COLOR.border } },
    bottom: { style: "thin" as const, color: { argb: COLOR.border } },
    right: { style: "thin" as const, color: { argb: COLOR.border } },
  };

  // Row 1: title banner
  ws.mergeCells(1, 1, 1, colCount);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = "IT AUDIT REGISTER";
  titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: COLOR.white } };
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.brand } };
  ws.getRow(1).height = 30;

  // Row 2: subtitle / instructions
  ws.mergeCells(2, 1, 2, colCount);
  const subCell = ws.getCell(2, 1);
  subCell.value = filterSummary
    ? `Exported ${rows.length} record(s)  |  Filters: ${filterSummary}  |  Generated ${new Date().toLocaleString()}`
    : `Exported ${rows.length} record(s)  |  Generated ${new Date().toLocaleString()}`;
  subCell.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: COLOR.subtitle } };
  subCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(2).height = 18;

  // Row 3: section group headers (spans derived from the shared layout)
  let start = 1;
  sections.forEach((section, idx) => {
    const end = start + section.columns.length - 1;
    ws.mergeCells(3, start, 3, end);
    const cell = ws.getCell(3, start);
    cell.value = section.title;
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: COLOR.white } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: idx % 2 === 0 ? COLOR.sectionA : COLOR.sectionB },
    };
    for (let c = start; c <= end; c += 1) {
      ws.getCell(3, c).border = thinBorder;
    }
    start = end + 1;
  });
  ws.getRow(3).height = 20;

  // Row 4: column headers
  const headerRow = ws.getRow(4);
  columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.required ? `${col.header} *` : col.header;
    cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: COLOR.white } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: col.required ? COLOR.requiredHeader : COLOR.optionalHeader },
    };
    cell.border = thinBorder;
  });
  headerRow.height = 30;

  // Data rows
  rows.forEach((row, rowIdx) => {
    const excelRow = ws.getRow(5 + rowIdx);
    columns.forEach((col, i) => {
      const cell = excelRow.getCell(i + 1);
      cell.value = col.value(row);
      cell.font = { name: "Segoe UI", size: 9, color: { argb: "FF1E293B" } };
      cell.alignment = { vertical: "top", wrapText: false };
      cell.border = thinBorder;
      if (rowIdx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.altRow } };
      }
    });
  });

  // Autofilter across the header row
  ws.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4, column: colCount },
  };

  // Footer note
  const noteRowIdx = 5 + rows.length + 1;
  ws.mergeCells(noteRowIdx, 1, noteRowIdx, colCount);
  const noteCell = ws.getCell(noteRowIdx, 1);
  noteCell.value = "Dark blue headers ( * ) = required fields  |  Link to Assets via Audit ID";
  noteCell.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: COLOR.subtitle } };
  noteCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `audit-register-${timestamp()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
