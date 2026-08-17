/**
 * URL prefixes that bypass the auth gate in `proxy.ts`.
 *
 * Its own module, with no `next/server` import, so that three places can share ONE definition:
 * the proxy itself, tests, and the build-time gate in `next.config.ts` (which runs before the
 * webpack alias exists and so cannot import app code that pulls in Next internals).
 *
 * Why this is not just inlined in proxy.ts: getting it wrong is silent and expensive. The
 * proctoring model weights were served from `/models/...`, which is not on this list, so every
 * request for them 307'd to `/login` and tfjs received an HTML page where it expected JSON. The
 * device check then reported "No face detected" to students whose cameras were working fine.
 * Nothing failed loudly; it just fell back to a third-party CDN and looked like a camera problem.
 *
 * The copy-a-rule-into-a-test pattern is already known to drift in this repo: `proxy.test.ts`
 * instructs "keep the two literally identical", and they are not — `proxy.ts` gained a
 * "/roadmaps" entry that the test's copy never got, so that test passes while guarding a rule the
 * app no longer has. One exported constant, imported everywhere, cannot drift.
 */
export const PUBLIC_ASSET_PREFIXES = ["/images/", "/videos/", "/assets/"] as const;
