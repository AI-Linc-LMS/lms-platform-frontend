"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { instructorService, type InstructorLiveSession } from "@/lib/services/instructor.service";

type SessionStatus = "live" | "scheduled" | "ended";

interface Session extends InstructorLiveSession {
  status: SessionStatus;
}

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

function providerOf(link: string): { label: string; icon: string; color: string } {
  const l = link.toLowerCase();
  if (l.includes("zoom")) return { label: "Zoom", icon: "mdi:video", color: "#2563eb" };
  if (l.includes("meet.google") || l.includes("hangouts")) return { label: "Google Meet", icon: "mdi:google", color: "#16a34a" };
  if (l.includes("teams.microsoft")) return { label: "Teams", icon: "mdi:microsoft-teams", color: "#6366f1" };
  return { label: "Online", icon: "mdi:web", color: "#6b7280" };
}

function statusOf(s: InstructorLiveSession): SessionStatus {
  const start = new Date(s.class_datetime).getTime();
  const end = start + (s.duration_minutes || 0) * 60_000;
  const now = Date.now();
  if (now >= start && now <= end) return "live";
  if (now < start) return "scheduled";
  return "ended";
}

function dayBadge(dt: string): { top: string; bottom: string } {
  try {
    const d = new Date(dt);
    return {
      top: d.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
      bottom: String(d.getDate()),
    };
  } catch {
    return { top: "", bottom: "" };
  }
}

