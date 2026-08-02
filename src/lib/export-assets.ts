import { labelEnum } from "./labels";
import type { Asset } from "./types";

// ---------------------------------------------------------------------------
// Asset Dashboard export (Excel + PDF). Independent from the IT Audit export.
// ---------------------------------------------------------------------------

export type AssetExportColumnKey =
  | "assetId"
  | "itemType"
  | "deviceType"
  | "computer"
  | "brandModel"
  | "serialNo"
  | "assignedTo"
  | "jobTitle"
  | "department"
  | "status"
  | "condition"
  | "processor"
  | "ram"
  | "primaryStorage"
  | "secondaryStorage"
  | "graphicsCard"
  | "network"
  | "operatingSystem"
  | "osLicense"
  | "macAddress"
  | "monitor"
  | "keyboard"
  | "mouse"
  | "webcam"
  | "printer"
  | "location"
  | "managementIp"
  | "rackSlot"
  | "portCount"
  | "linkedAudit"
  | "lastAuditDate"
  | "notes";

type Column = {
  key: AssetExportColumnKey;
  header: string;
  required?: boolean;
  width?: number;
  value: (row: Asset) => string;
};

export type AssetExportColumnSection = {
  title: string;
  columns: Array<{ key: AssetExportColumnKey; header: string; required?: boolean }>;
};

type ColumnSection = {
  title: string;
  columns: Column[];
};

function labelEnumOrBlank(value?: string | null): string {
  return value ? labelEnum(value) : "";
}

function fmtDate(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

/**
 * Column layout for the Asset inventory, grouped into sections. Covers both
 * end-user devices and infrastructure (server/network) assets; columns that
 * don't apply to a given row are simply left blank.
 */
const COLUMN_SECTIONS: ColumnSection[] = [
  {
    title: "IDENTIFICATION",
    columns: [
      { key: "assetId", header: "Asset ID", required: true, width: 14, value: (r) => r.asset_code },
      { key: "itemType", header: "Item Type", width: 14, value: (r) => labelEnumOrBlank(r.item_type ?? r.device_type) },
      { key: "deviceType", header: "Device Type", width: 14, value: (r) => labelEnumOrBlank(r.device_type) },
      { key: "computer", header: "Computer / Hostname", required: true, width: 24, value: (r) => r.computer_name ?? "" },
      { key: "brandModel", header: "Brand / Model", width: 22, value: (r) => r.brand_model ?? "" },
      { key: "serialNo", header: "Serial No.", width: 20, value: (r) => r.serial_number ?? "" },
    ],
  },
  {
    title: "ASSIGNMENT",
    columns: [
      { key: "assignedTo", header: "Assigned To", width: 22, value: (r) => r.assigned_to ?? "" },
      { key: "jobTitle", header: "Job Title", width: 22, value: (r) => r.job_title ?? "" },
      { key: "department", header: "Department", width: 18, value: (r) => r.department?.name ?? "" },
      { key: "status", header: "Status", width: 14, value: (r) => labelEnumOrBlank(r.status) },
      { key: "condition", header: "Condition", width: 14, value: (r) => labelEnumOrBlank(r.condition) },
    ],
  },
  {
    title: "SPECIFICATIONS",
    columns: [
      { key: "processor", header: "Processor", width: 26, value: (r) => r.processor ?? "" },
      { key: "ram", header: "RAM", width: 18, value: (r) => r.ram ?? "" },
      { key: "primaryStorage", header: "Primary Storage", width: 28, value: (r) => r.primary_storage ?? "" },
      { key: "secondaryStorage", header: "Secondary Storage", width: 22, value: (r) => r.secondary_storage ?? "" },
      { key: "graphicsCard", header: "Graphics Card", width: 24, value: (r) => r.gpu ?? "" },
      { key: "network", header: "Network", width: 24, value: (r) => r.network ?? "" },
      { key: "operatingSystem", header: "Operating System", width: 18, value: (r) => r.os ?? "" },
      { key: "osLicense", header: "OS License", width: 14, value: (r) => labelEnumOrBlank(r.os_license_status) },
      { key: "macAddress", header: "MAC Address", width: 18, value: (r) => r.mac_address ?? "" },
    ],
  },
  {
    title: "PERIPHERALS",
    columns: [
      { key: "monitor", header: "Monitor", width: 26, value: (r) => r.monitor ?? "" },
      { key: "keyboard", header: "Keyboard", width: 18, value: (r) => r.keyboard ?? "" },
      { key: "mouse", header: "Mouse", width: 16, value: (r) => r.mouse ?? "" },
      { key: "webcam", header: "Webcam", width: 18, value: (r) => r.webcam ?? "" },
      { key: "printer", header: "Printer", width: 24, value: (r) => r.printer ?? "" },
    ],
  },
  {
    title: "INFRASTRUCTURE",
    columns: [
      { key: "location", header: "Location", width: 20, value: (r) => r.location ?? "" },
      { key: "managementIp", header: "Management IP", width: 16, value: (r) => r.management_ip ?? "" },
      { key: "rackSlot", header: "Rack / Slot", width: 14, value: (r) => r.rack_slot ?? "" },
      { key: "portCount", header: "Port Count", width: 10, value: (r) => (r.port_count != null ? String(r.port_count) : "") },
    ],
  },
  {
    title: "AUDIT LINK",
    columns: [
      { key: "linkedAudit", header: "Linked Audit", width: 14, value: (r) => r.audit_register?.audit_code ?? "" },
      { key: "lastAuditDate", header: "Last Audit Date", width: 14, value: (r) => fmtDate(r.last_audit_date) },
    ],
  },
  {
    title: "NOTES",
    columns: [{ key: "notes", header: "Notes", width: 34, value: (r) => r.notes ?? "" }],
  },
];

export const ASSET_EXPORT_COLUMN_SECTIONS: AssetExportColumnSection[] = COLUMN_SECTIONS.map((section) => ({
  title: section.title,
  columns: section.columns.map(({ key, header, required }) => ({ key, header, required })),
}));

export const ALL_ASSET_EXPORT_COLUMN_KEYS: AssetExportColumnKey[] = COLUMN_SECTIONS.flatMap((section) =>
  section.columns.map((column) => column.key),
);

function resolveExportSections(selectedColumnKeys?: AssetExportColumnKey[]): ColumnSection[] {
  const selected = new Set(selectedColumnKeys ?? ALL_ASSET_EXPORT_COLUMN_KEYS);
  return COLUMN_SECTIONS.map((section) => ({
    ...section,
    columns: section.columns.filter((column) => selected.has(column.key)),
  })).filter((section) => section.columns.length > 0);
}

function timestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(
    now.getMinutes(),
  )}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// --- PDF (styled print window) ---------------------------------------------

