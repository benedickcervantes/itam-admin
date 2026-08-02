import { openLandscapeTablePdf } from "./export-pdf";
import { labelEnum } from "./labels";
import type { Supplier } from "./types";

export type SupplierExportColumnKey =
  | "supplierCode"
  | "name"
  | "status"
  | "contactPerson"
  | "email"
  | "phone"
  | "address"
  | "website"
  | "categories"
  | "notes";

type Column = {
  key: SupplierExportColumnKey;
  header: string;
  width: number;
  value: (row: Supplier) => string;
};

export type SupplierExportColumnSection = {
  title: string;
  columns: Array<{ key: SupplierExportColumnKey; header: string }>;
};

type ColumnSection = {
  title: string;
  columns: Column[];
};

const COLUMN_SECTIONS: ColumnSection[] = [
  {
    title: "SUPPLIER",
    columns: [
      { key: "supplierCode", header: "Supplier Code", width: 14, value: (r) => r.supplier_code },
      { key: "name", header: "Supplier Name", width: 28, value: (r) => r.name },
      { key: "status", header: "Status", width: 12, value: (r) => labelEnum(r.status ?? "") },
      {
        key: "categories",
        header: "Categories",
        width: 32,
        value: (r) => (r.categories ?? []).map((c) => labelEnum(c)).join(", "),
      },
    ],
  },
  {
    title: "CONTACT",
    columns: [
      { key: "contactPerson", header: "Contact Person", width: 20, value: (r) => r.contact_person ?? "" },
      { key: "email", header: "Email", width: 24, value: (r) => r.email ?? "" },
      { key: "phone", header: "Phone", width: 16, value: (r) => r.phone ?? "" },
      { key: "address", header: "Address", width: 32, value: (r) => r.address ?? "" },
      { key: "website", header: "Website", width: 24, value: (r) => r.website ?? "" },
    ],
  },
  {
    title: "NOTES",
    columns: [{ key: "notes", header: "Notes", width: 28, value: (r) => r.notes ?? "" }],
  },
];

export const SUPPLIER_EXPORT_COLUMN_SECTIONS: SupplierExportColumnSection[] = COLUMN_SECTIONS.map((section) => ({
  title: section.title,
  columns: section.columns.map(({ key, header }) => ({ key, header })),
}));

export const ALL_SUPPLIER_EXPORT_COLUMN_KEYS: SupplierExportColumnKey[] = COLUMN_SECTIONS.flatMap((section) =>
  section.columns.map((column) => column.key),
);

function resolveExportSections(selectedColumnKeys?: SupplierExportColumnKey[]): ColumnSection[] {
  const selected = new Set(selectedColumnKeys ?? ALL_SUPPLIER_EXPORT_COLUMN_KEYS);
  return COLUMN_SECTIONS.map((section) => ({
    ...section,
    columns: section.columns.filter((column) => selected.has(column.key)),
  })).filter((section) => section.columns.length > 0);
}

export function exportSuppliersPdf(
  rows: Supplier[],
  filterSummary?: string,
  selectedColumnKeys?: SupplierExportColumnKey[],
) {
  const sections = resolveExportSections(selectedColumnKeys);
  const columns = sections.flatMap((section) => section.columns);
  openLandscapeTablePdf({
    documentTitle: "Suppliers Export",
    title: "PROCUREMENT SUPPLIERS",
    filterSummary,
    rowCount: rows.length,
    sections: sections.map((s) => ({ title: s.title, headers: s.columns.map((c) => c.header) })),
    bodyRows: rows.map((row) => columns.map((c) => c.value(row))),
  });
}

export async function exportSuppliersExcel(
  rows: Supplier[],
  filterSummary?: string,
  selectedColumnKeys?: SupplierExportColumnKey[],
) {
  const sections = resolveExportSections(selectedColumnKeys);
  const columns = sections.flatMap((section) => section.columns);
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ITAM Admin";
  workbook.created = new Date();
  const ws = workbook.addWorksheet("Suppliers", {
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
  a.download = `suppliers-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
