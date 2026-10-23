/**
 * Where a visit to the legacy mock interview (/mock-interview) belongs for this tenant.
 *
 * `null` means the page may render: the tenant holds `mock_interview`, or holds NO features at all,
 * which the catalogue has always treated as holding everything (the sidebar in navModel.ts and the
 * backend's client_has_feature apply the same rule, so a legacy tenant is not turned away here
 * alone). Otherwise the rebuilt interview when the tenant holds it, else the dashboard.
 *
 * The sidebar already hides the entry for a tenant without the row, but a bookmark, a course link
 * or the dashboard still landed here and the page rendered as if nothing had changed: TechU kept a
 * working /mock-interview after its row was removed on 2026-10-23. The backend now refuses the
 * legacy API for such a tenant, so the page would be a shell of failed calls.
 */
export function legacyInterviewDestination(
  features: ReadonlyArray<{ name: string }> | undefined,
): "/interview" | "/dashboard" | null {
  if (!features || features.length === 0) return null;
  const holds = (name: string) => features.some((f) => f.name === name);
  if (holds("mock_interview")) return null;
  return holds("interview_realtime") ? "/interview" : "/dashboard";
}
