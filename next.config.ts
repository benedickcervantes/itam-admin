import type { NextConfig } from "next";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

/**
 * Target Nest base URL for dev rewrites when the browser uses same-origin
 * `/api/v1/*` and `/health`. Prefer BACKEND_INTERNAL_URL so NEXT_PUBLIC_* can
 * stay on LAN IP without the proxy looping incorrectly.
 */
function nestProxyBase(): string {
  const internal = stripTrailingSlash(process.env.BACKEND_INTERNAL_URL ?? "");
  if (internal) {
    return internal;
  }

  const pub = stripTrailingSlash(process.env.NEXT_PUBLIC_BACKEND_URL ?? "");

  if (pub) {
    try {
      const u = new URL(pub);
      if (u.port === "3000" || u.port === "3001") {
        return "http://127.0.0.1:4001";
      }
      if (u.port === "4001") {
        return "http://127.0.0.1:4001";
      }
    } catch {
      /* ignore invalid URL */
    }
    return pub;
  }

  return "http://127.0.0.1:4001";
}

/** LAN hostnames for Next dev HMR when opening http://<ip>:3000 (not localhost). */
function allowedDevOrigins(): string[] {
  const origins = new Set<string>();
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  if (backend) {
    try {
      const host = new URL(backend).hostname;
      if (host && host !== "localhost" && host !== "127.0.0.1") {
        origins.add(host);
      }
    } catch {
      /* ignore invalid URL */
    }
  }
  for (const part of (process.env.ALLOWED_DEV_ORIGINS ?? "").split(",")) {
    const h = part.trim();
    if (h) origins.add(h);
  }
  return [...origins];
}

const nextConfig: NextConfig = {
  allowedDevOrigins: allowedDevOrigins(),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async rewrites() {
    const base = nestProxyBase();
    return [
      { source: "/api/v1/:path*", destination: `${base}/api/v1/:path*` },
      { source: "/health", destination: `${base}/health` },
    ];
  },
};

export default nextConfig;
