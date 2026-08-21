"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, CircularProgress, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { AnimatedRing } from "@/components/scorecard/shared";
import { LiveSessionsEmptyState } from "@/components/live-sessions/LiveSessionsEmptyState";
import { LiveSessionsFeatureBlocked } from "@/components/live-sessions/LiveSessionsFeatureBlocked";
import { useLiveSessions } from "@/components/live-sessions/useLiveSessions";
import { RecordingPlayerDialog } from "@/components/live-sessions/RecordingPlayerDialog";
import { SessionFilterChips } from "@/components/live-sessions/ui/LiveSessionUI";
import { SessionMaterialsDisclosure } from "@/components/live-sessions/SessionMaterialsDisclosure";
import { StudentSessionSummaryDialog } from "@/components/live-sessions/StudentSessionSummaryDialog";
import { LiveSessionFeedbackDialog } from "@/components/live-sessions/LiveSessionFeedbackDialog";
import { COMMUNITY_FEATURE, HIDE_PARTICIPANT_COUNTS, useClientFeature, useClientOptIn } from "@/lib/hooks/useClientFeature";
import { studentLiveSessionsService } from "@/lib/services/live-sessions";
import type { StudentLiveSession, MyLiveStats } from "@/lib/services/live-sessions";
import { formatSessionClock, formatSessionTime } from "@/lib/utils/session-time";
import { ScheduleCalendar, dayKey, type CalendarEvent } from "@/components/live-sessions/ScheduleCalendar";

/* --------------------------------- helpers -------------------------------- */

type Tab = "upcoming" | "recordings" | "history";
const PAST = new Set(["ended", "expired"]);
const AI_GRAD = "linear-gradient(135deg,#7c3aed,#ec4899)";

function providerOf(s: StudentLiveSession): { label: string; icon: string; color: string } {
  if (s.is_google_meet) return { label: "Meet", icon: "mdi:google", color: "#16a34a" };
  if (s.zoom_meeting_type === "webinar") return { label: "Webinar", icon: "mdi:presentation", color: "#7c3aed" };
  if (s.is_zoom) return { label: "Zoom", icon: "mdi:video-outline", color: "#2563eb" };
  return { label: "Online", icon: "mdi:web", color: "#6b7280" };
}
function courseOf(s: StudentLiveSession): string {
  return s.cohort_detail?.name || s.adaptive_course_detail?.title || s.course_detail?.title || "";
}
/** Course title only - for cards that already show the batch as its own chip, so the batch name
 *  isn't printed twice. */
function courseTextOf(s: StudentLiveSession): string {
  return s.adaptive_course_detail?.title || s.course_detail?.title || s.course_detail?.name || "";
}
/** Stable per-batch accent so the same cohort always wears the same color across cards. */
const COHORT_CHIP_COLORS = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6", "#14b8a6", "#f43f5e"];
function cohortColorOf(id: number): string {
  return COHORT_CHIP_COLORS[Math.abs(id) % COHORT_CHIP_COLORS.length];
}
/** Courses are a facet too, but a muted one - batches keep the loud colors. */
const COURSE_FACET_COLOR = "#64748b";

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
/** Card text next to the chip: never repeat what the chip already says. */
function cardCourseText(s: StudentLiveSession): string {
  if (s.cohort_detail?.id != null && s.cohort_detail?.name) return courseTextOf(s); // chip = batch
  if (courseTextOf(s)) return ""; // chip = the course itself
  return courseOf(s); // no chip at all - keep the old text
}
/** What this session belongs to, as a prominent colored chip: the batch when there is one, else
 *  the course (muted color). Renders nothing for a fully untargeted session. */
