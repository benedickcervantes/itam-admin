import type { TourStep } from "@/components/SpotlightTour";

export const PROCUREMENT_TOUR_STORAGE_KEY = "tour-seen:procurement";

/**
 * Spotlight tour for Procurement (supplier directory).
 * Different from Assets / Audit / Device History / Service Log:
 * this page stores IT asset suppliers (vendors) — who to contact for servers,
 * desktops, peripherals, etc. It is not a purchase-order or receiving queue.
 */
export function getProcurementTourSteps(canCreate: boolean): TourStep[] {
  const steps: TourStep[] = [
    {
      title: "Welcome to Procurement",
      content:
        "This page is your IT supplier directory — companies that sell or service servers, desktops, and related equipment. Use it to find who to call for quotes, not to log purchase orders or inventory receipts.",
    },
    {
      target: '[data-tour="proc-search"]',
      title: "Search suppliers",
      content:
        "Search by supplier code, company name, contact person, email, phone, or address.",
      placement: "bottom",
    },
    {
      target: '[data-tour="proc-filters"]',
      title: "Filter by status & category",
      content:
        "Status shows Active vs Inactive vendors. Category narrows by what they supply (e.g. laptops, servers, networking). Use both to shortlist vendors quickly.",
      placement: "bottom",
    },
    {
      target: '[data-tour="proc-view-mode"]',
      title: "Table or grid view",
      content:
        "Table is best for scanning many suppliers. Grid shows contact highlights on cards. Your choice is remembered.",
      placement: "bottom",
    },
    {
      target: '[data-tour="proc-export"]',
      title: "Export supplier list",
      content:
        "Download the filtered directory as Excel or PDF — useful for sourcing lists or vendor reviews. Customize columns as needed.",
      placement: "bottom",
    },
  ];

  if (canCreate) {
    steps.push(
      {
        target: '[data-tour="proc-new"]',
        title: "Add a new supplier",
        content:
          "Click New Supplier when onboarding a vendor. Next we’ll walk through the form — company, contact, and supply categories.",
        placement: "bottom",
      },
      {
        id: "proc-form",
        target: '[data-tour="proc-form-drawer"]',
        allowMissingTarget: true,
        title: "Supplier form",
        content:
          "Fill company identity, contact channels, and what they can supply. A supplier code is assigned when you save.",
        placement: "dock-left",
      },
      {
        id: "proc-form-company",
        target: '[data-tour="proc-form-company"]',
        allowMissingTarget: true,
        title: "Company details",
        content:
          "Supplier Name is required. Set Status (Active/Inactive) and optional website so the team knows which vendors are still usable.",
        placement: "dock-left",
      },
      {
        id: "proc-form-contact",
        target: '[data-tour="proc-form-contact"]',
        allowMissingTarget: true,
        title: "Contact channels",
        content:
          "Add the contact person, email, phone, and address used for quotes and support. Accurate contacts speed up procurement follow-ups.",
        placement: "dock-left",
      },
      {
        id: "proc-form-categories",
        target: '[data-tour="proc-form-categories"]',
        allowMissingTarget: true,
        title: "Supply categories",
        content:
          "Tick what this vendor can provide — laptops, desktops, servers, networking, peripherals, etc. Categories power the list filter above.",
        placement: "dock-left",
      },
      {
        id: "proc-form-save",
        target: '[data-tour="proc-form-save"]',
        allowMissingTarget: true,
        title: "Save the supplier",
        content:
          "Click Create Supplier when ready. You can edit later if contacts or categories change. Cancel discards without saving.",
        placement: "dock-left",
      },
    );
  }

  steps.push(
    {
      target: '[data-tour="proc-list"]',
      title: "Browse suppliers",
      content:
        "Each row is one vendor: code, name, contact, email, phone, primary category, and status. Click a row for the full summary.",
      placement: "auto",
    },
    {
      target: '[data-tour="proc-actions"]',
      title: "Row actions",
      content: canCreate
        ? "View opens the summary. Edit updates details. Delete requires your password."
        : "Use View to open the full supplier summary. Create, edit, and delete are disabled for view-only accounts.",
      placement: "auto",
    },
    {
      title: "You're ready",
      content:
        "Remember: Procurement = supplier directory. Assets = inventory. Recommendation Specs / Contracts cover buying standards and agreements. Re-open this tour anytime with How it works.",
    },
  );

  return steps;
}
