/**
 * Carry a `?from=` return target across a multi-step runtime.
 *
 * `useReturnTo` resolves the param, but only for a page that actually receives it. The adaptive
 * quiz is three hops -- /adaptive-quizzes/start -> /session/<id> -> /session/<id>/results -- and a
 * param dropped at any hop is a learner who finishes a quiz launched from inside a course and is
 * returned to the standalone quiz library instead of the lesson they came from.
 *
 * Kept as a plain function (not a hook) so it can be used in loops and callbacks.
 */
export function withFrom(href: string, from: string | null | undefined): string {
  if (!from) return href;
  // Same-origin absolute paths only, matching useReturnTo's guard. A `from` of
  // `https://evil.example` or `//evil.example` is dropped rather than propagated.
  if (!from.startsWith("/") || from.startsWith("//")) return href;
  return `${href}${href.includes("?") ? "&" : "?"}from=${encodeURIComponent(from)}`;
}
