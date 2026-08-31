"use client";

import { useCallback, useMemo, useRef } from "react";

/**
 * The monotonic stale-response guard, lifted verbatim from
 * `app/admin/jobs-v2/scraped/page.tsx` — the one list in the module that already got this
 * right. Every other loader raced: type "eng", pause, type "ineer", and the slower first
 * response landed last and overwrote the correct rows.
 *
 * Usage is exactly the shape the scraped queue used, so its semantics are unchanged:
 *
 * ```ts
 * const seq = useSeq();
 * const load = useCallback(async () => {
 *   const token = seq.next();
 *   setLoading(true);
 *   try {
 *     const data = await service.get(...);
 *     if (!seq.isCurrent(token)) return;   // a newer request owns the screen
 *     ...
 *   } catch (err) {
 *     if (!seq.isCurrent(token)) return;
 *     setLoadError(message);               // NEVER setRows([])
 *   }
 * }, [seq, ...]);
 * ```
 */
export interface Seq {
  /** Claim the screen. Returns the token this request must be checked against. */
  next: () => number;
  /** True while `token` is still the newest request issued. */
  isCurrent: (token: number) => boolean;
  /** The newest token issued so far. */
  current: () => number;
  /**
   * Invalidate every in-flight request without issuing a new one — for unmount-adjacent
   * cleanup, or for a "cancel" control.
   */
  invalidate: () => void;
}

export function useSeq(): Seq {
  const ref = useRef(0);

  const next = useCallback(() => {
    ref.current += 1;
    return ref.current;
  }, []);

  const isCurrent = useCallback((token: number) => token === ref.current, []);

  const current = useCallback(() => ref.current, []);

  const invalidate = useCallback(() => {
    ref.current += 1;
  }, []);

  // The object identity is stable: every member is a stable useCallback, so a `useCallback`
  // loader can safely list `seq` in its dependency array without re-creating itself.
  return useMemo(
    () => ({ next, isCurrent, current, invalidate }),
    [next, isCurrent, current, invalidate],
  );
}
