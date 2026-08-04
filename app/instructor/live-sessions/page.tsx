"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTenantTimezone } from "@/lib/hooks/useTenantTimezone";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { StudyMaterialManager } from "@/components/live-sessions/StudyMaterialManager";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import {
  instructorService,
  type InstructorLiveSession,
  type InstructorCohort,
  type InstructorCourse,
  type LiveSessionProvider,
  type AttendeeRow,
} from "@/lib/services/instructor.service";
import { viewerTimeZone, timezoneOptions, sessionTimeParts } from "@/lib/utils/session-time";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

type SessionStatus = "live" | "scheduled" | "ended";

const STATUS_META: Record<SessionStatus, { label: string; color: string; bg: string }> = {
  live: { label: "Live", color: "#059669", bg: "color-mix(in srgb,#10b981 15%,transparent)" },
  scheduled: { label: "Scheduled", color: "#6d28d9", bg: "color-mix(in srgb,#8b5cf6 15%,transparent)" },
  ended: { label: "Ended", color: "#64748b", bg: "color-mix(in srgb,#64748b 14%,transparent)" },
};

const TABS: { key: SessionStatus | "all"; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "mdi:view-grid-outline" },
  { key: "live", label: "Live", icon: "mdi:access-point" },
  { key: "scheduled", label: "Scheduled", icon: "mdi:calendar-clock" },
  { key: "ended", label: "Ended", icon: "mdi:history" },
];

const PROVIDER_META: Record<LiveSessionProvider, { label: string; icon: string; color: string }> = {
  webinar: { label: "Webinar", icon: "mdi:presentation", color: "#7c3aed" },
  meeting: { label: "Zoom", icon: "mdi:video-outline", color: "#2563eb" },
  google_meet: { label: "Meet", icon: "mdi:google", color: "#16a34a" },
  manual: { label: "Online", icon: "mdi:web", color: "#6b7280" },
};

function statusOf(s: InstructorLiveSession, now: number): SessionStatus {
  const start = new Date(s.class_datetime).getTime();
  const end = start + (s.duration_minutes || 0) * 60_000;
  if (now >= start && now <= end) return "live";
  if (now < start) return "scheduled";
  return "ended";
}
function turnoutColor(pct: number): string {
  if (pct >= 80) return "#10b981";
  if (pct >= 50) return "#f59e0b";
  return "#ef4444";
}
function isToday(dt: string, now: number): boolean {
  const d = new Date(dt);
  const n = new Date(now);
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}
function timeLabel(dt: string, tz?: string | null): string {
  try {
    const p = sessionTimeParts(dt, tz);
    return p.zoneAbbr ? `${p.time} ${p.zoneAbbr}` : p.time;
  } catch {
    return "";
  }
}
function dateLabel(dt: string, now: number, status: SessionStatus, tz?: string | null): string {
  if (isToday(dt, now)) return "TODAY";
  try {
    const d = new Date(dt);
    const z = tz || undefined;
    const day = d.toLocaleDateString(undefined, { day: "numeric", timeZone: z });
    const mon = d.toLocaleDateString(undefined, { month: "short", timeZone: z }).toUpperCase();
    if (status === "scheduled") {
      const wd = d.toLocaleDateString(undefined, { weekday: "short", timeZone: z }).toUpperCase();
      return `${wd} ${day} ${mon}`;
    }
    return `${day} ${mon}`;
  } catch {
    return "";
  }
}

