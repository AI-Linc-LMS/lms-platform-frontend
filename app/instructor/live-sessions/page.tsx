"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import {
  instructorService,
  type InstructorLiveSession,
  type InstructorCohort,
  type InstructorCourse,
  type LiveSessionProvider,
} from "@/lib/services/instructor.service";

type SessionStatus = "live" | "scheduled" | "ended";

const STATUS_META: Record<SessionStatus, { label: string; color: string; bg: string }> = {
  live: { label: "Live now", color: "#dc2626", bg: "color-mix(in srgb,#ef4444 14%,transparent)" },
  scheduled: { label: "Scheduled", color: "#4338ca", bg: "color-mix(in srgb,#6366f1 14%,transparent)" },
  ended: { label: "Ended", color: "#475569", bg: "color-mix(in srgb,#64748b 14%,transparent)" },
};

const TABS: { key: SessionStatus | "all"; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "mdi:view-grid-outline" },
  { key: "live", label: "Live", icon: "mdi:access-point" },
  { key: "scheduled", label: "Scheduled", icon: "mdi:calendar-clock" },
  { key: "ended", label: "Ended", icon: "mdi:history" },
];

const PROVIDER_META: Record<LiveSessionProvider, { label: string; icon: string; color: string }> = {
  webinar: { label: "Zoom Webinar", icon: "mdi:presentation", color: "#7c3aed" },
  meeting: { label: "Zoom", icon: "mdi:video", color: "#2563eb" },
  google_meet: { label: "Google Meet", icon: "mdi:google", color: "#16a34a" },
  manual: { label: "Online", icon: "mdi:web", color: "#6b7280" },
};

// Status is derived client-side from datetime+duration against a ticking `now`, so a scheduled
// session flips to Live (and the counts/order update) without a manual reload.
function statusOf(s: InstructorLiveSession, now: number): SessionStatus {
  const start = new Date(s.class_datetime).getTime();
  const end = start + (s.duration_minutes || 0) * 60_000;
  if (now >= start && now <= end) return "live";
  if (now < start) return "scheduled";
  return "ended";
}

