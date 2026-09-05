import { describe, expect, it } from "vitest";

/**
 * Instructor route confinement.
 *
 * Mirrors `instructorBlocked` in proxy.ts. Duplicated rather than imported because proxy.ts pulls
 * in `next/server`, which needs a request context these tests have no reason to build — and the
 * thing worth protecting is the RULE, which is a string predicate.
 *
 * If you change the rule in proxy.ts, change it here. A drift shows up as a test that passes
 * while the guard does something else, so keep the two literally identical.
 */
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

const INSTRUCTOR_ALLOWED_ADMIN_PATH = /^\/admin\/adaptive-courses\/\d+(\/|$)/;
const INSTRUCTOR_ALLOWED_ASSESSMENT_PATH = /^\/admin\/assessment(\/|$)/;
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

describe("the builder is reachable", () => {
  it("lets an instructor open one course's builder", () => {
    // Without this the feature has no door: "Build a course" creates the course and bounces its
    // author to the dashboard.
    expect(instructorBlocked("/admin/adaptive-courses/56")).toBe(false);
    expect(instructorBlocked("/admin/adaptive-courses/56/")).toBe(false);
  });

  it("allows sub-paths of one course", () => {
    expect(instructorBlocked("/admin/adaptive-courses/56/settings")).toBe(false);
  });
});

describe("and nothing else opened with it", () => {
  it("still blocks the course hub", () => {
    // The hub lists every course in the tenant.
    expect(instructorBlocked("/admin/adaptive-courses")).toBe(true);
    expect(instructorBlocked("/admin/adaptive-courses/")).toBe(true);
  });

  it("still blocks the rest of the admin area", () => {
    for (const p of [
      "/admin",
      "/admin/students",
      "/admin/tickets",
      "/admin/instructors",
      "/admin/assessments",
      "/admin/adaptive-coursesX/1",
    ]) {
      expect(instructorBlocked(p), p).toBe(true);
    }
  });

  it("is not fooled by a non-numeric id", () => {
    // `/admin/adaptive-courses/new` is not one course; it must not open the whole prefix.
    expect(instructorBlocked("/admin/adaptive-courses/new")).toBe(true);
    expect(instructorBlocked("/admin/adaptive-courses/generate")).toBe(true);
  });

  it("is not fooled by a path that merely starts with a digit", () => {
    expect(instructorBlocked("/admin/adaptive-courses/56abc")).toBe(true);
  });

  it("still blocks the student learner view", () => {
    // `/adaptive-courses/12` used to be listed here and is deliberately no longer: proxy.ts
    // opened ONE course's learner view to instructors so "View content" stopped bouncing them.
    // This assertion kept passing only because the mirror above had drifted from the real rule -
    // the exact failure the mirror's own comment warns about. Resyncing the mirror surfaced it.
    for (const p of ["/", "/dashboard", "/community", "/resume"]) {
      expect(instructorBlocked(p), p).toBe(true);
    }
    // The hubs stay shut; it is one course by id, not the student home.
    for (const p of ["/adaptive-courses", "/adaptive-quizzes"]) {
      expect(instructorBlocked(p), p).toBe(true);
    }
  });

  it("opens one course's learner view but not the hub", () => {
    expect(instructorBlocked("/adaptive-courses/12")).toBe(false);
    expect(instructorBlocked("/adaptive-quizzes/start")).toBe(false);
    expect(instructorBlocked("/adaptive-courses")).toBe(true);
  });

  it("leaves the instructor's own space alone", () => {
    for (const p of ["/instructor/dashboard", "/instructor/courses", "/instructor/courses/56"]) {
      expect(instructorBlocked(p), p).toBe(false);
    }
  });
});


describe("assessment authoring is reachable", () => {
  it("lets an instructor open Assessment Management and the builder", () => {
    // Instructors are expected to write the papers they mark. The server has accepted their
    // writes all along (SCOPED_DASHBOARD_ROLES); the only thing missing was a door.
    expect(instructorBlocked("/admin/assessment")).toBe(false);
    expect(instructorBlocked("/admin/assessment/")).toBe(false);
    expect(instructorBlocked("/admin/assessment/create")).toBe(false);
    expect(instructorBlocked("/admin/assessment/861/edit")).toBe(false);
  });

  it("does not open the rest of /admin along with it", () => {
    // The door is one branch wide. Everything else under /admin stays shut.
    expect(instructorBlocked("/admin")).toBe(true);
    expect(instructorBlocked("/admin/manage-students")).toBe(true);
    expect(instructorBlocked("/admin/certificates")).toBe(true);
    expect(instructorBlocked("/admin/emails")).toBe(true);
    expect(instructorBlocked("/admin/adaptive-courses")).toBe(true);
  });

  it("does not open a path that merely starts with the same letters", () => {
    // /admin/assessments (plural) is not a route today, but a prefix rule that matched it
    // would silently widen the moment somebody added one.
    expect(instructorBlocked("/admin/assessment-templates")).toBe(true);
  });
});