function CohortChip({ s, small }: { s: StudentLiveSession; small?: boolean }) {
  const cohortId = s.cohort_detail?.id;
  const cohortName = s.cohort_detail?.name;
  const courseTitle = courseTextOf(s);
  const isCohort = cohortId != null && Boolean(cohortName);
  if (!isCohort && !courseTitle) return null;
  const label = isCohort ? cohortName! : courseTitle;
  const c = isCohort ? cohortColorOf(cohortId!) : COURSE_FACET_COLOR;
  return (
    <Box
      title={label}
      sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, px: small ? 0.8 : 1, py: 0.2, borderRadius: 999,
        fontSize: small ? "0.64rem" : "0.68rem", fontWeight: 800, color: c, flexShrink: 0,
        bgcolor: `color-mix(in srgb, ${c} 13%, transparent)`,
        border: `1px solid color-mix(in srgb, ${c} 30%, transparent)`, maxWidth: 170 }}
    >
      <Icon icon={isCohort ? "mdi:account-group" : "mdi:bookmark-outline"} width={small ? 11 : 12} style={{ flexShrink: 0 }} />
      <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</Box>
    </Box>
  );
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
/** A sitting kept for its recording even though it is marked cancelled. Says so plainly rather
 *  than passing it off as a class that ran normally. */
function CancelledSittingChip({ s }: { s: StudentLiveSession }) {
  if (!s.occurrence_cancelled) return null;
  return (
    <Box sx={{ px: 0.8, py: 0.2, borderRadius: 999, flexShrink: 0, fontSize: "0.64rem", fontWeight: 800,
      color: "#64748b", bgcolor: "color-mix(in srgb,#64748b 12%,transparent)" }}>
      Cancelled sitting
    </Box>
  );
}
/** Notes exist when the date/series has an AI summary OR a synced transcript - a transcript with
 *  no summary must still open the dialog (it renders whatever exists for the clicked date). */
function hasNotesOf(s: StudentLiveSession): boolean {
  return Boolean(
    s.zoom_ai_summary || s.google_ai_summary || s.zoom_transcript_synced_at || s.google_transcript_synced_at
  );
}
/** The backend's reminder state for THIS card: a dated occurrence is "on" only when its own id is
 *  in the armed set; a single session keeps the series-level flag. */
