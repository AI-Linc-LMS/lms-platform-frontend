"use client";

import { useEffect, useRef } from "react";
import {
  activityService,
  getTimeTrackingSessionId,
} from "@/lib/services/activity.service";

/**
 * Tracks "time on platform" and posts small deltas to the backend.
 *
 * Previously this sent raw wall-clock elapsed (`Date.now() - segmentStart`) with
 * NO cap, and only on tab-hide / unload. If the OS slept (or a tab sat open for
 * hours) with a segment open, `Date.now()` jumped forward by the whole span and
 * that entire duration was posted as "time spent" - the cause of absurdly large
 * values. This version:
 *   - sends a heartbeat every HEARTBEAT so each delta is small (~1 min),
 *   - CAPS every delta at MAX_DELTA_SECONDS, so a sleep/suspend jump can never
 *     post more than a minute or two,
 *   - pauses counting when the tab is hidden OR the user has been idle
 *     (no interaction) for IDLE_LIMIT, and
 *   - resets the segment start synchronously before the async send, so a
 *     hide-then-unload race can't post the same delta twice.
 */
const HEARTBEAT_MS = 60_000; // flush at most once a minute while active
const MAX_DELTA_SECONDS = 120; // hard cap per send (bounds sleep/suspend jumps)
const IDLE_LIMIT_MS = 10 * 60_000; // no interaction for 10 min => stop counting

export const useTimeTracking = (active: boolean = true) => {
  const startTimeRef = useRef<number>(Date.now());
  const lastInteractionRef = useRef<number>(Date.now());

  const getDeviceType = () => {
    if (typeof window === "undefined") return "desktop";
    const width = window.innerWidth;
    if (width <= 768) return "mobile";
    if (width <= 1024) return "tablet";
    return "desktop";
  };

  const getFormattedDate = () => new Date().toISOString().split("T")[0];

  /**
   * Flush the current segment. `requireActive` drops the segment if the user has
   * been idle (used by the heartbeat); the hide/unload flushes pass it false so a
   * genuine "leaving" still records the time up to that moment.
   */
  const flush = (isSessionEnd: boolean, requireActive: boolean) => {
    if (typeof document !== "undefined" && document.hidden && !isSessionEnd) {
      return; // don't accrue while the tab is in the background
    }
    const now = Date.now();
    const elapsed = Math.floor((now - startTimeRef.current) / 1000);
    // Reset the segment start BEFORE the async send so a concurrent event
    // (e.g. beforeunload right after visibilitychange) can't re-post this delta.
    startTimeRef.current = now;
    if (elapsed <= 0) return;
    if (requireActive && now - lastInteractionRef.current > IDLE_LIMIT_MS) {
      return; // idle: discard this segment entirely
    }
    const seconds = Math.min(elapsed, MAX_DELTA_SECONDS); // <-- the cap
    void activityService
      .trackTime({
        time_spent_seconds: seconds,
        session_id: getTimeTrackingSessionId(),
        date: getFormattedDate(),
        device_type: getDeviceType(),
        session_only: isSessionEnd,
      })
      .catch(() => {
        /* silently ignore */
      });
  };

  const resetSegmentStart = () => {
    startTimeRef.current = Date.now();
    lastInteractionRef.current = Date.now();
  };

  useEffect(() => {
    if (!active) return;

    resetSegmentStart();

    const markInteraction = () => {
      lastInteractionRef.current = Date.now();
    };
    const interactionEvents = ["pointerdown", "keydown", "scroll", "mousemove", "touchstart"];
    interactionEvents.forEach((e) =>
      window.addEventListener(e, markInteraction, { passive: true }),
    );

    const heartbeat = window.setInterval(() => flush(false, true), HEARTBEAT_MS);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        flush(true, false); // record time up to the moment they left
      } else {
        resetSegmentStart(); // new segment; don't count the hidden gap
      }
    };
    const handleBeforeUnload = () => flush(true, false);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.clearInterval(heartbeat);
      interactionEvents.forEach((e) => window.removeEventListener(e, markInteraction));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return null;
};
