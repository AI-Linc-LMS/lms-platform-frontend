"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { config } from "@/lib/config";
import { notificationService, type Notification } from "@/lib/services/notification.service";
import { useToast } from "@/components/common/Toast";

const COMMUNITY_TOAST_TYPES = new Set<string>([
  "community_thread",
  "community_reply",
  "community_mention",
  "community_helpful",
  "community_live_starting",
]);

const SEEN_KEY = "ailinc_community_notif_last_seen";
const POLL_INTERVAL_MS = 30_000;
// After this many consecutive errors the hook gives up until the next page mount.
// Prevents notification 4xx/5xx errors from spamming the dev console every 30s
// when the backend is unreachable or the user isn't authenticated.
const MAX_CONSECUTIVE_FAILURES = 2;

function getStoredLastSeen(): string | null {
  try {
    return sessionStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

function setStoredLastSeen(value: string) {
  try {
    sessionStorage.setItem(SEEN_KEY, value);
  } catch {
    /* ignore */
  }
}

/**
 * Polls the notification endpoint every 30 seconds and surfaces unseen
 * community-related notifications as toast messages. The popover stays the
 * authoritative full list — this is just a "tap on the shoulder" for things
 * that happened while the user was on the community page.
 *
 * Notifications are only toasted once per session via sessionStorage of the
 * latest `created_at`. Reloading the tab will start fresh.
 */
export function useCommunityNotifications(opts: { enabled?: boolean } = {}) {
  const { enabled = true } = opts;
  const { showToast } = useToast();
  const router = useRouter();
  const lastSeenRef = useRef<string | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    lastSeenRef.current = getStoredLastSeen();

    let stopped = false;
    let failures = 0;
    let intervalId: number | null = null;

    const stop = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const poll = async () => {
      try {
        const res = await notificationService.getNotifications(config.clientId, 1, 20);
        if (stopped) return;
        failures = 0;
        const items = res.results.filter((n) =>
          COMMUNITY_TOAST_TYPES.has(n.notification_type)
        );
        setUnread(items.filter((n) => !n.is_read).length);

        const lastSeenIso = lastSeenRef.current;
        const fresh = items
          .filter((n) => !n.is_read && (!lastSeenIso || n.created_at > lastSeenIso))
          .sort((a, b) => a.created_at.localeCompare(b.created_at));

        for (const n of fresh) {
          showToast(`${n.title} — ${n.message}`, severityFor(n));
          if (n.created_at > (lastSeenRef.current ?? "")) {
            lastSeenRef.current = n.created_at;
          }
        }
        if (lastSeenRef.current) setStoredLastSeen(lastSeenRef.current);
      } catch {
        // Backend down or unauthenticated. Back off so we don't keep
        // throwing AxiosErrors into the console every 30 seconds.
        failures += 1;
        if (failures >= MAX_CONSECUTIVE_FAILURES) {
          stop();
        }
      }
    };

    void poll();
    intervalId = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      stopped = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { unread, navigateToNotification };
}

function severityFor(n: Notification): "info" | "success" | "error" {
  if (n.notification_type === "community_helpful") return "success";
  if (n.notification_type === "community_live_starting") return "info";
  return "info";
}

function navigateToNotification(n: Notification) {
  const url = n.action_url;
  if (!url) return;
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
}
