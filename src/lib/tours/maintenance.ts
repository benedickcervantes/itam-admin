import type { TourStep } from "@/components/SpotlightTour";

export const MAINTENANCE_TOUR_STORAGE_KEY = "tour-seen:maintenance";

/**
 * Spotlight tour for Asset Service / Repair Log.
 * Different from Assets (inventory), Audit (assessment), and Device History (transfers):
 * this page logs hands-on repair / preventive service done on a machine —
 * not a helpdesk ticket queue for day-to-day user requests.
 */
export function getMaintenanceTourSteps(canCreate: boolean): TourStep[] {
  const steps: TourStep[] = [
    {
      title: "Welcome to Service / Repair Log",
      content:
        "This page records hands-on work done on assets — repairs, parts swaps, preventive service. It is not a helpdesk ticket queue; day-to-day user concerns stay in your ticketing system.",
    },
    {
      target: '[data-tour="service-search"]',
      title: "Search service logs",
      content:
        "Search by record ID, computer name, employee, issue text, or who performed the work.",
      placement: "bottom",
    },
    {
      target: '[data-tour="service-filters"]',
      title: "Filter by status",
      content:
        "Narrow by Open, In Progress, Completed, or Cancelled so you can work the active repair queue or review closed jobs.",
      placement: "bottom",
    },
    {
      target: '[data-tour="service-view-mode"]',
      title: "Table or grid view",
      content:
        "Table is best for scanning many logs. Grid shows issue text on cards. Your choice is remembered.",
      placement: "bottom",
    },
    {
      target: '[data-tour="service-export"]',
      title: "Export service reports",
      content:
        "Download the filtered list as Excel or PDF. Customize columns for vendor reports or monthly repair summaries.",
      placement: "bottom",
    },
  ];

  if (canCreate) {
    steps.push(
      {
        target: '[data-tour="service-new"]',
        title: "Log new service work",
        content:
          "Click New Service Log when you start or finish hands-on work on a machine. Next we’ll walk through the form.",
        placement: "bottom",
      },
      {
        id: "service-form",
        target: '[data-tour="service-form-drawer"]',
        allowMissingTarget: true,
        title: "Service log form",
        content:
          "Capture which asset was serviced, what was wrong, what you did, and the status. Keep it factual — what happened to the machine.",
        placement: "dock-left",
      },
      {
        id: "service-form-device",
        target: '[data-tour="service-form-device"]',
        allowMissingTarget: true,
        title: "Pick the asset",
        content:
          "Search inventory by asset code, computer name, user, or department. Confirm the employee if needed — the form can pull the assignee from Assets.",
        placement: "dock-left",
      },
      {
        id: "service-form-issue",
        target: '[data-tour="service-form-issue"]',
        allowMissingTarget: true,
        title: "Issue & action taken",
        content:
          "Describe the problem and what was done (parts replaced, cleaning, OS fix, etc.). This becomes the repair history for that device.",
        placement: "dock-left",
      },
      {
        id: "service-form-status",
        target: '[data-tour="service-form-status"]',
        allowMissingTarget: true,
        title: "Status & dates",
        content:
          "Set Open / In Progress / Completed / Cancelled, who performed the work, and open/closed dates. Completing a job can set the closed date automatically.",
        placement: "dock-left",
      },
      {
        id: "service-form-save",
        target: '[data-tour="service-form-save"]',
        allowMissingTarget: true,
        title: "Save the log",
        content:
          "Click Create Log (or Save Changes when editing). A record code is assigned so you can find this service entry later.",
        placement: "dock-left",
      },
    );
  }

  steps.push(
    {
      target: '[data-tour="service-list"]',
      title: "Browse service logs",
      content:
        "Each row is one service/repair entry: record ID, computer, employee, department, issue, status, and date opened. Click a row for the full summary.",
      placement: "auto",
    },
    {
      target: '[data-tour="service-actions"]',
      title: "Row actions",
      content: canCreate
        ? "View opens the summary. Edit updates the log as work progresses. Delete requires your password."
        : "Use View to open the full service summary. Create, edit, and delete are disabled for view-only accounts.",
      placement: "auto",
    },
    {
      title: "You're ready",
      content:
        "Remember: Service Log = repairs done on hardware. Assets = inventory. Audit = assessments. Device History = transfers. Re-open this tour anytime with How it works.",
    },
  );

  return steps;
}
