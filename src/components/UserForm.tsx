"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Pencil,
  RefreshCw,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Field, inputClass, selectClass } from "@/components/Drawer";
import {
  availableRoles,
  generatePassword,
  passwordStrength,
  ROLE_META,
  type UserFormMode,
  type UserRole,
} from "@/lib/user-form";
import type { AdminUser, Department } from "@/lib/types";

function FormSection({
  id,
  title,
  description,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-4 rounded-xl border border-slate-700/60 bg-slate-900/30">
      <div className="flex items-start gap-3 border-b border-slate-700/60 px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2E7D9A]/15 text-[#2E7D9A]">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
        </div>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-400">{message}</p>;
}

function RoleCard({
  role,
  selected,
  disabled,
  onSelect,
}: {
  role: UserRole;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const meta = ROLE_META[role];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? "border-[#2E7D9A]/60 bg-[#2E7D9A]/10 ring-1 ring-[#2E7D9A]/30"
          : "border-slate-700 bg-slate-900/40 hover:border-slate-600"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-white">{meta.label}</span>
        <Badge value={role} />
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{meta.description}</p>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">{meta.permissions}</p>
    </button>
  );
}

export function UserDetailView({
  user,
  onEdit,
  canEdit,
}: {
  user: AdminUser;
  onEdit?: () => void;
  canEdit?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-base font-semibold text-sky-300">
          {user.full_name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join("")}
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-white">{user.full_name}</p>
          <p className="truncate text-sm text-slate-400">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge value={user.role} />
            <Badge value={user.is_active ? "ACTIVE" : "INACTIVE"} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-700/60 bg-slate-900/30 px-3 py-2.5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Department</p>
          <p className="mt-1 text-sm text-slate-200">{user.department?.name ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-slate-700/60 bg-slate-900/30 px-3 py-2.5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Joined</p>
          <p className="mt-1 text-sm text-slate-200">
            {user.created_at ? new Date(user.created_at).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" }) : "—"}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-700/60 bg-slate-900/30 px-3 py-2.5 text-sm text-slate-400">
        {ROLE_META[user.role as UserRole]?.description ?? "—"}
      </div>

      {canEdit && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-amber-500/40 hover:text-amber-300"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit user
        </button>
      )}
    </div>
  );
}

export function UserForm({
  mode,
  form,
  onChange,
  departments,
  actorRole,
  sessionUserId,
  editingId,
  fieldErrors = {},
  readOnly = false,
}: {
  mode: UserFormMode;
  form: Record<string, string>;
  onChange: (form: Record<string, string>) => void;
  departments: Department[];
  actorRole: string;
  sessionUserId: string;
  editingId?: string;
  fieldErrors?: Record<string, string>;
  readOnly?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const roles = availableRoles(actorRole);
  const strength = passwordStrength(form.password ?? "");
  const isSelf = editingId === sessionUserId;
  const showConfirmField = mode === "create" || Boolean(form.password);

  const set = (patch: Record<string, string>) => onChange({ ...form, ...patch });

  const handleGeneratePassword = () => {
    const password = generatePassword();
    set({ password, confirmPassword: password });
    setShowPassword(true);
    setShowConfirm(true);
    setCopied(false);
  };

  const handleCopyPassword = async () => {
    const password = form.password ?? "";
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-4">
      <FormSection
        id="user-account"
        title="Account Details"
        description={mode === "create" ? "Basic sign-in credentials for the new user." : "Update the user's profile information."}
        icon={User}
      >
        <Field label="Full Name" required>
          <input
            className={`${inputClass} ${fieldErrors.fullName ? "border-red-500/60" : ""}`}
            value={form.fullName ?? ""}
            onChange={(e) => set({ fullName: e.target.value })}
            placeholder="e.g. Juan Dela Cruz"
            readOnly={readOnly}
            autoFocus={mode === "create" && !readOnly}
          />
          <FieldError message={fieldErrors.fullName} />
        </Field>

        <Field label="Email Address" required={mode === "create"}>
          <input
            type="email"
            className={`${inputClass} ${fieldErrors.email ? "border-red-500/60" : ""}`}
            value={form.email ?? ""}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="name@company.com"
            readOnly={readOnly || mode === "edit"}
          />
          {mode === "edit" && (
            <p className="text-xs text-slate-500">Email cannot be changed after the account is created.</p>
          )}
          <FieldError message={fieldErrors.email} />
        </Field>

        {!readOnly && (
          <div className="space-y-3 rounded-lg border border-slate-700/60 bg-slate-950/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                <Lock className="h-3.5 w-3.5" />
                {mode === "create" ? "Password" : "New Password"}
                {mode === "create" && <span className="text-red-400">*</span>}
              </div>
              <div className="flex items-center gap-1.5">
                {form.password && (
                  <button
                    type="button"
                    onClick={() => void handleCopyPassword()}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2 py-1 text-[11px] font-medium text-slate-300 hover:border-[#2E7D9A]/50 hover:text-[#2E7D9A]"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2 py-1 text-[11px] font-medium text-slate-300 hover:border-[#2E7D9A]/50 hover:text-[#2E7D9A]"
                >
                  <RefreshCw className="h-3 w-3" /> Generate
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className={`${inputClass} pr-10 ${fieldErrors.password ? "border-red-500/60" : ""}`}
                value={form.password ?? ""}
                onChange={(e) => {
                  const password = e.target.value;
                  set({
                    password,
                    ...(password ? {} : { confirmPassword: "" }),
                  });
                  if (!password) setCopied(false);
                }}
                placeholder={mode === "edit" ? "Leave blank to keep current password" : "Minimum 6 characters"}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {form.password && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Strength</span>
                  <span className={strength.label === "Strong" ? "text-emerald-400" : strength.label === "Fair" ? "text-amber-400" : "text-red-400"}>
                    {strength.label}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
                  <div
                    className={`h-full rounded-full transition-all ${strength.color}`}
                    style={{ width: `${Math.min(100, (strength.score / 5) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            <FieldError message={fieldErrors.password} />

            {showConfirmField && (
              <Field label="Confirm Password" required>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    className={`${inputClass} pr-10 ${fieldErrors.confirmPassword ? "border-red-500/60" : ""}`}
                    value={form.confirmPassword ?? ""}
                    onChange={(e) => set({ confirmPassword: e.target.value })}
                    placeholder={mode === "edit" ? "Re-enter new password" : "Re-enter password"}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-white"
                    aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError message={fieldErrors.confirmPassword} />
              </Field>
            )}
          </div>
        )}
      </FormSection>

      <FormSection
        id="user-access"
        title="Access & Permissions"
        description="Choose what this user can see and do in the system."
        icon={Shield}
      >
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-300">Role</p>
          <div className="grid gap-2">
            {roles.map((role) => (
              <RoleCard
                key={role}
                role={role}
                selected={form.role === role}
                disabled={readOnly}
                onSelect={() => set({ role })}
              />
            ))}
          </div>
          {actorRole !== "SUPER_ADMIN" && (
            <p className="text-xs text-slate-500">Only Super Admins can create other Super Admin accounts.</p>
          )}
        </div>

        <Field label="Department" required={form.role === "VIEWER"}>
          <select
            className={`${selectClass} ${fieldErrors.departmentId ? "border-red-500/60" : ""}`}
            value={form.departmentId ?? ""}
            onChange={(e) => set({ departmentId: e.target.value })}
            disabled={readOnly}
          >
            <option value="">— Select department —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {form.role === "VIEWER" ? (
            <p className="text-xs text-amber-300/80">Viewers are scoped to their assigned department.</p>
          ) : (
            <p className="text-xs text-slate-500">Optional for admin roles. Leave blank for organization-wide access.</p>
          )}
          <FieldError message={fieldErrors.departmentId} />
        </Field>

        {mode === "edit" && (
          <Field label="Account Status">
            <select
              className={selectClass}
              value={form.isActive ?? "true"}
              onChange={(e) => set({ isActive: e.target.value })}
              disabled={readOnly || isSelf}
            >
              <option value="true">Active — can sign in</option>
              <option value="false">Inactive — sign-in disabled</option>
            </select>
            {isSelf && (
              <p className="text-xs text-slate-500">You cannot deactivate your own account.</p>
            )}
          </Field>
        )}
      </FormSection>

      {mode === "create" && (
        <div className="flex items-start gap-2.5 rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2.5 text-xs text-sky-200/90">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
          <p>
            The user will sign in with their email and the password you set. Share credentials securely and ask them to change their password after first login.
          </p>
        </div>
      )}
    </div>
  );
}
