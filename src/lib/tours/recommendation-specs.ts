import type { TourStep } from "@/components/SpotlightTour";

export const RECOMMENDATION_SPECS_TOUR_STORAGE_KEY = "tour-seen:recommendation-specs";

/**
 * Spotlight tour for Recommendation Specs.
 * Different from other modules: this is a small fixed catalog (Audience × Device type),
 * not a searchable CRUD list. Users switch combinations, compare Minimum vs Recommended,
 * then Print/Export or Edit the active catalog.
 */
export function getRecommendationSpecsTourSteps(canEdit: boolean): TourStep[] {
  const steps: TourStep[] = [
    {
      title: "Welcome to Recommendation Specs",
      content:
        "This page holds standard equipment specs used when buying laptops and desktops. Pick who the PC is for and the device type, then review Minimum vs Recommended requirements — it is not a supplier list or asset inventory.",
    },
    {
      target: '[data-tour="specs-audience"]',
      title: "Choose the audience",
      content:
        "Non-Engineer covers typical office roles. Engineer is for heavier technical workloads. Switching audience loads a different spec catalog.",
      placement: "bottom",
    },
    {
      target: '[data-tour="specs-device"]',
      title: "Choose laptop or desktop",
      content:
        "Each audience has separate Laptop and Desktop standards. Combine Audience + Device type to see the right comparison table.",
      placement: "bottom",
    },
    {
      target: '[data-tour="specs-print"]',
      title: "Print the current specs",
      content:
        "Print a clean copy of the active Minimum / Recommended table for approvals or handouts to requesters.",
      placement: "bottom",
    },
    {
      target: '[data-tour="specs-export"]',
      title: "Export specs",
      content:
        "Download the active catalog as Excel or PDF for procurement packages or vendor RFQs.",
      placement: "bottom",
    },
  ];

  if (canEdit) {
    steps.push({
      target: '[data-tour="specs-edit"]',
      title: "Edit the active catalog",
      content:
        "Admins can update title, roles, and component rows for the selected Audience + Device. There is no “New” record — you edit one of the four standard catalogs.",
      placement: "bottom",
    });
  }

  steps.push(
    {
      target: '[data-tour="specs-summary"]',
      title: "Active catalog summary",
      content:
        "Shows which audience and device you selected, the catalog title, and who it applies to (roles / departments).",
      placement: "bottom",
    },
    {
      target: '[data-tour="specs-table"]',
      title: "Minimum vs Recommended",
      content:
        "Each row is a component (CPU, RAM, storage…). Minimum is the floor; Recommended is the preferred buy. Use this when justifying upgrades or quoting vendors.",
      placement: "auto",
    },
  );

  if (canEdit) {
    steps.push(
      {
        id: "specs-form",
        target: '[data-tour="specs-form-drawer"]',
        allowMissingTarget: true,
        title: "Edit specs form",
        content:
          "Update the catalog metadata and the two requirement tiers. Changes apply only to the Audience + Device combination you selected.",
        placement: "dock-left",
      },
      {
        id: "specs-form-meta",
        target: '[data-tour="specs-form-meta"]',
        allowMissingTarget: true,
        title: "Title & roles",
        content:
          "Title names the catalog. For (roles / departments) explains who should use this standard — e.g. Admin, Finance, Engineering.",
        placement: "dock-left",
      },
      {
        id: "specs-form-minimum",
        target: '[data-tour="specs-form-minimum"]',
        allowMissingTarget: true,
        title: "Minimum requirements",
        content:
          "Define or edit component rows for the minimum acceptable build. Add or remove rows as standards change.",
        placement: "dock-left",
      },
      {
        id: "specs-form-recommended",
        target: '[data-tour="specs-form-recommended"]',
        allowMissingTarget: true,
        title: "Recommended requirements",
        content:
          "Preferred specs for new purchases. Keep these aligned with current market and budget guidance.",
        placement: "dock-left",
      },
      {
        id: "specs-form-save",
        target: '[data-tour="specs-form-save"]',
        allowMissingTarget: true,
        title: "Save changes",
        content:
          "Save updates the catalog immediately. Cancel discards edits. Switch Audience/Device anytime to review the other standards.",
        placement: "dock-left",
      },
    );
  }

  steps.push({
    title: "You're ready",
    content:
      "Remember: Recommendation Specs = buying standards. Procurement = supplier directory. Assets = inventory. Re-open this tour anytime with How it works.",
  });

  return steps;
}
