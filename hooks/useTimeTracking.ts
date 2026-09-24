"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  activityService,
  getTimeTrackingSessionId,
} from "@/lib/services/activity.service";
import { lastPracticePulse } from "@/lib/activity/practicePulse";

/**
 * Tracks two different things about the same wall clock and keeps them apart.
 *
 *  - PRESENCE (`time_spent_seconds`): how long the learner was in the app. The heartbeat is
 *    mounted on every authenticated page, so this is the right input for engagement reporting.
 *  - PRACTICE (`learning_seconds`): how much of that was spent WORKING ON CONTENT. This is what
 *    the dashboard's "15-min practice" goal reads, so it has to mean the learner practised and
 *    not that a tab was open.
 *
 * History, because each guard here is a bug that shipped:
 *   - Raw wall-clock elapsed with no cap, flushed only on hide/unload, so an OS sleep with a
 *     segment open posted the whole span as time spent. Hence the heartbeat and MAX_DELTA_SECONDS.
 *   - Presence counted as practice, so sitting on the dashboard completed the practice goal.
 *     Hence the split, and LEARNING_ROUTES.
 *   - The split was one boolean for the whole segment, read at FLUSH time. A segment straddles a
 *     navigation, so every click from the dashboard into a lesson filed up to two minutes of
 *     dashboard time as practice - the same bug again, one heartbeat at a time. Hence slices:
 *     the clock is closed off and banked at every route change, and the delta carries the split.
 *   - Idle only had to beat a ten minute limit, so a learning page that was opened and abandoned
 *     banked ten of the fifteen minutes on its own. Hence LEARNING_IDLE_LIMIT_MS.
 */

/**
 * Routes where the time spent is PRACTICE.
 *
 * The test is "is the learner working on a piece of content here", not "is this part of a
 * course". Catalogues, menus, pickers and results screens are where a learner looks at their
 * learning; they are not where the learning happens, and counting them is how a goal completes
 * itself for someone who opened nothing. That reading excludes, deliberately:
 *   - /dashboard, the screen the complaint came from;
 *   - /adaptive-courses/<id>/submodule/<id>, the submodule MENU that lists watch/read/quiz/solve;
 *   - /adaptive-quizzes and /adaptive-quizzes/start, the quiz picker;
 *   - /adaptive-quizzes/session/<id>/results, reading a score you already earned;
 *   - /courses/<id>, a route that no longer exists since the legacy player was removed.
 *
 * Not included, and not an oversight: mock interviews and the interview room. They are plausibly
 * practice, but adding a surface GRANTS credit and this change is meant to only ever remove it;
 * a surface that should count can be added on its own evidence.
 */
const LEARNING_ROUTES = [
  // A lesson being read, a video being watched, a problem being solved.
  /^\/adaptive-courses\/[^/]+\/submodule\/[^/]+\/(article|video|coding)\/[^/]+/,
  // The adaptive quiz runtime - the session itself, never its results page.
  /^\/adaptive-quizzes\/session\/[^/]+\/?$/,
  // Sitting a paper.
  /^\/assessments\/[^/]+\/(take|calibration)(\/|$)/,
  // Roadmap step content.
  /^\/roadmaps\/[^/]+\/step\/[^/]+/,
];

const isLearningPath = (path: string | null): boolean =>
  !!path && LEARNING_ROUTES.some((re) => re.test(path));

const HEARTBEAT_MS = 60_000; // flush at most once a minute while active
const MAX_DELTA_SECONDS = 120; // hard cap per send (bounds sleep/suspend jumps)
const IDLE_LIMIT_MS = 10 * 60_000; // presence: no interaction for 10 min => stop counting
/**
 * Practice is held to a much shorter idle limit than presence.
 *
 * Presence answers "were they here", and someone reading with their hands off the keyboard is
 * still here. Practice claims they were WORKING, and ten minutes of that claim can be bought by
 * opening a lesson and walking away - two thirds of the goal, for nothing. Three minutes is long
 * enough that a still reader is never cut off (any pointer move, key, scroll or touch restarts
 * it) and short enough that an abandoned tab cannot earn the goal. Video, which produces no
 * input events at all, reports playback through the practice pulse instead.
 */
const LEARNING_IDLE_LIMIT_MS = 3 * 60_000;

