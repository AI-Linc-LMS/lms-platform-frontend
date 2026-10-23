/**
 * Where a visit to the legacy mock interview belongs for this tenant, and which of its pages the
 * question applies to.
 *
 * /mock-interview is two products behind one URL prefix. The hub, quick-start, schedule and
 * scheduled pages are the STANDALONE legacy product, the one the `mock_interview` feature row
 * describes and the one a tenant switches off. /mock-interview/courses and /mock-interview/<id>
 * are the course and journey interview ROUNDS: a template-started interview runs through the same
 * runner pages, and those rounds are governed by the course (`interview_rounds_enabled`), not by
 * the row. TechU held 74 active templates across 12 such courses while holding no row at all, so
 * guarding the whole prefix would have retired the rounds its courses were built with.
 *
 * `legacyInterviewDestination` returns `null` when the page may render: the tenant holds
 * `mock_interview`, or holds NO features at all, which the catalogue has always treated as holding
 * everything (the sidebar in navModel.ts and the backend's client_has_feature apply the same rule).
 * Otherwise the rebuilt interview when the tenant holds it, else the dashboard.
 */
export function legacyInterviewDestination(
  features: ReadonlyArray<{ name: string }> | undefined,
): "/interview" | "/dashboard" | null {
  if (!features || features.length === 0) return null;
  const holds = (name: string) => features.some((f) => f.name === name);
  if (holds("mock_interview")) return null;
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
