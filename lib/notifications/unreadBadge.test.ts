/**
 * "Even after clicking the notification and opening the message, it is not marked as read. The
 * second time, it is." The click marked it read and navigated; the next page's app bar read the
 * unread count back from this cache, which still held the old number.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUnreadCount = vi.hoisted(() => vi.fn());
vi.mock("@/lib/services/notification.service", () => ({ notificationService: { getUnreadCount } }));

import { __resetUnreadBadge, getUnreadCountCached, setUnreadCountCached } from "./unreadBadge";

beforeEach(() => {
  __resetUnreadBadge();
  getUnreadCount.mockReset();
});

describe("the unread badge cache", () => {
  it("serves a remount from the cache within the TTL", async () => {
    getUnreadCount.mockResolvedValue(3);
    expect(await getUnreadCountCached(1, true)).toBe(3);
    expect(await getUnreadCountCached(1)).toBe(3);
    expect(getUnreadCount).toHaveBeenCalledTimes(1);
  });

  it("a remount after marking one read shows the new count, not the cached one", async () => {
    getUnreadCount.mockResolvedValue(3);
    await getUnreadCountCached(1, true); // opening the panel
    setUnreadCountCached(1, 2); // clicking one notification
    expect(await getUnreadCountCached(1)).toBe(2); // the next page's app bar
    expect(getUnreadCount).toHaveBeenCalledTimes(1);
  });

  it("a request that started before the click cannot put the old count back", async () => {
    let resolve!: (n: number) => void;
    getUnreadCount.mockReturnValue(new Promise<number>((r) => (resolve = r)));
    const pending = getUnreadCountCached(1, true);
    setUnreadCountCached(1, 0); // mark all read while the count request is in flight
    resolve(4);
    expect(await pending).toBe(0);
    expect(await getUnreadCountCached(1)).toBe(0);
  });

  it("never goes below zero, and is per tenant", async () => {
    setUnreadCountCached(1, -1);
    expect(await getUnreadCountCached(1)).toBe(0);
    getUnreadCount.mockResolvedValue(7);
    expect(await getUnreadCountCached(2)).toBe(7);
  });
});
