/**
 * RETIRED. This was the hub: the mode selector, the stats strip and the tabs
 * of the standalone legacy mock interview, a product now switched off for every tenant.
 * Nothing of that page is left here.
 *
 * The file stays so the URL still MATCHES a route and app/mock-interview/layout.tsx runs and
 * redirects a stale bookmark to the rebuilt interview or the dashboard. Delete it and Next.js
 * answers with the root not-found page instead - nested layouts are not applied to a route that
 * matched nothing - so a learner with an old link would get a 404 rather than a way back, and
 * there are 1,456 historical attempts across 12 tenants behind links like these.
 *
 * The layout returns null for every standalone path, so this component is never painted.
 */
export default function RetiredStandaloneInterviewHub() {
  return null;
}
