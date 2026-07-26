import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Instructors live entirely inside /instructor/*. This is the real guard (server-side, no flash)
 * that keeps the instructor role out of the student learner view and the full-admin area — replacing
 * the old "hidden sidebar link + backend 403" model for this role. Role comes from the `user_role`
 * cookie (set at login). Other roles are unaffected.
 */
const INSTRUCTOR_HOME = "/instructor/dashboard";

// Student + admin route roots an instructor must not enter.
const INSTRUCTOR_BLOCKED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/adaptive-courses",
  "/adaptive-quizzes",
  "/assessments",
  "/community",
  "/courses",
  "/credentials",
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

export function middleware(req: NextRequest) {
  const role = normalizeRole(req.cookies.get("user_role")?.value);
  if (role !== "instructor") return NextResponse.next();

  const path = req.nextUrl.pathname;
  const blocked =
    path === "/" ||
    INSTRUCTOR_BLOCKED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

  if (blocked) {
    const url = req.nextUrl.clone();
    url.pathname = INSTRUCTOR_HOME;
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Run on page routes; skip Next internals, the API, and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