function fmtTime(dt: string): string {
  try {
    return new Date(dt).toLocaleString(undefined, {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dt;
  }
}

export default function InstructorLiveSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<SessionStatus | "all">("all");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await instructorService.getLiveSessions();
        if (!cancelled) {
          const all = [...data.upcoming, ...data.past].map((s) => ({ ...s, status: statusOf(s) }));
          // live first, then scheduled (soonest), then ended (most recent).
          const order: Record<SessionStatus, number> = { live: 0, scheduled: 1, ended: 2 };
          all.sort((a, b) => {
            if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
            const ta = new Date(a.class_datetime).getTime();
            const tb = new Date(b.class_datetime).getTime();
            return a.status === "ended" ? tb - ta : ta - tb;
          });
          setSessions(all);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Couldn't load your live sessions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const c = { all: sessions.length, live: 0, scheduled: 0, ended: 0 } as Record<SessionStatus | "all", number>;
    sessions.forEach((s) => (c[s.status] += 1));
    return c;
  }, [sessions]);

  const visible = useMemo(() => (tab === "all" ? sessions : sessions.filter((s) => s.status === tab)), [sessions, tab]);

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setToast("Join link copied to clipboard.");
    } catch {
      setToast("Couldn't copy the link.");
    }
  };

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Teach"
        title="Live Sessions"
        description="Sessions scheduled for the courses and cohorts you're assigned to — host, share links and follow up."
        accent="pink"
        icon="mdi:video-outline"
        action={
          <HeaderActionButton icon="mdi:calendar-plus" variant="ghost" onClick={() => setScheduleOpen(true)}>
            Schedule session
          </HeaderActionButton>
        }
      />

      {/* Filter tabs */}
      <Stack direction="row" spacing={0.75} sx={{ mb: 2.5, flexWrap: "wrap", gap: 0.75 }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Box
              key={t.key}
              onClick={() => setTab(t.key)}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.6,
                px: 1.75,
                py: 0.75,
                borderRadius: 999,
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: 700,
                color: active ? "#fff" : "text.secondary",
                background: active ? "linear-gradient(135deg,#ec4899,#a855f7)" : "var(--card-bg)",
                border: active ? "none" : "1px solid var(--border-default)",
              }}
            >
              <Icon icon={t.icon} width={15} />
              {t.label}
              <Box
                component="span"
                sx={{
                  ml: 0.3,
                  px: 0.7,
                  py: 0.05,
                  borderRadius: 999,
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  bgcolor: active ? "rgba(255,255,255,0.25)" : "color-mix(in srgb,var(--border-default) 60%,transparent)",
                }}
              >
                {counts[t.key]}
              </Box>
            </Box>
          );
        })}
      </Stack>

      {error && <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>{error}</Typography>}
      {!error && !loading && visible.length === 0 && (
        <Box sx={{ p: 5, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default)" }}>
          <Icon icon="mdi:video-off-outline" width={34} style={{ opacity: 0.4 }} />
          <Typography sx={{ color: "text.secondary", mt: 1 }}>
            {sessions.length === 0
              ? "No live sessions scheduled for your courses or cohorts yet."
              : "No sessions in this view."}
          </Typography>
        </Box>
      )}

      {/* Session cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2,1fr)" }, gap: 2 }}>
        {visible.map((s) => {
          const m = STATUS_META[s.status];
          const p = providerOf(s.join_link);
          const badge = dayBadge(s.class_datetime);
          const isLive = s.status === "live";
          return (
            <Box
              key={s.id}
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                bgcolor: "var(--card-bg)",
                border: isLive ? "1px solid color-mix(in srgb,#ef4444 45%,transparent)" : "1px solid var(--border-default)",
                boxShadow: isLive ? "0 0 0 3px color-mix(in srgb,#ef4444 12%,transparent)" : "0 10px 30px -26px rgba(16,24,40,.3)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box sx={{ p: 2.25, display: "flex", gap: 1.75, flex: 1 }}>
                {/* Date badge */}
                <Box
                  sx={{
                    width: 56,
                    flexShrink: 0,
                    borderRadius: 3,
                    overflow: "hidden",
                    border: "1px solid var(--border-default)",
                    textAlign: "center",
                  }}
                >
                  <Box sx={{ py: 0.4, background: "linear-gradient(135deg,#ec4899,#a855f7)", color: "#fff", fontSize: "0.62rem", fontWeight: 900, letterSpacing: 0.5 }}>
                    {badge.top}
                  </Box>
                  <Box sx={{ py: 0.6 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: "1.35rem", lineHeight: 1 }}>{badge.bottom}</Typography>
                  </Box>
                </Box>

                {/* Body */}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75, flexWrap: "wrap", gap: 0.5 }}>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.4,
                        px: 0.9,
                        py: 0.25,
                        borderRadius: 999,
                        bgcolor: m.bg,
                        color: m.color,
                        fontSize: "0.68rem",
                        fontWeight: 800,
                      }}
                    >
                      {isLive && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: m.color, animation: "pulse 1.4s infinite" }} />}
                      {m.label}
                    </Box>
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.35, px: 0.9, py: 0.25, borderRadius: 999, border: "1px solid var(--border-default)", fontSize: "0.68rem", fontWeight: 700, color: p.color }}>
                      <Icon icon={p.icon} width={12} />
                      {p.label}
                    </Box>
                  </Stack>

                  <Typography sx={{ fontWeight: 800, fontSize: "1.02rem", lineHeight: 1.25 }}>{s.topic_name}</Typography>
                  <Stack direction="row" spacing={1.5} sx={{ mt: 0.6, color: "text.secondary" }}>
                    <Stack direction="row" spacing={0.4} alignItems="center">
                      <Icon icon="mdi:clock-outline" width={14} />
                      <Typography sx={{ fontSize: "0.8rem" }}>{fmtTime(s.class_datetime)}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.4} alignItems="center">
                      <Icon icon="mdi:timer-sand" width={14} />
                      <Typography sx={{ fontSize: "0.8rem" }}>{s.duration_minutes} min</Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Box>

              {/* Actions */}
              <Stack direction="row" spacing={1} sx={{ px: 2.25, pb: 2.25, flexWrap: "wrap", gap: 1 }}>
                {(isLive || s.status === "scheduled") && s.join_link && (
                  <Button
                    href={s.join_link}
                    target="_blank"
                    rel="noopener"
                    startIcon={<Icon icon={isLive ? "mdi:broadcast" : "mdi:login-variant"} width={16} />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 800,
                      color: "#fff",
                      px: 2,
                      py: 0.9,
                      borderRadius: 2,
                      background: isLive ? "linear-gradient(135deg,#ef4444,#ec4899)" : "linear-gradient(135deg,#ec4899,#a855f7)",
                      "&:hover": { filter: "brightness(1.06)" },
                    }}
                  >
                    {isLive ? "Start hosting" : "Join"}
                  </Button>
                )}
                {s.join_link && (
                  <Button
                    onClick={() => copyLink(s.join_link)}
                    startIcon={<Icon icon="mdi:link-variant" width={16} />}
                    sx={{ textTransform: "none", fontWeight: 700, color: "#6366f1", px: 1.75, py: 0.9, borderRadius: 2, border: "1px solid var(--border-default)" }}
                  >
                    Copy link
                  </Button>
                )}
                {s.status === "ended" && (
                  <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", alignSelf: "center", fontStyle: "italic" }}>
                    Session ended · recordings & attendance coming soon
                  </Typography>
                )}
              </Stack>
            </Box>
          );
        })}
      </Box>

      {/* Schedule dialog — instructor sessions are provisioned by admin today */}
      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Schedule a live session</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.9rem" }}>
            Live sessions are provisioned from the class calendar by your admin and mapped to your
            cohorts automatically. Need a new session on the schedule? Send a quick request and
            your admin will set it up with the right Zoom/Meet link.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setScheduleOpen(false)} sx={{ textTransform: "none", fontWeight: 700 }}>
            Close
          </Button>
          <Button
            href="/tickets"
            startIcon={<Icon icon="mdi:headset" width={16} />}
            sx={{ textTransform: "none", fontWeight: 800, color: "#fff", px: 2.5, borderRadius: 2, background: "linear-gradient(135deg,#ec4899,#a855f7)" }}
          >
            Request a session
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {toast ? (
          <Alert severity="success" variant="filled" onClose={() => setToast(null)} sx={{ fontWeight: 600 }}>
            {toast}
          </Alert>
        ) : undefined}
      </Snackbar>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </PageShell>
  );
}
