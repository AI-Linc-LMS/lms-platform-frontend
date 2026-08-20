/**
 * Tiny module-level TTL cache for service GETs, with in-flight dedup.
 *
 * The pattern the repo already uses ad hoc (adaptive-journey.service's 5-min
 * module cache, the AppBar's leaderboard/streak cache), extracted so hot list
 * pages stop replaying a full skeleton + refetch when the user bounces back
 * to a page they saw seconds ago. Session-scoped on purpose: it needs no
 * invalidation story beyond `invalidate()` on the obvious mutations, and the
 * persisted TanStack cache still covers cross-reload paints where adopted.
 */
const store = new Map<string, { ts: number; data: unknown; promise?: Promise<unknown> }>();

export async function cachedGet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 120_000,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit) {
    if (hit.promise) return hit.promise as Promise<T>;
    if (now - hit.ts < ttlMs) return hit.data as T;
  }
  const promise = fetcher().then(
    (data) => {
      store.set(key, { ts: Date.now(), data });
      return data;
    },
    (err) => {
      // Never cache failures.
      store.delete(key);
      throw err;
    },
  );
  store.set(key, { ts: now, data: hit?.data, promise });
  return promise;
}

/** Drop every cached entry whose key starts with the prefix. */
export function invalidateCached(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
