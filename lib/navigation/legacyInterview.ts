/**
 * Where a visit to the RETIRED standalone mock interview goes, and which of its pages the
 * question applies to.
 *
 * /mock-interview is two products behind one URL prefix, and only the first one is retired.
 *
 * RETIRED, FOR EVERY TENANT - the standalone legacy mock interview: the hub, quick-start,
 * schedule and scheduled pages, the product the `mock_interview` feature row described. There is
 * no tenant left that may see it, so `legacyInterviewDestination` ALWAYS names somewhere to go
 * and never returns null. It deliberately does not read `mock_interview` at all:
 *   - holding the row is no longer a way in, and 14 tenants hold it;
 *   - 5 tenants hold NO feature rows at all, and the catalogue has always read "no rows" as
 *     "holds everything", so a feature-row check could never have retired this for them.
 * That is the whole reason this function stopped being a feature check and became a redirect.
 *
 * KEPT, UNTOUCHED - /mock-interview/courses and the runner /mock-interview/<id>: the course and
 * journey interview ROUNDS. A template-started round runs through the SAME runner pages, and the
 * rounds are governed by the course (`AdaptiveCourse.interview_rounds_enabled`), never by the
 * row. 468 live templates across 9 tenants depend on them, and TechU holds 74 of those while
 * holding no feature row at all. `isStandaloneLegacyInterviewPath` is the line between the two
 * products: widen it to the whole prefix and you retire the rounds the courses were built with.
 *
 * Nothing is deleted. Historical attempts stay exactly as they are and stay readable to admins
 * at /admin/admin-mock-interview/sessions; rounds are still built at .../templates.
 */
export function legacyInterviewDestination(
  features: ReadonlyArray<{ name: string }> | undefined,
): "/interview" | "/dashboard" {
  const holds = (name: string) => Boolean(features?.some((f) => f.name === name));
  return holds("interview_realtime") ? "/interview" : "/dashboard";
}

const STANDALONE_PAGES = [
  /^\/mock-interview\/?$/,
  /^\/mock-interview\/(quick-start|schedule|scheduled)(\/|$)/,
];

/** True for the standalone product's own pages; false for the course rounds and the runner. */
export function isStandaloneLegacyInterviewPath(pathname: string | null | undefined): boolean {
  return STANDALONE_PAGES.some((re) => re.test(pathname ?? ""));
}
