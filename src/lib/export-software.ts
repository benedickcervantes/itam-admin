import { labelEnum } from "./labels";
import { openLandscapeTablePdf } from "./export-pdf";
import type { SoftwareDeviceRow } from "./api/software";

export type SoftwareExportColumnKey =
  | "assetId"
  | "computer"
  | "user"
  | "department"
  | "standard"
  | "installed"
  | "notNeeded"
  | "missing"
  | "missingSoftware"
  | "additional"
  | "compliance";

type Column = {
  key: SoftwareExportColumnKey;
  header: string;
  required?: boolean;
  width: number;
  value: (row: SoftwareDeviceRow) => string;
};

export type SoftwareExportColumnSection = {
  title: string;
  columns: Array<{ key: SoftwareExportColumnKey; header: string; required?: boolean }>;
};

type ColumnSection = {
  title: string;
  columns: Column[];
};

function covered(row: SoftwareDeviceRow) {
  return row.standard_installed + row.standard_not_needed;
}

const COLUMN_SECTIONS: ColumnSection[] = [
  {
    title: "COMPUTER",
    columns: [
      { key: "assetId", header: "Asset ID", required: true, width: 14, value: (r) => r.asset_code },
      { key: "computer", header: "Computer", required: true, width: 28, value: (r) => r.computer_name },
      { key: "user", header: "User", width: 24, value: (r) => r.assigned_to?.trim() || "" },
      { key: "department", header: "Department", width: 22, value: (r) => r.department?.trim() || "" },
    ],
  },
  {
    title: "CHECKLIST",
    columns: [
      {
        key: "standard",
        header: "Standard",
        width: 12,
        value: (r) => `${covered(r)}/${r.standard_total}`,
      },
      { key: "installed", header: "Installed", width: 12, value: (r) => String(r.standard_installed) },
      { key: "notNeeded", header: "Not needed", width: 14, value: (r) => String(r.standard_not_needed) },
      { key: "missing", header: "Missing", width: 12, value: (r) => String(r.standard_missing) },
      {
        key: "missingSoftware",
        header: "Missing software",
        width: 36,
        value: (r) => r.missing_software.join(", "),
      },
      { key: "additional", header: "Additional", width: 12, value: (r) => String(r.additional_count) },
      { key: "compliance", header: "Compliance", width: 14, value: (r) => labelEnum(r.compliance) },
    ],
  },
];

export const SOFTWARE_EXPORT_COLUMN_SECTIONS: SoftwareExportColumnSection[] = COLUMN_SECTIONS.map((section) => ({
  title: section.title,
  columns: section.columns.map(({ key, header, required }) => ({ key, header, required })),
}));

export const ALL_SOFTWARE_EXPORT_COLUMN_KEYS: SoftwareExportColumnKey[] = COLUMN_SECTIONS.flatMap((section) =>
  section.columns.map((column) => column.key),
);

function resolveExportSections(selectedColumnKeys?: SoftwareExportColumnKey[]): ColumnSection[] {
  const selected = new Set(selectedColumnKeys ?? ALL_SOFTWARE_EXPORT_COLUMN_KEYS);
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

export function exportSoftwarePdf(
  rows: SoftwareDeviceRow[],
  filterSummary?: string,
  selectedColumnKeys?: SoftwareExportColumnKey[],
) {
  const sections = resolveExportSections(selectedColumnKeys);
  const columns = sections.flatMap((section) => section.columns);
  openLandscapeTablePdf({
    documentTitle: "Software Compliance Export",
    title: "SOFTWARE COMPLIANCE",
    filterSummary,
    rowCount: rows.length,
    sections: sections.map((section) => ({
      title: section.title,
      headers: section.columns.map((column) => column.header),
    })),
    bodyRows: rows.map((row) => columns.map((column) => column.value(row))),
    note: "Standard is the required set only. Additional software, such as AutoCAD, is counted separately. Tip: In the print dialog, set Layout to Landscape and turn off Headers and footers for a clean PDF.",
  });
}

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

export async function exportSoftwareExcel(
  rows: SoftwareDeviceRow[],
  filterSummary?: string,
  selectedColumnKeys?: SoftwareExportColumnKey[],
) {
  const sections = resolveExportSections(selectedColumnKeys);
  const columns = sections.flatMap((section) => section.columns);
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ITAM Admin";
  workbook.created = new Date();
  const ws = workbook.addWorksheet("Software Compliance", {
    views: [{ state: "frozen", ySplit: 4, xSplit: 1 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  const colCount = Math.max(columns.length, 1);
  columns.forEach((column, index) => {
    ws.getColumn(index + 1).width = column.width;
  });

  const thinBorder = {
    top: { style: "thin" as const, color: { argb: COLOR.border } },
    left: { style: "thin" as const, color: { argb: COLOR.border } },
    bottom: { style: "thin" as const, color: { argb: COLOR.border } },
    right: { style: "thin" as const, color: { argb: COLOR.border } },
  };

  ws.mergeCells(1, 1, 1, colCount);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = "SOFTWARE COMPLIANCE";
  titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: COLOR.white } };
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.brand } };
  ws.getRow(1).height = 30;

  ws.mergeCells(2, 1, 2, colCount);
  const subCell = ws.getCell(2, 1);
  subCell.value = filterSummary
    ? `Exported ${rows.length} record(s)  |  Filters: ${filterSummary}  |  Generated ${new Date().toLocaleString()}`
    : `Exported ${rows.length} record(s)  |  Generated ${new Date().toLocaleString()}`;
  subCell.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: COLOR.subtitle } };
  subCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(2).height = 18;

  let start = 1;
  sections.forEach((section, index) => {
    const end = start + section.columns.length - 1;
    ws.mergeCells(3, start, 3, end);
    const cell = ws.getCell(3, start);
    cell.value = section.title;
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: COLOR.white } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: index % 2 === 0 ? COLOR.sectionA : COLOR.sectionB },
    };
    for (let column = start; column <= end; column += 1) {
      ws.getCell(3, column).border = thinBorder;
    }
    start = end + 1;
  });
  ws.getRow(3).height = 20;

  const headerRow = ws.getRow(4);
  columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column.required ? `${column.header} *` : column.header;
    cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: COLOR.white } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: column.required ? COLOR.requiredHeader : COLOR.optionalHeader },
    };
    cell.border = thinBorder;
  });
  headerRow.height = 30;

  rows.forEach((row, rowIndex) => {
    const excelRow = ws.getRow(5 + rowIndex);
    columns.forEach((column, index) => {
      const cell = excelRow.getCell(index + 1);
      cell.value = column.value(row);
      cell.font = { name: "Segoe UI", size: 9, color: { argb: "FF1E293B" } };
      cell.alignment = { vertical: "top", wrapText: false };
      cell.border = thinBorder;
      if (rowIndex % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.altRow } };
      }
    });
  });

  if (columns.length > 0) {
    ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: columns.length } };
  }

  const noteRow = 5 + rows.length + 1;
  ws.mergeCells(noteRow, 1, noteRow, colCount);
  const noteCell = ws.getCell(noteRow, 1);
  noteCell.value =
    "Blue headers ( * ) = required fields  |  Standard is the required set only. Additional software is counted separately.";
  noteCell.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: COLOR.subtitle } };
  noteCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `software-compliance-${timestamp()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
