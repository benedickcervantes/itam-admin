import { apiJson } from "./client";

export type PortalConfig = {
  supportEmail: string | null;
  supportPhone: string | null;
  supportLabel: string;
};

export async function fetchPortalConfig() {
  return apiJson<PortalConfig>("/api/v1/public/portal-config");
}

export function buildSupportMailto(email: string, subject = "ITAM Admin Support") {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}`;
}

export function buildSupportTel(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0") && digits.length === 11) {
    return `tel:+63${digits.slice(1)}`;
  }
  if (digits.startsWith("63")) {
    return `tel:+${digits}`;
  }
  return `tel:${digits}`;
}
