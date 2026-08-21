import type { TourStep } from "@/components/SpotlightTour";

export const ASSETS_TOUR_STORAGE_KEY = "tour-seen:assets";

/** Spotlight tour for the Assets inventory page. */
export function getAssetsTourSteps(canCreate: boolean): TourStep[] {
  const steps: TourStep[] = [
    {
      title: "Welcome to Assets",
      content:
        "This page is your long-term hardware inventory — laptops, desktops, peripherals, and infrastructure gear. Each record is linked to audits so you can see who has what.",
    },
    {
      target: '[data-tour="assets-search"]',
      title: "Search the inventory",
      content:
        "Type an asset code, assignee name, brand, or serial number. Results update as you type — use this when you need one device quickly.",
      placement: "bottom",
    },
    {
      target: '[data-tour="assets-filters"]',
      title: "Narrow with filters",
      content:
        "Filter by department, asset status (Available, In Use…), employee status, or item type. Active filters appear as chips below so you can clear them one by one.",
      placement: "bottom",
    },
    {
      target: '[data-tour="assets-view-mode"]',
      title: "Table or grid view",
      content:
        "Switch between a dense table (best for scanning many rows) and a card grid (easier on smaller screens). Your choice is remembered next time.",
      placement: "bottom",
    },
    {
      target: '[data-tour="assets-export"]',
      title: "Export reports",
      content:
        "Download the current filtered list as Excel or PDF. You can also customize which columns to include before exporting.",
      placement: "bottom",
    },
  ];

  if (canCreate) {
    steps.push(
      {
        target: '[data-tour="assets-new"]',
        title: "Add a new asset",
        content:
          "Click New Asset to open the registration form. Next we’ll walk through the form itself — category, sections, and how to save.",
        placement: "bottom",
      },
      {
        id: "assets-form",
        target: '[data-tour="assets-form-drawer"]',
        allowMissingTarget: true,
        title: "New Asset form",
        content:
          "This side panel is where you register hardware. Fill in the sections from top to bottom. Required fields are marked with a red asterisk. You can cancel anytime without saving.",
        placement: "dock-left",
      },
      {
        id: "assets-form-category",
        target: '[data-tour="assets-form-category"]',
        allowMissingTarget: true,
        title: "Choose the asset category",
        content:
          "End User Device = laptop/PC assigned to a person. Infrastructure = servers, firewalls, APs. Spare / Shared Peripheral = printers, keyboards, and stock with no assignee.",
        placement: "dock-left",
      },
      {
        id: "assets-form-toolbar",
        target: '[data-tour="assets-form-toolbar"]',
        allowMissingTarget: true,
        title: "Jump between sections",
        content:
          "Use these tabs to jump to Employee, Device, or Peripherals without scrolling the whole form. Handy when the form gets long.",
        placement: "dock-left",
      },
      {
        id: "assets-form-employee",
        target: '[data-tour="assets-form-employee"]',
        allowMissingTarget: true,
        title: "Assignee & ownership",
        content:
          "Set who uses the device and which department owns it. Leave Assigned To blank for spare/available stock — status can sync to Available automatically.",
        placement: "dock-left",
      },
      {
        id: "assets-form-device",
        target: '[data-tour="assets-form-device"]',
        allowMissingTarget: true,
        title: "Device details",
        content:
          "Enter type, brand/model, serial, specs (RAM, storage, OS), and condition. These fields power inventory reports and audit links later.",
        placement: "dock-left",
      },
      {
        id: "assets-form-save",
        target: '[data-tour="assets-form-save"]',
        allowMissingTarget: true,
        title: "Save the asset",
        content:
          "When everything looks right, click Save Asset. The system assigns an asset code automatically. Cancel discards the draft without creating a record.",
        placement: "dock-left",
      },
    );
  }

  steps.push(
    {
      target: '[data-tour="assets-list"]',
      title: "Browse the list",
      content:
        "Each row is one asset: code, type, brand/model, assignee, department, status, and condition. Click a row to open the full detail panel.",
      placement: "auto",
    },
    {
      target: '[data-tour="assets-actions"]',
      title: "Row actions",
      content: canCreate
        ? "Use View to inspect, Edit to update details, or Delete (password required) to remove a record. On peripherals, open View then use Move in the drawer to reassign. Viewers only see View."
        : "Use View to open the full asset detail panel. Create, edit, and delete are disabled for view-only accounts.",
      placement: "auto",
    },
    {
      title: "You're ready",
      content:
        "Tip: Assets are inventory records — not repair tickets (use Maintenance) and not employee audits (use Audit Register). Re-open this tour anytime with How it works.",
    },
  );

  return steps;
}
