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
import { StudentSessionSummaryDialog } from "@/components/live-sessions/StudentSessionSummaryDialog";
import { studentLiveSessionsService } from "@/lib/services/live-sessions";
import type { StudentLiveSession, StudentLiveOccurrence, MyLiveStats } from "@/lib/services/live-sessions";

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
function fmtDay(dt?: string | null) {
  if (!dt) return { d: "", mon: "", wd: "" };
  const x = new Date(dt);
  return {
    d: x.toLocaleDateString(undefined, { day: "2-digit" }),
    mon: x.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
    wd: x.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase(),
  };
}
function fmtTime(dt?: string | null) {
  if (!dt) return "";
  return new Date(dt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}
function startedAgo(dt?: string | null): string {
  if (!dt) return "";
  const mins = Math.max(0, Math.round((Date.now() - new Date(dt).getTime()) / 60000));
  if (mins < 1) return "Starting now";
  if (mins < 60) return `Started ${mins} min ago`;
  return `Started ${Math.round(mins / 60)}h ago`;
}
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
  const [busyIcs, setBusyIcs] = useState<number | "all" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    studentLiveSessionsService.getMyStats().then(setStats).catch(() => undefined);
  }, []);
  useEffect(() => {
    // seed reminder state from the payload
    setReminders((cur) => {
      const next = { ...cur };
      for (const s of sessions) if (next[s.id] === undefined) next[s.id] = Boolean(s.reminder_enabled);
      return next;
    });
  }, [sessions]);

  const live = useMemo(() => sessions.find((s) => s.meeting_status === "live"), [sessions]);
  const upcoming = useMemo(
    () => sessions.filter((s) => s.meeting_status === "scheduled").sort((a, b) => (a.class_datetime || "").localeCompare(b.class_datetime || "")),
    [sessions],
  );
  const recordings = useMemo(() => sessions.filter((s) => s.has_recording), [sessions]);
  const history = useMemo(
    () => sessions.filter((s) => PAST.has(s.meeting_status ?? "")).sort((a, b) => (b.class_datetime || "").localeCompare(a.class_datetime || "")),
    [sessions],
  );

  const syncAll = useCallback(async () => {
    setBusyIcs("all");
    try {
      downloadBlob(await studentLiveSessionsService.getMyCalendarIcs(), "my-live-sessions.ics");
      setToast("Calendar file downloaded. Open it to add all your upcoming sessions.");
    } catch {
      setToast("Couldn't build your calendar right now.");
    } finally {
      setBusyIcs(null);
    }
  }, []);
  const addToCalendar = useCallback(async (s: StudentLiveSession) => {
    setBusyIcs(s.id);
    try {
      downloadBlob(await studentLiveSessionsService.getSessionIcs(s.id), `live-session-${s.id}.ics`);
    } catch {
      setToast("Couldn't add this to your calendar.");
    } finally {
      setBusyIcs(null);
    }
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
        <Button onClick={syncAll} disabled={busyIcs === "all"}
          startIcon={busyIcs === "all" ? <CircularProgress size={15} /> : <Icon icon="mdi:calendar-sync" width={18} />}
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
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.4, borderRadius: 999, bgcolor: "rgba(239,68,68,0.25)", border: "1px solid rgba(239,68,68,0.5)", fontSize: "0.68rem", fontWeight: 800 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#f87171", animation: "pulse 1.4s infinite" }} /> LIVE NOW
                  </Box>
                  <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.82rem" }}>{startedAgo(live.class_datetime)}</Typography>
                </Stack>
                <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.6rem", md: "2.1rem" }, lineHeight: 1.1 }}>{live.topic_name}</Typography>
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
                  <Button component="a" href={joinUrlOf(live)} target="_blank" rel="noopener"
                    startIcon={<Icon icon="mdi:video" width={18} />}
                    sx={{ px: 3, py: 1.1, borderRadius: 2.5, fontWeight: 800, textTransform: "none", color: "#047857", bgcolor: "#fff", "&:hover": { bgcolor: "rgba(255,255,255,0.9)" } }}>
                    Join now
                  </Button>
                  <Button onClick={() => router.push("/community")} startIcon={<Icon icon="mdi:comment-question-outline" width={18} />}
                    sx={{ px: 2.5, py: 1.1, borderRadius: 2.5, fontWeight: 800, textTransform: "none", color: "#fff", bgcolor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}>
                    Ask a question
                  </Button>
                </Stack>
              </Box>
              <Box sx={{ p: 2.5, borderLeft: { md: "1px solid rgba(255,255,255,0.1)" }, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <Stack direction="row" spacing={-0.8} sx={{ mb: 1 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <Box key={i} sx={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid #052e16", ml: i ? "-8px" : 0,
                      background: ["#a855f7", "#6366f1", "#ec4899", "#f59e0b"][i] }} />
                  ))}
                </Stack>
                <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>{live.attendance_count || 0} joined</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.78rem", mt: 0.5 }}>
                  You&apos;re in the room with your cohort. Ask questions any time.
                </Typography>
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
                      <UpcomingCard key={s.id} s={s} isNext={i === 0}
                        reminderOn={reminders[s.id] ?? Boolean(s.reminder_enabled)}
                        busyIcs={busyIcs === s.id}
                        onAddCalendar={() => addToCalendar(s)} onRemind={() => toggleReminder(s)} />
                    ))}
                  </Stack>
                )
              )}
              {tab === "recordings" && (
                recordings.length === 0 ? <Empty text="No recordings yet. They appear here automatically after a session ends." /> : (
                  <Stack spacing={1.5}>
                    {recordings.map((s) => (
                      <RecordingCard key={s.id} s={s} watching={watchingRecordingId === s.id}
                        onWatch={() => handleWatchRecording(s)}
                        onSummary={() => setSummarySession(s)} />
                    ))}
                  </Stack>
                )
              )}
              {tab === "history" && (
                history.length === 0 ? <Empty text="No past sessions yet." /> : (
                  <Stack spacing={1.25}>
                    {history.map((s) => <HistoryRow key={s.id} s={s} />)}
                  </Stack>
                )
              )}
            </Box>

            {/* Right rail */}
            <Stack spacing={2.5}>
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

