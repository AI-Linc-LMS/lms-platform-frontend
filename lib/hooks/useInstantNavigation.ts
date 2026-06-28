"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";

/**
 * Lightning-fast client navigation, reusing the sidebar's recipe:
 *  - `prefetch(href)` warms the route chunk (call on hover/focus) so the click has nothing to fetch.
 *  - `push`/`replace` navigate inside a React transition, so the click is acknowledged instantly and
 *    the route-segment `loading.tsx` shimmer shows immediately while the destination's data loads.
 *
 * Usage at a nav site:
 *   const { push, prefetch } = useInstantNavigation();
 *   <Box onMouseEnter={() => prefetch(href)} onFocus={() => prefetch(href)} onClick={() => push(href)} />
 *
 * Never `await` an API before calling push — navigate first and let the destination fetch + shimmer.
 */
export function useInstantNavigation() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const push = useCallback(
    (href: string) => startTransition(() => router.push(href)),
    [router],
  );
  const replace = useCallback(
    (href: string) => startTransition(() => router.replace(href)),
    [router],
  );
  // Best-effort warm-up; router.prefetch resolves async and never throws into render.
  const prefetch = useCallback(
    (href: string) => {
      try {
        router.prefetch(href);
      } catch {
        /* prefetch is an optimization — ignore failures */
      }
    },
    [router],
  );

  return { push, replace, prefetch, isPending };
}
