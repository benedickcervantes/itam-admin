import type { TourStep } from "@/components/SpotlightTour";

export const DEVICE_HISTORY_TOUR_STORAGE_KEY = "tour-seen:device-history";

/**
 * Spotlight tour for Device History.
 * Different from Assets (inventory) and Audit (assessment):
 * this page tracks who had which device over time, and the main write action
 * is bulk transfer when someone resigns or gets a new PC.
 */
export function getDeviceHistoryTourSteps(canWrite: boolean): TourStep[] {
  const steps: TourStep[] = [
    {
      title: "Welcome to Device History",
      content:
        "This page is the movement log — who was assigned a device, when, and who had it before. Use it when someone resigns or changes role and their assets must move to a replacement (or to a new PC for the same person).",
    },
    {
      target: '[data-tour="history-search"]',
      title: "Search history",
      content:
        "Search by record ID, asset code, employee name, brand, or serial. Handy when you need one person’s trail quickly.",
      placement: "bottom",
    },
    {
      target: '[data-tour="history-filters"]',
      title: "Filter the trail",
      content:
        "Department narrows by org unit. Show switches between All, Current only (still assigned), or Previous / Available (closed moves and stock releases).",
      placement: "bottom",
    },
    {
      target: '[data-tour="history-view-mode"]',
      title: "Table or grid view",
      content:
        "Table is best for scanning many history rows. Grid shows cards with notes and status. Your choice is remembered.",
      placement: "bottom",
    },
    {
      target: '[data-tour="history-export"]',
      title: "Export history",
      content:
        "Download the filtered history as Excel or PDF. Customize columns for handovers, audits, or offboarding reports.",
      placement: "bottom",
    },
  ];

  if (canWrite) {
    steps.push(
      {
        target: '[data-tour="history-transfer"]',
        title: "Transfer to a new user",
        content:
          "This is the main action — not “create inventory.” Click Transfer to new user when devices must move in bulk. Next we’ll open the transfer form.",
        placement: "bottom",
      },
      {
        id: "history-transfer-form",
        target: '[data-tour="history-transfer-drawer"]',
        allowMissingTarget: true,
        title: "Transfer form",
        content:
          "All selected assets under the current user move together. Device History records close for the old assignment and open for the new one. Assets (and related audits when applicable) update too.",
        placement: "dock-left",
      },
      {
        id: "history-transfer-type",
        target: '[data-tour="history-transfer-type"]',
        allowMissingTarget: true,
        title: "Choose transfer type",
        content:
          "Different user = resign / replacement (names must differ). Same user, new PC = keep the employee name and point peripherals at a new IT Audit workstation.",
        placement: "dock-left",
      },
      {
        id: "history-transfer-from",
        target: '[data-tour="history-transfer-from"]',
        allowMissingTarget: true,
        title: "Pick the current user",
        content:
          "Search the person who currently holds the devices. They must already have assigned assets — the list below loads after you pick them.",
        placement: "dock-left",
      },
      {
        id: "history-transfer-assets",
        target: '[data-tour="history-transfer-assets"]',
        allowMissingTarget: true,
        title: "Select what moves",
        content:
          "Check the laptop/desktop plus printers and other peripherals that should move. Uncheck anything that stays with the current user.",
        placement: "dock-left",
      },
      {
        id: "history-transfer-submit",
        target: '[data-tour="history-transfer-submit"]',
        allowMissingTarget: true,
        title: "Confirm the transfer",
        content:
          "When the destination user (or new PC audit) is set and assets are selected, click Transfer. History, Assets, and linked audits update together.",
        placement: "dock-left",
      },
    );
  }

  steps.push(
    {
      target: '[data-tour="history-list"]',
      title: "Browse the history list",
      content:
        "Each row is one assignment period: record ID, asset, computer, assigned to, last user, department, and date. Status under the date shows Current, Previous, or Available.",
      placement: "auto",
    },
    {
      target: '[data-tour="history-actions"]',
      title: "Row actions",
      content: canWrite
        ? "View opens the summary. Edit corrects a history row if needed. Delete requires your password. Day-to-day moves should use Transfer, not manual create."
        : "Use View to open the full history summary. Transfer, edit, and delete are disabled for view-only accounts.",
      placement: "auto",
    },
    {
      title: "You're ready",
      content:
        "Remember: Device History = movement log & transfers. Assets = who owns what now. Audit Register = assessments. Re-open this tour anytime with How it works.",
    },
  );

  return steps;
}
