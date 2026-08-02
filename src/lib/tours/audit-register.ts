import type { TourStep } from "@/components/SpotlightTour";

export const AUDIT_TOUR_STORAGE_KEY = "tour-seen:audit-register";

/**
 * Spotlight tour for IT Audit Register.
 * Different from Assets: this is a point-in-time employee device assessment
 * (status, overall assessment, priority, items needed) — not ownership inventory.
 * Saving an audit can also create/update linked records on the Assets page.
 */
export function getAuditTourSteps(canCreate: boolean): TourStep[] {
  const steps: TourStep[] = [
    {
      title: "Welcome to IT Audit Register",
      content:
        "This page records employee device audits — who was checked, what hardware they have, the overall assessment, priority, and what items are needed. It is not the same as Assets (long-term inventory).",
    },
    {
      target: '[data-tour="audit-search"]',
      title: "Search audits",
      content:
        "Search by audit code, employee name, computer name, brand, or job title. Use this to find one person’s audit quickly.",
      placement: "bottom",
    },
    {
      target: '[data-tour="audit-filters"]',
      title: "Filter by need & urgency",
      content:
        "Narrow by Items needed (e.g. RAM, SSD), Audit Status (Open, In Progress…), and Priority. These filters help you work the upgrade/replacement queue — not by department or asset stock status.",
      placement: "bottom",
    },
    {
      target: '[data-tour="audit-view-mode"]',
      title: "Table or grid view",
      content:
        "Table is best for scanning many audits. Grid shows cards with assessment and notes. Your choice is remembered.",
      placement: "bottom",
    },
    {
      target: '[data-tour="audit-export"]',
      title: "Export audit reports",
      content:
        "Export the current filtered list as Excel or PDF. Customize columns when you need a specific report for management or procurement.",
      placement: "bottom",
    },
  ];

  if (canCreate) {
    steps.push(
      {
        target: '[data-tour="audit-new"]',
        title: "Start a new audit",
        content:
          "Click New Audit to capture a device assessment for an employee. Next we’ll walk through the audit form — employee, device, and the Audit section.",
        placement: "bottom",
      },
      {
        id: "audit-form",
        target: '[data-tour="audit-form-drawer"]',
        allowMissingTarget: true,
        title: "New Audit form",
        content:
          "This panel captures a point-in-time audit. Fill Employee → Device → Peripherals → Audit. Required fields have a red asterisk. Cancel discards without saving.",
        placement: "dock-left",
      },
      {
        id: "audit-form-toolbar",
        target: '[data-tour="audit-form-toolbar"]',
        allowMissingTarget: true,
        title: "Jump between sections",
        content:
          "Use these tabs to jump to Employee, Device, Peripherals, or Audit without scrolling the whole form.",
        placement: "dock-left",
      },
      {
        id: "audit-form-employee",
        target: '[data-tour="audit-form-employee"]',
        allowMissingTarget: true,
        title: "Employee details",
        content:
          "Employee Name is required. Set department, job title, and employee status. This ties the audit to a person — unlike Assets, where assignee can be left blank for spare stock.",
        placement: "dock-left",
      },
      {
        id: "audit-form-device",
        target: '[data-tour="audit-form-device"]',
        allowMissingTarget: true,
        title: "Device under audit",
        content:
          "Record the computer name, type, brand/model, specs, and condition as found during the audit. Saving may also sync a linked record on the Assets dashboard.",
        placement: "dock-left",
      },
      {
        id: "audit-form-assessment",
        target: '[data-tour="audit-form-assessment"]',
        allowMissingTarget: true,
        title: "Assessment & priority",
        content:
          "Set Audit Status, Overall Assessment (OK / Needs Upgrade / Needs Replacement), Priority, findings, and recommended actions. If upgrade/replacement is needed, tick the items needed checklist — that drives the list filters.",
        placement: "dock-left",
      },
      {
        id: "audit-form-save",
        target: '[data-tour="audit-form-save"]',
        allowMissingTarget: true,
        title: "Save the audit",
        content:
          "Click Save Record when done. An audit code is assigned automatically. If hardware is saved, you may also see linked asset codes appear on the Assets page.",
        placement: "dock-left",
      },
    );
  }

  steps.push(
    {
      target: '[data-tour="audit-list"]',
      title: "Browse audit records",
      content:
        "Each row is one audit: code, employee, computer, status, assessment, items needed, and priority. Click a row to open the full summary.",
      placement: "auto",
    },
    {
      target: '[data-tour="audit-actions"]',
      title: "Row actions",
      content: canCreate
        ? "View opens the summary. Edit updates the audit. Delete requires your password. Viewers only get View."
        : "Use View to open the full audit summary. Create, edit, and delete are disabled for view-only accounts.",
      placement: "auto",
    },
    {
      title: "You're ready",
      content:
        "Remember: Audit Register = assessment & follow-up queue. Assets = who owns what long-term. Maintenance = repairs. Re-open this tour anytime with How it works.",
    },
  );

  return steps;
}
