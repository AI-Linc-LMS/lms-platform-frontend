import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token");
  const { pathname } = request.nextUrl;

  // Files under /public are requested by URL (e.g. CSS background-image, <img src>).
  // They must bypass auth — otherwise unauthenticated users get 307 → /login and assets never load.
  if (
    pathname.startsWith("/images/") ||
    pathname.startsWith("/videos/") ||
    pathname.startsWith("/assets/")
  ) {
    return NextResponse.next();
  }

  const publicRoutes = [
    "/signup",
    "/verify-email",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/auth/handoff",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If accessing a protected route without token, redirect to login
  if (!isPublicRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing auth pages while authenticated, redirect to dashboard.
  // Exceptions: /verify-email still needs to load for email confirmation
  // links, and /auth/* needs to load so an already-signed-in user can
  // consume a new handoff token (e.g. switching tenants).
  if (
    isPublicRoute &&
    token &&
    pathname !== "/verify-email" &&
    !pathname.startsWith("/auth/")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
