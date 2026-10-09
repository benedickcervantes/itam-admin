import type { TourStep } from "@/components/SpotlightTour";

export const SOFTWARE_TOUR_STORAGE_KEY = "tour-seen:software";

/**
 * Spotlight tour for Software.
 * Checklist compliance for PCs and laptops — not an install-scanning agent.
 * Standard (the 6/6) is separate from Additional apps such as AutoCAD.
 */
export function getSoftwareTourSteps(canWrite: boolean): TourStep[] {
  const steps: TourStep[] = [
    {
      title: "Welcome to Software",
      content:
        "This page is the company checklist for each PC and laptop. IT marks what is installed. It does not scan computers on its own.",
    },
    {
      target: '[data-tour="sw-tabs"]',
      title: "Computers and Catalog",
      content:
        "Computers is the checklist on each PC and laptop. Catalog is the company list of software names: the standard set, plus extra apps such as AutoCAD.",
      placement: "bottom",
    },
    {
      id: "sw-filters",
      target: '[data-tour="sw-filters"]',
      title: "Find a computer",
      content:
        "Search by computer name, user, asset code, or department. Filter by department, or by compliance: Complete, Missing standard, or With additional. Active filters show as chips you can clear.",
      placement: "bottom",
    },
    {
      id: "sw-toolbar",
      target: '[data-tour="sw-toolbar"]',
      title: "Table, grid, and export",
      content:
        "Table is best for scanning many computers. Grid shows one card per PC. Export downloads the filtered list as Excel or PDF, using the same report layout as the other modules. Customize columns when you only need some fields.",
      placement: "bottom",
    },
    {
      id: "sw-list",
      target: '[data-tour="sw-list"]',
      title: "Compliance at a glance",
      content:
        "The standard score is the required set only — for example 6/6. Extra apps are counted beside it, such as “1 extra”. Click a row to open that computer’s checklist.",
      placement: "top",
    },
    {
      id: "sw-device",
      target: '[data-tour="sw-device-summary"]',
      allowMissingTarget: true,
      title: "Checklist summary",
      content:
        "The banner shows how many standard apps are covered, how many additional apps are on this PC, and the operating system already stored on the asset.",
      placement: "dock-left",
    },
    {
      id: "sw-device-standard",
      target: '[data-tour="sw-device-standard"]',
      allowMissingTarget: true,
      title: "Standard software",
      content:
        "Chrome, PDF viewer, Office 365, Viber, printer driver, and Dropbox are required on every computer. Mark each Installed, Missing, or Not needed. Not needed still counts as covered. A note is optional.",
      placement: "dock-left",
    },
    {
      id: "sw-device-extra",
      target: '[data-tour="sw-device-extra"]',
      allowMissingTarget: true,
      title: "Additional software",
      content:
        "Apps used by only some people, such as AutoCAD, appear here. They do not change the 6/6 standard score. Removing one takes it off this PC only. The name stays in the catalog.",
      placement: "dock-left",
    },
  ];

  if (canWrite) {
    steps.push({
      id: "sw-device-add",
      target: '[data-tour="sw-device-add"]',
      allowMissingTarget: true,
      title: "Add software to this computer",
      content:
        "Pick an additional app already in the catalog, or type a new name. A new name is saved as Additional and assigned to this PC only — not to every computer.",
      placement: "dock-left",
    });
  }

  steps.push({
    id: "sw-catalog",
    target: '[data-tour="sw-catalog-list"]',
    allowMissingTarget: true,
    title: "Company catalog",
    content:
      "Standard items show on every PC. Additional items stay off a computer until you add them there. Renaming a catalog item updates every checklist that uses it.",
    placement: "top",
  });

  if (canWrite) {
    steps.push(
      {
        id: "sw-catalog-new",
        target: '[data-tour="sw-catalog-new"]',
        allowMissingTarget: true,
        title: "Add catalog software",
        content:
          "Use Add software for a new company-wide name. Choose Additional unless every PC should be checked for it.",
        placement: "bottom",
      },
      {
        id: "sw-catalog-form",
        target: '[data-tour="sw-catalog-form"]',
        allowMissingTarget: true,
        title: "Name and notes",
        content:
          "The name must be unique. Notes are optional — for example the approved PDF viewer or printer driver.",
        placement: "dock-left",
      },
      {
        id: "sw-catalog-form-type",
        target: '[data-tour="sw-catalog-form-type"]',
        allowMissingTarget: true,
        title: "Standard or Additional",
        content:
          "Standard appears on every computer as Missing until IT marks it. Additional does not appear until you add it to a specific PC. Deleting a catalog item removes it from every computer and asks for your password.",
        placement: "dock-left",
      },
    );
  }

  steps.push({
    title: "You're ready",
    content:
      "Remember: 6/6 is the standard set only. Additional apps are counted beside it. The dashboard Software Compliance card is a live snapshot and ignores the week, month, quarter, and year filter. Re-open this tour anytime with How it works.",
  });

  return steps;
}