function seededReminder(s: StudentLiveSession): boolean {
  if (s.occurrence_id != null) {
    return (s.reminder_occurrence_ids ?? []).includes(s.occurrence_id);
  }
  return Boolean(s.reminder_enabled);
}
function fmtDay(dt?: string | null, tz?: string | null) {
  if (!dt) return { d: "", mon: "", wd: "" };
  const x = new Date(dt);
  const z = tz || undefined;
  return {
    d: x.toLocaleDateString(undefined, { day: "2-digit", timeZone: z }),
    mon: x.toLocaleDateString(undefined, { month: "short", timeZone: z }).toUpperCase(),
    wd: x.toLocaleDateString(undefined, { weekday: "short", timeZone: z }).toUpperCase(),
  };
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
        out.push({
          ...s,
          // Keep the parent id for API calls (feedback, reminders) but make the key unique per date.
          occurrence_id: o.id,
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
  }, [instances]);

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
  const recordings = useMemo(
    // An ended date can carry a transcript but no recording (recording failed, or only the
    // transcript synced) - it lists too, with Notes and no Watch, instead of vanishing.
    () => instances.filter((s) => (s.has_recording || (PAST.has(s.meeting_status ?? "") && hasNotesOf(s))) && matchesSelectedDay(s)),
    [instances, matchesSelectedDay],
  );
  const history = useMemo(
    () => instances.filter((s) => PAST.has(s.meeting_status ?? "") && matchesSelectedDay(s)).sort((a, b) => (b.class_datetime || "").localeCompare(a.class_datetime || "")),
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
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3, gap: 2, flexWrap: "wrap" }}>
        <Stack direction="row" spacing={1.75} alignItems="flex-start">
          <Box sx={{ width: 52, height: 52, borderRadius: 3, flexShrink: 0, display: "grid", placeItems: "center", color: "#fff", background: AI_GRAD }}>
            <Icon icon="mdi:broadcast" width={26} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: 1, color: "#7c3aed" }}>LEARN · LIVE</Typography>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.6rem", md: "2rem" }, lineHeight: 1.1 }}>Live Sessions</Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.9rem", maxWidth: 520, mt: 0.25 }}>
              Join live classes, prepare before you arrive, and catch up on anything you missed with recordings and notes.
            </Typography>
          </Box>
        </Stack>
        <Button onClick={syncAll}
          startIcon={<Icon icon="mdi:calendar-sync" width={18} />}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2.5, px: 2, py: 1, border: "1px solid var(--border-default)", color: "var(--font-primary)", bgcolor: "var(--card-bg)" }}>
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
              display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 300px" } }}>
              <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.4, borderRadius: 999, bgcolor: "rgba(239,68,68,0.25)", border: "1px solid rgba(239,68,68,0.5)", fontSize: "0.68rem", fontWeight: 800 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#f87171", animation: "pulse 1.4s infinite" }} /> LIVE NOW
                  </Box>
                  <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.82rem" }}>{startedAgo(live.class_datetime)}</Typography>
                  <LiveTimeLeft start={live.class_datetime} durationMinutes={live.duration_minutes} />
                </Stack>
                <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.6rem", md: "2.1rem" }, lineHeight: 1.1 }}>{live.topic_name}</Typography>
                <LiveProgress start={live.class_datetime} durationMinutes={live.duration_minutes} />
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.25, color: "rgba(255,255,255,0.85)", flexWrap: "wrap", gap: 0.75 }}>
                  {live.instructor && (
                    <Stack direction="row" spacing={0.6} alignItems="center">
                      <Box sx={{ width: 24, height: 24, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: "0.62rem", fontWeight: 800, bgcolor: "rgba(255,255,255,0.2)" }}>{initials(live.instructor)}</Box>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{live.instructor}</Typography>
                    </Stack>
                  )}
                  {courseOf(live) && <Stack direction="row" spacing={0.4} alignItems="center"><Icon icon="mdi:bookmark-outline" width={15} /><Typography sx={{ fontSize: "0.85rem" }}>{courseOf(live)}</Typography></Stack>}
                  <Stack direction="row" spacing={0.4} alignItems="center"><Icon icon={providerOf(live).icon} width={15} /><Typography sx={{ fontSize: "0.85rem" }}>{providerOf(live).label}</Typography></Stack>
                </Stack>
                <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }} flexWrap="wrap" useFlexGap>
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
              <Box sx={{ p: 2.5, borderLeft: { md: "1px solid rgba(255,255,255,0.1)" }, display: "flex", flexDirection: "column", justifyContent: "center", gap: 1.5 }}>
                {(live.agenda?.length ?? 0) > 0 && (
                  <Box>
                    <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: 0.8, color: "rgba(255,255,255,0.55)", mb: 1 }}>TODAY&apos;S AGENDA</Typography>
                    <Stack spacing={0.75}>
                      {(live.agenda || []).slice(0, 5).map((item, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                          <Box sx={{ width: 18, height: 18, flexShrink: 0, mt: 0.1, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: "0.62rem", fontWeight: 800, bgcolor: "rgba(255,255,255,0.15)" }}>{i + 1}</Box>
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
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3,1fr)" }, gap: 2, mb: 3 }}>
              <StatCard icon="mdi:check-circle-outline" tint="#7c3aed" value={stats.sessions_attended} label="Sessions attended" sub={`of ${stats.sessions_held} held`} />
              <StatCard icon="mdi:calendar-check-outline" tint="#10b981" value={`${stats.attendance_rate}%`} label="Attendance rate" sub={`cohort avg ${stats.cohort_avg_rate}%`} />
              <StatCard icon="mdi:clock-outline" tint="#ec4899" value={stats.live_hours} label="Live hours" sub="attended" />
            </Box>
          )}

          {/* Main grid */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 320px" }, gap: 2.5, alignItems: "start" }}>
            <Box>
              {/* Batch/course facet filter - only when this student actually spans several. */}
              {facetOptions.length >= 2 && (
                <Box sx={{ mb: 1.5 }}>
                  <SessionFilterChips
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
              <Stack direction="row" spacing={0.75} sx={{ mb: 2, flexWrap: "wrap", gap: 0.75 }}>
                {TABS.map((tb) => {
                  const active = tab === tb.key;
                  return (
                    <Box key={tb.key} onClick={() => setTab(tb.key)}
                      sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 1.75, py: 0.8, borderRadius: 2.5, cursor: "pointer",
                        fontSize: "0.85rem", fontWeight: 800, color: active ? "#fff" : "text.secondary",
                        background: active ? AI_GRAD : "var(--card-bg)", border: active ? "none" : "1px solid var(--border-default)" }}>
                      <Icon icon={tb.icon} width={16} /> {tb.label}
                      <Box component="span" sx={{ ml: 0.3, px: 0.7, borderRadius: 999, fontSize: "0.7rem", fontWeight: 800, bgcolor: active ? "rgba(255,255,255,0.25)" : "color-mix(in srgb,var(--border-default) 60%,transparent)" }}>{tb.count}</Box>
                    </Box>
                  );
                })}
              </Stack>

              {tab === "upcoming" && (
                upcoming.length === 0 ? <Empty text="No upcoming sessions. New classes will show up here." /> : (
                  <Stack spacing={1.75}>
                    {upcoming.map((s, i) => (
                      <UpcomingCard key={s.occurrence_id ?? s.id} s={s} isNext={i === 0}
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
    <Box sx={{ p: 5, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default)" }}>
      <Icon icon="mdi:video-off-outline" width={30} style={{ opacity: 0.4 }} />
      <Typography sx={{ color: "text.secondary", mt: 1 }}>{text}</Typography>
    </Box>
  );
}

function StatCard({ icon, tint, value, label, sub }: { icon: string; tint: string; value: React.ReactNode; label: string; sub: string }) {
  return (
    <Box sx={{ p: 2.25, borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <Box sx={{ width: 38, height: 38, borderRadius: 2, flexShrink: 0, display: "grid", placeItems: "center", color: tint, bgcolor: `color-mix(in srgb,${tint} 12%,transparent)` }}>
        <Icon icon={icon} width={20} />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 900, fontSize: "1.6rem", lineHeight: 1, color: tint }}>{value}</Typography>
        <Typography sx={{ fontWeight: 700, fontSize: "0.84rem", mt: 0.4 }}>{label}</Typography>
        <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{sub}</Typography>
      </Box>
    </Box>
  );
}

function DateBadge({ dt, tz }: { dt?: string | null; tz?: string | null }) {
  const b = fmtDay(dt, tz);
  return (
    <Box sx={{ width: 58, flexShrink: 0, borderRadius: 2.5, border: "1px solid var(--border-default)", textAlign: "center", overflow: "hidden" }}>
      <Box sx={{ py: 0.3, bgcolor: "color-mix(in srgb,var(--border-default) 35%,transparent)", fontSize: "0.58rem", fontWeight: 800, color: "text.secondary" }}>{b.wd}</Box>
      <Typography sx={{ fontWeight: 900, fontSize: "1.35rem", lineHeight: 1.3 }}>{b.d}</Typography>
      <Typography sx={{ fontSize: "0.58rem", fontWeight: 800, color: "text.secondary", pb: 0.4 }}>{b.mon}</Typography>
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
      bgcolor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", fontSize: "0.72rem", fontWeight: 800 }}>
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

function useCountdown(target?: string | null): string | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const h = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(h);
  }, []);
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0 || diff > 24 * 3600 * 1000) return null;
  const s = Math.floor(diff / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/**
 * Cancellation / reschedule notice from an admin or the assigned instructor.
 *
 * Rendered above everything else on the card: the student has to read WHY before they reach for a
 * join link or plan around the old time.
 */
function SessionNotice({ s }: { s: StudentLiveSession }) {
  const kind = s.notice_type;
  if (kind !== "cancelled" && kind !== "rescheduled") return null;
  const cancelled = kind === "cancelled";
  const tone = cancelled ? "#ef4444" : "#f59e0b";
  return (
    <Box sx={{ display: "flex", gap: 1, px: 2.25, py: 1.25,
      bgcolor: `color-mix(in srgb, ${tone} 10%, transparent)`,
      borderBottom: `1px solid color-mix(in srgb, ${tone} 30%, transparent)` }}>
      <Icon icon={cancelled ? "mdi:calendar-remove" : "mdi:calendar-clock"} width={18} style={{ color: tone, flexShrink: 0, marginTop: 2 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: tone }}>
          {cancelled ? "Session cancelled" : "Session rescheduled"}
        </Typography>
        {s.notice_reason && (
          <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", wordBreak: "break-word" }}>
            {s.notice_reason}
          </Typography>
        )}
        {!cancelled && s.previous_class_datetime && (
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", opacity: 0.8, textDecoration: "line-through" }}>
            {formatSessionTime(s.previous_class_datetime, s.timezone)}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function UpcomingCard({ s, isNext, reminderOn, onAddCalendar, onRemind }: {
  s: StudentLiveSession; isNext: boolean; reminderOn: boolean;
  onAddCalendar: () => void; onRemind: () => void;
}) {
  const p = providerOf(s);
  const countdown = useCountdown(isNext ? s.class_datetime : null);
  const recurring = Boolean(s.zoom_is_recurring && (s.occurrences?.length ?? 0) > 0);
  const courseText = cardCourseText(s);

  return (
    <Box sx={{ borderRadius: 3.5, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", overflow: "hidden" }}>
      <SessionNotice s={s} />
      {isNext && countdown && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.25, py: 0.75, background: "color-mix(in srgb,#7c3aed 8%,transparent)" }}>
          <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: 0.6, color: "#7c3aed" }}>✦ STARTS NEXT</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", fontVariantNumeric: "tabular-nums", color: "#7c3aed" }}>{countdown}</Typography>
        </Stack>
      )}
      <Box sx={{ p: 2.25, display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
        <DateBadge dt={s.class_datetime} tz={s.timezone} />
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5, flexWrap: "wrap", gap: 0.5 }}>
            <Box sx={{ px: 0.9, py: 0.2, borderRadius: 999, bgcolor: "color-mix(in srgb,#8b5cf6 14%,transparent)", color: "#6d28d9", fontSize: "0.66rem", fontWeight: 800 }}>Scheduled</Box>
            <Stack direction="row" spacing={0.35} alignItems="center" sx={{ color: p.color }}><Icon icon={p.icon} width={14} /><Typography sx={{ fontSize: "0.72rem", fontWeight: 700 }}>{p.label}</Typography></Stack>
            <CohortChip s={s} />
            <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{formatSessionClock(s.class_datetime, s.timezone)} · {s.duration_minutes || 0}m</Typography>
            {recurring && <Box sx={{ px: 0.8, py: 0.2, borderRadius: 999, bgcolor: "color-mix(in srgb,#6366f1 12%,transparent)", color: "#4f46e5", fontSize: "0.64rem", fontWeight: 800 }}>Recurring</Box>}
          </Stack>
          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.2 }}>{s.topic_name}</Typography>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mt: 0.4, color: "text.secondary", flexWrap: "wrap", gap: 0.5 }}>
            {s.instructor && <Stack direction="row" spacing={0.4} alignItems="center"><Icon icon="mdi:account-outline" width={13} /><Typography sx={{ fontSize: "0.8rem" }}>{s.instructor}</Typography></Stack>}
            {/* The batch already has its chip above, so this line is course-only when one exists. */}
            {courseText && <Stack direction="row" spacing={0.4} alignItems="center"><Icon icon="mdi:bookmark-outline" width={13} /><Typography sx={{ fontSize: "0.8rem" }} noWrap>{courseText}</Typography></Stack>}
          </Stack>
          {recurring && s.recurrence_summary && (
            <Typography sx={{ mt: 1, fontSize: "0.78rem", fontWeight: 700, color: "#6366f1" }}>
              {s.recurrence_summary}
            </Typography>
          )}
        </Box>
        <Stack spacing={1} sx={{ minWidth: 168 }}>
          <Button onClick={onAddCalendar}
            startIcon={<Icon icon="mdi:calendar-plus" width={16} />}
            sx={{ textTransform: "none", fontWeight: 800, color: "#fff", py: 1, borderRadius: 2, background: AI_GRAD, "&:hover": { filter: "brightness(1.06)" } }}>
            Add to calendar
          </Button>
          <Button onClick={onRemind}
            startIcon={<Icon icon={reminderOn ? "mdi:bell-check" : "mdi:bell-outline"} width={16} />}
            sx={{ textTransform: "none", fontWeight: 700, py: 1, borderRadius: 2, border: "1px solid var(--border-default)",
              color: reminderOn ? "#059669" : "var(--font-primary)", bgcolor: reminderOn ? "color-mix(in srgb,#10b981 8%,transparent)" : "transparent" }}>
            {reminderOn ? "Reminder on" : "Remind me"}
          </Button>
        </Stack>
      </Box>

      {/* Anything the trainer has already shared for this upcoming session — so a learner can
          prepare before it starts, not only afterwards. */}
      <Box sx={{ px: 2.25, pb: 1.75 }}>
        <SessionMaterialsDisclosure liveClassId={s.id} />
      </Box>
    </Box>
  );
}

function RecordingCard({ s, watching, onWatch, onSummary }: { s: StudentLiveSession; watching: boolean; onWatch: () => void; onSummary: () => void }) {
  // Not gated on the AI summary: a date with a transcript but no summary still has notes to show,
  // and the dialog renders whatever exists for the clicked date.
  const hasNotes = hasNotesOf(s);
  return (
    <Box sx={{ borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", p: 2, display: "flex", gap: 1.75, alignItems: "center", flexWrap: "wrap" }}>
      <DateBadge dt={s.class_datetime} tz={s.timezone} />
      <Box sx={{ flex: 1, minWidth: 180 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "1rem" }} noWrap>{s.topic_name}</Typography>
          <CohortChip s={s} small />
          <CancelledSittingChip s={s} />
        </Stack>
        <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
          {cardCourseText(s) || (s.has_recording ? "Recording available" : "Transcript available")}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        {hasNotes && (
          <Button onClick={onSummary} startIcon={<Icon icon="mdi:text-box-outline" width={16} />}
            sx={{ textTransform: "none", fontWeight: 700, color: "#6366f1", px: 1.5, py: 0.8, borderRadius: 2, border: "1px solid var(--border-default)" }}>
            Notes
          </Button>
        )}
        {s.has_recording && (
          <Button onClick={onWatch} disabled={watching}
            startIcon={watching ? <CircularProgress size={14} color="inherit" /> : <Icon icon="mdi:play" width={16} />}
            sx={{ textTransform: "none", fontWeight: 800, color: "#fff", px: 2, py: 0.8, borderRadius: 2, background: AI_GRAD }}>
            Watch
          </Button>
        )}
      </Stack>
    </Box>
  );
}

function HistoryRow({ s, watching, onWatch, onGiveFeedback }: {
  s: StudentLiveSession; watching?: boolean; onWatch?: () => void; onGiveFeedback?: () => void;
}) {
  const attended = Boolean(s.my_attendance?.attended);
  // The chip says what this session belongs to, so the text line never repeats it.
  const courseText = cardCourseText(s);
  return (
    <Box sx={{ borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", p: 1.75 }}>
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
      <Icon icon={attended ? "mdi:check-circle" : "mdi:close-circle-outline"} width={22} style={{ color: attended ? "#10b981" : "#94a3b8", flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.92rem" }} noWrap>{s.topic_name}</Typography>
        <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
          {s.class_datetime ? formatSessionTime(s.class_datetime, s.timezone, { format: { month: "short", day: "numeric" }, dual: false, showZone: false }) : ""}
          {courseText ? ` · ${courseText}` : ""}
        </Typography>
      </Box>
      <CohortChip s={s} small />
      <CancelledSittingChip s={s} />
      <Box sx={{ px: 1, py: 0.3, borderRadius: 999, fontSize: "0.68rem", fontWeight: 800,
        color: attended ? "#059669" : "#64748b", bgcolor: attended ? "color-mix(in srgb,#10b981 12%,transparent)" : "color-mix(in srgb,#64748b 12%,transparent)" }}>
        {attended ? "Attended" : "Missed"}
      </Box>
      {/* This glyph always looked like a play button; now it is one, opening the same in-app
          player the Recordings tab uses for this date. */}
      {s.has_recording && onWatch && (
        <Tooltip title="Watch recording">
          <IconButton size="small" aria-label="Watch recording" disabled={watching} onClick={onWatch}>
            {watching
              ? <CircularProgress size={16} sx={{ color: "#7c3aed" }} />
              : <Icon icon="mdi:play-circle-outline" width={18} style={{ color: "#7c3aed" }} />}
          </IconButton>
        </Tooltip>
      )}
      {/* Nothing to rate on a session that was called off. */}
      {onGiveFeedback && s.notice_type !== "cancelled" && (
        <Button onClick={onGiveFeedback} size="small" startIcon={<Icon icon="mdi:star-outline" width={16} />}
          sx={{ textTransform: "none", fontWeight: 700, color: "#7c3aed", minWidth: 0, flexShrink: 0 }}>
          Rate
        </Button>
      )}
    </Box>
    {/* What the trainer shared for this session. Collapsed so a long history stays scannable, and
        only fetched when opened. */}
    <SessionMaterialsDisclosure liveClassId={s.id} dense />
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
      <Box sx={{ borderRadius: 4, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", p: 2.5, textAlign: "center" }}>
        <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: 0.8, color: "text.secondary", mb: 1.5 }}>YOUR ATTENDANCE</Typography>
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

      <Box sx={{ borderRadius: 4, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", p: 2.5 }}>
        <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: 0.8, color: "text.secondary", mb: 1.5 }}>THIS WEEK</Typography>
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
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "text.secondary" }}>{WEEK_LABELS[i]}</Typography>
                <Box sx={{ width: 30, height: 30, borderRadius: 1.5, display: "grid", placeItems: "center", bgcolor: m.bg, border: d.state === "none" ? "1px solid var(--border-default)" : "none" }}>
                  {m.icon && <Icon icon={m.icon} width={d.state === "live" ? 8 : 15} style={{ color: m.fg }} />}
                </Box>
              </Stack>
            );
          })}
        </Stack>
        <Stack direction="row" spacing={1.5} sx={{ mt: 1.5, flexWrap: "wrap" }}>
          {[["#10b981", "Attended"], ["#ef4444", "Live"], ["#7c3aed", "Upcoming"]].map(([c, l]) => (
            <Stack key={l} direction="row" spacing={0.5} alignItems="center">
              <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: c }} />
              <Typography sx={{ fontSize: "0.68rem", color: "text.secondary" }}>{l}</Typography>
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
    <Box sx={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 1400,
      px: 2, py: 1.25, borderRadius: 2, bgcolor: "#111827", color: "#fff", fontSize: "0.85rem", fontWeight: 600, boxShadow: "0 12px 30px -12px rgba(0,0,0,.5)", maxWidth: "90vw" }}>
      {text}
    </Box>
  );
}
