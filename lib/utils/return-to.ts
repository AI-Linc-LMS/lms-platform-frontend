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

// A throwaway origin to resolve a candidate path against. Nothing is ever fetched from it.
const PROBE_ORIGIN = "https://x.invalid";

/**
 * `raw` if it is safe to navigate to - a path on THIS site - else null.
 *
 * `from` arrives in the URL bar, and a redirect target taken from user input is an open redirect.
 * Starting with a single "/" is not enough: browsers read "\" as "/" and silently drop tabs and
 * newlines while parsing, so "/\evil.example/x" and "/<TAB>/evil.example" both become
 * "//evil.example" - another site - and the router navigates there. So: no backslash or control
 * character at all, a leading "/" that is not "//", and resolving it must not leave this origin.
 * The one guard for `useReturnTo`, `withFrom` and the quiz runtime.
 */
export function safeFrom(raw: string | null | undefined): string | null {
  if (!raw) return null;
  for (let i = 0; i < raw.length; i += 1) {
    const code = raw.charCodeAt(i);
    if (code < 0x20 || code === 0x7f || raw[i] === "\\") return null;
  }
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  try {
    if (new URL(raw, PROBE_ORIGIN).origin !== PROBE_ORIGIN) return null;
  } catch {
    return null;
  }
  return raw;
}

export function withFrom(href: string, from: string | null | undefined): string {
  // Same-origin paths only (see `safeFrom`): anything else is dropped rather than propagated.
  const safe = safeFrom(from);
  if (!safe) return href;
  return `${href}${href.includes("?") ? "&" : "?"}from=${encodeURIComponent(safe)}`;
}
