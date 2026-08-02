import { labelEntityType } from "./activity-log-ui";
import { openLandscapeTablePdf } from "./export-pdf";
import { labelEnum } from "./labels";
import type { ActivityLog } from "./types";

export type ActivityLogExportColumnKey =
  | "time"
  | "actorName"
  | "actorEmail"
  | "action"
  | "entityType"
  | "entityLabel"
  | "entityId"
  | "summary"
  | "ipAddress"
  | "changes";

type Column = {
  key: ActivityLogExportColumnKey;
  header: string;
  width: number;
  value: (row: ActivityLog) => string;
};

export type ActivityLogExportColumnSection = {
  title: string;
  columns: Array<{ key: ActivityLogExportColumnKey; header: string }>;
};

type ColumnSection = {
  title: string;
  columns: Column[];
};

function formatDateTime(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value || "—";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatChanges(row: ActivityLog): string {
  const changes = Array.isArray(row.changes) ? row.changes : [];
  if (!changes.length) return "";
  return changes
    .map((c) => `${c.field}: ${formatChangeValue(c.before)} → ${formatChangeValue(c.after)}`)
    .join("; ");
}

const COLUMN_SECTIONS: ColumnSection[] = [
  {
    title: "EVENT",
    columns: [
      { key: "time", header: "Time", width: 20, value: (r) => formatDateTime(r.created_at) },
      { key: "action", header: "Action", width: 18, value: (r) => labelEnum(r.action) },
      { key: "summary", header: "Summary", width: 40, value: (r) => r.summary },
      { key: "ipAddress", header: "IP Address", width: 16, value: (r) => r.ip_address ?? "" },
    ],
  },
  {
    title: "ACTOR",
    columns: [
      { key: "actorName", header: "Actor Name", width: 20, value: (r) => r.actor_name ?? "" },
      { key: "actorEmail", header: "Actor Email", width: 24, value: (r) => r.actor_email ?? "" },
    ],
  },
  {
    title: "ENTITY",
    columns: [
      {
        key: "entityType",
        header: "Entity Type",
        width: 18,
        value: (r) => labelEntityType(r.entity_type),
      },
      { key: "entityLabel", header: "Entity Label", width: 24, value: (r) => r.entity_label ?? "" },
      { key: "entityId", header: "Entity ID", width: 28, value: (r) => r.entity_id ?? "" },
      { key: "changes", header: "Field Changes", width: 48, value: formatChanges },
    ],
  },
];

export const ACTIVITY_LOG_EXPORT_COLUMN_SECTIONS: ActivityLogExportColumnSection[] = COLUMN_SECTIONS.map(
  (section) => ({
    title: section.title,
    columns: section.columns.map(({ key, header }) => ({ key, header })),
  }),
);

export const ALL_ACTIVITY_LOG_EXPORT_COLUMN_KEYS: ActivityLogExportColumnKey[] = COLUMN_SECTIONS.flatMap(
  (section) => section.columns.map((column) => column.key),
);

function resolveExportSections(selectedColumnKeys?: ActivityLogExportColumnKey[]): ColumnSection[] {
  const selected = new Set(selectedColumnKeys ?? ALL_ACTIVITY_LOG_EXPORT_COLUMN_KEYS);
  return COLUMN_SECTIONS.map((section) => ({
    ...section,
    columns: section.columns.filter((column) => selected.has(column.key)),
  })).filter((section) => section.columns.length > 0);
}

export function exportActivityLogsPdf(
  rows: ActivityLog[],
  filterSummary?: string,
  selectedColumnKeys?: ActivityLogExportColumnKey[],
) {
  const sections = resolveExportSections(selectedColumnKeys);
  const columns = sections.flatMap((section) => section.columns);
  openLandscapeTablePdf({
    documentTitle: "Activity Logs Export",
    title: "ACTIVITY LOGS",
    filterSummary,
    rowCount: rows.length,
    sections: sections.map((s) => ({ title: s.title, headers: s.columns.map((c) => c.header) })),
    bodyRows: rows.map((row) => columns.map((c) => c.value(row))),
  });
}

export async function exportActivityLogsExcel(
  rows: ActivityLog[],
  filterSummary?: string,
  selectedColumnKeys?: ActivityLogExportColumnKey[],
) {
  const sections = resolveExportSections(selectedColumnKeys);
  const columns = sections.flatMap((section) => section.columns);
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ITAM Admin";
  workbook.created = new Date();
  const ws = workbook.addWorksheet("Activity Logs", {
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
  a.download = `activity-logs-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
