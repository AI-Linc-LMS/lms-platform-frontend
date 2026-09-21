"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { AnimatedRing } from "@/components/scorecard/shared";
import { LiveSessionsEmptyState } from "@/components/live-sessions/LiveSessionsEmptyState";
import { LiveSessionsFeatureBlocked } from "@/components/live-sessions/LiveSessionsFeatureBlocked";
import { useLiveSessions } from "@/components/live-sessions/useLiveSessions";
import { RecordingPlayerDialog } from "@/components/live-sessions/RecordingPlayerDialog";
import { SessionFilterChips } from "@/components/live-sessions/ui/LiveSessionUI";
import { StudentSessionSummaryDialog } from "@/components/live-sessions/StudentSessionSummaryDialog";
import { LiveSessionFeedbackDialog } from "@/components/live-sessions/LiveSessionFeedbackDialog";
import { COMMUNITY_FEATURE, HIDE_PARTICIPANT_COUNTS, useClientFeature, useClientOptIn } from "@/lib/hooks/useClientFeature";
import { studentLiveSessionsService } from "@/lib/services/live-sessions";
import type { StudentLiveSession, MyLiveStats } from "@/lib/services/live-sessions";
import { ScheduleCalendar, dayKey, type CalendarEvent } from "@/components/live-sessions/ScheduleCalendar";
import { ScrollRow } from "@/components/common/mobile/ScrollRow";
import {
  AI_GRAD,
  HistoryRow,
  RecordingCard,
  UpcomingCard,
  courseOf,
  hasNotesOf,
  providerOf,
} from "@/components/live-sessions/ui/StudentSessionCards";

/* --------------------------------- helpers -------------------------------- */

type Tab = "upcoming" | "recordings" | "history";
const PAST = new Set(["ended", "expired"]);

/**
 * Every way this session is targeted, as namespaced facet keys ('c:' cohort, 'a:' adaptive
 * course, 'l:' legacy course + id) so the three id spaces can never collide. A session matches a
 * selected facet if ANY of its mappings does.
 */
function facetsOf(s: StudentLiveSession): { key: string; label: string; kind: "cohort" | "course" }[] {
  const out: { key: string; label: string; kind: "cohort" | "course" }[] = [];
  if (s.cohort_detail?.id != null && s.cohort_detail.name) {
    out.push({ key: `c:${s.cohort_detail.id}`, label: s.cohort_detail.name, kind: "cohort" });
  }
  if (s.adaptive_course_detail?.id != null && s.adaptive_course_detail.title) {
    out.push({ key: `a:${s.adaptive_course_detail.id}`, label: s.adaptive_course_detail.title, kind: "course" });
  }
  const cd = s.course_detail;
  const cdLabel = cd?.title || cd?.name;
  if (cd?.id != null && cdLabel) {
    out.push({ key: `l:${cd.id}`, label: cdLabel, kind: "course" });
  }
  return out;
}
function joinUrlOf(s: StudentLiveSession): string {
  return (s.is_google_meet ? s.join_link : s.zoom_join_url) || s.join_link || "";
}
function initials(name: string): string {
  return (name || "?").trim().slice(0, 2).toUpperCase();
}
/** Key for anything stored per CARD: expanded occurrences of one series share `s.id`, so state
 *  keyed by id alone toggles every date of the series at once. `0` = the single-session case. */
function cardKeyOf(s: StudentLiveSession): string {
  return `${s.id}:${s.occurrence_id ?? 0}`;
}
/** The backend's reminder state for THIS card: a dated occurrence is "on" only when its own id is
 *  in the armed set; a single session keeps the series-level flag. */
