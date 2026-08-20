"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/common/Toast";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import {
  studentLiveSessionsService,
  StudentLiveSession,
} from "@/lib/services/live-sessions";
import { getLiveSessionErrorMessage, copyToClipboard } from "@/lib/utils/live-session-errors";

const LIVE_SESSIONS_FEATURE = "live_sessions";
/** How close (ms) to a status boundary the coarse 60s safety-net poll runs. */
const NEAR_BOUNDARY_MS = 15 * 60 * 1000;
const SAFETY_POLL_MS = 60_000;
/** A tab returning to view refetches only if its snapshot is older than this. */
const STALE_ON_FOCUS_MS = 60_000;
/** setTimeout overflows (and fires IMMEDIATELY) past ~24.8 days; clamp far boundaries well below
 *  that. A clamped timer just reloads early and reschedules - an overflowed one fetch-loops. */
const MAX_TIMER_MS = 6 * 60 * 60 * 1000;

/**
 * The instants at which some session's status flips, from the list we already have: every future
 * start, and the scheduled end of anything currently running. `next` is the earliest one still
 * ahead (null when none). `near` means something is within ±15 min of a boundary - about to
 * start, currently live, or just ended - which is when polling is worth its requests.
 */
function statusBoundaries(
  sessions: StudentLiveSession[],
  now: number,
): { next: number | null; near: boolean } {
  let next = Infinity;
  let near = false;
  const consider = (startIso?: string | null, durationMin?: number | null) => {
    if (!startIso) return;
    const start = new Date(startIso).getTime();
    if (Number.isNaN(start)) return;
    const end = start + (durationMin || 60) * 60_000;
    if (start > now) next = Math.min(next, start);
    else if (now <= end) next = Math.min(next, end);
    if (Math.abs(start - now) <= NEAR_BOUNDARY_MS || (start <= now && now <= end + NEAR_BOUNDARY_MS)) {
      near = true;
    }
  };
  for (const s of sessions) {
    if (s.notice_type === "cancelled") continue;
    const occs = s.occurrences ?? [];
    if (s.zoom_is_recurring && occs.length > 0) {
      // A recurring series' own class_datetime is frozen at occurrence #1; the dates that can
      // actually flip status are the occurrences'.
      for (const o of occs) {
        if (o.status === "cancelled" || o.meeting_status === "cancelled") continue;
        consider(o.occurrence_datetime, o.duration_minutes ?? s.duration_minutes);
      }
    } else {
      consider(s.class_datetime, s.duration_minutes);
    }
  }
  return { next: Number.isFinite(next) ? next : null, near };
}

function formatCompactMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "";
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function useLiveSessions() {
  const { t } = useTranslation("common");
  const { clientInfo, loading: loadingClientInfo } = useClientInfo();
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<StudentLiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [watchingRecordingId, setWatchingRecordingId] = useState<
    number | null
  >(null);
  // In-app playback + session summary (provider-neutral: Zoom cloud MP4s and Google Meet
  // Drive recordings both stream through the backend proxy - "watch ON platform").
  const [playerSession, setPlayerSession] = useState<StudentLiveSession | null>(null);
  const [summarySession, setSummarySession] = useState<StudentLiveSession | null>(null);

  const enabledFeatureNames = new Set(
    clientInfo?.features?.map((f) => f.name) ?? []
  );
  const hasLiveSessionsFeature =
    enabledFeatureNames.size === 0 ||
    enabledFeatureNames.has(LIVE_SESSIONS_FEATURE);

  // Self-refresh machinery. The page used to fetch exactly once on mount, so "Join now" never
  // appeared without a manual refresh and the LIVE hero lingered after a session ended.
  const inFlightRef = useRef(false);
  const lastLoadAtRef = useRef(0);
  // Bumped after every COMPLETED load so the scheduler re-evaluates with a fresh clock even when
  // the payload (and therefore the digest) did not change.
  const [loadStamp, setLoadStamp] = useState(0);
  const sessionsRef = useRef<StudentLiveSession[]>([]);

  const loadSessionsImpl = async (opts?: { background?: boolean }) => {
    if (inFlightRef.current) return; // never more than one in flight; triggers while loading are dropped
    inFlightRef.current = true;
    const background = Boolean(opts?.background);
    try {
      if (!background) setLoading(true);
      const data = await studentLiveSessionsService.getSessions();
      sessionsRef.current = data;
      setSessions(data);
    } catch (error: unknown) {
      // A failed background refresh keeps the current snapshot and stays silent - it must not
      // toast over whatever the student is doing every 60s while a poll is active.
      if (!background) showToast(getLiveSessionErrorMessage(error), "error");
    } finally {
      if (!background) setLoading(false);
      inFlightRef.current = false;
      lastLoadAtRef.current = Date.now();
      setLoadStamp((n) => n + 1);
    }
  };
  // Stable identity so consumers (and the effects below) can list it as a dependency without
  // re-arming - and re-firing - their fetches on every render.
  const loadImplRef = useRef(loadSessionsImpl);
  loadImplRef.current = loadSessionsImpl;
  const loadSessions = useCallback(
    (opts?: { background?: boolean }) => loadImplRef.current(opts),
    [],
  );

  useEffect(() => {
    if (loadingClientInfo || !hasLiveSessionsFeature) return;
    loadSessions();
  }, [loadingClientInfo, hasLiveSessionsFeature, loadSessions]);

  /**
   * Content digest of the list. The scheduler must key off DATA changes, not array identity:
   * every reload builds a new array even when nothing changed, and an effect that re-arms on
   * identity after a load IT caused is the classic self-sustaining refetch loop.
   */
  const sessionsDigest = useMemo(
    () =>
      sessions
        .map((s) =>
          [
            s.id,
            s.meeting_status,
            s.class_datetime,
            s.duration_minutes,
            s.notice_type,
            ...(s.occurrences ?? []).map(
              (o) => `${o.id}.${o.meeting_status}.${o.occurrence_datetime}.${o.duration_minutes}`,
            ),
          ].join(":"),
        )
        .join("|"),
    [sessions],
  );

  // Boundary-aware self-refresh: one silent reload just after the next status flip, plus a coarse
  // 60s poll only while a flip is near (the backend stamps ends within ~3 min; the poll is the
  // net under a boundary timer that fired before the stamp landed).
  useEffect(() => {
    if (loadingClientInfo || !hasLiveSessionsFeature) return;
    if (!sessionsDigest && loadStamp === 0) return; // nothing loaded yet - the initial load owns the first fetch
    const { next, near } = statusBoundaries(sessionsRef.current, Date.now());
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (next != null) {
      // +5s so the backend has computed the flip by the time we ask. Never arm a past/immediate
      // fire from inside the scheduler - that is what breaks the load->reschedule->load cycle:
      // this effect only ever arms FUTURE work, and a boundary already behind us belongs to the
      // safety-net interval.
      const delay = Math.min(next + 5_000 - Date.now(), MAX_TIMER_MS);
      if (delay >= 1_000) {
        timer = setTimeout(() => void loadSessions({ background: true }), delay);
      }
    }
    let interval: ReturnType<typeof setInterval> | null = null;
    if (near) {
      interval = setInterval(() => void loadSessions({ background: true }), SAFETY_POLL_MS);
    }
    return () => {
      if (timer) clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [loadingClientInfo, hasLiveSessionsFeature, sessionsDigest, loadStamp, loadSessions]);

  // A tab that sat hidden through a boundary (background timers are throttled) catches up the
  // moment it returns - but only when its snapshot is actually stale, so tab-flipping is free.
  useEffect(() => {
    if (loadingClientInfo || !hasLiveSessionsFeature) return;
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastLoadAtRef.current < STALE_ON_FOCUS_MS) return;
      void loadSessions({ background: true });
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [loadingClientInfo, hasLiveSessionsFeature, loadSessions]);

  const handleCopyPassword = (password: string) => {
    copyToClipboard(password, showToast, t("liveSessions.passwordCopied"));
  };

  const handleWatchRecording = async (activity: StudentLiveSession) => {
    try {
      setWatchingRecordingId(activity.id);
      // `activity.id` stays the PARENT id for every expanded occurrence (feedback and reminders
      // are series-level), so it cannot identify which date this row is. Without the occurrence,
      // both 17 and 18 August asked for the same recording and got it.
      const info = await studentLiveSessionsService.getRecording(
        activity.id,
        activity.occurrence_id
      );
      if (info.playable_in_app) {
        // Watch ON platform: the backend proxy streams Zoom MP4s and Google Meet Drive
        // recordings alike - no external tabs, no share links.
        setPlayerSession(activity);
        return;
      }
      // Manually pasted recording link - external is all we have.
      // Prefer THIS row's own recording over the series-level fallbacks, for the same reason.
      const external =
        activity.zoom_recording_url || info.recording_link || activity.recording_link;
      if (external?.trim()) {
        window.open(external, "_blank");
        return;
      }
      showToast(getLiveSessionErrorMessage(null, "recording"), "error");
    } catch (error: unknown) {
      showToast(getLiveSessionErrorMessage(error, "recording"), "error");
    } finally {
      setWatchingRecordingId(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSessionDuration = (minutes: number | undefined) => {
    if (minutes == null || minutes <= 0) return "-";
    return formatCompactMinutes(minutes);
  };

  const formatSessionStatusCaption = (
    activity: StudentLiveSession
  ): string | null => {
    const m = activity.time_remaining_minutes ?? 0;
    if (m <= 0) return null;
    const compact = formatCompactMinutes(m);
    if (!compact) return null;
    if (activity.meeting_status === "scheduled") {
      return t("liveSessions.startsInCountdown", { time: compact });
    }
    if (activity.meeting_status === "live") {
      return t("liveSessions.sessionTimeLeft", { time: compact });
    }
    return null;
  };

  return {
    loadingClientInfo,
    hasLiveSessionsFeature,
    loading,
    sessions,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    watchingRecordingId,
    playerSession,
    setPlayerSession,
    summarySession,
    setSummarySession,
    loadSessions,
    handleCopyPassword,
    handleWatchRecording,
    formatDateTime,
    formatSessionDuration,
    formatSessionStatusCaption,
  };
}
