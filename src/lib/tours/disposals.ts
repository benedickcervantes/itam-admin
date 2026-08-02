import type { TourStep } from "@/components/SpotlightTour";

export const DISPOSALS_TOUR_STORAGE_KEY = "tour-seen:disposals";

/**
 * Spotlight tour for Disposals.
 * Different from Assets (active inventory), Service Log (repairs), Device History (transfers):
 * this page records when hardware is retired/disposed, with method, reason, and
 * certificate / approval tracking for compliance.
 */
export function getDisposalsTourSteps(canCreate: boolean): TourStep[] {
  const steps: TourStep[] = [
    {
      title: "Welcome to Disposals",
      content:
        "This page tracks retired and disposed assets — when a device leaves inventory for good. Record the reason, disposal method, and certificate details for audit compliance. It is not a repair log or transfer tool.",
    },
    {
      target: '[data-tour="disp-search"]',
      title: "Search disposal records",
      content:
        "Search by record ID, asset code, computer name, brand, serial, or disposal reason.",
      placement: "bottom",
    },
    {
      target: '[data-tour="disp-filters"]',
      title: "Filter by disposal method",
      content:
        "Narrow by how assets were disposed (e.g. recycle, destroy, donate, sell). Useful for compliance and vendor reports.",
      placement: "bottom",
    },
    {
      target: '[data-tour="disp-view-mode"]',
      title: "Table or grid view",
      content:
        "Table is best for scanning many retirements. Grid shows reason and certificate on cards. Your choice is remembered.",
      placement: "bottom",
    },
    {
      target: '[data-tour="disp-export"]',
      title: "Export disposal reports",
      content:
        "Download the filtered list as Excel or PDF for auditors, finance, or environmental reporting. Customize columns as needed.",
      placement: "bottom",
    },
  ];

  if (canCreate) {
    steps.push(
      {
        target: '[data-tour="disp-new"]',
        title: "Record a new disposal",
        content:
          "Click New Disposal when an asset is retired from inventory. Next we’ll walk through the form — asset, details, and documentation.",
        placement: "bottom",
      },
      {
        id: "disp-form",
        target: '[data-tour="disp-form-drawer"]',
        allowMissingTarget: true,
        title: "Disposal form",
        content:
          "Link the asset, set the date and reason, choose a method, then add certificate and approval names. A record code is assigned on save.",
        placement: "dock-left",
      },
      {
        id: "disp-form-asset",
        target: '[data-tour="disp-form-asset"]',
        allowMissingTarget: true,
        title: "Select the asset",
        content:
          "Pick the inventory item being retired. After creation, the asset cannot be changed on this record — choose carefully.",
        placement: "dock-left",
      },
      {
        id: "disp-form-details",
        target: '[data-tour="disp-form-details"]',
        allowMissingTarget: true,
        title: "Date, reason & method",
        content:
          "Set when it was disposed, why (be specific for audits), and the method — recycle, destroy, donate, sell, etc.",
        placement: "dock-left",
      },
      {
        id: "disp-form-docs",
        target: '[data-tour="disp-form-docs"]',
        allowMissingTarget: true,
        title: "Certificate & approvals",
        content:
          "Optional but important: certificate/doc number, approved by, and witness. These support compliance and retirement reporting.",
        placement: "dock-left",
      },
      {
        id: "disp-form-save",
        target: '[data-tour="disp-form-save"]',
        allowMissingTarget: true,
        title: "Save the disposal",
        content:
          "Click Create Disposal when ready. Keep certificates on file. Cancel discards without saving.",
        placement: "dock-left",
      },
    );
  }

  steps.push(
    {
      target: '[data-tour="disp-list"]',
      title: "Browse disposal records",
      content:
        "Each row is one retirement: record ID, asset, computer, department, date, reason, and method. Click a row for the full summary.",
      placement: "auto",
    },
    {
      target: '[data-tour="disp-actions"]',
      title: "Row actions",
      content: canCreate
        ? "View opens the summary. Edit updates details. Delete requires your password."
        : "Use View to open the full disposal summary. Create, edit, and delete are disabled for view-only accounts.",
      placement: "auto",
    },
    {
      title: "You're ready",
      content:
        "Remember: Disposals = retired hardware. Assets = active inventory. Service Log = repairs. Device History = transfers. Re-open this tour anytime with How it works.",
    },
  );

  return steps;
}
