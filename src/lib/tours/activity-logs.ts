import type { TourStep } from "@/components/SpotlightTour";

export const ACTIVITY_LOGS_TOUR_STORAGE_KEY = "tour-seen:activity-logs";

/**
 * Spotlight tour for Activity Logs.
 * Read-only audit trail: who did what, when, and before/after field changes.
 * Not a place to create records — actions elsewhere (Assets, Users, etc.) write here.
 */
export function getActivityLogsTourSteps(): TourStep[] {
  return [
    {
      title: "Welcome to Activity Logs",
      content:
        "This is the audit trail for ITAM. Every create, update, delete, and login attempt is recorded here with who did it and what changed. You browse and export — you don’t create logs on this page.",
    },
    {
      target: '[data-tour="logs-search"]',
      title: "Search the trail",
      content:
        "Search by actor name/email, summary text, or entity label (e.g. an asset code or user name).",
      placement: "bottom",
    },
    {
      target: '[data-tour="logs-filters"]',
      title: "Filter by action, entity & actor",
      content:
        "Narrow by action (Create, Update, Delete, Login…), entity type (Asset, User, Disposal…), or the admin who performed it.",
      placement: "bottom",
    },
    {
      target: '[data-tour="logs-dates"]',
      title: "Date range & presets",
      content:
        "Limit by From / To dates, or jump with Today, 7d, and 30d. From must be on or before To.",
      placement: "bottom",
    },
    {
      target: '[data-tour="logs-page-size"]',
      title: "Rows per page",
      content: "Show 20, 50, or 100 events per page when reviewing busy periods.",
      placement: "bottom",
    },
    {
      target: '[data-tour="logs-refresh"]',
      title: "Refresh",
      content: "Reload the latest events from the server after more actions happen elsewhere.",
      placement: "bottom",
    },
    {
      target: '[data-tour="logs-export"]',
      title: "Export for audits",
      content:
        "Download the filtered trail as Excel or PDF for compliance reviews. Customize which columns to include.",
      placement: "bottom",
    },
    {
      target: '[data-tour="logs-list"]',
      title: "Browse events",
      content:
        "Each row shows time, actor, action, entity, and a short summary. Click a row to expand field-level before/after changes.",
      placement: "auto",
    },
    {
      id: "logs-detail",
      target: '[data-tour="logs-detail"]',
      allowMissingTarget: true,
      title: "Before / after details",
      content:
        "Expanded rows show IP, entity ID (copyable), field changes, and a link to open the related record when available. Click the row again to collapse.",
      placement: "auto",
    },
    {
      title: "You're ready",
      content:
        "Use Activity Logs to investigate who changed what. Create and edit still happen on each module’s own page. Re-open this tour anytime with How it works.",
    },
  ];
}
