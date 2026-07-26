"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { useToast } from "@/components/common/Toast";
import { StudentDetailDrawer } from "@/components/instructor/StudentDetailDrawer";
import {
  instructorService,
  type InstructorDashboard,
  type InstructorCohortDetail,
  type InstructorScheduleItem,
  type InstructorRecentSubmission,
} from "@/lib/services/instructor.service";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const COHORT_GRADIENTS = [
  "linear-gradient(120deg,#6366f1,#f59e0b)",
  "linear-gradient(120deg,#a855f7,#ec4899)",
  "linear-gradient(120deg,#6366f1,#8b5cf6)",
  "linear-gradient(120deg,#0ea5e9,#6366f1)",
];

export default function InstructorDashboardPage() {
  const { push, prefetch } = useInstantNavigation();
  const { showToast } = useToast();
  const [dash, setDash] = useState<InstructorDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await instructorService.getDashboard();
        if (!cancelled) setDash(d);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load your workspace.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = (dash?.instructor_name || "").trim().split(/\s+/)[0] || "there";
  const liveSession = useMemo(() => dash?.schedule.find((s) => s.status === "live"), [dash]);

  function copyCode() {
    if (!dash?.instructor_code) return;
    navigator.clipboard?.writeText(dash.instructor_code).then(
      () => showToast("Instructor code copied.", "success"),
      () => showToast("Couldn't copy the code.", "error"),
    );
  }

  return (
    <PageShell>
      {error && <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>{error}</Typography>}

      {/* ---- Hero ---- */}
      <Box
        sx={{
          borderRadius: 4,
          p: { xs: 3, md: 4 },
          color: "#fff",
          position: "relative",
          overflow: "hidden",
          background: "radial-gradient(120% 140% at 85% 0%, #4c1d95 0%, #2e1065 45%, #1e1b4b 100%)",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
          gap: { xs: 3, md: 4 },
          alignItems: "start",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ mb: 2, px: 1.25, py: 0.5, borderRadius: 999, border: "1px solid rgba(255,255,255,0.2)",
            display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: "0.68rem", fontWeight: 800,
            letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(255,255,255,0.85)" }}>
            <Icon icon="mdi:school-outline" width={14} /> Instructor workspace
          </Box>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.8rem", md: "2.4rem" }, lineHeight: 1.1 }}>
            {greeting()}, {firstName}.
          </Typography>
          <Typography sx={{ mt: 1.5, color: "rgba(255,255,255,0.8)", fontSize: "1rem", maxWidth: 560, lineHeight: 1.5 }}>
            You have <b style={{ color: "#fff" }}>{dash?.live_now ?? 0} session{(dash?.live_now ?? 0) === 1 ? "" : "s"} live now</b>{" "}
            and <b style={{ color: "#fca5a5" }}>{dash?.at_risk_count ?? 0} students</b> flagged as needing a nudge across your {dash?.batches ?? 0} cohort{(dash?.batches ?? 0) === 1 ? "" : "s"}.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
            <Button
              component="a"
              disabled={!liveSession?.join_link}
              href={liveSession?.join_link || undefined}
              target="_blank"
              rel="noopener"
              startIcon={<Icon icon="mdi:video" width={18} />}
              sx={{ px: 2.5, py: 1.25, borderRadius: 2.5, fontWeight: 800, textTransform: "none", color: "#fff",
                background: "linear-gradient(135deg,#10b981,#059669)", "&:hover": { filter: "brightness(1.06)" },
                "&.Mui-disabled": { background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)" } }}>
              {liveSession ? "Join live session" : "No live session"}
            </Button>
            <Button
              onClick={() => push("/instructor/students")}
              startIcon={<Icon icon="mdi:flag-outline" width={18} />}
              sx={{ px: 2.5, py: 1.25, borderRadius: 2.5, fontWeight: 800, textTransform: "none", color: "#fff",
                bgcolor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.18)" } }}>
              Review flagged students
            </Button>
          </Stack>
        </Box>

        {/* Instructor code card */}
        <Box sx={{ width: { xs: "100%", md: 320 }, p: 2.5, borderRadius: 3, border: "1px solid rgba(255,255,255,0.14)",
          bgcolor: "rgba(0,0,0,0.25)" }}>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1.5, color: "rgba(255,255,255,0.75)" }}>
            <Icon icon="mdi:shield-check-outline" width={16} />
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" }}>
              Your instructor code
            </Typography>
          </Stack>
          <Box sx={{ p: 2, borderRadius: 2, textAlign: "center", bgcolor: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)", mb: 1.5 }}>
            <Typography sx={{ fontWeight: 900, fontSize: "1.7rem", letterSpacing: 4, fontFamily: "monospace" }}>
              {dash?.instructor_code || "— — —"}
            </Typography>
          </Box>
          <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem", lineHeight: 1.5, mb: 1.5 }}>
            {dash?.instructor_code
              ? "Students see this code instead of your name. It's your public teacher identity — never share your login."
              : "No code set yet. Ask an admin to set your instructor code on the Instructors page."}
          </Typography>
          {dash?.instructor_code && (
            <Button fullWidth onClick={copyCode} startIcon={<Icon icon="mdi:content-copy" width={16} />}
              sx={{ py: 1, borderRadius: 2, fontWeight: 800, textTransform: "none", bgcolor: "#fff", color: "#4c1d95",
                "&:hover": { bgcolor: "rgba(255,255,255,0.9)" } }}>
              Copy code
            </Button>
          )}
        </Box>
      </Box>

      {/* ---- KPI cards ---- */}
      <Box sx={{ mt: 2.5, display: "grid", gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2 }}>
        <Kpi label="Students" value={dash?.students ?? 0} icon="mdi:account-outline" sub={`${dash?.active_students ?? 0} active this week`} />
        <Kpi label="Cohorts assigned" value={dash?.batches ?? 0} icon="mdi:school-outline" sub={`${dash?.courses ?? 0} courses`} />
        <Kpi label="Cohort avg score" value={`${dash?.avg_progress ?? 0}%`} icon="mdi:target" tint="#10b981" sub={`${dash?.completion_rate ?? 0}% completed`} />
        <Kpi label="Need attention" value={dash?.at_risk_count ?? 0} icon="mdi:flag-variant-outline" tint="#ef4444"
          sub={<span style={{ color: "#ef4444", fontWeight: 700 }}>flagged by AI</span>} />
      </Box>

      {/* ---- Cohorts + Schedule ---- */}
      <Box sx={{ mt: 3.5, display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 340px" }, gap: 2.5, alignItems: "start" }}>
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.15rem" }}>Your cohorts</Typography>
            <Button onClick={() => push("/instructor/cohorts")} endIcon={<Icon icon="mdi:chevron-right" width={18} />}
              sx={{ textTransform: "none", fontWeight: 700, color: "#6366f1" }}>All cohorts</Button>
          </Stack>
          <Typography sx={{ color: "text.secondary", fontSize: "0.82rem", mb: 1.5 }}>Assigned by admin · you own delivery & reporting</Typography>
          <Stack spacing={1.5}>
            {(dash?.cohorts_detailed ?? []).map((c, i) => (
              <CohortRow key={c.id} c={c} grad={COHORT_GRADIENTS[i % COHORT_GRADIENTS.length]}
                onOpen={() => push(`/instructor/cohorts/${c.id}`)} onHover={() => prefetch(`/instructor/cohorts/${c.id}`)} />
            ))}
            {dash && dash.cohorts_detailed.length === 0 && (
              <Box sx={{ p: 3, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default)" }}>
                <Typography sx={{ color: "text.secondary" }}>No cohorts assigned yet.</Typography>
              </Box>
            )}
          </Stack>
        </Box>

        <SchedulePanel items={dash?.schedule ?? []} onSchedule={() => push("/instructor/live-sessions")} />
      </Box>

      {/* ---- Recent submissions + Needs attention ---- */}
      <Box sx={{ mt: 3.5, display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 340px" }, gap: 2.5, alignItems: "start" }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", mb: 1.5 }}>Recent submissions</Typography>
          <Box sx={{ borderRadius: 3, border: "1px solid var(--border-default)", bgcolor: "var(--card-bg)", overflow: "hidden" }}>
            {(dash?.recent_submissions ?? []).length === 0 ? (
              <Typography sx={{ color: "text.secondary", p: 3 }}>No submissions yet.</Typography>
            ) : (
              (dash?.recent_submissions ?? []).map((s, i) => <SubmissionRow key={s.submission_id} s={s} first={i === 0} />)
            )}
          </Box>
        </Box>

        <Box sx={{ borderRadius: 3, border: "1px solid var(--border-default)", bgcolor: "var(--card-bg)", p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
            <Icon icon="mdi:flag-variant-outline" width={18} style={{ color: "#ef4444" }} />
            <Typography sx={{ fontWeight: 800 }}>Needs attention</Typography>
          </Stack>
          <Typography sx={{ color: "text.secondary", fontSize: "0.78rem", mb: 1.5 }}>
            AI-flagged · {dash?.at_risk_count ?? 0} students
          </Typography>
          <Stack spacing={0.5}>
            {(dash?.at_risk ?? []).map((s) => (
              <Box key={s.student_id} onClick={() => setSelected(s.student_id)}
                role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") setSelected(s.student_id); }}
                sx={{ display: "flex", alignItems: "center", gap: 1.25, p: 1, borderRadius: 2, cursor: "pointer",
                  "&:hover": { bgcolor: "color-mix(in srgb, #ef4444 6%, transparent)" } }}>
                <Box sx={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center",
                  color: "#fff", fontWeight: 800, fontSize: "0.72rem", background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                  {(s.name || s.email || "?").slice(0, 1).toUpperCase()}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }} noWrap>{s.name || s.email}</Typography>
                  <Typography sx={{ color: "#ef4444", fontSize: "0.74rem" }}>{Math.round(s.progress)}% progress · low</Typography>
                </Box>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#ef4444", flexShrink: 0 }} />
              </Box>
            ))}
            {dash && dash.at_risk.length === 0 && (
              <Typography sx={{ color: "text.secondary", fontSize: "0.84rem", py: 1 }}>No at-risk students — great job!</Typography>
            )}
          </Stack>
        </Box>
      </Box>

      <StudentDetailDrawer studentId={selected} open={selected != null} onClose={() => setSelected(null)} />
    </PageShell>
  );
}

function Kpi({ label, value, sub, icon, tint = "#6366f1" }: {
  label: string; value: React.ReactNode; sub?: React.ReactNode; icon: string; tint?: string;
}) {
  return (
    <Box sx={{ p: 2.25, borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "text.secondary" }}>{label}</Typography>
        <Box sx={{ width: 30, height: 30, borderRadius: 2, display: "grid", placeItems: "center",
          color: tint, bgcolor: `color-mix(in srgb, ${tint} 12%, transparent)` }}>
          <Icon icon={icon} width={17} />
        </Box>
      </Stack>
      <Typography sx={{ fontWeight: 900, fontSize: "1.9rem", mt: 0.5, fontFamily: "monospace" }}>{value}</Typography>
      {sub && <Typography sx={{ color: "text.secondary", fontSize: "0.78rem", mt: 0.25 }}>{sub}</Typography>}
    </Box>
  );
}

function CohortRow({ c, grad, onOpen, onHover }: {
  c: InstructorCohortDetail; grad: string; onOpen: () => void; onHover: () => void;
}) {
  return (
    <Box onClick={onOpen} onMouseEnter={onHover} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(); }}
      sx={{ cursor: "pointer", p: 2, borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)",
        display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr auto" }, gap: 2, alignItems: "center",
        transition: "border-color .15s, box-shadow .15s",
        "&:hover": { borderColor: "color-mix(in srgb, #6366f1 40%, transparent)", boxShadow: "0 12px 30px -20px rgba(99,102,241,.4)" } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: 2.5, flexShrink: 0, display: "grid", placeItems: "center",
          color: "#fff", background: grad }}>
          <Icon icon="mdi:account-group" width={22} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.98rem" }} noWrap>{c.name}</Typography>
          <Box sx={{ mt: 0.5, height: 6, borderRadius: 3, bgcolor: "color-mix(in srgb, var(--border-default) 50%, transparent)", overflow: "hidden", maxWidth: 220 }}>
            <Box sx={{ width: `${Math.max(0, Math.min(100, c.progress))}%`, height: "100%", background: grad }} />
          </Box>
        </Box>
      </Stack>
      <Stack direction="row" spacing={2.5} alignItems="center" sx={{ flexShrink: 0 }}>
        <Stat n={c.student_count} label="students" />
        <Stat n={`${c.avg_score}%`} label="avg score" />
        <Stat n={c.at_risk} label="at risk" danger={c.at_risk > 0} />
        <Icon icon="mdi:chevron-right" width={22} style={{ color: "var(--font-tertiary)" }} />
      </Stack>
    </Box>
  );
}

function Stat({ n, label, danger }: { n: React.ReactNode; label: string; danger?: boolean }) {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography sx={{ fontWeight: 900, fontSize: "1.05rem", color: danger ? "#f59e0b" : "var(--font-primary)" }}>{n}</Typography>
      <Typography sx={{ fontSize: "0.62rem", color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</Typography>
    </Box>
  );
}

function SchedulePanel({ items, onSchedule }: { items: InstructorScheduleItem[]; onSchedule: () => void }) {
  return (
    <Box sx={{ borderRadius: 3, border: "1px solid var(--border-default)", bgcolor: "var(--card-bg)", p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>Schedule</Typography>
        <Button onClick={onSchedule} endIcon={<Icon icon="mdi:arrow-right" width={16} />}
          sx={{ textTransform: "none", fontWeight: 700, color: "#6366f1", minWidth: 0 }}>All</Button>
      </Stack>
      <Stack spacing={1}>
        {items.length === 0 && <Typography sx={{ color: "text.secondary", fontSize: "0.84rem", py: 1 }}>No upcoming sessions.</Typography>}
        {items.map((s) => {
          const live = s.status === "live";
          return (
            <Box key={s.id} sx={{ p: 1.5, borderRadius: 2, border: "1px solid var(--border-default)",
              bgcolor: live ? "color-mix(in srgb,#10b981 8%,transparent)" : "transparent" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                <Chip size="small" label={live ? "● Live" : "Scheduled"}
                  sx={{ fontWeight: 800, height: 20, color: live ? "#059669" : "#6366f1",
                    bgcolor: live ? "color-mix(in srgb,#10b981 16%,transparent)" : "color-mix(in srgb,#6366f1 12%,transparent)" }} />
                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontWeight: 600 }}>
                  {new Date(s.datetime).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </Typography>
              </Stack>
              <Typography sx={{ fontWeight: 800, fontSize: "0.9rem" }} noWrap>{s.topic}</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.76rem" }} noWrap>
                {s.cohort_name}{s.registered ? ` · ${s.registered} registered` : ""}
              </Typography>
            </Box>
          );
        })}
      </Stack>
      <Button fullWidth onClick={onSchedule} startIcon={<Icon icon="mdi:plus" width={18} />}
        sx={{ mt: 1.5, py: 1, borderRadius: 2, fontWeight: 800, textTransform: "none", color: "#6366f1",
          bgcolor: "color-mix(in srgb,#6366f1 8%,transparent)" }}>
        Schedule session
      </Button>
    </Box>
  );
}

function SubmissionRow({ s, first }: { s: InstructorRecentSubmission; first: boolean }) {
  const graded = s.review_status === "evaluated" || s.review_status === "published" || s.score != null;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.75,
      borderTop: first ? "none" : "1px solid var(--border-default)" }}>
      <Box sx={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center",
        color: "#fff", fontWeight: 800, fontSize: "0.78rem", background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
        {(s.student_name || "?").slice(0, 1).toUpperCase()}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }} noWrap>{s.student_name}</Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.8rem" }} noWrap>{s.assessment_title}</Typography>
      </Box>
      {s.completed_at && (
        <Typography sx={{ fontSize: "0.74rem", color: "text.secondary", display: { xs: "none", sm: "block" } }}>
          {new Date(s.completed_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </Typography>
      )}
      {graded && s.score != null ? (
        <Chip size="small" label={`${Math.round(s.score)}`} sx={{ fontWeight: 800, color: "#059669",
          bgcolor: "color-mix(in srgb,#10b981 14%,transparent)" }} />
      ) : (
        <Chip size="small" label="Grade" sx={{ fontWeight: 800, color: "#6366f1", cursor: "pointer",
          bgcolor: "color-mix(in srgb,#6366f1 12%,transparent)" }} />
      )}
    </Box>
  );
}
