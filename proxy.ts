import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Instructors live entirely inside /instructor/*. Confining them here (server-side, no flash) is the
// real guard that keeps the instructor role out of the student learner view and the full-admin area.
const INSTRUCTOR_HOME = "/instructor/dashboard";
const INSTRUCTOR_BLOCKED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/adaptive-courses",
  "/adaptive-quizzes",
  "/assessments",
  "/community",
  "/courses",
  "/jobs",
  "/jobs-v2",
  "/leaderboard-streaks",
  "/live-sessions",
  "/mock-interview",
  "/points-system",
  "/proctoring-demo",
  "/resume",
];

function normalizeRole(role?: string): string {
  return (role || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function instructorBlocked(pathname: string): boolean {
  return (
    pathname === "/" ||
    INSTRUCTOR_BLOCKED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  );
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token");
  const role = normalizeRole(request.cookies.get("user_role")?.value);
  const isInstructor = role === "instructor";
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
    // Public credential verification pages — anyone (incl. LinkedIn's crawler) can open these.
    "/credentials",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Scorecard PDF route is loaded by the backend's Playwright printer with a
  // pdf_token query param. There is no session cookie in that context; the
  // backend's AllowScorecardPdfToken permission validates the token. Letting
  // this through here keeps the auth model intact (data fetch still requires
  // a valid token) without redirecting Playwright to /login.
  const isScorecardPdfRoute = pathname.startsWith("/user/scorecard/pdf");

  // If accessing a protected route without token, redirect to login
  if (!isPublicRoute && !isScorecardPdfRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing auth pages while authenticated, redirect home (instructors to their own space).
  // Exceptions: /verify-email still needs to load for email confirmation
  // links, and /auth/* needs to load so an already-signed-in user can
  // consume a new handoff token (e.g. switching tenants).
  if (
    isPublicRoute &&
    token &&
    pathname !== "/verify-email" &&
    !pathname.startsWith("/auth/") &&
    // Credential pages must render for signed-in users too (don't bounce to /dashboard).
    !pathname.startsWith("/credentials")
  ) {
    return NextResponse.redirect(
      new URL(isInstructor ? INSTRUCTOR_HOME : "/dashboard", request.url),
    );
  }

  // Confine instructors to /instructor/* — bounce them off the student learner view and /admin/*.
  if (isInstructor && token && instructorBlocked(pathname)) {
    return NextResponse.redirect(new URL(INSTRUCTOR_HOME, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