function seededReminder(s: StudentLiveSession): boolean {
  if (s.occurrence_id != null) {
    return (s.reminder_occurrence_ids ?? []).includes(s.occurrence_id);
  }
  return Boolean(s.reminder_enabled);
}
function startedAgo(dt?: string | null): string {
  if (!dt) return "";
  const mins = Math.max(0, Math.round((Date.now() - new Date(dt).getTime()) / 60000));
  if (mins < 1) return "Starting now";
  if (mins < 60) return `Started ${mins} min ago`;
  return `Started ${Math.round(mins / 60)}h ago`;
}
function downloadText(text: string, filename: string, type = "text/calendar;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* --- Client-side calendar (no server round-trip; works regardless of auth/blob quirks). --- */
function icsStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function icsEscape(s: string): string {
  return (s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
function sessionJoinUrl(s: StudentLiveSession): string {
  return (s.is_google_meet ? s.join_link : s.zoom_join_url) || s.join_link || "";
}
function buildIcs(sessions: StudentLiveSession[]): string {
  const now = icsStamp(new Date());
  const events: string[] = [];
  for (const s of sessions) {
    if (!s.class_datetime) continue;
    const start = new Date(s.class_datetime);
    if (Number.isNaN(start.getTime())) continue;
    const end = new Date(start.getTime() + (s.duration_minutes || 60) * 60000);
    const join = sessionJoinUrl(s);
    events.push(
      [
        "BEGIN:VEVENT",
        `UID:liveclass-${s.id}@ailinc.com`,
        `DTSTAMP:${now}`,
        `DTSTART:${icsStamp(start)}`,
        `DTEND:${icsStamp(end)}`,
        `SUMMARY:${icsEscape(s.topic_name || "Live session")}`,
        `DESCRIPTION:${icsEscape(join ? `Join: ${join}` : "Live session")}`,
        ...(join ? [`URL:${icsEscape(join)}`] : []),
        "BEGIN:VALARM",
        "TRIGGER:-PT30M",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape((s.topic_name || "Live session") + " starts soon")}`,
        "END:VALARM",
        "END:VEVENT",
      ].join("\r\n"),
    );
  }
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AI Linc//Live Sessions//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}
/** One-click add to Google Calendar (opens the event prefilled). */
function googleCalendarUrl(s: StudentLiveSession): string {
  if (!s.class_datetime) return "";
  const start = new Date(s.class_datetime);
  const end = new Date(start.getTime() + (s.duration_minutes || 60) * 60000);
  const join = sessionJoinUrl(s);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: s.topic_name || "Live session",
    dates: `${icsStamp(start)}/${icsStamp(end)}`,
    details: join ? `Join: ${join}` : "Live session",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* ---------------------------------- page ---------------------------------- */

export default function LiveSessionsPage() {
  const router = useRouter();
  const {
    loadingClientInfo, hasLiveSessionsFeature, loading, sessions,
    watchingRecordingId, playerSession, setPlayerSession, summarySession, setSummarySession,
    handleWatchRecording, loadSessions,
  } = useLiveSessions();

  const [tab, setTab] = useState<Tab>("upcoming");
  const [stats, setStats] = useState<MyLiveStats | null>(null);
  // Keyed by cardKeyOf(s) (`id:occurrence`), NOT by id: arming one date of a series must not light
  // "Reminder on" on every other date (the ids match the payload's reminder_occurrence_ids).
  const [reminders, setReminders] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [feedbackFor, setFeedbackFor] = useState<StudentLiveSession | null>(null);
  // Calendar day filter (local YYYY-MM-DD from dayKey); null = show everything.
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  // Batch/course facet filter (namespaced key from facetsOf); null = everything. Only rendered
  // when >= 2 distinct facets exist.
  const [facetFilter, setFacetFilter] = useState<string | null>(null);
  const { enabled: communityEnabled } = useClientFeature(COMMUNITY_FEATURE);
  const hideCounts = useClientOptIn(HIDE_PARTICIPANT_COUNTS);

  useEffect(() => {
    studentLiveSessionsService.getMyStats().then(setStats).catch(() => undefined);
  }, []);

  /**
   * A recurring series is ONE session row carrying N dated occurrences, and its `meeting_status`
   * describes the series as a whole. Bucketing the raw rows therefore collapsed 50 scheduled
   * sessions into a single entry — and once today's occurrence was running the series read "live",
   * so "Upcoming" showed 0 while 49 dates were still to come.
   *
   * Expand each series into one entry per occurrence so every date is counted and listed on its own.
   * Non-recurring sessions pass through untouched.
   */
  const instances = useMemo<StudentLiveSession[]>(() => {
    const out: StudentLiveSession[] = [];
    for (const s of sessions) {
      const occs = s.occurrences ?? [];
      if (!s.zoom_is_recurring || occs.length === 0) {
        out.push(s);
        continue;
      }
      // Cancelled sittings drop out - EXCEPT one that left artifacts behind. A class that ran,
      // recorded and produced a summary is sometimes still marked cancelled (a post-edit Zoom
      // resync can re-cancel a date that already happened), and dropping it here made three real
      // recorded classes invisible to every enrolled student while admins could play them.
      const kept = occs.filter(
        (o) =>
          (o.status !== "cancelled" && o.meeting_status !== "cancelled") ||
          o.has_recording || o.zoom_recording_url || o.zoom_ai_summary
      );

      // A recurring series' own zoom_recording_url is the SERIES-LATEST recording: Zoom returns the
      // most recent occurrence's recording when asked about the series id. If the per-occurrence
      // sync has not attributed it yet (no occurrence carries a url of its own), show it on the
      // latest occurrence that has already happened — that is the one it actually belongs to.
      //
      // Not `o.has_recording ?? s.has_recording`, which was the bug: `??` only falls back on
      // null/undefined, and the occurrence serializer always returns a real boolean, so `false ??
      // true` stayed false and the parent's recording was silently dropped. The "Recordings left"
      // KPI counts parents, so it said 1 while this list said 0 for the same session.
      //
      // Not `||` either — that would claim every one of the 50 occurrences has a recording.
      const noneCarryTheirOwn = !kept.some((o) => o.has_recording || o.zoom_recording_url);
      const inheritIdx =
        noneCarryTheirOwn && s.has_recording
          ? kept.reduce((best, o, i) => {
              const t = new Date(o.occurrence_datetime ?? s.class_datetime ?? 0).getTime();
              if (t > Date.now()) return best;
              const bt =
                best < 0
                  ? -Infinity
                  : new Date(kept[best].occurrence_datetime ?? s.class_datetime ?? 0).getTime();
              return t > bt ? i : best;
            }, -1)
          : -1;

      kept.forEach((o, i) => {
        const inherits = i === inheritIdx;
        const cancelled = o.status === "cancelled" || o.meeting_status === "cancelled";
        // Attendance is PER SITTING. `my_attendance` is series-level - it means "attended at least
        // one date" - so every dated card inherited it and a student who joined one sitting was
        // marked Attended on all of them, contradicting the admin roster. Absent from the map =
        // not attended. An older backend sends no map at all; keep the previous (imperfect) value
        // there rather than marking every past date Missed.
        const mine = s.my_attendance_by_occurrence?.[String(o.id)];
        const myAttendance = s.my_attendance_by_occurrence
          ? mine
            ? { attended: mine.attended, duration_seconds: mine.duration_seconds ?? 0 }
            : null
          : s.my_attendance;
        out.push({
          ...s,
          // Keep the parent id for API calls (feedback, reminders) but make the key unique per date.
          occurrence_id: o.id,
          occurrence_ran: o.ran,
          before_enrolment: o.before_enrolment,
          has_materials: o.has_materials,
          // Per-date title where one exists (AI-titled after transcript sync, or admin-renamed);
          // blank inherits the series title.
          topic_name: o.topic_name || s.topic_name,
          class_datetime: o.occurrence_datetime ?? s.class_datetime,
          duration_minutes: o.duration_minutes ?? s.duration_minutes,
          // A retained cancelled sitting is forced PAST rather than inheriting the series status:
          // the series is often still "scheduled", which would list a class that already happened
          // as a joinable future one and let it drive the LIVE hero.
          meeting_status:
            o.meeting_status && o.meeting_status !== "cancelled"
              ? o.meeting_status
              : cancelled
                ? "ended"
                : s.meeting_status,
          occurrence_cancelled: cancelled,
          has_recording: Boolean(o.has_recording || (inherits && s.has_recording)),
          zoom_recording_url:
            o.zoom_recording_url ?? (inherits ? s.zoom_recording_url : undefined),
          // Same rule as the recording: the series-level summary is the series-LATEST one, so it
          // may only surface on the occurrence that inherits the series artifacts — otherwise
          // every date would advertise notes that belong to one sitting.
          zoom_ai_summary: o.zoom_ai_summary ?? (inherits ? s.zoom_ai_summary : null),
          my_attendance: myAttendance,
        });
      });
    }
    return out;
  }, [sessions]);

  useEffect(() => {
    // Seed reminder state per CARD (instance): each date of a series arms on its own.
    setReminders((cur) => {
      const next = { ...cur };
      for (const s of instances) {
        const k = cardKeyOf(s);
        if (next[k] === undefined) next[k] = seededReminder(s);
      }
      return next;
    });
  }, [instances]);

  const live = useMemo(() => {
    // A cancelled session must never drive the LIVE hero: the meeting still exists and is
    // joinable, so without this the student is offered "Join now" for a class that is off.
    const reallyLive = instances.find((s) => s.meeting_status === "live" && s.notice_type !== "cancelled");
    if (reallyLive) return reallyLive;
    // Belt and braces: the wall clock is inside a session's window but this snapshot of the list
    // still says "scheduled" (it was fetched before the flip). Promote it to the hero so Join
    // appears without waiting for the next refresh - but ONLY where the join gate already allows
    // joining (ungated, or the host has started). A gated session whose trainer hasn't opened the
    // room stays out: the gate remains authoritative, the refetch handles that case.
    // Deliberate clock snapshot: this re-evaluates on every (self-)refresh of the list, and the
    // hook's boundary timer lands one just after each start, so a stale `now` only delays
    // promotion until that reload.
    // eslint-disable-next-line react-hooks/purity -- see above
    const now = Date.now();
    return instances.find((s) => {
      if (s.meeting_status !== "scheduled" || s.notice_type === "cancelled") return false;
      if (s.join_gated && !s.host_started) return false;
      if (!s.class_datetime) return false;
      const start = new Date(s.class_datetime).getTime();
      if (Number.isNaN(start)) return false;
      return start <= now && now <= start + (s.duration_minutes || 60) * 60_000;
    });
  }, [instances]);

  // This calendar shows live sessions and nothing else - it is the Live Sessions page, and the
  // assessment/interview dots it also carried belonged to other modules' surfaces. Built from the
  // occurrence-expanded `instances`, not the raw sessions - a recurring series is one row whose
  // class_datetime is frozen at occurrence #1, so feeding sessions gave the whole series a single
  // dot on its first date and none on the rest.
  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    const evs: CalendarEvent[] = [];
    for (const s of instances) {
      // The batch/course filter governs the CALENDAR too. It only governed the tabs, so with a
      // batch selected the dots (and the day panel they feed) went on advertising every other
      // batch's classes — a zoom_check filter showing 8024-E's dates on half the month.
      if (facetFilter != null && !facetsOf(s).some((f) => f.key === facetFilter)) continue;
      if (!s.class_datetime) continue;
      evs.push({
        id: `live-${s.id}-${s.occurrence_id ?? 0}`,
        date: s.class_datetime,
        title: s.topic_name || "Live session",
        type: "live",
        note: s.meeting_status === "live" ? "live now" : undefined,
        subtitle: courseOf(s) || undefined,
      });
    }
    return evs;
  }, [instances, facetFilter]);

  // While a session is live, poll Zoom for the CURRENT participant count (the stored
  // attendance_count only lands after the meeting ends — that's why it read '0 joined').
  const [liveJoined, setLiveJoined] = useState<number | null>(null);
  const liveId = live?.id;
  // id:occurrence of the hero session - `id` alone can't tell two dates of one series apart.
  const liveKey = live ? `${live.id}:${live.occurrence_id ?? 0}` : null;
  // Which hero we already refreshed the list for after Zoom reported it over - the poll keeps
  // returning live:false every 25s afterwards, and only the TRANSITION should refetch.
  const endedRefreshedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!liveId) {
      setLiveJoined(null);
      return;
    }
    let cancelled = false;
    const poll = async () => {
      try {
        const r = await studentLiveSessionsService.getLiveCount(liveId);
        if (cancelled) return;
        setLiveJoined(r.live && r.count != null ? r.count : null);
        if (r.live) {
          // Back live (or live after a flap): a later end may refetch again.
          endedRefreshedForRef.current = null;
        } else if (endedRefreshedForRef.current !== liveKey) {
          // Zoom says the meeting is over while the hero still shows LIVE. One silent list
          // refresh so the hero clears as soon as the backend stamps the end, instead of
          // lingering until the student reloads by hand.
          endedRefreshedForRef.current = liveKey;
          void loadSessions({ background: true });
        }
      } catch {
        /* keep the attendance-count fallback */
      }
    };
    poll();
    const timer = setInterval(poll, 25000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [liveId, liveKey, loadSessions]);


  // Calendar day + facet filters, applied to all three tabs (and therefore the tab counts).
  const matchesSelectedDay = useCallback(
    (s: StudentLiveSession) => {
      if (facetFilter != null && !facetsOf(s).some((f) => f.key === facetFilter)) return false;
      if (!selectedDay) return true;
      if (!s.class_datetime) return false;
      const d = new Date(s.class_datetime);
      return !isNaN(d.getTime()) && dayKey(d) === selectedDay;
    },
    [selectedDay, facetFilter],
  );
  // The distinct batch/course facets across this student's sessions - a filter is only worth its
  // pixels when there are at least two. Sessions mapped via a course (cohort_detail null) get a
  // facet too, which cohort-only keying missed entirely.
  const facetOptions = useMemo(() => {
    const map = new Map<string, { key: string; label: string; kind: "cohort" | "course" }>();
    for (const s of sessions) {
      for (const f of facetsOf(s)) if (!map.has(f.key)) map.set(f.key, f);
    }
    // Batches first, then courses, alphabetical within each - a stable, scannable row.
    return Array.from(map.values()).sort(
      (a, b) => (a.kind === b.kind ? a.label.localeCompare(b.label) : a.kind === "cohort" ? -1 : 1)
    );
  }, [sessions]);
  // A facet can vanish from the payload between loads - a batch the learner was moved out of, or
  // (since the backend stopped letting a course tag widen a batch session) a session that was
  // never theirs. The chip row hides itself below two facets, so a filter left pointing at a gone
  // facet would empty the page with no visible way back.
  useEffect(() => {
    if (facetFilter && !facetOptions.some((f) => f.key === facetFilter)) setFacetFilter(null);
  }, [facetFilter, facetOptions]);
  const selectedDayLabel = useMemo(() => {
    if (!selectedDay) return "";
    const [y, m, d] = selectedDay.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }, [selectedDay]);

  const upcoming = useMemo(
    // `s !== live` matters only for a clock-promoted hero (still "scheduled" in the payload):
    // a session shown as LIVE NOW must not also be listed as upcoming.
    () => instances.filter((s) => s.meeting_status === "scheduled" && s !== live && matchesSelectedDay(s)).sort((a, b) => (a.class_datetime || "").localeCompare(b.class_datetime || "")),
    [instances, live, matchesSelectedDay],
  );
  // The "STARTS NEXT" crown belongs to the first date that is actually going ahead — a cancelled
  // series sorted to the top used to take it and run a live countdown under its own red banner.
  const firstLiveUpcoming = useMemo(
    () => upcoming.find((s) => s.notice_type !== "cancelled"),
    [upcoming],
  );
  const recordings = useMemo(
    // An ended date can carry a transcript but no recording (recording failed, or only the
    // transcript synced) - it lists too, with Notes and no Watch, instead of vanishing.
    // Material counts the same way. For a student who joined the batch late this tab is the
    // ONLY route to a class held before they arrived, so a date whose sole artefact is the
    // trainer's files still has to appear.
    () => instances.filter((s) => (s.has_recording
      || (PAST.has(s.meeting_status ?? "") && (hasNotesOf(s) || s.has_materials)))
      && matchesSelectedDay(s)),
    [instances, matchesSelectedDay],
  );
  const history = useMemo(
    // A class held before this student joined the batch was never theirs to attend, so it is not
    // part of their history and must never be stamped "Missed". The server flags it and clamps
    // its own attendance denominator the same way, so the KPI ring and this list agree.
    // Recordings (below) deliberately keep them: catching up is good, being blamed is not.
    () => instances.filter((s) => PAST.has(s.meeting_status ?? "") && !s.before_enrolment && matchesSelectedDay(s)).sort((a, b) => (b.class_datetime || "").localeCompare(a.class_datetime || "")),
    [instances, matchesSelectedDay],
  );

  const syncAll = useCallback(() => {
    const future = sessions.filter((s) => s.meeting_status === "scheduled" || s.meeting_status === "live");
    if (future.length === 0) {
      setToast("You have no upcoming sessions to sync.");
      return;
    }
    downloadText(buildIcs(future), "my-live-sessions.ics");
    setToast(`Downloaded ${future.length} session${future.length === 1 ? "" : "s"}. Open the file to add them to your calendar.`);
  }, [sessions]);
  const addToCalendar = useCallback((s: StudentLiveSession) => {
    // One-click into Google Calendar (the common case); the .ics download is the universal fallback.
    const g = googleCalendarUrl(s);
    if (g) window.open(g, "_blank", "noopener");
    downloadText(buildIcs([s]), `live-session-${s.id}.ics`);
  }, []);
  const toggleReminder = useCallback(async (s: StudentLiveSession) => {
    const key = cardKeyOf(s);
    const want = !(reminders[key] ?? seededReminder(s));
    setReminders((c) => ({ ...c, [key]: want }));
    try {
      // `occurrence_id` scopes the reminder to this card's date - without it a recurring series
      // arms (and emails) every remaining sitting at once.
      await studentLiveSessionsService.toggleReminder(s.id, want, s.occurrence_id);
      setToast(want ? "We'll email you before this session." : "Reminder turned off.");
    } catch {
      setReminders((c) => ({ ...c, [key]: !want })); // revert
      setToast("Couldn't update the reminder.");
    }
  }, [reminders]);

  if (loadingClientInfo || (hasLiveSessionsFeature && loading && sessions.length === 0)) {
    return <PageShell><Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box></PageShell>;
  }
  if (!hasLiveSessionsFeature) {
    return <PageShell><LiveSessionsFeatureBlocked /></PageShell>;
  }

  const TABS: { key: Tab; label: string; icon: string; count: number }[] = [
    { key: "upcoming", label: "Upcoming", icon: "mdi:calendar-blank-outline", count: upcoming.length },
    { key: "recordings", label: "Recordings", icon: "mdi:play-circle-outline", count: recordings.length },
    { key: "history", label: "History", icon: "mdi:history", count: history.length },
  ];

  return (
    <PageShell>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: { xs: 2.5, md: 3 }, gap: { xs: 1.5, md: 2 }, flexWrap: "wrap" }}>
        <Stack direction="row" spacing={1.75} alignItems="flex-start" sx={{ minWidth: { xs: 0, sm: "auto" }, flex: { xs: 1, sm: "initial" } }}>
          <Box sx={{ width: { xs: 44, md: 52 }, height: { xs: 44, md: 52 }, borderRadius: 3, flexShrink: 0, display: "grid", placeItems: "center", color: "#fff", background: AI_GRAD }}>
            <Icon icon="mdi:broadcast" width={26} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: { xs: "0.75rem", md: "0.68rem" }, fontWeight: 800, letterSpacing: 1, color: "#7c3aed" }}>LEARN · LIVE</Typography>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.55rem", md: "2rem" }, lineHeight: 1.1 }}>Live Sessions</Typography>
            <Typography sx={{ color: "text.secondary", fontSize: { xs: "0.86rem", md: "0.9rem" }, maxWidth: 520, mt: 0.25 }}>
              Join live classes, prepare before you arrive, and catch up on anything you missed with recordings and notes.
            </Typography>
          </Box>
        </Stack>
        {/* The natural action for this header on a phone, so it spans the width rather than
            floating as a 150px pill under a three-line paragraph. */}
        <Button onClick={syncAll}
          startIcon={<Icon icon="mdi:calendar-sync" width={18} />}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2.5, px: 2, py: 1,
            width: { xs: "100%", sm: "auto" }, minHeight: { xs: 48, sm: "auto" },
            border: "1px solid var(--border-default)", color: "var(--font-primary)", bgcolor: "var(--card-bg)" }}>
          Sync to calendar
        </Button>
      </Stack>

      {sessions.length === 0 ? (
        <LiveSessionsEmptyState />
      ) : (
        <>
          {/* LIVE NOW hero */}
          {live && (
            <Box sx={{ borderRadius: 4, overflow: "hidden", color: "#fff", mb: 2.5,
              background: "radial-gradient(120% 140% at 90% 0%, #14532d 0%, #052e16 55%, #022c22 100%)",
              // Without this a long agenda line gives the grid child a min-content floor wider than
              // the screen, and the whole page starts sliding sideways.
              display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", md: "minmax(0,1fr) 300px" },
              "& > *": { minWidth: 0 } }}>
              <Box sx={{ p: { xs: 2, md: 3.5 }, minWidth: 0 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.4, borderRadius: 999, bgcolor: "rgba(239,68,68,0.25)", border: "1px solid rgba(239,68,68,0.5)", fontSize: { xs: "0.75rem", md: "0.68rem" }, fontWeight: 800 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#f87171", animation: "pulse 1.4s infinite" }} /> LIVE NOW
                  </Box>
                  <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.82rem" }}>{startedAgo(live.class_datetime)}</Typography>
                  <LiveTimeLeft start={live.class_datetime} durationMinutes={live.duration_minutes} />
                </Stack>
                <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.45rem", md: "2.1rem" }, lineHeight: 1.15, wordBreak: "break-word" }}>{live.topic_name}</Typography>
                <LiveProgress start={live.class_datetime} durationMinutes={live.duration_minutes} />
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.25, color: "rgba(255,255,255,0.85)", flexWrap: "wrap", gap: 0.75 }}>
                  {live.instructor && (
                    <Stack direction="row" spacing={0.6} alignItems="center">
                      <Box sx={{ width: { xs: 26, md: 24 }, height: { xs: 26, md: 24 }, flexShrink: 0, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: { xs: "0.75rem", md: "0.62rem" }, fontWeight: 800, bgcolor: "rgba(255,255,255,0.2)" }}>{initials(live.instructor)}</Box>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{live.instructor}</Typography>
                    </Stack>
                  )}
                  {courseOf(live) && <Stack direction="row" spacing={0.4} alignItems="center"><Icon icon="mdi:bookmark-outline" width={15} /><Typography sx={{ fontSize: "0.85rem" }}>{courseOf(live)}</Typography></Stack>}
                  <Stack direction="row" spacing={0.4} alignItems="center"><Icon icon={providerOf(live).icon} width={15} /><Typography sx={{ fontSize: "0.85rem" }}>{providerOf(live).label}</Typography></Stack>
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2.5,
                  "& > *": { width: { xs: "100%", sm: "auto" }, minHeight: { xs: 48, sm: "auto" } } }} flexWrap="wrap" useFlexGap>
                  {/* Where the tenant requires it, Join only opens once the trainer has actually
                      started — the scheduled time passing is not the same as the class beginning.
                      `join_gated` is false whenever the backend can't observe that (fail-open), so a
                      false here must read as "not gated", never as "not started". */}
                  {live.join_gated && !live.host_started ? (
                    <Button disabled startIcon={<Icon icon="mdi:clock-outline" width={18} />}
                      sx={{ px: 3, py: 1.1, borderRadius: 2.5, fontWeight: 800, textTransform: "none",
                        color: "rgba(255,255,255,0.75) !important", bgcolor: "rgba(255,255,255,0.14)" }}>
                      Waiting for your trainer to start
                    </Button>
                  ) : (
                    <Button component="a" href={joinUrlOf(live)} target="_blank" rel="noopener"
                      startIcon={<Icon icon="mdi:video" width={18} />}
                      sx={{ px: 3, py: 1.1, borderRadius: 2.5, fontWeight: 800, textTransform: "none", color: "#047857", bgcolor: "#fff", "&:hover": { bgcolor: "rgba(255,255,255,0.9)" } }}>
                      Join now
                    </Button>
                  )}
                  {communityEnabled && (
                    <Button onClick={() => router.push("/community")} startIcon={<Icon icon="mdi:comment-question-outline" width={18} />}
                      sx={{ px: 2.5, py: 1.1, borderRadius: 2.5, fontWeight: 800, textTransform: "none", color: "#fff", bgcolor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}>
                      Ask a question
                    </Button>
                  )}
                </Stack>
              </Box>
              <Box sx={{ p: { xs: 2, md: 2.5 }, minWidth: 0,
                borderTop: { xs: "1px solid rgba(255,255,255,0.12)", md: "none" },
                borderLeft: { md: "1px solid rgba(255,255,255,0.1)" },
                display: "flex", flexDirection: "column", justifyContent: "center", gap: 1.5 }}>
                {(live.agenda?.length ?? 0) > 0 && (
                  <Box>
                    <Typography sx={{ fontSize: { xs: "0.75rem", md: "0.62rem" }, fontWeight: 800, letterSpacing: 0.8, color: "rgba(255,255,255,0.55)", mb: 1 }}>TODAY&apos;S AGENDA</Typography>
                    <Stack spacing={0.75}>
                      {(live.agenda || []).slice(0, 5).map((item, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                          <Box sx={{ width: { xs: 22, md: 18 }, height: { xs: 22, md: 18 }, flexShrink: 0, mt: 0.1, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: { xs: "0.75rem", md: "0.62rem" }, fontWeight: 800, bgcolor: "rgba(255,255,255,0.15)" }}>{i + 1}</Box>
                          <Typography sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.3 }}>{item}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                )}
                {/* Headcount is hidden where the tenant opted out — the avatar stack goes too, since
                    four faces still implies "several people are here". */}
                {!hideCounts && (
                  <Box>
                    <Stack direction="row" spacing={-0.8} sx={{ mb: 0.75 }}>
                      {[0, 1, 2, 3].map((i) => (
                        <Box key={i} sx={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid #052e16", ml: i ? "-8px" : 0,
                          background: ["#a855f7", "#6366f1", "#ec4899", "#f59e0b"][i] }} />
                      ))}
                    </Stack>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.9rem" }}>{(liveJoined ?? live.attendance_count) || 0} joined</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* KPI cards */}
          {stats && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", md: "repeat(3,minmax(0,1fr))" }, gap: { xs: 1.25, md: 2 }, mb: { xs: 2.5, md: 3 }, "& > *": { minWidth: 0 } }}>
              <StatCard icon="mdi:check-circle-outline" tint="#7c3aed" value={stats.sessions_attended} label="Sessions attended" sub={`of ${stats.sessions_held} held`} />
              <StatCard icon="mdi:calendar-check-outline" tint="#10b981" value={`${stats.attendance_rate}%`} label="Attendance rate" sub={`cohort avg ${stats.cohort_avg_rate}%`} />
              <StatCard icon="mdi:clock-outline" tint="#ec4899" value={stats.live_hours} label="Live hours" sub="attended" />
            </Box>
          )}

          {/* Main grid */}
          {/* The calendar rail is the second column on a desktop and stacks UNDER the list on a
              phone - the list is what the learner came for, so it reads first. */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", lg: "minmax(0,1fr) 320px" }, gap: 2.5, alignItems: "start", "& > *": { minWidth: 0 } }}>
            <Box sx={{ minWidth: 0 }}>
              {/* Batch/course facet filter - only when this student actually spans several. */}
              {facetOptions.length >= 2 && (
                <Box sx={{ mb: 1.5 }}>
                  <SessionFilterChips
                    scrollOnPhone
                    ariaLabel="Batch and course filter"
                    options={[
                      { key: "", label: "All batches & courses" },
                      ...facetOptions.map((f) => ({ key: f.key, label: f.label })),
                    ]}
                    value={facetFilter ?? ""}
                    onChange={(k) => setFacetFilter(k === "" ? null : k)}
                  />
                </Box>
              )}
              {/* Calendar day filter chip - dismissible; clicking the same day on the calendar
                  also clears it. */}
              {selectedDay && (
                <Stack direction="row" sx={{ mb: 1.5 }}>
                  <Box
                    onClick={() => setSelectedDay(null)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedDay(null); }}
                    sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 1.5, py: 0.6, borderRadius: 999,
                      minHeight: { xs: 44, sm: "auto" },
                      cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, color: "#6d28d9",
                      bgcolor: "color-mix(in srgb,#8b5cf6 12%,transparent)",
                      border: "1px solid color-mix(in srgb,#8b5cf6 30%,transparent)",
                      "&:hover": { bgcolor: "color-mix(in srgb,#8b5cf6 18%,transparent)" } }}
                  >
                    <Icon icon="mdi:calendar-search" width={15} />
                    Showing {selectedDayLabel}
                    <Icon icon="mdi:close-circle" width={16} />
                  </Box>
                </Stack>
              )}
              {/* Tabs */}
              {/* Three tabs plus their counts are ~330px of chips: they fit 390 only just, and not
                  at all once a count reaches three digits. A scroll row with a snap and an edge
                  fade says so, instead of clipping the third tab at the screen edge. */}
              <ScrollRow
                ariaLabel="Session tabs"
                gap={0.75}
                sx={{ mb: 2, pb: { xs: 0.5, sm: 0 }, gap: { xs: 0.75, sm: "6px 12px" },
                  flexWrap: { xs: "nowrap", sm: "wrap" }, overflowX: { xs: "auto", sm: "visible" }, overflowY: { xs: "hidden", sm: "visible" },
                  "& > *": { scrollSnapAlign: "start", flexShrink: 0 } }}
              >
                {TABS.map((tb) => {
                  const active = tab === tb.key;
                  return (
                    <Box key={tb.key} onClick={() => setTab(tb.key)}
                      role="button"
                      aria-pressed={active}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTab(tb.key); } }}
                      sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: { xs: 2, sm: 1.75 }, py: 0.8,
                        minHeight: { xs: 44, sm: "auto" }, whiteSpace: "nowrap",
                        borderRadius: 2.5, cursor: "pointer",
                        fontSize: "0.85rem", fontWeight: 800, color: active ? "#fff" : "text.secondary",
                        background: active ? AI_GRAD : "var(--card-bg)", border: active ? "none" : "1px solid var(--border-default)" }}>
                      <Icon icon={tb.icon} width={16} /> {tb.label}
                      <Box component="span" sx={{ ml: 0.3, px: 0.7, borderRadius: 999, fontSize: { xs: "0.75rem", sm: "0.7rem" }, fontWeight: 800, bgcolor: active ? "rgba(255,255,255,0.25)" : "color-mix(in srgb,var(--border-default) 60%,transparent)" }}>{tb.count}</Box>
                    </Box>
                  );
                })}
              </ScrollRow>

              {tab === "upcoming" && (
                upcoming.length === 0 ? <Empty text="No upcoming sessions. New classes will show up here." /> : (
                  <Stack spacing={{ xs: 1.5, sm: 1.75 }}>
                    {upcoming.map((s) => (
                      <UpcomingCard key={s.occurrence_id ?? s.id}
                        s={s} isNext={s === firstLiveUpcoming}
                        reminderOn={reminders[cardKeyOf(s)] ?? seededReminder(s)}
                        onAddCalendar={() => addToCalendar(s)} onRemind={() => toggleReminder(s)} />
                    ))}
                  </Stack>
                )
              )}
              {tab === "recordings" && (
                recordings.length === 0 ? <Empty text="No recordings yet. They appear here automatically after a session ends." /> : (
                  <Stack spacing={1.5}>
                    {recordings.map((s) => (
                      <RecordingCard key={s.occurrence_id ?? s.id} s={s} watching={watchingRecordingId === s.id}
                        onWatch={() => handleWatchRecording(s)}
                        onSummary={() => setSummarySession(s)} />
                    ))}
                  </Stack>
                )
              )}
              {tab === "history" && (
                history.length === 0 ? <Empty text="No past sessions yet." /> : (
                  <Stack spacing={1.25}>
                    {history.map((s) => (
                      <HistoryRow key={s.occurrence_id ?? s.id} s={s}
                        watching={watchingRecordingId === s.id}
                        onWatch={() => handleWatchRecording(s)}
                        onGiveFeedback={() => setFeedbackFor(s)} />
                    ))}
                  </Stack>
                )
              )}
            </Box>

            {/* Right rail */}
            <Stack spacing={2.5}>
              <ScheduleCalendar events={calendarEvents} legendTypes={["live"]} selectedKey={selectedDay} onSelectDay={setSelectedDay} />
              {stats && <AttendanceRail stats={stats} />}
            </Stack>
          </Box>
        </>
      )}

      {/* occurrenceId is what makes this play the DATE the student clicked. `id` is the series for
          every expanded row, so passing it alone streams the series-latest recording. */}
      <RecordingPlayerDialog open={Boolean(playerSession)} liveClassId={playerSession?.id ?? null}
        occurrenceId={playerSession?.occurrence_id ?? null}
        title={playerSession?.topic_name} onClose={() => setPlayerSession(null)} />
      {/* Same occurrence rule as the recording player above: `id` is the series for every
          expanded row, so the occurrence is what makes this show the clicked DATE's notes. */}
      {summarySession && (
        <StudentSessionSummaryDialog activityId={summarySession.id} occurrenceId={summarySession.occurrence_id ?? null}
          topicName={summarySession.topic_name || ""} open onClose={() => setSummarySession(null)} />
      )}

      <LiveSessionFeedbackDialog
        open={Boolean(feedbackFor)}
        liveClassId={feedbackFor?.id ?? null}
        sessionTitle={feedbackFor?.topic_name}
        onClose={() => setFeedbackFor(null)}
        onSubmitted={(msg) => setToast(msg)}
      />

      {toast && <Snack text={toast} onClose={() => setToast(null)} />}
      <style jsx global>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.35 } }`}</style>
    </PageShell>
  );
}

/* ------------------------------- components ------------------------------- */

function Empty({ text }: { text: string }) {
  return (
    <Box sx={{ p: { xs: 3.5, sm: 5 }, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default)" }}>
      <Icon icon="mdi:video-off-outline" width={30} style={{ opacity: 0.4 }} />
      <Typography sx={{ color: "text.secondary", mt: 1 }}>{text}</Typography>
    </Box>
  );
}

function StatCard({ icon, tint, value, label, sub }: { icon: string; tint: string; value: React.ReactNode; label: string; sub: string }) {
  return (
    // Two of these share a 390px row. Side by side the icon eats 50px of a 155px card and
    // "Attendance rate" breaks over three lines; stacking it gives the number the full width.
    <Box sx={{ p: { xs: 1.75, sm: 2.25 }, borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)",
      display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: { xs: 1, sm: 1.5 }, alignItems: "flex-start", minWidth: 0 }}>
      <Box sx={{ width: 38, height: 38, borderRadius: 2, flexShrink: 0, display: "grid", placeItems: "center", color: tint, bgcolor: `color-mix(in srgb,${tint} 12%,transparent)` }}>
        <Icon icon={icon} width={20} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.45rem", sm: "1.6rem" }, lineHeight: 1, color: tint }}>{value}</Typography>
        <Typography sx={{ fontWeight: 700, fontSize: "0.84rem", mt: 0.4 }}>{label}</Typography>
        <Typography sx={{ fontSize: { xs: "0.75rem", sm: "0.72rem" }, color: "text.secondary" }}>{sub}</Typography>
      </Box>
    </Box>
  );
}

function useTick(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const h = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(h);
  }, [ms]);
  return now;
}

/** A "time left" chip for the live session (ticks down to the session end). */
function LiveTimeLeft({ start, durationMinutes }: { start?: string | null; durationMinutes?: number }) {
  const now = useTick(1000);
  if (!start || !durationMinutes) return null;
  const end = new Date(start).getTime() + durationMinutes * 60000;
  const remain = end - now;
  const mins = Math.floor(Math.max(0, remain) / 60000);
  const label = remain <= 0 ? "Wrapping up" : mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m left` : `${mins} min left`;
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.4, borderRadius: 999,
      bgcolor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", fontSize: { xs: "0.75rem", md: "0.72rem" }, fontWeight: 800, whiteSpace: "nowrap" }}>
      <Icon icon="mdi:timer-outline" width={13} /> {label}
    </Box>
  );
}

