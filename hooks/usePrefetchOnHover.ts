"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Warm a route while the user is still deciding to click it.
 *
 * `<Link>` prefetches on its own; `router.push()` does not. Most navigation in this app is an
 * imperative push from a card or a row, so the route only begins loading *after* the click — the
 * user waits through the whole round trip while looking at the old screen.
 *
 * Hover and keyboard focus are the earliest honest signals of intent, and they arrive a few hundred
 * milliseconds before the click. That is usually enough for the route to be ready by the time the
 * click lands.
 *
 * Returns props to spread onto the clickable element. It deliberately changes nothing else:
 *
 * * **No markup change.** Only event handlers, so layout, styling and accessibility are untouched.
 * * **No effect on navigation.** The click path still runs exactly as before, so scroll behaviour —
 *   which differs between `<Link>` and `router.push()` in subtle ways — cannot shift.
 * * **Fires once per href.** Hovering along a list of cards prefetches each at most once, and
 *   sweeping the mouse across a grid will not re-request anything.
 * * **Cannot break a click.** `prefetch` is best-effort: a failure (offline, a route that 404s) is
 *   swallowed, and the click then behaves as it does today.
 *
 * Hover is intent-driven, so this stays bounded — only routes the user actually points at are
 * fetched, unlike viewport-based prefetching which would pull every card in a long list.
 *
 * ```tsx
 * const prefetch = usePrefetchOnHover(`/courses/${course.id}`);
 * <Card onClick={open} {...prefetch}>…</Card>
 * ```
 */
export function usePrefetchOnHover(href: string | null | undefined) {
  const router = useRouter();
  const doneRef = useRef<string | null>(null);

  const warm = useCallback(() => {
    if (!href || doneRef.current === href) return;
    doneRef.current = href;
    try {
      router.prefetch(href);
    } catch {
      // Best-effort only — never let warming a route interfere with using the page.
    }
  }, [router, href]);

  return { onMouseEnter: warm, onFocus: warm };
}