export default function InstructorLiveSessionsPage() {
  const [sessions, setSessions] = useState<InstructorLiveSession[]>([]);
  const [pastTotal, setPastTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<SessionStatus | "all">("all");
  const [now, setNow] = useState(() => Date.now());
  const [hostingId, setHostingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; sev: "success" | "error" | "info" } | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<InstructorLiveSession | null>(null);
  const [attendanceFor, setAttendanceFor] = useState<InstructorLiveSession | null>(null);
  const [materialsFor, setMaterialsFor] = useState<InstructorLiveSession | null>(null);

  const reload = useCallback(async () => {
    try {
      const data = await instructorService.getLiveSessions();
      setSessions([...data.upcoming, ...data.past]);
      setPastTotal(data.past_total);
      setError(null);
    } catch (e) {
      setError(getAxiosErrorDetail(e, "Couldn't load your live sessions."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => {
    const h = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(h);
  }, []);

  const withStatus = useMemo(() => sessions.map((s) => ({ s, status: statusOf(s, now) })), [sessions, now]);
  const ordered = useMemo(() => {
    const order: Record<SessionStatus, number> = { live: 0, scheduled: 1, ended: 2 };
    return [...withStatus].sort((a, b) => {
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      const ta = new Date(a.s.class_datetime).getTime();
      const tb = new Date(b.s.class_datetime).getTime();
      return a.status === "ended" ? tb - ta : ta - tb;
    });
  }, [withStatus]);
  const counts = useMemo(() => {
    const c = { all: ordered.length, live: 0, scheduled: 0, ended: 0 } as Record<SessionStatus | "all", number>;
    ordered.forEach((x) => (c[x.status] += 1));
    return c;
  }, [ordered]);
  const visible = useMemo(() => (tab === "all" ? ordered : ordered.filter((x) => x.status === tab)), [ordered, tab]);
  const endedShown = useMemo(() => withStatus.filter((x) => x.status === "ended").length, [withStatus]);
  const showTruncation = (tab === "all" || tab === "ended") && pastTotal > endedShown;

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setToast({ text: "Join link copied to clipboard.", sev: "success" });
    } catch {
      setToast({ text: "Couldn't copy the link.", sev: "error" });
    }
  };
  const startHosting = async (s: InstructorLiveSession) => {
    setHostingId(s.id);
    try {
      const link = await instructorService.getHostLink(s.id);
      if (!link.url) { setToast({ text: "No host link is available for this session yet.", sev: "error" }); return; }
      window.open(link.url, "_blank", "noopener");
      setToast({ text: link.kind === "panelist" ? "Opening your panelist link. You'll join as a presenter." : "Opening your host link.", sev: "info" });
    } catch {
      setToast({ text: "Couldn't get your host link right now.", sev: "error" });
    } finally {
      setHostingId(null);
    }
  };
  const removeSession = async (s: InstructorLiveSession) => {
    if (!window.confirm(`Delete "${s.topic_name}"? This also removes the Zoom session.`)) return;
    try {
      await instructorService.deleteLiveSession(s.id);
      setSessions((cur) => cur.filter((x) => x.id !== s.id));
      setToast({ text: "Session deleted.", sev: "success" });
    } catch {
      setToast({ text: "Couldn't delete this session.", sev: "error" });
    }
  };

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Teach"
        title="Live Sessions"
        description="Host sessions for the courses and cohorts you're assigned to. Create one, share links, and join as a presenter."
        accent="pink"
        icon="mdi:video-outline"
        action={
          <HeaderActionButton icon="mdi:calendar-plus" variant="solid" onClick={() => setCreateOpen(true)}>
            Schedule session
          </HeaderActionButton>
        }
      />

      {/* Filter tabs */}
      <Stack direction="row" spacing={0.75} sx={{ mb: 2.5, flexWrap: "wrap", gap: 0.75 }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Box key={t.key} onClick={() => setTab(t.key)}
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 1.75, py: 0.75, borderRadius: 999,
                cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, color: active ? "#fff" : "text.secondary",
                background: active ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "var(--card-bg)",
                border: active ? "none" : "1px solid var(--border-default)" }}>
              {t.key === "live" && <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: active ? "#fff" : "#10b981" }} />}
              {t.key !== "live" && <Icon icon={t.icon} width={15} />}
              {t.label}
              <Box component="span" sx={{ ml: 0.3, px: 0.7, py: 0.05, borderRadius: 999, fontSize: "0.68rem", fontWeight: 800,
                bgcolor: active ? "rgba(255,255,255,0.25)" : "color-mix(in srgb,var(--border-default) 60%,transparent)" }}>
                {counts[t.key]}
              </Box>
            </Box>
          );
        })}
      </Stack>

      {error && <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>{error}</Typography>}
      {!error && loading && <Box sx={{ p: 5, display: "grid", placeItems: "center" }}><CircularProgress size={26} /></Box>}
      {!error && !loading && visible.length === 0 && (
        <Box sx={{ p: 5, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default)" }}>
          <Icon icon="mdi:video-off-outline" width={34} style={{ opacity: 0.4 }} />
          <Typography sx={{ color: "text.secondary", mt: 1 }}>
            {sessions.length === 0 ? "No live sessions yet. Schedule one for a cohort you teach." : "No sessions in this view."}
          </Typography>
          {sessions.length === 0 && (
            <Button onClick={() => setCreateOpen(true)} startIcon={<Icon icon="mdi:calendar-plus" width={16} />}
              sx={{ mt: 2, textTransform: "none", fontWeight: 800, color: "#fff", px: 2.5, py: 1, borderRadius: 999,
                background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
              Schedule your first session
            </Button>
          )}
        </Box>
      )}

      {/* Session rows */}
      <Stack spacing={1.75}>
        {visible.map(({ s, status }) => (
          <SessionRow
            key={s.id}
            s={s}
            status={status}
            now={now}
            hosting={hostingId === s.id}
            onHost={() => startHosting(s)}
            onCopy={() => copyLink(s.join_link)}
            onEdit={() => setEditing(s)}
            onAttendance={() => setAttendanceFor(s)}
            onMaterials={() => setMaterialsFor(s)}
            onRecording={() => s.recording_url && window.open(s.recording_url, "_blank", "noopener")}
            onDelete={() => removeSession(s)}
          />
        ))}
      </Stack>

      {showTruncation && (
        <Typography sx={{ textAlign: "center", color: "text.secondary", fontSize: "0.82rem", mt: 2.5 }}>
          Showing the latest {endedShown} of {pastTotal} past sessions.
        </Typography>
      )}

      <CreateSessionDialog open={createOpen} onClose={() => setCreateOpen(false)}
        onCreated={(msg) => { setToast({ text: msg, sev: "success" }); void reload(); }} />
      <EditSessionDialog session={editing} onClose={() => setEditing(null)}
        onSaved={() => { setToast({ text: "Session updated.", sev: "success" }); void reload(); }} />
      <AttendanceDialog session={attendanceFor} onClose={() => setAttendanceFor(null)} />
      <Dialog open={Boolean(materialsFor)} onClose={() => setMaterialsFor(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{materialsFor?.topic_name || "Study material"}</DialogTitle>
        <DialogContent>
          {materialsFor && <StudyMaterialManager liveClassId={materialsFor.id} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaterialsFor(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {toast ? <Alert severity={toast.sev} variant="filled" onClose={() => setToast(null)} sx={{ fontWeight: 600 }}>{toast.text}</Alert> : undefined}
      </Snackbar>

      <style jsx global>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </PageShell>
  );
}

/* --------------------------------- row ------------------------------------ */

function TurnoutBlock({ label, attendance, registered, turnout }: {
  label: string; attendance: number; registered: number; turnout: number;
}) {
  const color = turnoutColor(turnout);
  return (
    <Box sx={{ minWidth: 150 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.5 }}>
        <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", fontWeight: 600 }}>{label}</Typography>
        <Typography sx={{ fontSize: "0.86rem", fontWeight: 800 }}>{attendance}/{registered}</Typography>
      </Stack>
      <Box sx={{ height: 6, borderRadius: 3, bgcolor: "color-mix(in srgb,var(--border-default) 55%,transparent)", overflow: "hidden" }}>
        <Box sx={{ width: `${Math.max(0, Math.min(100, turnout))}%`, height: "100%", bgcolor: color }} />
      </Box>
      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color, mt: 0.4 }}>{turnout}% turnout</Typography>
    </Box>
  );
}

function SessionRow({ s, status, now, hosting, onHost, onCopy, onEdit, onAttendance, onMaterials, onRecording, onDelete }: {
  s: InstructorLiveSession; status: SessionStatus; now: number; hosting: boolean;
  onHost: () => void; onCopy: () => void; onEdit: () => void; onAttendance: () => void; onMaterials: () => void; onRecording: () => void; onDelete: () => void;
}) {
  const m = STATUS_META[status];
  const p = PROVIDER_META[s.provider] ?? PROVIDER_META.manual;
  const isLive = status === "live";
  const today = isToday(s.class_datetime, now);
  const viewerTime = sessionTimeParts(s.class_datetime, s.timezone).viewerTime;
  // Thirty minutes is enough to open the room, share a screen and settle before students arrive,
  // without putting a Start button on every session in next month's list.
  const minutesToStart = (new Date(s.class_datetime).getTime() - now) / 60000;
  const canStartEarly = minutesToStart > 0 && minutesToStart <= 30;
  const hasStats = s.registered > 0 && s.turnout != null && (status === "ended" || s.attendance > 0);

  const outlineBtn = { textTransform: "none", fontWeight: 700, color: "#6366f1", px: 1.75, py: 0.9, borderRadius: 2, border: "1px solid var(--border-default)" } as const;

  return (
    <Box sx={{ borderRadius: 3.5, bgcolor: "var(--card-bg)", p: { xs: 1.75, md: 2.25 },
      border: isLive ? "1px solid color-mix(in srgb,#10b981 40%,transparent)" : "1px solid var(--border-default)",
      boxShadow: isLive ? "0 0 0 3px color-mix(in srgb,#10b981 10%,transparent)" : "0 10px 30px -28px rgba(16,24,40,.3)",
      display: "flex", flexWrap: "wrap", alignItems: "center", gap: { xs: 1.5, md: 2 } }}>
      {/* Date/time badge */}
      <Box sx={{ width: 78, flexShrink: 0, borderRadius: 2.5, textAlign: "center", py: 1,
        bgcolor: today ? "color-mix(in srgb,#10b981 14%,transparent)" : "color-mix(in srgb,var(--border-default) 40%,transparent)" }}>
        <Typography sx={{ fontWeight: 900, fontSize: "0.98rem", lineHeight: 1.15, color: today ? "#059669" : "var(--font-primary)" }}>
          {timeLabel(s.class_datetime, s.timezone)}
        </Typography>
        <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: 0.4, color: "text.secondary", mt: 0.4 }}>
          {dateLabel(s.class_datetime, now, status, s.timezone)}
        </Typography>
      </Box>

      {/* Middle */}
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.6, flexWrap: "wrap", gap: 0.5 }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, px: 0.9, py: 0.2, borderRadius: 999, bgcolor: m.bg, color: m.color, fontSize: "0.68rem", fontWeight: 800 }}>
            {isLive && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: m.color, animation: "pulse 1.4s infinite" }} />}
            {m.label}
          </Box>
          <Stack direction="row" spacing={0.35} alignItems="center" sx={{ color: p.color }}>
            <Icon icon={p.icon} width={14} />
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700 }}>{p.label}</Typography>
          </Stack>
          <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{s.duration_minutes}m</Typography>
          {viewerTime && (
            <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>· {viewerTime} your time</Typography>
          )}
        </Stack>
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.2 }} noWrap>{s.topic_name}</Typography>
        <Stack direction="row" spacing={0.4} alignItems="center" sx={{ color: "text.secondary", mt: 0.3 }}>
          <Icon icon="mdi:account-outline" width={13} />
          <Typography sx={{ fontSize: "0.8rem" }} noWrap>
            {s.cohort_name || "Session"}{s.registered > 0 ? ` · ${s.registered} registered` : ""}
          </Typography>
        </Stack>
      </Box>

      {/* Right: stats + actions */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ ml: "auto", flexWrap: "wrap", gap: 1.5, justifyContent: "flex-end" }}>
        {hasStats && s.turnout != null && (
          <TurnoutBlock label={status === "live" ? "Joined" : "Attendance"} attendance={s.attendance} registered={s.registered} turnout={s.turnout} />
        )}

        <Stack direction="row" spacing={1} alignItems="center">
          {/* Also before the clock says "live".
              A trainer opens the room to set up, and a session the platform still calls
              "scheduled" was previously unstartable from here — the button only appeared once the
              start time had already passed. That also matters beyond convenience: where a tenant
              gates student Join on the host actually starting, this button is the only thing that
              produces that signal. */}
          {(status === "live" || (status === "scheduled" && canStartEarly)) && s.hostable && (
            <Button onClick={onHost} disabled={hosting}
              startIcon={hosting ? <CircularProgress size={15} color="inherit" /> : <Icon icon="mdi:video" width={16} />}
              sx={{ textTransform: "none", fontWeight: 800, color: "#fff", px: 2, py: 0.9, borderRadius: 2,
                background: "linear-gradient(135deg,#10b981,#059669)", "&:hover": { filter: "brightness(1.06)" },
                "&.Mui-disabled": { color: "rgba(255,255,255,0.8)" } }}>
              {status === "live" ? "Start hosting" : "Start early"}
            </Button>
          )}
          {status === "scheduled" && (
            <>
              {s.editable && (
                <Button onClick={onEdit} startIcon={<Icon icon="mdi:pencil-outline" width={16} />} sx={outlineBtn}>Edit</Button>
              )}
              {s.join_link && (
                <Button onClick={onCopy} startIcon={<Icon icon="mdi:tray-arrow-up" width={16} />}
                  sx={{ textTransform: "none", fontWeight: 700, color: "#7c3aed", px: 1.75, py: 0.9, borderRadius: 2,
                    bgcolor: "color-mix(in srgb,#7c3aed 10%,transparent)" }}>
                  Copy link
                </Button>
              )}
            </>
          )}
          {status === "ended" && (
            <>
              {s.has_recording ? (
                <Button onClick={onRecording} startIcon={<Icon icon="mdi:play" width={16} />}
                  sx={{ textTransform: "none", fontWeight: 700, color: "#7c3aed", px: 1.75, py: 0.9, borderRadius: 2,
                    bgcolor: "color-mix(in srgb,#7c3aed 10%,transparent)" }}>
                  Recording
                </Button>
              ) : s.editable ? (
                <Button startIcon={<Icon icon="mdi:tray-arrow-down" width={16} />} disabled sx={{ ...outlineBtn, color: "text.disabled" }}>
                  Upload recording
                </Button>
              ) : null}
              <Button onClick={onAttendance} startIcon={<Icon icon="mdi:calendar-check-outline" width={16} />} sx={outlineBtn}>Attendance</Button>
            </>
          )}
          {/* Material is shared both before a class (prep) and after it (notes), so this is not
              gated on the session having ended. */}
          <Button onClick={onMaterials} startIcon={<Icon icon="mdi:paperclip" width={16} />} sx={outlineBtn}>Material</Button>
          {s.created_by_me && (
            <IconButton size="small" onClick={onDelete} sx={{ color: "text.secondary", "&:hover": { color: "#ef4444" } }} aria-label="Delete session">
              <Icon icon="mdi:trash-can-outline" width={18} />
            </IconButton>
          )}
        </Stack>
      </Stack>

      {s.password && (
        <Box sx={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, px: 1, py: 0.4, borderRadius: 1.5, bgcolor: "color-mix(in srgb,#6366f1 8%,transparent)", fontSize: "0.7rem", fontWeight: 700, color: "#4f46e5" }}>
            <Icon icon="mdi:key-variant" width={12} /> {s.password}
          </Box>
        </Box>
      )}
    </Box>
  );
}