/** A thin elapsed/remaining progress bar under the hero title. */
function LiveProgress({ start, durationMinutes }: { start?: string | null; durationMinutes?: number }) {
  const now = useTick(1000);
  if (!start || !durationMinutes) return null;
  const s = new Date(start).getTime();
  const end = s + durationMinutes * 60000;
  const pct = Math.max(0, Math.min(100, ((now - s) / (end - s)) * 100));
  return (
    <Box sx={{ mt: 1.5, maxWidth: 620 }}>
      <Box sx={{ height: 5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.14)", overflow: "hidden" }}>
        <Box sx={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#34d399,#10b981)", transition: "width 1s linear" }} />
      </Box>
    </Box>
  );
}

const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
function AttendanceRail({ stats }: { stats: MyLiveStats }) {
  const rate = stats.attendance_rate;
  const band = rate >= 80 ? "STRONG" : rate >= 50 ? "STEADY" : "BUILDING";
  const missing = Math.max(0, Math.ceil((80 - rate) / 20));
  return (
    <>
      <Box sx={{ borderRadius: 4, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", p: { xs: 2, sm: 2.5 }, textAlign: "center" }}>
        <Typography sx={{ fontSize: { xs: "0.75rem", sm: "0.66rem" }, fontWeight: 800, letterSpacing: 0.8, color: "text.secondary", mb: 1.5 }}>YOUR ATTENDANCE</Typography>
        <Box sx={{ display: "grid", placeItems: "center" }}>
          <AnimatedRing value={rate} size={148} asPercent caption={band}
            color={rate >= 80 ? "#10b981" : rate >= 50 ? "#7c3aed" : "#f59e0b"} />
        </Box>
        {rate < 100 && (
          <Box sx={{ mt: 2, p: 1.5, borderRadius: 2.5, bgcolor: "color-mix(in srgb,#10b981 8%,transparent)" }}>
            <Typography sx={{ fontSize: "0.8rem", color: "var(--font-secondary)" }}>
              Attend <b>{missing || 1} more</b> session{(missing || 1) === 1 ? "" : "s"} to push your rate higher.
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ borderRadius: 4, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", p: { xs: 2, sm: 2.5 } }}>
        <Typography sx={{ fontSize: { xs: "0.75rem", sm: "0.66rem" }, fontWeight: 800, letterSpacing: 0.8, color: "text.secondary", mb: 1.5 }}>THIS WEEK</Typography>
        <Stack direction="row" justifyContent="space-between">
          {stats.week.map((d, i) => {
            const meta: Record<string, { bg: string; fg: string; icon?: string }> = {
              attended: { bg: "color-mix(in srgb,#10b981 16%,transparent)", fg: "#059669", icon: "mdi:check" },
              live: { bg: "color-mix(in srgb,#ef4444 16%,transparent)", fg: "#dc2626", icon: "mdi:circle" },
              upcoming: { bg: "color-mix(in srgb,#8b5cf6 16%,transparent)", fg: "#7c3aed", icon: "mdi:calendar-blank" },
              missed: { bg: "color-mix(in srgb,#64748b 12%,transparent)", fg: "#94a3b8", icon: "mdi:minus" },
              none: { bg: "transparent", fg: "var(--font-tertiary)" },
            };
            const m = meta[d.state] || meta.none;
            return (
              <Stack key={i} alignItems="center" spacing={0.6}>
                <Typography sx={{ fontSize: { xs: "0.75rem", sm: "0.68rem" }, fontWeight: 700, color: "text.secondary" }}>{WEEK_LABELS[i]}</Typography>
                <Box sx={{ width: { xs: 36, sm: 30 }, height: { xs: 36, sm: 30 }, borderRadius: 1.5, display: "grid", placeItems: "center", bgcolor: m.bg, border: d.state === "none" ? "1px solid var(--border-default)" : "none" }}>
                  {m.icon && <Icon icon={m.icon} width={d.state === "live" ? 8 : 15} style={{ color: m.fg }} />}
                </Box>
              </Stack>
            );
          })}
        </Stack>
        <Stack direction="row" spacing={1.5} sx={{ mt: 1.5, flexWrap: "wrap", gap: { xs: 0.5, sm: 0 } }}>
          {[["#10b981", "Attended"], ["#ef4444", "Live"], ["#7c3aed", "Upcoming"]].map(([c, l]) => (
            <Stack key={l} direction="row" spacing={0.5} alignItems="center">
              <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: c }} />
              <Typography sx={{ fontSize: { xs: "0.75rem", sm: "0.68rem" }, color: "text.secondary" }}>{l}</Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </>
  );
}

function Snack({ text, onClose }: { text: string; onClose: () => void }) {
  useEffect(() => {
    const h = setTimeout(onClose, 3500);
    return () => clearTimeout(h);
  }, [onClose]);
  return (
    // The bottom nav is fixed at 56px + the home indicator, so a toast at `bottom: 24` lands
    // behind it and a learner never sees "We'll email you before this session."
    <Box sx={{ position: "fixed", bottom: { xs: "calc(72px + env(safe-area-inset-bottom))", md: 24 }, left: "50%", transform: "translateX(-50%)", zIndex: 1400,
      px: 2, py: 1.25, borderRadius: 2, bgcolor: "#111827", color: "#fff", fontSize: "0.85rem", fontWeight: 600, boxShadow: "0 12px 30px -12px rgba(0,0,0,.5)", maxWidth: { xs: "calc(100vw - 32px)", sm: "90vw" } }}>
      {text}
    </Box>
  );
}
