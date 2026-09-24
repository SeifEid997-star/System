import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "qlinic_session";

async function getSessionRole(token?: string) {
  const secret = process.env.AUTH_SECRET || (process.env.NODE_ENV !== "production" ? "local-development-secret-change-before-deploy-qlinic" : "");
  if (!token || !secret || secret.length < 32) return null;
  try {
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra) return null;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
    const actualBytes = Uint8Array.from(atob(signature.replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0));
    if (actualBytes.length !== expected.length) return null;
    let difference = 0;
    for (let i = 0; i < expected.length; i++) difference |= expected[i] ^ actualBytes[i];
    if (difference !== 0) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const data = JSON.parse(atob(normalized + "=".repeat((4 - normalized.length % 4) % 4)));
    return typeof data.sub === "string" && typeof data.role === "string" && typeof data.exp === "number" && data.exp > Math.floor(Date.now() / 1000) ? data.role as string : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/api/auth/")) return NextResponse.next();

  const role = await getSessionRole(request.cookies.get(COOKIE_NAME)?.value);
  const valid = role !== null;
  if (pathname.startsWith("/api/")) {
    if (!valid) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (pathname.startsWith("/api/admin/") && role !== "OWNER") return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    return NextResponse.next();
  }

  if (pathname === "/login") {
    if (!valid) return NextResponse.next();
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname === "/settings/reset" && role !== "OWNER") return NextResponse.redirect(new URL("/", request.url));
  if (pathname.startsWith("/superadmin") && role !== "SUPERADMIN") return NextResponse.redirect(new URL("/", request.url));
  if (!valid) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
