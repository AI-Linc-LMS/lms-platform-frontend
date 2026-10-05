/**
 * Splitting the adaptive course list into the two things it has always contained.
 *
 * `GET /adaptive-quiz/api/courses/` merges two lanes and says so in its own comment: the
 * tenant's published catalog, gated by enrolment, OR the learner's own generated courses,
 * which `course_forge` builds from a roadmap node and leaves unpublished so that every
 * tenant-wide query excludes them automatically.
 *
 * Both arrive in one array, sorted by date, with nothing on the card to tell them apart. On
 * production that is 39 of one and 12 of the other for a single tenant. The serializer has
 * carried `origin` for exactly this reason ("so the learner's own generated courses can be
 * badged as such rather than sitting anonymously beside the courses their institution
 * assigned them") and nothing had read it.
 *
 * Pure, so the rule is testable without rendering a page.
 */

export type CourseOrigin = "all" | "mine" | "client";

export interface HasOrigin {
  origin?: "authored" | "forge";
}

/**
 * Absent `origin` counts as the tenant's, not the learner's.
 *
 * That is the safe direction on an older server: a tenant course shown under "Built by me" is
 * a lie about who made it, while the reverse is only a missing badge.
 */
export function isBuiltByLearner(course: HasOrigin): boolean {
  return course.origin === "forge";
}

export function filterByOrigin<T extends HasOrigin>(courses: T[], which: CourseOrigin): T[] {
  if (which === "all") return courses;
  const mine = which === "mine";
  return courses.filter((c) => isBuiltByLearner(c) === mine);
}

export function countByOrigin(courses: HasOrigin[]): { mine: number; client: number } {
  let mine = 0;
  for (const c of courses) if (isBuiltByLearner(c)) mine += 1;
  return { mine, client: courses.length - mine };
}

/**
 * Whether the switcher is worth showing at all.
 *
 * A filter with nothing on one side of it is chrome that explains nothing: most tenants have
 * no forge courses, and a learner who has built none should not be asked to choose between
 * "all" and "none". It appears when the list genuinely holds both kinds.
 */
export function shouldOfferOriginFilter(courses: HasOrigin[]): boolean {
  const { mine, client } = countByOrigin(courses);
  return mine > 0 && client > 0;
}
