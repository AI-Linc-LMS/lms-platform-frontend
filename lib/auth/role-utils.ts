/**
 * Normalized role string for comparisons (handles "Course Manager", "course_manager", etc.)
 */
export function normalizeRole(role: string | undefined | null): string {
  if (role == null || role === "") return "";
  return String(role).trim().toLowerCase().replace(/\s+/g, "_");
}

/** Admin / instructor with full access and student↔admin toggle */
export function isFullAdminRole(role: string | undefined | null): boolean {
  const r = normalizeRole(role);
  return r === "admin" || r === "superadmin" || r === "instructor";
}

/**
 * Roles that only use the admin shell + modules granted via client features
 * (e.g. assessments, manage students, jobs) — not the main student app by default.
 */
export function isAdminOnlyRole(role: string | undefined | null): boolean {
  const r = normalizeRole(role);
  return (
    r === "course_manager" ||
    r === "coursemanager" ||
    r === "content_manager" ||
    r === "contentmanager"
  );
}

/** Course manager only — used for tighter nav than other admin-only roles. */
export function isCourseManagerRole(role: string | undefined | null): boolean {
  const r = normalizeRole(role);
  return r === "course_manager" || r === "coursemanager";
}

/**
 * Admin sidebar `featureName` values shown to course managers (subset of admin nav).
 * Client feature flags still apply first; this list further restricts visible links.
 */
export const COURSE_MANAGER_ADMIN_SIDEBAR_FEATURES: readonly string[] = [
  "admin_dashboard",
  "admin_manage_students",
  "admin_course_builder",
  "admin_mock_interview",
  "admin_assessment",
  "admin_jobs_v2",
];

/** May see /admin/* navigation (full or limited) */
export function canAccessAdminArea(role: string | undefined | null): boolean {
  return isFullAdminRole(role) || isAdminOnlyRole(role);
}

const DEFAULT_STUDENT_HOME = "/dashboard";
const DEFAULT_ADMIN_HOME = "/admin/dashboard";

function pathnameOnly(url: string): string {
  try {
    if (url.startsWith("/")) {
      const q = url.indexOf("?");
      return q >= 0 ? url.slice(0, q) : url;
    }
  } catch {
    /* fall through */
  }
  return url.split("?")[0] || "";
}

export function isAdminAppPath(path: string): boolean {
  const p = pathnameOnly(path);
  return p === "/admin" || p.startsWith("/admin/");
}

/**
 * Safe post-login path: students are not sent to /admin; limited admins are not sent to student home by default.
 */
export function resolvePostLoginPath(
  role: string | undefined | null,
  requestedRedirect: string | null | undefined
): string {
  const raw = (requestedRedirect ?? "").trim();
  let path = raw || DEFAULT_STUDENT_HOME;

  if (!path.startsWith("/") || path.startsWith("//")) {
    path = DEFAULT_STUDENT_HOME;
  }

  const pathname = pathnameOnly(path);
  const canAdmin = canAccessAdminArea(role);
  const limitedAdmin = isAdminOnlyRole(role);

  if (!canAdmin) {
    if (isAdminAppPath(pathname)) {
      return DEFAULT_STUDENT_HOME;
    }
    return path;
  }

  if (limitedAdmin) {
    if (isAdminAppPath(pathname)) {
      return path;
    }
    return DEFAULT_ADMIN_HOME;
  }

  return path;
}
