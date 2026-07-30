"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { AnimatedRing } from "@/components/scorecard/shared";
import { LiveSessionsEmptyState } from "@/components/live-sessions/LiveSessionsEmptyState";
import { LiveSessionsFeatureBlocked } from "@/components/live-sessions/LiveSessionsFeatureBlocked";
import { useLiveSessions } from "@/components/live-sessions/useLiveSessions";
import { RecordingPlayerDialog } from "@/components/live-sessions/RecordingPlayerDialog";
import { SessionMaterialsDisclosure } from "@/components/live-sessions/SessionMaterialsDisclosure";
import { StudentSessionSummaryDialog } from "@/components/live-sessions/StudentSessionSummaryDialog";
import { LiveSessionFeedbackDialog } from "@/components/live-sessions/LiveSessionFeedbackDialog";
import { COMMUNITY_FEATURE, HIDE_PARTICIPANT_COUNTS, useClientFeature, useClientOptIn } from "@/lib/hooks/useClientFeature";
import { studentLiveSessionsService } from "@/lib/services/live-sessions";
import type { StudentLiveSession, StudentLiveOccurrence, MyLiveStats } from "@/lib/services/live-sessions";
import { formatSessionClock, formatSessionTime } from "@/lib/utils/session-time";
import { ScheduleCalendar, type CalendarEvent } from "@/components/live-sessions/ScheduleCalendar";
import { assessmentService, type Assessment } from "@/lib/services/assessment.service";
import mockInterviewService, { type MockInterview } from "@/lib/services/mock-interview.service";