export function exportAssetsPdf(
  rows: Asset[],
  filterSummary?: string,
  selectedColumnKeys?: AssetExportColumnKey[],
): void {
  const sections = resolveExportSections(selectedColumnKeys);
  const columns = sections.flatMap((section) => section.columns);
  const generatedAt = new Date().toLocaleString();
  const totalCols = columns.length;

  const sectionCells = sections
    .map(
      (section, i) =>
        `<th colspan="${section.columns.length}" class="section ${i % 2 === 0 ? "sec-a" : "sec-b"}">${escapeHtml(
          section.title,
        )}</th>`,
    )
    .join("");

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
<title>Asset Inventory</title>
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
  <div class="banner"><h1>ASSET INVENTORY</h1></div>
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
  <div class="note">Blue headers ( * ) = required fields  |  Linked to IT Audit Register via Linked Audit</div>
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
  setTimeout(() => {
    win.print();
  }, 300);
}

// --- Excel (.xlsx via exceljs) ---------------------------------------------

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

export async function exportAssetsExcel(
  rows: Asset[],
  filterSummary?: string,
  selectedColumnKeys?: AssetExportColumnKey[],
): Promise<void> {
  const sections = resolveExportSections(selectedColumnKeys);
  const columns = sections.flatMap((section) => section.columns);

  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ITAM Admin";
  workbook.created = new Date();
  const ws = workbook.addWorksheet("Asset Inventory", {
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
  titleCell.value = "ASSET INVENTORY";
  titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: COLOR.white } };
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.brand } };
  ws.getRow(1).height = 30;

  // Row 2: subtitle
  ws.mergeCells(2, 1, 2, colCount);
  const subCell = ws.getCell(2, 1);
  subCell.value = filterSummary
    ? `Exported ${rows.length} record(s)  |  Filters: ${filterSummary}  |  Generated ${new Date().toLocaleString()}`
    : `Exported ${rows.length} record(s)  |  Generated ${new Date().toLocaleString()}`;
  subCell.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: COLOR.subtitle } };
  subCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(2).height = 18;

  // Row 3: section group headers
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

  ws.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4, column: colCount },
  };

  const noteRowIdx = 5 + rows.length + 1;
  ws.mergeCells(noteRowIdx, 1, noteRowIdx, colCount);
  const noteCell = ws.getCell(noteRowIdx, 1);
  noteCell.value = "Blue headers ( * ) = required fields  |  Linked to IT Audit Register via Linked Audit";
  noteCell.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: COLOR.subtitle } };
  noteCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `asset-inventory-${timestamp()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
