import { openLandscapeTablePdf } from "./export-pdf";
import { labelEnum } from "./labels";
import type { DisposalRecord } from "./types";

export type DisposalExportColumnKey =
  | "recordId"
  | "assetId"
  | "computer"
  | "department"
  | "disposalDate"
  | "reason"
  | "method"
  | "certificateDocNo"
  | "approvedBy"
  | "witness"
  | "notes";

type Column = {
  key: DisposalExportColumnKey;
  header: string;
  width: number;
  value: (row: DisposalRecord) => string;
};

export type DisposalExportColumnSection = {
  title: string;
  columns: Array<{ key: DisposalExportColumnKey; header: string }>;
};

type ColumnSection = {
  title: string;
  columns: Column[];
};

const COLUMN_SECTIONS: ColumnSection[] = [
  {
    title: "ASSET",
    columns: [
      { key: "recordId", header: "Record ID", width: 14, value: (r) => r.record_code },
      { key: "assetId", header: "Asset ID", width: 14, value: (r) => r.asset?.asset_code ?? "" },
      { key: "computer", header: "Computer", width: 22, value: (r) => r.asset?.computer_name ?? r.computer_name ?? "" },
      { key: "department", header: "Department", width: 18, value: (r) => r.asset?.department?.name ?? "" },
    ],
  },
  {
    title: "DISPOSAL",
    columns: [
      { key: "disposalDate", header: "Disposal Date", width: 14, value: (r) => r.disposal_date.slice(0, 10) },
      { key: "reason", header: "Reason", width: 32, value: (r) => r.disposal_reason },
      { key: "method", header: "Method", width: 14, value: (r) => labelEnum(r.disposal_method ?? "") },
      { key: "certificateDocNo", header: "Certificate / Doc No.", width: 18, value: (r) => r.certificate_doc_no ?? "" },
      { key: "approvedBy", header: "Approved By", width: 18, value: (r) => r.approved_by ?? "" },
      { key: "witness", header: "Witness", width: 18, value: (r) => r.witness ?? "" },
    ],
  },
  {
    title: "NOTES",
    columns: [{ key: "notes", header: "Notes", width: 28, value: (r) => r.notes ?? "" }],
  },
];

export const DISPOSAL_EXPORT_COLUMN_SECTIONS: DisposalExportColumnSection[] = COLUMN_SECTIONS.map((section) => ({
  title: section.title,
  columns: section.columns.map(({ key, header }) => ({ key, header })),
}));

export const ALL_DISPOSAL_EXPORT_COLUMN_KEYS: DisposalExportColumnKey[] = COLUMN_SECTIONS.flatMap((section) =>
  section.columns.map((column) => column.key),
);

function resolveExportSections(selectedColumnKeys?: DisposalExportColumnKey[]): ColumnSection[] {
  const selected = new Set(selectedColumnKeys ?? ALL_DISPOSAL_EXPORT_COLUMN_KEYS);
  return COLUMN_SECTIONS.map((section) => ({
    ...section,
    columns: section.columns.filter((column) => selected.has(column.key)),
  })).filter((section) => section.columns.length > 0);
}

export function exportDisposalsPdf(
  rows: DisposalRecord[],
  filterSummary?: string,
  selectedColumnKeys?: DisposalExportColumnKey[],
) {
  const sections = resolveExportSections(selectedColumnKeys);
  const columns = sections.flatMap((section) => section.columns);
  openLandscapeTablePdf({
    documentTitle: "Disposals Export",
    title: "DISPOSAL LOG",
    filterSummary,
    rowCount: rows.length,
    sections: sections.map((s) => ({ title: s.title, headers: s.columns.map((c) => c.header) })),
    bodyRows: rows.map((row) => columns.map((c) => c.value(row))),
  });
}

export async function exportDisposalsExcel(
  rows: DisposalRecord[],
  filterSummary?: string,
  selectedColumnKeys?: DisposalExportColumnKey[],
) {
  const sections = resolveExportSections(selectedColumnKeys);
  const columns = sections.flatMap((section) => section.columns);
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ITAM Admin";
  workbook.created = new Date();
  const ws = workbook.addWorksheet("Disposal Log", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  columns.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.width;
  });

  ws.addRow(columns.map((c) => c.header));
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E7D9A" } };

  rows.forEach((row) => ws.addRow(columns.map((c) => c.value(row))));

  if (filterSummary) {
    const info = workbook.addWorksheet("Info");
    info.addRow(["Filter summary", filterSummary]);
    info.addRow(["Exported rows", rows.length]);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `disposals-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
