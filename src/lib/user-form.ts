export const USER_ROLES = ["SUPER_ADMIN", "IT_ADMIN", "VIEWER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_META: Record<
  UserRole,
  { label: string; description: string; permissions: string }
> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    description: "Full system access including user management and all records.",
    permissions: "Read & write · All departments",
  },
  IT_ADMIN: {
    label: "IT Admin",
    description: "Manage assets, audits, maintenance, and day-to-day IT operations.",
    permissions: "Read & write · All departments",
  },
  VIEWER: {
    label: "Viewer",
    description: "Read-only access for department heads to monitor their team's records.",
    permissions: "View only · Assign a department",
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type UserFormMode = "create" | "edit";

export function passwordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: "Enter a password", color: "bg-slate-600" };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 3) return { score, label: "Fair", color: "bg-amber-500" };
  return { score, label: "Strong", color: "bg-emerald-500" };
}

export function generatePassword(length = 12): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*";
  const all = upper + lower + digits + symbols;
  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
  const base = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  while (base.length < length) base.push(pick(all));
  for (let i = base.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  return base.join("");
}

export function validateUserForm(
  form: Record<string, string>,
  mode: UserFormMode,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const fullName = form.fullName?.trim() ?? "";
  const email = form.email?.trim() ?? "";
  const password = form.password ?? "";
  const confirmPassword = form.confirmPassword ?? "";

  if (!fullName) errors.fullName = "Full name is required.";
  else if (fullName.length < 2) errors.fullName = "Enter at least 2 characters.";

  if (mode === "create") {
    if (!email) errors.email = "Email is required.";
    else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";

    if (!password) errors.password = "Password is required.";
    else if (password.length < 6) errors.password = "Password must be at least 6 characters.";

    if (!confirmPassword) errors.confirmPassword = "Please confirm the password.";
    else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
  } else if (password && password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (form.role === "VIEWER" && !form.departmentId) {
    errors.departmentId = "Assign a department for viewer accounts.";
  }

  return errors;
}

export function availableRoles(actorRole: string): UserRole[] {
  if (actorRole === "SUPER_ADMIN") return [...USER_ROLES];
  return ["IT_ADMIN", "VIEWER"];
}