export const useTimeTracking = (active: boolean = true) => {
  /** Start of the stretch of time that has not been banked into `pendingRef` yet. */
  const sliceStartRef = useRef<number>(Date.now());
  /** Banked milliseconds awaiting a send, already split. `learning` is always <= `total`. */
  const pendingRef = useRef<{ total: number; learning: number }>({ total: 0, learning: 0 });
  const lastInteractionRef = useRef<number>(Date.now());
  const pathname = usePathname();
  /**
   * Whether the CURRENT route is a practice surface. Assigned from an effect, never during
   * render: the slice that is ending has to be banked against the page being left, and by render
   * time `pathname` is already the page being opened.
   */
  const learningRef = useRef(false);

  const getDeviceType = () => {
    if (typeof window === "undefined") return "desktop";
    const width = window.innerWidth;
    if (width <= 768) return "mobile";
    if (width <= 1024) return "tablet";
    return "desktop";
  };

  const getFormattedDate = () => new Date().toISOString().split("T")[0];

  /** The last moment we have evidence the learner was working: input, or media playback. */
  const lastActivityAt = () => Math.max(lastInteractionRef.current, lastPracticePulse());

  /**
   * Close off the time since the last slice boundary and bank it, splitting presence from
   * practice. Cheap and purely local - no request - so it can run on every navigation.
   *
   * `requireActive` drops the slice from presence too when the learner has been idle past the
   * presence limit (the heartbeat passes it); a genuine "leaving" passes false so the seconds up
   * to the moment they left are still recorded. The practice limit applies either way: a stretch
   * nobody was working through is not practice just because it ended on a lesson page.
   */
  const closeSlice = (now: number, requireActive: boolean) => {
    const ms = now - sliceStartRef.current;
    // Reset the boundary BEFORE anything can return early, so no stretch of time is ever banked
    // twice by a concurrent event (visibilitychange immediately followed by beforeunload).
    sliceStartRef.current = now;
    if (ms <= 0) return;
    const idleFor = now - lastActivityAt();
    if (requireActive && idleFor > IDLE_LIMIT_MS) return; // idle: discard this slice entirely
    pendingRef.current.total += ms;
    if (learningRef.current && idleFor <= LEARNING_IDLE_LIMIT_MS) {
      pendingRef.current.learning += ms;
    }
  };

  /** Send whatever has been banked. */
  const send = (isSessionEnd: boolean) => {
    const pending = pendingRef.current;
    const totalSeconds = Math.floor(pending.total / 1000);
    if (totalSeconds <= 0) return;
    // The cap bounds a clock jump, so the excess is dropped rather than carried forward.
    const seconds = Math.min(totalSeconds, MAX_DELTA_SECONDS);
    const learningSeconds = Math.min(Math.floor(pending.learning / 1000), seconds);
    pendingRef.current = { total: 0, learning: 0 };
    void activityService
      .trackTime({
        time_spent_seconds: seconds,
        learning_seconds: learningSeconds,
        // Kept for a backend that has not shipped the split yet; it reads as "all of it", which
        // is what that backend would have recorded anyway.
        is_learning: learningSeconds > 0,
        session_id: getTimeTrackingSessionId(),
        date: getFormattedDate(),
        device_type: getDeviceType(),
        session_only: isSessionEnd,
      })
      .catch(() => {
        /* silently ignore */
      });
  };

  const flush = (isSessionEnd: boolean, requireActive: boolean) => {
    if (typeof document !== "undefined" && document.hidden && !isSessionEnd) {
      return; // don't accrue while the tab is in the background
    }
    closeSlice(Date.now(), requireActive);
    send(isSessionEnd);
  };

  const resetSegmentStart = () => {
    sliceStartRef.current = Date.now();
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
    // Media events do not bubble, but they do reach a capturing listener on the document, so one
    // listener covers every native <video>/<audio> on the page without the player knowing about
    // time tracking. Embedded players (Vimeo) have no element to listen to and report playback
    // through the practice pulse instead.
    document.addEventListener("timeupdate", markInteraction, { capture: true });

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
      document.removeEventListener("timeupdate", markInteraction, { capture: true });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Bank the slice that ends at this navigation BEFORE adopting the new route's verdict. The
  // seconds just spent belong to the page being left. Declared after the effect above so that on
  // first mount the segment start is reset before this runs.
  useEffect(() => {
    if (!active) return;
    if (typeof document !== "undefined" && document.hidden) {
      // A background tab accrues nothing, and its slice boundary is re-set the moment it comes
      // back. Banking here instead would file the whole hidden stretch as time in the app, since
      // the heartbeat deliberately leaves the boundary alone while hidden.
      sliceStartRef.current = Date.now();
    } else {
      closeSlice(Date.now(), false);
    }
    learningRef.current = isLearningPath(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, active]);

  return null;
};
