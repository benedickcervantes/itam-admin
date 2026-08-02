import type { TourStep } from "@/components/SpotlightTour";

export const CONTRACTS_TOUR_STORAGE_KEY = "tour-seen:contracts";

/**
 * Spotlight tour for Device Agreements (contracts).
 * Different from Assets / Device History / Disposals: this page generates Company
 * Device Agreement PDFs (DCA-XXXX) from live ITAM assignments and stores them
 * for download — it does not transfer or retire hardware.
 */
export function getContractsTourSteps(canGenerate: boolean): TourStep[] {
  const steps: TourStep[] = [
    {
      title: "Welcome to Device Agreements",
      content:
        "Generate Company Device Agreements (DCA) from live ITAM inventory. Each PDF lists the employee’s assigned assets (Section IX), is numbered DCA-XXXX, and is saved for later viewing and download. This is not a transfer or disposal tool.",
    },
    {
      target: '[data-tour="dca-kpis"]',
      title: "At-a-glance counts",
      content:
        "See total stored contracts, how many employees appear on this page, and how many assets those agreements cover.",
      placement: "bottom",
    },
    {
      target: '[data-tour="dca-template"]',
      title: "Agreement template",
      content:
        "Preview the blank Company Device Agreement template. Reload, open full size, or download it. Generated contracts fill this layout with employee and asset data.",
      placement: "bottom",
    },
    {
      target: '[data-tour="dca-search"]',
      title: "Search contracts",
      content:
        "Find agreements by document number (DCA-XXXX), employee name, or department.",
      placement: "bottom",
    },
    {
      target: '[data-tour="dca-refresh"]',
      title: "Refresh the list",
      content:
        "Reload contracts from the server after someone else generates or deletes an agreement.",
      placement: "bottom",
    },
    {
      target: '[data-tour="dca-filters"]',
      title: "Filter by employee",
      content:
        "Show only agreements for one employee — useful when re-issuing or checking coverage.",
      placement: "bottom",
    },
  ];

  if (canGenerate) {
    steps.push(
      {
        target: '[data-tour="dca-new"]',
        title: "Generate a contract",
        content:
          "Click Generate contract when an employee has assigned ITAM assets and needs a signed-ready PDF. Next we’ll walk through the form.",
        placement: "bottom",
      },
      {
        id: "dca-form",
        target: '[data-tour="dca-form-drawer"]',
        allowMissingTarget: true,
        title: "Generate form",
        content:
          "Pick the employee, confirm position/department and date, review assets that will appear in Section IX, then generate the PDF. Assets come from current ITAM assignments — assign devices first if the list is empty.",
        placement: "dock-left",
      },
      {
        id: "dca-form-employee",
        target: '[data-tour="dca-form-employee"]',
        allowMissingTarget: true,
        title: "Select the employee",
        content:
          "Choose from ITAM assignees. Position and department often auto-fill from inventory; you can adjust them for the PDF.",
        placement: "dock-left",
      },
      {
        id: "dca-form-details",
        target: '[data-tour="dca-form-details"]',
        allowMissingTarget: true,
        title: "Date & notes",
        content:
          "Set the date issued (shown on the agreement). Internal notes stay on the IT record and are optional.",
        placement: "dock-left",
      },
      {
        id: "dca-form-assets",
        target: '[data-tour="dca-form-assets"]',
        allowMissingTarget: true,
        title: "Assets in Section IX",
        content:
          "Live preview of devices that will be listed on the PDF. If none appear, assign assets to this employee in ITAM first.",
        placement: "dock-left",
      },
      {
        id: "dca-form-save",
        target: '[data-tour="dca-form-save"]',
        allowMissingTarget: true,
        title: "Generate the PDF",
        content:
          "Click Generate PDF when ready. The agreement is saved with the next DCA number; you can preview and download it afterward. Cancel closes without creating.",
        placement: "dock-left",
      },
    );
  }

  steps.push(
    {
      target: '[data-tour="dca-list"]',
      title: "Browse generated agreements",
      content:
        "Each row is one stored DCA: document number, employee, position, department, asset count, and dates. Click a row to preview the PDF.",
      placement: "auto",
    },
    {
      target: '[data-tour="dca-actions"]',
      title: "Row actions",
      content: canGenerate
        ? "View opens the PDF preview. Download saves the file. Delete requires your password and removes the stored PDF."
        : "Use View to open the PDF preview, or Download to save a copy. Generate and delete are disabled for view-only accounts.",
      placement: "auto",
    },
    {
      title: "You're ready",
      content:
        "Remember: Device Agreements = accountability PDFs from assigned assets. Device History = transfers. Assets = inventory. Re-open this tour anytime with How it works.",
    },
  );

  return steps;
}