/** "HH:MM" (24h) for an ISO datetime, or "" when unparseable. */
function hhmm(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

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
function joinUrlOf(s: StudentLiveSession): string {
  return (s.is_google_meet ? s.join_link : s.zoom_join_url) || s.join_link || "";
}
function initials(name: string): string {
  return (name || "?").trim().slice(0, 2).toUpperCase();
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
    handleWatchRecording,
  } = useLiveSessions();

  const [tab, setTab] = useState<Tab>("upcoming");
  const [stats, setStats] = useState<MyLiveStats | null>(null);
  const [reminders, setReminders] = useState<Record<number, boolean>>({});
  const [prep, setPrep] = useState<Record<number, number[]>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [feedbackFor, setFeedbackFor] = useState<StudentLiveSession | null>(null);
  const { enabled: communityEnabled } = useClientFeature(COMMUNITY_FEATURE);
  const hideCounts = useClientOptIn(HIDE_PARTICIPANT_COUNTS);
  // Extra calendar sources (best-effort — a failure just leaves those dots off the calendar).
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [interviews, setInterviews] = useState<MockInterview[]>([]);

  useEffect(() => {
    studentLiveSessionsService.getMyStats().then(setStats).catch(() => undefined);
    assessmentService.getActiveAssessments().then(setAssessments).catch(() => undefined);
    mockInterviewService.listInterviews().then(setInterviews).catch(() => undefined);
  }, []);
  useEffect(() => {
    // seed reminder + prep state from the payload
    setReminders((cur) => {
      const next = { ...cur };
      for (const s of sessions) if (next[s.id] === undefined) next[s.id] = Boolean(s.reminder_enabled);
      return next;
    });
    setPrep((cur) => {
      const next = { ...cur };
      for (const s of sessions) if (next[s.id] === undefined) next[s.id] = s.my_prep ?? [];
      return next;
    });
  }, [sessions]);

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
      const live = occs.filter(
        (o) => o.status !== "cancelled" && o.meeting_status !== "cancelled"
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
      const noneCarryTheirOwn = !live.some((o) => o.has_recording || o.zoom_recording_url);
      const inheritIdx =
        noneCarryTheirOwn && s.has_recording
          ? live.reduce((best, o, i) => {
              const t = new Date(o.occurrence_datetime ?? s.class_datetime ?? 0).getTime();
              if (t > Date.now()) return best;
              const bt =
                best < 0
                  ? -Infinity
                  : new Date(live[best].occurrence_datetime ?? s.class_datetime ?? 0).getTime();
              return t > bt ? i : best;
            }, -1)
          : -1;

      live.forEach((o, i) => {
        const inherits = i === inheritIdx;
        out.push({
          ...s,
          // Keep the parent id for API calls (feedback, reminders) but make the key unique per date.
          occurrence_id: o.id,
          class_datetime: o.occurrence_datetime ?? s.class_datetime,
          duration_minutes: o.duration_minutes ?? s.duration_minutes,
          // `live` has already excluded cancelled occurrences, but .filter() does not narrow the
          // union the way the old `continue` did — so exclude it explicitly rather than casting.
          meeting_status:
            o.meeting_status && o.meeting_status !== "cancelled"
              ? o.meeting_status
              : s.meeting_status,
          has_recording: Boolean(o.has_recording || (inherits && s.has_recording)),
          zoom_recording_url:
            o.zoom_recording_url ?? (inherits ? s.zoom_recording_url : undefined),
        });
      });
    }
    return out;
  }, [sessions]);

  const live = useMemo(
    // A cancelled session must never drive the LIVE hero: the meeting still exists and is
    // joinable, so without this the student is offered "Join now" for a class that is off.
    () => instances.find((s) => s.meeting_status === "live" && s.notice_type !== "cancelled"),
    [instances],
  );

  // Unified calendar feed: live sessions + assessment windows (start=assessment, end=deadline) +
  // scheduled mock interviews.
  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    const evs: CalendarEvent[] = [];
    for (const s of sessions) {
      if (!s.class_datetime) continue;
      evs.push({
        id: `live-${s.id}`,
        date: s.class_datetime,
        title: s.topic_name || "Live session",
        type: "live",
        note: s.meeting_status === "live" ? "live now" : undefined,
        subtitle: courseOf(s) || undefined,
      });
    }
    for (const a of assessments) {
      if (a.start_time) evs.push({ id: `assess-${a.id}`, date: a.start_time, title: a.title, type: "assessment" });
      if (a.end_time) evs.push({ id: `deadline-${a.id}`, date: a.end_time, title: a.title, type: "deadline", time: `Due ${hhmm(a.end_time)}` });
    }
    for (const iv of interviews) {
      if (iv.scheduled_date_time) evs.push({ id: `iv-${iv.id}`, date: iv.scheduled_date_time, title: iv.title || iv.topic || "Mock interview", type: "interview", subtitle: iv.topic });
    }
    return evs;
  }, [sessions, assessments, interviews]);

  // While a session is live, poll Zoom for the CURRENT participant count (the stored
  // attendance_count only lands after the meeting ends — that's why it read '0 joined').
  const [liveJoined, setLiveJoined] = useState<number | null>(null);
  const liveId = live?.id;
  useEffect(() => {
    if (!liveId) {
      setLiveJoined(null);
      return;
    }
    let cancelled = false;
    const poll = async () => {
      try {
        const r = await studentLiveSessionsService.getLiveCount(liveId);
        if (!cancelled) setLiveJoined(r.live && r.count != null ? r.count : null);
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
  }, [liveId]);


  const upcoming = useMemo(
    () => instances.filter((s) => s.meeting_status === "scheduled").sort((a, b) => (a.class_datetime || "").localeCompare(b.class_datetime || "")),
    [instances],
  );
  const recordings = useMemo(() => instances.filter((s) => s.has_recording), [instances]);
  const history = useMemo(
    () => instances.filter((s) => PAST.has(s.meeting_status ?? "")).sort((a, b) => (b.class_datetime || "").localeCompare(a.class_datetime || "")),
    [instances],
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
    const want = !(reminders[s.id] ?? s.reminder_enabled);
    setReminders((c) => ({ ...c, [s.id]: want }));
    try {
      await studentLiveSessionsService.toggleReminder(s.id, want);
      setToast(want ? "We'll email you before this session." : "Reminder turned off.");
    } catch {
      setReminders((c) => ({ ...c, [s.id]: !want })); // revert
      setToast("Couldn't update the reminder.");
    }
  }, [reminders]);
  const togglePrep = useCallback(async (s: StudentLiveSession, index: number) => {
    const current = prep[s.id] ?? s.my_prep ?? [];
    const done = !current.includes(index);
    const optimistic = done ? [...current, index].sort((a, b) => a - b) : current.filter((i) => i !== index);
    setPrep((c) => ({ ...c, [s.id]: optimistic }));
    try {
      const r = await studentLiveSessionsService.togglePrep(s.id, index, done);
      setPrep((c) => ({ ...c, [s.id]: r.completed }));
    } catch {
      setPrep((c) => ({ ...c, [s.id]: current })); // revert
      setToast("Couldn't update your checklist.");
    }
  }, [prep]);

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
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" }, gap: 2, mb: 3 }}>
              <StatCard icon="mdi:check-circle-outline" tint="#7c3aed" value={stats.sessions_attended} label="Sessions attended" sub={`of ${stats.sessions_held} held`} />
              <StatCard icon="mdi:calendar-check-outline" tint="#10b981" value={`${stats.attendance_rate}%`} label="Attendance rate" sub={`cohort avg ${stats.cohort_avg_rate}%`} />
              <StatCard icon="mdi:clock-outline" tint="#ec4899" value={stats.live_hours} label="Live hours" sub="attended" />
              <StatCard icon="mdi:play-circle-outline" tint="#f59e0b" value={stats.recordings_left} label="Recordings left" sub="to catch up" />
            </Box>
          )}

          {/* Main grid */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 320px" }, gap: 2.5, alignItems: "start" }}>
            <Box>
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
                        reminderOn={reminders[s.id] ?? Boolean(s.reminder_enabled)}
                        prepDone={prep[s.id] ?? s.my_prep ?? []}
                        onAddCalendar={() => addToCalendar(s)} onRemind={() => toggleReminder(s)}
                        onTogglePrep={(idx) => togglePrep(s, idx)} />
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
                    {history.map((s) => <HistoryRow key={s.occurrence_id ?? s.id} s={s} onGiveFeedback={() => setFeedbackFor(s)} />)}
                  </Stack>
                )
              )}
            </Box>

            {/* Right rail */}
            <Stack spacing={2.5}>
              <ScheduleCalendar events={calendarEvents} />
              {stats && <AttendanceRail stats={stats} />}
            </Stack>
          </Box>
        </>
      )}

      <RecordingPlayerDialog open={Boolean(playerSession)} liveClassId={playerSession?.id ?? null}
        title={playerSession?.topic_name} onClose={() => setPlayerSession(null)} />
      {summarySession && (
        <StudentSessionSummaryDialog activityId={summarySession.id} topicName={summarySession.topic_name || ""} open onClose={() => setSummarySession(null)} />
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

function UpcomingCard({ s, isNext, reminderOn, prepDone, onAddCalendar, onRemind, onTogglePrep }: {
  s: StudentLiveSession; isNext: boolean; reminderOn: boolean; prepDone: number[];
  onAddCalendar: () => void; onRemind: () => void; onTogglePrep: (index: number) => void;
}) {
  const p = providerOf(s);
  const prepItems = s.prep_items ?? [];
  const doneCount = prepItems.filter((_, i) => prepDone.includes(i)).length;
  const countdown = useCountdown(isNext ? s.class_datetime : null);
  const recurring = Boolean(s.zoom_is_recurring && (s.occurrences?.length ?? 0) > 0);
  const [open, setOpen] = useState(false);

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
            <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{formatSessionClock(s.class_datetime, s.timezone)} · {s.duration_minutes || 0}m</Typography>
            {recurring && <Box sx={{ px: 0.8, py: 0.2, borderRadius: 999, bgcolor: "color-mix(in srgb,#6366f1 12%,transparent)", color: "#4f46e5", fontSize: "0.64rem", fontWeight: 800 }}>Recurring</Box>}
          </Stack>
          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.2 }}>{s.topic_name}</Typography>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mt: 0.4, color: "text.secondary", flexWrap: "wrap", gap: 0.5 }}>
            {s.instructor && <Stack direction="row" spacing={0.4} alignItems="center"><Icon icon="mdi:account-outline" width={13} /><Typography sx={{ fontSize: "0.8rem" }}>{s.instructor}</Typography></Stack>}
            {courseOf(s) && <Stack direction="row" spacing={0.4} alignItems="center"><Icon icon="mdi:bookmark-outline" width={13} /><Typography sx={{ fontSize: "0.8rem" }} noWrap>{courseOf(s)}</Typography></Stack>}
          </Stack>
          {recurring && (
            <Box sx={{ mt: 1 }}>
              <Button onClick={() => setOpen((o) => !o)} size="small" endIcon={<Icon icon={open ? "mdi:chevron-up" : "mdi:chevron-down"} width={16} />}
                sx={{ textTransform: "none", fontWeight: 700, color: "#6366f1", px: 0, minWidth: 0 }}>
                {s.recurrence_summary || `${s.occurrences?.length} sessions in this series`}
              </Button>
              {open && (
                <Stack spacing={0.5} sx={{ mt: 0.5, pl: 1, borderLeft: "2px solid var(--border-default)" }}>
                  {(s.occurrences || []).slice(0, 12).map((o: StudentLiveOccurrence) => (
                    <Stack key={o.id} direction="row" spacing={1} alignItems="center">
                      <Icon icon={o.meeting_status === "ended" ? "mdi:check-circle" : o.meeting_status === "live" ? "mdi:access-point" : "mdi:calendar-blank-outline"} width={14}
                        style={{ color: o.meeting_status === "ended" ? "#10b981" : o.meeting_status === "live" ? "#ef4444" : "#94a3b8" }} />
                      <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                        {o.occurrence_datetime ? formatSessionTime(o.occurrence_datetime, s.timezone, { format: { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }, dual: false }) : ""}
                      </Typography>
                      {o.has_recording && <Icon icon="mdi:play-circle-outline" width={13} style={{ color: "#7c3aed" }} />}
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
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

      {/* Come prepared (AI-generated) */}
      {prepItems.length > 0 && (
        <Box sx={{ mx: 2.25, mb: 2.25, p: 1.75, borderRadius: 2.5, border: "1px solid var(--border-default)", bgcolor: "color-mix(in srgb,#7c3aed 4%,transparent)" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: "0.64rem", fontWeight: 800, letterSpacing: 0.6, color: "text.secondary" }}>COME PREPARED</Typography>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: doneCount === prepItems.length ? "#059669" : "#b45309" }}>
              {doneCount}/{prepItems.length} DONE
            </Typography>
          </Stack>
          <Stack spacing={0.5}>
            {prepItems.map((item, i) => {
              const done = prepDone.includes(i);
              return (
                <Stack key={i} direction="row" spacing={1} alignItems="center" onClick={() => onTogglePrep(i)}
                  role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onTogglePrep(i); }}
                  sx={{ cursor: "pointer", py: 0.25, "&:hover .prep-text": { color: "var(--font-primary)" } }}>
                  <Icon icon={done ? "mdi:check-circle" : "mdi:checkbox-blank-circle-outline"} width={18}
                    style={{ color: done ? "#10b981" : "var(--font-tertiary)", flexShrink: 0 }} />
                  <Typography className="prep-text" sx={{ fontSize: "0.84rem", color: done ? "text.secondary" : "var(--font-primary)", textDecoration: done ? "line-through" : "none" }}>
                    {item}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      )}
      {/* Anything the trainer has already shared for this upcoming session — so a learner can
          prepare before it starts, not only afterwards. */}
      <Box sx={{ px: 2.25, pb: 1.75 }}>
        <SessionMaterialsDisclosure liveClassId={s.id} />
      </Box>
    </Box>
  );
}

function RecordingCard({ s, watching, onWatch, onSummary }: { s: StudentLiveSession; watching: boolean; onWatch: () => void; onSummary: () => void }) {
  const hasSummary = Boolean(s.zoom_ai_summary || s.google_ai_summary);
  return (
    <Box sx={{ borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", p: 2, display: "flex", gap: 1.75, alignItems: "center", flexWrap: "wrap" }}>
      <DateBadge dt={s.class_datetime} tz={s.timezone} />
      <Box sx={{ flex: 1, minWidth: 180 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1rem" }} noWrap>{s.topic_name}</Typography>
        <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{courseOf(s) || "Recording available"}</Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        {hasSummary && (
          <Button onClick={onSummary} startIcon={<Icon icon="mdi:text-box-outline" width={16} />}
            sx={{ textTransform: "none", fontWeight: 700, color: "#6366f1", px: 1.5, py: 0.8, borderRadius: 2, border: "1px solid var(--border-default)" }}>
            Notes
          </Button>
        )}
        <Button onClick={onWatch} disabled={watching}
          startIcon={watching ? <CircularProgress size={14} color="inherit" /> : <Icon icon="mdi:play" width={16} />}
          sx={{ textTransform: "none", fontWeight: 800, color: "#fff", px: 2, py: 0.8, borderRadius: 2, background: AI_GRAD }}>
          Watch
        </Button>
      </Stack>
    </Box>
  );
}

function HistoryRow({ s, onGiveFeedback }: { s: StudentLiveSession; onGiveFeedback?: () => void }) {
  const attended = Boolean(s.my_attendance?.attended);
  return (
    <Box sx={{ borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", p: 1.75 }}>
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
      <Icon icon={attended ? "mdi:check-circle" : "mdi:close-circle-outline"} width={22} style={{ color: attended ? "#10b981" : "#94a3b8", flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.92rem" }} noWrap>{s.topic_name}</Typography>
        <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
          {s.class_datetime ? formatSessionTime(s.class_datetime, s.timezone, { format: { month: "short", day: "numeric" }, dual: false, showZone: false }) : ""}
          {courseOf(s) ? ` · ${courseOf(s)}` : ""}
        </Typography>
      </Box>
      <Box sx={{ px: 1, py: 0.3, borderRadius: 999, fontSize: "0.68rem", fontWeight: 800,
        color: attended ? "#059669" : "#64748b", bgcolor: attended ? "color-mix(in srgb,#10b981 12%,transparent)" : "color-mix(in srgb,#64748b 12%,transparent)" }}>
        {attended ? "Attended" : "Missed"}
      </Box>
      {s.has_recording && <Icon icon="mdi:play-circle-outline" width={18} style={{ color: "#7c3aed" }} />}
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
