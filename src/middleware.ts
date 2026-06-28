import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROXY_PREFIXES = ["/api/v1/", "/health"];

function needsBackendApiKey(pathname: string): boolean {
  return PROXY_PREFIXES.some(
    (prefix) => pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix),
  );
}

export function middleware(request: NextRequest) {
  if (!needsBackendApiKey(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const apiKey = process.env.BACKEND_API_KEY ?? process.env.FRONTEND_API_KEY ?? "";
  if (!apiKey) {
    return NextResponse.json(
      { message: "Server configuration error: missing BACKEND_API_KEY" },
      { status: 500 },
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-api-key", apiKey);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/api/v1/:path*", "/health"],
};