function dayBadge(dt: string): { top: string; bottom: string } {
  try {
    const d = new Date(dt);
    return { top: d.toLocaleDateString(undefined, { month: "short" }).toUpperCase(), bottom: String(d.getDate()) };
  } catch {
    return { top: "", bottom: "" };
  }
}
function fmtTime(dt: string): string {
  try {
    return new Date(dt).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
  } catch {
    return dt;
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

  const reload = useCallback(async () => {
    try {
      const data = await instructorService.getLiveSessions();
      setSessions([...data.upcoming, ...data.past]);
      setPastTotal(data.past_total);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load your live sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Tick every 30s so live/scheduled/ended stays fresh while the page is open.
  useEffect(() => {
    const h = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(h);
  }, []);

  const withStatus = useMemo(
    () => sessions.map((s) => ({ s, status: statusOf(s, now) })),
    [sessions, now],
  );
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
      if (!link.url) {
        setToast({ text: "No host link is available for this session yet.", sev: "error" });
        return;
      }
      window.open(link.url, "_blank", "noopener");
      setToast({
        text: link.kind === "panelist" ? "Opening your panelist link. You'll join as a presenter." : "Opening your host link.",
        sev: "info",
      });
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
                background: active ? "linear-gradient(135deg,#ec4899,#a855f7)" : "var(--card-bg)",
                border: active ? "none" : "1px solid var(--border-default)" }}>
              <Icon icon={t.icon} width={15} />
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
      {!error && loading && (
        <Box sx={{ p: 5, display: "grid", placeItems: "center" }}><CircularProgress size={26} /></Box>
      )}
      {!error && !loading && visible.length === 0 && (
        <Box sx={{ p: 5, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default)" }}>
          <Icon icon="mdi:video-off-outline" width={34} style={{ opacity: 0.4 }} />
          <Typography sx={{ color: "text.secondary", mt: 1 }}>
            {sessions.length === 0 ? "No live sessions yet. Schedule one for a cohort you teach." : "No sessions in this view."}
          </Typography>
          {sessions.length === 0 && (
            <Button onClick={() => setCreateOpen(true)} startIcon={<Icon icon="mdi:calendar-plus" width={16} />}
              sx={{ mt: 2, textTransform: "none", fontWeight: 800, color: "#fff", px: 2.5, py: 1, borderRadius: 999,
                background: "linear-gradient(135deg,#ec4899,#a855f7)" }}>
              Schedule your first session
            </Button>
          )}
        </Box>
      )}

      {/* Session cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2,1fr)" }, gap: 2 }}>
        {visible.map(({ s, status }) => {
          const m = STATUS_META[status];
          const p = PROVIDER_META[s.provider] ?? PROVIDER_META.manual;
          const badge = dayBadge(s.class_datetime);
          const isLive = status === "live";
          return (
            <Box key={s.id}
              sx={{ borderRadius: 4, overflow: "hidden", bgcolor: "var(--card-bg)",
                border: isLive ? "1px solid color-mix(in srgb,#ef4444 45%,transparent)" : "1px solid var(--border-default)",
                boxShadow: isLive ? "0 0 0 3px color-mix(in srgb,#ef4444 12%,transparent)" : "0 10px 30px -26px rgba(16,24,40,.3)",
                display: "flex", flexDirection: "column" }}>
              <Box sx={{ p: 2.25, display: "flex", gap: 1.75, flex: 1 }}>
                {/* Date badge */}
                <Box sx={{ width: 56, flexShrink: 0, borderRadius: 3, overflow: "hidden", border: "1px solid var(--border-default)", textAlign: "center" }}>
                  <Box sx={{ py: 0.4, background: "linear-gradient(135deg,#ec4899,#a855f7)", color: "#fff", fontSize: "0.62rem", fontWeight: 900, letterSpacing: 0.5 }}>{badge.top}</Box>
                  <Box sx={{ py: 0.6 }}><Typography sx={{ fontWeight: 900, fontSize: "1.35rem", lineHeight: 1 }}>{badge.bottom}</Typography></Box>
                </Box>
                {/* Body */}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75, flexWrap: "wrap", gap: 0.5 }}>
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, px: 0.9, py: 0.25, borderRadius: 999, bgcolor: m.bg, color: m.color, fontSize: "0.68rem", fontWeight: 800 }}>
                      {isLive && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: m.color, animation: "pulse 1.4s infinite" }} />}
                      {m.label}
                    </Box>
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.35, px: 0.9, py: 0.25, borderRadius: 999, border: "1px solid var(--border-default)", fontSize: "0.68rem", fontWeight: 700, color: p.color }}>
                      <Icon icon={p.icon} width={12} />{p.label}
                    </Box>
                    {s.created_by_me && (
                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.3, px: 0.8, py: 0.25, borderRadius: 999, bgcolor: "color-mix(in srgb,#10b981 12%,transparent)", color: "#059669", fontSize: "0.66rem", fontWeight: 800 }}>
                        <Icon icon="mdi:account-check" width={11} />Yours
                      </Box>
                    )}
                  </Stack>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.02rem", lineHeight: 1.25 }}>{s.topic_name}</Typography>
                  <Stack direction="row" spacing={1.5} sx={{ mt: 0.6, color: "text.secondary", flexWrap: "wrap", gap: 0.5 }}>
                    <Stack direction="row" spacing={0.4} alignItems="center"><Icon icon="mdi:clock-outline" width={14} /><Typography sx={{ fontSize: "0.8rem" }}>{fmtTime(s.class_datetime)}</Typography></Stack>
                    <Stack direction="row" spacing={0.4} alignItems="center"><Icon icon="mdi:timer-sand" width={14} /><Typography sx={{ fontSize: "0.8rem" }}>{s.duration_minutes} min</Typography></Stack>
                    {s.cohort_name && <Stack direction="row" spacing={0.4} alignItems="center"><Icon icon="mdi:account-group" width={14} /><Typography sx={{ fontSize: "0.8rem" }} noWrap>{s.cohort_name}</Typography></Stack>}
                  </Stack>
                </Box>
                {s.created_by_me && (
                  <IconButton size="small" onClick={() => removeSession(s)} sx={{ alignSelf: "flex-start", color: "text.secondary", "&:hover": { color: "#ef4444" } }} aria-label="Delete session">
                    <Icon icon="mdi:trash-can-outline" width={18} />
                  </IconButton>
                )}
              </Box>

              {/* Actions */}
              <Stack direction="row" spacing={1} sx={{ px: 2.25, pb: 2.25, flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                {status !== "ended" && s.hostable ? (
                  <Button onClick={() => startHosting(s)} disabled={hostingId === s.id}
                    startIcon={hostingId === s.id ? <CircularProgress size={15} color="inherit" /> : <Icon icon={isLive ? "mdi:broadcast" : "mdi:login-variant"} width={16} />}
                    sx={{ textTransform: "none", fontWeight: 800, color: "#fff", px: 2, py: 0.9, borderRadius: 2,
                      background: isLive ? "linear-gradient(135deg,#ef4444,#ec4899)" : "linear-gradient(135deg,#ec4899,#a855f7)",
                      "&:hover": { filter: "brightness(1.06)" }, "&.Mui-disabled": { color: "rgba(255,255,255,0.8)", filter: "grayscale(.3)" } }}>
                    {isLive ? "Start hosting" : s.is_webinar ? "Get panelist link" : "Get host link"}
                  </Button>
                ) : status !== "ended" && s.join_link ? (
                  <Button href={s.join_link} target="_blank" rel="noopener" startIcon={<Icon icon="mdi:login-variant" width={16} />}
                    sx={{ textTransform: "none", fontWeight: 800, color: "#fff", px: 2, py: 0.9, borderRadius: 2, background: "linear-gradient(135deg,#ec4899,#a855f7)" }}>
                    Join
                  </Button>
                ) : null}
                {s.join_link && (
                  <Button onClick={() => copyLink(s.join_link)} startIcon={<Icon icon="mdi:link-variant" width={16} />}
                    sx={{ textTransform: "none", fontWeight: 700, color: "#6366f1", px: 1.75, py: 0.9, borderRadius: 2, border: "1px solid var(--border-default)" }}>
                    Copy attendee link
                  </Button>
                )}
                {s.password && (
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, px: 1, py: 0.5, borderRadius: 2, bgcolor: "color-mix(in srgb,#6366f1 8%,transparent)", fontSize: "0.72rem", fontWeight: 700, color: "#4f46e5" }}>
                    <Icon icon="mdi:key-variant" width={13} /> {s.password}
                  </Box>
                )}
                {status === "ended" && (
                  <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", alignSelf: "center", fontStyle: "italic" }}>
                    Session ended · recordings & attendance coming soon
                  </Typography>
                )}
              </Stack>
            </Box>
          );
        })}
      </Box>

      {showTruncation && (
        <Typography sx={{ textAlign: "center", color: "text.secondary", fontSize: "0.82rem", mt: 2.5 }}>
          Showing the latest {endedShown} of {pastTotal} past sessions.
        </Typography>
      )}

      <CreateSessionDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(msg) => { setToast({ text: msg, sev: "success" }); void reload(); }}
      />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {toast ? <Alert severity={toast.sev} variant="filled" onClose={() => setToast(null)} sx={{ fontWeight: 600 }}>{toast.text}</Alert> : undefined}
      </Snackbar>

      <style jsx global>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </PageShell>
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
  const [duration, setDuration] = useState(60);
  const [audience, setAudience] = useState("");     // "c:<id>" | "a:<id>"
  const [passcode, setPasscode] = useState("");
  const [registration, setRegistration] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    instructorService.getCohorts().then(setCohorts).catch(() => undefined);
    instructorService.getCourses().then(setCourses).catch(() => undefined);
  }, [open]);

  const reset = () => {
    setTopic(""); setDescription(""); setWhen(""); setDuration(60); setAudience("");
    setPasscode(""); setRegistration(false); setSessionType("meeting"); setErr(null);
  };

  const valid = topic.trim().length >= 2 && !!when && duration >= 1 && duration <= 600 && !!audience;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    setErr(null);
    try {
      const [kind, idStr] = audience.split(":");
      const id = Number(idStr);
      const created = await instructorService.createLiveSession({
        topic_name: topic.trim(),
        description: description.trim() || undefined,
        class_datetime: new Date(when).toISOString(),
        duration_minutes: duration,
        session_type: sessionType,
        ...(kind === "c" ? { cohort_id: id } : { adaptive_course_id: id }),
        ...(sessionType === "webinar" ? { passcode: passcode.trim() || undefined, registration_required: registration } : {}),
      });
      onCreated(`Session created${sessionType === "webinar" ? ". You're added as a panelist." : "."}`);
      if (created.host_link?.url) window.open(created.host_link.url, "_blank", "noopener");
      reset();
      onClose();
    } catch (e) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setErr(detail || (e instanceof Error ? e.message : "Couldn't create the session."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>Schedule a live session</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {/* Type toggle */}
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
              fullWidth size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Duration (min)" type="number" value={duration}
              onChange={(e) => setDuration(Math.max(1, Math.min(600, Number(e.target.value) || 0)))}
              size="small" sx={{ width: { xs: "100%", sm: 160 } }} inputProps={{ min: 1, max: 600 }} />
          </Stack>

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