function DateBadge({ dt }: { dt?: string | null }) {
  const b = fmtDay(dt);
  return (
    <Box sx={{ width: 58, flexShrink: 0, borderRadius: 2.5, border: "1px solid var(--border-default)", textAlign: "center", overflow: "hidden" }}>
      <Box sx={{ py: 0.3, bgcolor: "color-mix(in srgb,var(--border-default) 35%,transparent)", fontSize: "0.58rem", fontWeight: 800, color: "text.secondary" }}>{b.wd}</Box>
      <Typography sx={{ fontWeight: 900, fontSize: "1.35rem", lineHeight: 1.3 }}>{b.d}</Typography>
      <Typography sx={{ fontSize: "0.58rem", fontWeight: 800, color: "text.secondary", pb: 0.4 }}>{b.mon}</Typography>
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

function UpcomingCard({ s, isNext, reminderOn, busyIcs, onAddCalendar, onRemind }: {
  s: StudentLiveSession; isNext: boolean; reminderOn: boolean; busyIcs: boolean;
  onAddCalendar: () => void; onRemind: () => void;
}) {
  const p = providerOf(s);
  const countdown = useCountdown(isNext ? s.class_datetime : null);
  const recurring = Boolean(s.zoom_is_recurring && (s.occurrences?.length ?? 0) > 0);
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ borderRadius: 3.5, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", overflow: "hidden" }}>
      {isNext && countdown && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.25, py: 0.75, background: "color-mix(in srgb,#7c3aed 8%,transparent)" }}>
          <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: 0.6, color: "#7c3aed" }}>✦ STARTS NEXT</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", fontVariantNumeric: "tabular-nums", color: "#7c3aed" }}>{countdown}</Typography>
        </Stack>
      )}
      <Box sx={{ p: 2.25, display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
        <DateBadge dt={s.class_datetime} />
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5, flexWrap: "wrap", gap: 0.5 }}>
            <Box sx={{ px: 0.9, py: 0.2, borderRadius: 999, bgcolor: "color-mix(in srgb,#8b5cf6 14%,transparent)", color: "#6d28d9", fontSize: "0.66rem", fontWeight: 800 }}>Scheduled</Box>
            <Stack direction="row" spacing={0.35} alignItems="center" sx={{ color: p.color }}><Icon icon={p.icon} width={14} /><Typography sx={{ fontSize: "0.72rem", fontWeight: 700 }}>{p.label}</Typography></Stack>
            <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{fmtTime(s.class_datetime)} · {s.duration_minutes || 0}m</Typography>
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
                        {o.occurrence_datetime ? new Date(o.occurrence_datetime).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}
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
          <Button onClick={onAddCalendar} disabled={busyIcs}
            startIcon={busyIcs ? <CircularProgress size={14} color="inherit" /> : <Icon icon="mdi:calendar-plus" width={16} />}
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
    </Box>
  );
}

function RecordingCard({ s, watching, onWatch, onSummary }: { s: StudentLiveSession; watching: boolean; onWatch: () => void; onSummary: () => void }) {
  const hasSummary = Boolean(s.zoom_ai_summary || s.google_ai_summary);
  return (
    <Box sx={{ borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", p: 2, display: "flex", gap: 1.75, alignItems: "center", flexWrap: "wrap" }}>
      <DateBadge dt={s.class_datetime} />
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

function HistoryRow({ s }: { s: StudentLiveSession }) {
  const attended = Boolean(s.my_attendance?.attended);
  return (
    <Box sx={{ borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", p: 1.75, display: "flex", gap: 1.5, alignItems: "center" }}>
      <Icon icon={attended ? "mdi:check-circle" : "mdi:close-circle-outline"} width={22} style={{ color: attended ? "#10b981" : "#94a3b8", flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.92rem" }} noWrap>{s.topic_name}</Typography>
        <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
          {s.class_datetime ? new Date(s.class_datetime).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}
          {courseOf(s) ? ` · ${courseOf(s)}` : ""}
        </Typography>
      </Box>
      <Box sx={{ px: 1, py: 0.3, borderRadius: 999, fontSize: "0.68rem", fontWeight: 800,
        color: attended ? "#059669" : "#64748b", bgcolor: attended ? "color-mix(in srgb,#10b981 12%,transparent)" : "color-mix(in srgb,#64748b 12%,transparent)" }}>
        {attended ? "Attended" : "Missed"}
      </Box>
      {s.has_recording && <Icon icon="mdi:play-circle-outline" width={18} style={{ color: "#7c3aed" }} />}
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
