import type { TourStep } from "@/components/SpotlightTour";

export const USERS_TOUR_STORAGE_KEY = "tour-seen:users";

/**
 * Spotlight tour for User Management.
 * Different from Assets / Device History assignees: this page manages ITAM login
 * accounts (Super Admin, IT Admin, Viewer) — not hardware assignment to employees.
 */
export function getUsersTourSteps(canManage: boolean): TourStep[] {
  const steps: TourStep[] = [
    {
      title: "Welcome to User Management",
      content:
        "Manage who can sign in to ITAM: Super Admins, IT Admins, and Viewers. This is the login directory — not the employee list used when assigning devices. Create accounts, set roles, and activate or deactivate access.",
    },
    {
      target: '[data-tour="users-kpis"]',
      title: "Account overview",
      content:
        "Quick counts of total users, active accounts, admins, and viewers so you can see access at a glance.",
      placement: "bottom",
    },
    {
      target: '[data-tour="users-search"]',
      title: "Search users",
      content: "Find accounts by full name or email address.",
      placement: "bottom",
    },
    {
      target: '[data-tour="users-filters"]',
      title: "Filter the directory",
      content:
        "Narrow by role (Super Admin, IT Admin, Viewer), department, or active/inactive status.",
      placement: "bottom",
    },
    {
      target: '[data-tour="users-view-mode"]',
      title: "Table or grid view",
      content:
        "Table is best for scanning many accounts. Grid shows avatars and role badges on cards. Your choice is remembered.",
      placement: "bottom",
    },
    {
      target: '[data-tour="users-export"]',
      title: "Export user lists",
      content:
        "Download the filtered directory as Excel or PDF for audits or access reviews. Customize columns as needed.",
      placement: "bottom",
    },
  ];

  if (canManage) {
    steps.push(
      {
        target: '[data-tour="users-new"]',
        title: "Create a new user",
        content:
          "Click New User to add an ITAM login. Next we’ll walk through account details and role permissions.",
        placement: "bottom",
      },
      {
        id: "users-form",
        target: '[data-tour="users-form-drawer"]',
        allowMissingTarget: true,
        title: "User form",
        content:
          "Set name, email, and password, then choose a role and department. Viewers are scoped to a department; admins can work across the organization.",
        placement: "dock-left",
      },
      {
        id: "users-form-account",
        target: '[data-tour="users-form-account"]',
        allowMissingTarget: true,
        title: "Account details",
        content:
          "Enter full name and email (email can’t change later). Set a password or use Generate, then confirm it. Share credentials securely.",
        placement: "dock-left",
      },
      {
        id: "users-form-access",
        target: '[data-tour="users-form-access"]',
        allowMissingTarget: true,
        title: "Access & permissions",
        content:
          "Pick Viewer (read-only, department-scoped), IT Admin (day-to-day operations), or Super Admin (full access including user management — Super Admins only). Assign a department when required.",
        placement: "dock-left",
      },
      {
        id: "users-form-save",
        target: '[data-tour="users-form-save"]',
        allowMissingTarget: true,
        title: "Save the account",
        content:
          "Click Create User when ready. Ask them to change their password after first login. Cancel discards without saving.",
        placement: "dock-left",
      },
    );
  }

  steps.push(
    {
      target: '[data-tour="users-list"]',
      title: "Browse accounts",
      content:
        "Each row is one login: name, email, role, department, status, and join date. Click a row for the account summary.",
      placement: "auto",
    },
    {
      target: '[data-tour="users-actions"]',
      title: "Row actions",
      content: canManage
        ? "View opens the summary. Edit updates details or password. Deactivate / Reactivate needs your password — you can’t change your own status."
        : "Use View to open the account summary. Create and status changes require admin write access.",
      placement: "auto",
    },
    {
      title: "You're ready",
      content:
        "Remember: User Management = ITAM logins and roles. Assets / Device History use employee assignees for hardware — a different list. Re-open this tour anytime with How it works.",
    },
  );

  return steps;
}