/* --------------------------- create session dialog -------------------------- */

function CreateSessionDialog({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: (msg: string) => void;
}) {
  const [cohorts, setCohorts] = useState<InstructorCohort[]>([]);
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [sessionType, setSessionType] = useState<"meeting" | "webinar">("meeting");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [when, setWhen] = useState("");
  const [sessionTz, setSessionTz] = useState("");
  const [duration, setDuration] = useState(60);
  const [audience, setAudience] = useState("");
  const [passcode, setPasscode] = useState("");
  const [registration, setRegistration] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const tenantTz = useTenantTimezone();
  useEffect(() => {
    if (!open) return;
    instructorService.getCohorts().then(setCohorts).catch(() => undefined);
    // Adaptive only: this picker submits the id as `adaptive_course_id`, and classic course ids come
    // from a different table — sending one would address an unrelated adaptive course or be rejected.
    instructorService
      .getCourses()
      .then((list) => setCourses(list.filter((c) => c.kind === "adaptive")))
      .catch(() => undefined);
    // Default the session zone to the instructor's own zone (client-only).
    setSessionTz((prev) => prev || tenantTz);
  }, [open]);

  const reset = () => {
    setTopic(""); setDescription(""); setWhen(""); setDuration(60); setAudience("");
    setPasscode(""); setRegistration(false); setSessionType("meeting"); setErr(null);
  };
  const valid = topic.trim().length >= 2 && !!when && duration >= 1 && duration <= 600 && !!audience;

  const submit = async () => {
    if (!valid) return;
    setSaving(true); setErr(null);
    try {
      const [kind, idStr] = audience.split(":");
      const id = Number(idStr);
      const created = await instructorService.createLiveSession({
        topic_name: topic.trim(),
        description: description.trim() || undefined,
        class_datetime: when,
        timezone: sessionTz || undefined,
        duration_minutes: duration,
        session_type: sessionType,
        ...(kind === "c" ? { cohort_id: id } : { adaptive_course_id: id }),
        ...(sessionType === "webinar" ? { passcode: passcode.trim() || undefined, registration_required: registration } : {}),
      });
      onCreated(`Session created${sessionType === "webinar" ? ". You're added as a panelist." : "."}`);
      if (created.host_link?.url) window.open(created.host_link.url, "_blank", "noopener");
      reset(); onClose();
    } catch (e) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setErr(detail || (getAxiosErrorDetail(e, "Couldn't create the session.")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>Schedule a live session</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Stack direction="row" spacing={1}>
            {(["meeting", "webinar"] as const).map((t) => {
              const active = sessionType === t;
              return (
                <Box key={t} onClick={() => setSessionType(t)}
                  sx={{ flex: 1, p: 1.5, borderRadius: 2.5, cursor: "pointer", textAlign: "center",
                    border: active ? "2px solid #7c3aed" : "1px solid var(--border-default)",
                    bgcolor: active ? "color-mix(in srgb,#7c3aed 8%,transparent)" : "transparent" }}>
                  <Icon icon={t === "webinar" ? "mdi:presentation" : "mdi:video"} width={22} style={{ color: active ? "#7c3aed" : "#6b7280" }} />
                  <Typography sx={{ fontWeight: 800, fontSize: "0.86rem", mt: 0.25 }}>{t === "webinar" ? "Webinar" : "Meeting"}</Typography>
                  <Typography sx={{ fontSize: "0.68rem", color: "text.secondary" }}>
                    {t === "webinar" ? "You join as a panelist" : "You host with the start link"}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
          <TextField label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} fullWidth size="small" required />
          <TextField label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth size="small" multiline minRows={2} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="Starts" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)}
              fullWidth size="small" InputLabelProps={{ shrink: true }} helperText="Wall-clock time, in the timezone →" />
            <TextField label="Duration (min)" type="number" value={duration}
              onChange={(e) => setDuration(Math.max(1, Math.min(600, Number(e.target.value) || 0)))}
              size="small" sx={{ width: { xs: "100%", sm: 130 } }} inputProps={{ min: 1, max: 600 }} />
          </Stack>
          <TextField select label="Timezone" value={sessionTz} onChange={(e) => setSessionTz(e.target.value)}
            fullWidth size="small" helperText="The session is scheduled in this zone">
            {timezoneOptions(sessionTz).map((z) => (
              <MenuItem key={z.value} value={z.value}>{z.label}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Cohort or course" value={audience} onChange={(e) => setAudience(e.target.value)} fullWidth size="small">
            {cohorts.length > 0 && <MenuItem disabled sx={{ fontWeight: 800, opacity: 1 }}>Cohorts</MenuItem>}
            {cohorts.map((c) => <MenuItem key={`c${c.id}`} value={`c:${c.id}`}>&nbsp;&nbsp;{c.name}</MenuItem>)}
            {courses.length > 0 && <MenuItem disabled sx={{ fontWeight: 800, opacity: 1 }}>Courses</MenuItem>}
            {courses.map((c) => <MenuItem key={`a${c.id}`} value={`a:${c.id}`}>&nbsp;&nbsp;{c.title}</MenuItem>)}
            {cohorts.length === 0 && courses.length === 0 && <MenuItem disabled>No assigned cohorts or courses</MenuItem>}
          </TextField>
          {sessionType === "webinar" && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
              <TextField label="Passcode (optional)" value={passcode} onChange={(e) => setPasscode(e.target.value)} size="small" sx={{ flex: 1 }} />
              <FormControlLabel control={<Switch checked={registration} onChange={(e) => setRegistration(e.target.checked)} />} label="Require registration" />
            </Stack>
          )}
          {err && <Alert severity="error" sx={{ fontWeight: 600 }}>{err}</Alert>}
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
            Provisions a Zoom {sessionType} on your institution's account. {sessionType === "webinar" ? "You'll be added as a panelist and get a unique presenter link." : "You'll get the host start link to run it."}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: "none", fontWeight: 700 }}>Cancel</Button>
        <Button onClick={submit} disabled={!valid || saving}
          startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <Icon icon="mdi:calendar-check" width={16} />}
          sx={{ textTransform: "none", fontWeight: 800, color: "#fff", px: 2.5, borderRadius: 2,
            background: "linear-gradient(135deg,#7c3aed,#ec4899)", "&.Mui-disabled": { color: "rgba(255,255,255,0.7)", opacity: 0.7 } }}>
          {saving ? "Creating…" : "Create session"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ----------------------------- edit dialog -------------------------------- */

/** Render an absolute instant as a datetime-local wall-clock IN THE GIVEN ZONE (not the browser's). */
function toLocalInput(iso: string, tz?: string | null): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const parts = new Intl.DateTimeFormat("en-CA", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
      timeZone: tz || undefined,
    }).formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const hour = get("hour") === "24" ? "00" : get("hour");
    return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
  } catch {
    return "";
  }
}

function EditSessionDialog({ session, onClose, onSaved }: {
  session: InstructorLiveSession | null; onClose: () => void; onSaved: () => void;
}) {
  const [topic, setTopic] = useState("");
  const [when, setWhen] = useState("");
  const [sessionTz, setSessionTz] = useState("");
  const [duration, setDuration] = useState(60);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      const tz = session.timezone || viewerTimeZone() || "Asia/Kolkata";
      setTopic(session.topic_name);
      setSessionTz(tz);
      // Show the wall-clock in the SESSION's own zone so editing from another zone doesn't shift it.
      setWhen(toLocalInput(session.class_datetime, tz));
      setDuration(session.duration_minutes);
      setErr(null);
    }
  }, [session]);

  const valid = topic.trim().length >= 2 && !!when && duration >= 1 && duration <= 600;

  const submit = async () => {
    if (!session || !valid) return;
    setSaving(true); setErr(null);
    try {
      await instructorService.editLiveSession(session.id, {
        topic_name: topic.trim(),
        class_datetime: when,
        timezone: sessionTz || undefined,
        duration_minutes: duration,
      });
      onSaved(); onClose();
    } catch (e) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setErr(detail || (getAxiosErrorDetail(e, "Couldn't update the session.")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!session} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>Edit session</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} fullWidth size="small" />
          <TextField label="Starts" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)}
            fullWidth size="small" InputLabelProps={{ shrink: true }} helperText="Wall-clock time, in the timezone below" />
          <TextField select label="Timezone" value={sessionTz} onChange={(e) => setSessionTz(e.target.value)}
            fullWidth size="small">
            {timezoneOptions(sessionTz).map((z) => (
              <MenuItem key={z.value} value={z.value}>{z.label}</MenuItem>
            ))}
          </TextField>
          <TextField label="Duration (min)" type="number" value={duration}
            onChange={(e) => setDuration(Math.max(1, Math.min(600, Number(e.target.value) || 0)))}
            size="small" inputProps={{ min: 1, max: 600 }} />
          {err && <Alert severity="error" sx={{ fontWeight: 600 }}>{err}</Alert>}
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Changes sync to the Zoom session.</Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: "none", fontWeight: 700 }}>Cancel</Button>
        <Button onClick={submit} disabled={!valid || saving}
          startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <Icon icon="mdi:content-save" width={16} />}
          sx={{ textTransform: "none", fontWeight: 800, color: "#fff", px: 2.5, borderRadius: 2, background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* --------------------------- attendance dialog ---------------------------- */

function AttendanceDialog({ session, onClose }: { session: InstructorLiveSession | null; onClose: () => void }) {
  const [rows, setRows] = useState<AttendeeRow[] | null>(null);
  const [summary, setSummary] = useState({ registered: 0, attendance: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) { setRows(null); return; }
    setLoading(true);
    instructorService.getAttendance(session.id)
      .then((r) => { setRows(r.attendees); setSummary({ registered: r.registered, attendance: r.attendance }); })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [session]);

  const SRC: Record<AttendeeRow["source"], { label: string; color: string }> = {
    zoom: { label: "Zoom", color: "#2563eb" },
    meet: { label: "Meet", color: "#16a34a" },
    manual: { label: "Manual", color: "#6b7280" },
  };

  return (
    <Dialog open={!!session} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>
        Attendance
        <Typography component="span" sx={{ ml: 1, fontSize: "0.85rem", color: "text.secondary", fontWeight: 600 }}>
          {summary.attendance}/{summary.registered} joined
        </Typography>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ p: 3, display: "grid", placeItems: "center" }}><CircularProgress size={22} /></Box>
        ) : rows && rows.length > 0 ? (
          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
            {rows.map((r, i) => {
              const src = SRC[r.source];
              return (
                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.25, p: 1, borderRadius: 2, "&:hover": { bgcolor: "color-mix(in srgb,#6366f1 5%,transparent)" } }}>
                  <Box sx={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center",
                    color: "#fff", fontWeight: 800, fontSize: "0.72rem", background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                    {(r.name || "?").slice(0, 1).toUpperCase()}
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.86rem" }} noWrap>{r.name}</Typography>
                    {r.email && <Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }} noWrap>{r.email}</Typography>}
                  </Box>
                  {r.duration_minutes != null && <Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>{r.duration_minutes}m</Typography>}
                  <Box sx={{ px: 0.8, py: 0.15, borderRadius: 999, fontSize: "0.62rem", fontWeight: 800, color: src.color, bgcolor: `color-mix(in srgb,${src.color} 12%,transparent)` }}>{src.label}</Box>
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Typography sx={{ color: "text.secondary", py: 3, textAlign: "center" }}>No attendance recorded yet.</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 700 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
