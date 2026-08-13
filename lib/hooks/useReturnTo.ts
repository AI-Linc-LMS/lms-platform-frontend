"use client";

import { useSearchParams } from "next/navigation";

/**
 * Where a content player should send the learner "back" to.
 *
 * The article reader, quiz engine and coding editor are shared runtimes reached from more than
 * one module. Hard-coding "Back to course" is wrong for anyone who arrived from a roadmap: it
 * ends their session in a product they did not choose. Callers pass `?from=<path>` and this
 * resolves it, falling back to whatever the module's own default is.
 *
 * Only same-origin ABSOLUTE PATHS are honoured. A `from` of `https://evil.example` or
 * `//evil.example` is ignored rather than followed, because this value comes from the URL bar
 * and a redirect target taken from user input is an open redirect.
 */
export function useReturnTo(fallback: { href: string; label: string }): {
  href: string;
  label: string;
} {
  const params = useSearchParams();
  const raw = params?.get("from") ?? "";

  // Must start with a single "/" — rejects absolute URLs and protocol-relative "//host".
  const isSafePath = raw.startsWith("/") && !raw.startsWith("//");
  if (!isSafePath) return fallback;

  const label = raw.startsWith("/roadmaps/") ? "Back to roadmap" : "Back";
  return { href: raw, label };
}
