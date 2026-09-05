import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { PUBLIC_ASSET_PREFIXES } from "@/lib/public-asset-prefixes";

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
  "/resume",
  "/roadmaps",
];

function normalizeRole(role?: string): string {
  return (role || "").trim().toLowerCase().replace(/\s+/g, "_");
}

/**
 * The adaptive course BUILDER for one course, e.g. `/admin/adaptive-courses/56`.
 *
 * Instructors build their own courses here — it is the only page that can add a week, a topic or
 * a piece of content, and there is no instructor-side equivalent. Without this hole the feature
 * has no door: "Build a course" creates the course and then bounces its author to the dashboard,
 * and the card that says "yours to build" leads nowhere.
 *
 * Deliberately NOT `/admin/adaptive-courses` itself — the hub lists every course in the tenant and
 * stays blocked. One course, by id, and nothing else under /admin.
 *
 * Safe to open because the server now answers the question this rule used to stand in for. When
 * this confinement was written the authoring API had no object-level check at all, so a blunt
 * path block was the only guard. It now refuses to read or write a course you neither authored
 * nor were assigned to, per object, with tests. An instructor typing another course's id gets a
 * 403 from the API and an error state on the page, not somebody else's course.
 */
const INSTRUCTOR_ALLOWED_ADMIN_PATH = /^\/admin\/adaptive-courses\/\d+(\/|$)/;

/**
 * Assessment Management — the list, the builder, and one paper by id.
 *
 * Instructors are expected to write the papers they mark, and there is no instructor-side
 * equivalent: /instructor/assessments is the Gradebook, which reads submissions and cannot
 * create anything. Without this hole the authoring API is reachable only by hand — the server
 * has accepted instructor writes all along (SCOPED_DASHBOARD_ROLES), so the only thing standing
 * between a trainer and their own paper was the absence of a door.
 *
 * Unlike the adaptive-courses hub, the assessment LIST is safe to open: it is already scoped
 * server-side to the caller's own courses and cohorts (_assessments_for_admin_dashboard returns
 * `by_course | by_cohort` for a scoped role, and Assessment.objects.none() for anyone else), so
 * an instructor sees their papers rather than the tenant's.
 *
 * Every write behind it is object-scoped too, which is what makes the path rule unnecessary as a
 * guard: course tags are checked against their assignments when a paper is created, cohort
 * bindings against the batches they staff, and detail/publish against
 * _assessment_accessible_by_profile. An instructor typing another paper's id gets a 403 from the
 * API and an error state on the page, not somebody else's assessment.
 */
const INSTRUCTOR_ALLOWED_ASSESSMENT_PATH = /^\/admin\/assessment(\/|$)/;

/**
 * ONE adaptive course's learner view, e.g. `/adaptive-courses/18` and everything nested under it
 * (journey, submodules, video, coding) — plus the quiz-taking flow those pages open.
 *
 * Trainers read the material they teach through the learner surface: students ask doubts from
 * AI-generated content, and the backend deliberately grants staff preview (tenant-scoped, journey
 * lock bypassed for staff). Without this hole the "View content" card action navigated and was
 * bounced straight back to the dashboard — a button that visibly did nothing.
 *
 * Deliberately NOT the bare `/adaptive-courses` hub or `/adaptive-quizzes` hub — those are the
 * student home surfaces and stay blocked. One course by id; quiz start/session by object. The
 * backend enforces per-object access either way (staff_may_preview is tenant-scoped).
 */
const INSTRUCTOR_ALLOWED_LEARNER_PATHS = [
  /^\/adaptive-courses\/\d+(\/|$)/,
  /^\/adaptive-quizzes\/(start|session\/[^/]+)(\/|$)?/,
];

function instructorBlocked(pathname: string): boolean {
  if (INSTRUCTOR_ALLOWED_ADMIN_PATH.test(pathname)) return false;
  if (INSTRUCTOR_ALLOWED_ASSESSMENT_PATH.test(pathname)) return false;
  if (INSTRUCTOR_ALLOWED_LEARNER_PATHS.some((re) => re.test(pathname))) return false;
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
  // The list lives in its own module so the build gate in next.config.ts can check the proctoring
  // model URL against the same source of truth rather than a copy that drifts.
  if (PUBLIC_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
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

  // A signed-in student landing on "/" used to get a full document render of
  // app/page.tsx whose only job is a client-side router.push("/dashboard") —
  // two sequential document loads to reach the dashboard. Redirect at the
  // edge instead, same as unauthenticated visitors get their /login 307.
  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
