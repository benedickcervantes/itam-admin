import { labelEnum } from "./labels";
import type { ActivityLog } from "./types";
import { labelEntityType } from "./activity-log-ui";

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

function resolveExportColumns(selectedColumnKeys?: ActivityLogExportColumnKey[]): Column[] {
  const selected = new Set(selectedColumnKeys ?? ALL_ACTIVITY_LOG_EXPORT_COLUMN_KEYS);
  return COLUMN_SECTIONS.flatMap((section) => section.columns.filter((column) => selected.has(column.key)));
}

function rowsToMatrix(rows: ActivityLog[], columns: Column[]) {
  return rows.map((row) => columns.map((col) => col.value(row)));
}

export function exportActivityLogsPdf(
  rows: ActivityLog[],
  filterSummary?: string,
  selectedColumnKeys?: ActivityLogExportColumnKey[],
) {
  const columns = resolveExportColumns(selectedColumnKeys);
  const headers = columns.map((c) => c.header);
  const body = rowsToMatrix(rows, columns);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Activity Logs Export</title>
<style>
body{font-family:Segoe UI,Arial,sans-serif;margin:24px;color:#111}
h1{font-size:18px;margin:0 0 4px}
.meta{font-size:12px;color:#555;margin-bottom:16px}
table{border-collapse:collapse;width:100%;font-size:10px}
th,td{border:1px solid #ccc;padding:5px 6px;text-align:left;vertical-align:top}
th{background:#1e3a5f;color:#fff}
tr:nth-child(even) td{background:#f8fafc}
</style></head><body>
<h1>Activity Logs Export</h1>
<div class="meta">${filterSummary ? `Filters: ${filterSummary}` : "All records"} · ${rows.length} row(s)</div>
<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${String(c).replace(/</g, "&lt;")}</td>`).join("")}</tr>`).join("")}</tbody>
</table></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

export async function exportActivityLogsExcel(
  rows: ActivityLog[],
  filterSummary?: string,
  selectedColumnKeys?: ActivityLogExportColumnKey[],
) {
  const columns = resolveExportColumns(selectedColumnKeys);
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ITAM Admin";
  workbook.created = new Date();
  const ws = workbook.addWorksheet("Activity Logs");

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
