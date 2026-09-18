import { notificationService } from "@/lib/services/notification.service";

/**
 * The unread badge's count, cached across AppBar remounts.
 *
 * MainLayout (and therefore AppBar) is rendered per page, so it REMOUNTS on every navigation, and
 * every page transition used to fire another unread-count request. Within the TTL a remount reuses
 * the last value instead, and concurrent callers share one request. The 60s poll passes
 * `force` so live updates are unaffected.
 *
 * Every local change to the count must be written HERE, not only into component state. Reported
 * as "after opening a notification it is not marked as read; the second time it is": clicking one
 * marked it read on the server and decremented the badge in state, then navigated to its link.
 * The new page's AppBar re-read this cache, which still held the old count, so the badge put the
 * notification back until the next forced fetch.
 */
const UNREAD_TTL_MS = 60_000;

let cache: { clientId: unknown; count: number; at: number } | null = null;
let inFlight: Promise<number> | null = null;
/** Bumped on every local write, so a request that started before it cannot overwrite it. */
let generation = 0;

export function getUnreadCountCached(clientId: unknown, force = false): Promise<number> {
  const fresh = cache !== null && cache.clientId === clientId && Date.now() - cache.at < UNREAD_TTL_MS;
  if (!force && fresh) return Promise.resolve(cache!.count);
  if (!force && inFlight) return inFlight;
  const startedAt = generation;
  const request = notificationService
    .getUnreadCount(clientId as never)
    .then((count) => {
      if (startedAt !== generation && cache && cache.clientId === clientId) return cache.count;
      cache = { clientId, count, at: Date.now() };
      return count;
    })
    .finally(() => {
      if (inFlight === request) inFlight = null;
    });
  inFlight = request;
  return request;
}

/** Record a count the client knows to be true (after marking one or all read). */
export function setUnreadCountCached(clientId: unknown, count: number): void {
  generation += 1;
  cache = { clientId, count: Math.max(0, count), at: Date.now() };
}

/** The cached count, if any, for `clientId`. */
export function peekUnreadCount(clientId: unknown): number | null {
  return cache && cache.clientId === clientId ? cache.count : null;
}

/** Test hook. */
export function __resetUnreadBadge(): void {
  cache = null;
  inFlight = null;
  generation = 0;
}
