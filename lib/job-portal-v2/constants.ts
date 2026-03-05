/**
 * Job Portal V2 – shared constants.
 * Use these across student and admin pages for consistency.
 */

/** Default page size for job and application lists */
export const JOB_PORTAL_PAGE_SIZE = 10;

/** Roles that can access the admin job portal */
export const JOB_PORTAL_ADMIN_ROLES = [
  "admin",
  "superadmin",
  "course_manager",
] as const;

export type JobPortalAdminRole = (typeof JOB_PORTAL_ADMIN_ROLES)[number];
