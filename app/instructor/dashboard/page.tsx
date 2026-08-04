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
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Percent display that reads cleanly at the low end (0 / <1% / rounded), no awkward decimals. */
function fmtPct(n: number): string {
  const v = Number(n) || 0;
  if (v <= 0) return "0%";
  if (v < 1) return "<1%";
  return `${Math.round(v)}%`;
}

const COHORT_GRADIENTS = [
  "linear-gradient(120deg,#6366f1,#f59e0b)",
  "linear-gradient(120deg,#a855f7,#ec4899)",
  "linear-gradient(120deg,#6366f1,#8b5cf6)",
  "linear-gradient(120deg,#0ea5e9,#6366f1)",
];
const AI_GRAD = "linear-gradient(135deg,#7c3aed,#ec4899)";

type Band = { label: string; color: string; bg: string };
function band(pct: number): Band {
  if (pct >= 60) return { label: "Strong", color: "#059669", bg: "color-mix(in srgb,#10b981 15%,transparent)" };
  if (pct >= 40) return { label: "Watch", color: "#b45309", bg: "color-mix(in srgb,#f59e0b 16%,transparent)" };
  return { label: "Needs work", color: "#b91c1c", bg: "color-mix(in srgb,#ef4444 14%,transparent)" };
}
const isGraded = (s: InstructorRecentSubmission) =>
  s.review_status === "evaluated" || s.review_status === "published" || s.score != null;

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
        if (!cancelled) setError(getAxiosErrorDetail(e, "Failed to load your workspace."));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = (dash?.instructor_name || "").trim().split(/\s+/)[0] || "there";
  const liveSession = useMemo(() => dash?.schedule.find((s) => s.status === "live"), [dash]);
  const nextSession = useMemo(() => dash?.schedule.find((s) => s.status === "scheduled"), [dash]);
  const pending = useMemo(() => (dash?.recent_submissions ?? []).filter((s) => !isGraded(s)).length, [dash]);
  const students = dash?.students ?? 0;
  const atRisk = dash?.at_risk_count ?? 0;
  const onTrackPct = students > 0 ? Math.round(((students - atRisk) / students) * 100) : 0;
  const topRiskCohort = useMemo(
    () => [...(dash?.cohorts_detailed ?? [])].sort((a, b) => b.at_risk - a.at_risk)[0],
    [dash],
  );

  function copyCode() {
    if (!dash?.instructor_code) return;
    navigator.clipboard?.writeText(dash.instructor_code).then(
      () => showToast("Instructor code copied.", "success"),
      () => showToast("Couldn't copy the code.", "error"),
    );
  }

  const headline = liveSession
    ? `You're live now, ${firstName}. Your session is running.`
    : atRisk > 0
      ? `${greeting()}, ${firstName}. ${atRisk} student${atRisk === 1 ? "" : "s"} need${atRisk === 1 ? "s" : ""} a nudge today.`
      : pending > 0
        ? `${greeting()}, ${firstName}. ${pending} submission${pending === 1 ? "" : "s"} waiting on your review.`
        : `${greeting()}, ${firstName}. Your cohorts are on track.`;

  const primary =
    liveSession
      ? { label: "Start today's session", icon: "mdi:broadcast", href: liveSession.join_link, to: undefined }
      : atRisk > 0
        ? { label: "Review at-risk students", icon: "mdi:flag-outline", href: undefined, to: "/instructor/students?status=at_risk" }
        : pending > 0
          ? { label: "Open the gradebook", icon: "mdi:clipboard-check-outline", href: undefined, to: "/instructor/assessments" }
          : { label: "Open student reports", icon: "mdi:chart-box-outline", href: undefined, to: "/instructor/students" };

  return (
    <PageShell>
      {error && <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>{error}</Typography>}

      {/* Two-column: a continuous main column + a continuous right rail (no per-row staggered gaps). */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 360px" }, gap: 2.5, alignItems: "start" }}>
        {/* ============================ MAIN COLUMN ============================ */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, minWidth: 0 }}>
          {/* ---- Hero ---- */}
          <Box sx={{ borderRadius: 4, position: "relative", overflow: "hidden", color: "#fff",
            background: "radial-gradient(120% 140% at 85% 0%, #4c1d95 0%, #2e1065 45%, #1e1b4b 100%)" }}>
            <Box sx={{ height: 4, background: "linear-gradient(90deg,#8b5cf6,#ec4899,#f59e0b)" }} />
            <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5, gap: 1 }}>
                <Box sx={{ px: 1.25, py: 0.5, borderRadius: 999, border: "1px solid rgba(255,255,255,0.2)",
                  display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: "0.66rem", fontWeight: 800,
                  letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(255,255,255,0.9)" }}>
                  <Icon icon="mdi:sparkles" width={13} /> Your teaching briefing
                </Box>
                <Box onClick={dash?.instructor_code ? copyCode : undefined}
                  sx={{ px: 1.1, py: 0.5, borderRadius: 999, bgcolor: "rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.14)",
                    display: "inline-flex", alignItems: "center", gap: 0.75, cursor: dash?.instructor_code ? "pointer" : "default" }}>
                  <Icon icon="mdi:shield-account-outline" width={13} style={{ opacity: 0.75 }} />
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: 1.5 }}>{dash?.instructor_code || "no code"}</Typography>
                  {dash?.instructor_code && <Icon icon="mdi:content-copy" width={12} style={{ opacity: 0.7 }} />}
                </Box>
              </Stack>

              <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
                Welcome back, {dash?.instructor_name || "Instructor"}
              </Typography>

              <Box sx={{ mt: 1, mb: 1.5, px: 1.25, py: 0.6, borderRadius: 999, bgcolor: "rgba(255,255,255,0.08)",
                display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: "0.82rem", fontWeight: 600 }}>
                <span>👋</span>
                <span>Guiding <b>{students}</b> student{students === 1 ? "" : "s"} across <b>{dash?.batches ?? 0}</b> cohort{(dash?.batches ?? 0) === 1 ? "" : "s"}.</span>
              </Box>

              <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.6rem", md: "2.1rem" }, lineHeight: 1.12, maxWidth: 620 }}>{headline}</Typography>

              <Typography sx={{ mt: 1.25, color: "rgba(255,255,255,0.8)", fontSize: "0.96rem", maxWidth: 620, lineHeight: 1.5 }}>
                {topRiskCohort && topRiskCohort.at_risk > 0 ? (
                  <>Your biggest lever is <b style={{ color: "#fff" }}>{topRiskCohort.name}</b>, with <b style={{ color: "#fca5a5" }}>{topRiskCohort.at_risk} student{topRiskCohort.at_risk === 1 ? "" : "s"}</b> slipping. A quick check-in moves them back on track.{" "}
                    <Box component="span" onClick={() => push("/instructor/students?status=at_risk")}
                      sx={{ color: "#fcd34d", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>Review →</Box></>
                ) : pending > 0 ? (
                  <>You have <b style={{ color: "#fff" }}>{pending} submission{pending === 1 ? "" : "s"}</b> to review. Clearing your grading backlog keeps students moving.{" "}
                    <Box component="span" onClick={() => push("/instructor/assessments")}
                      sx={{ color: "#fcd34d", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>Grade now →</Box></>
                ) : (
                  <>Everyone's tracking well across your {dash?.batches ?? 0} cohort{(dash?.batches ?? 0) === 1 ? "" : "s"}. Keep the momentum with a live session or a quick nudge.</>
                )}
              </Typography>

              <Box sx={{ mt: 2.5, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                <HeroTask eyebrow="Do this week" icon="mdi:clipboard-check-outline"
                  title={pending > 0 ? `Clear ${pending} submission${pending === 1 ? "" : "s"} to grade` : "Give every cohort a check-in"}
                  sub={pending > 0 ? "Gradebook" : "Student reports"}
                  onClick={() => push(pending > 0 ? "/instructor/assessments" : "/instructor/students")} />
                <HeroTask eyebrow="Do today"
                  icon={liveSession ? "mdi:broadcast" : nextSession ? "mdi:calendar-clock" : "mdi:message-text-outline"}
                  title={liveSession ? `Host ${liveSession.topic}` : nextSession ? `Prep ${nextSession.topic}` : atRisk > 0 ? `Nudge ${atRisk} at-risk student${atRisk === 1 ? "" : "s"}` : "Message a cohort"}
                  sub={liveSession ? "Live now" : nextSession ? nextSession.cohort_name : "Reach your students"}
                  onClick={() => push("/instructor/live-sessions")} />
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2.5 }} alignItems={{ sm: "center" }}>
                {primary.href !== undefined ? (
                  <Button component="a" href={primary.href || undefined} target="_blank" rel="noopener" disabled={!primary.href}
                    startIcon={<Icon icon={primary.icon} width={18} />} endIcon={<Icon icon="mdi:arrow-right" width={18} />}
                    sx={{ px: 3, py: 1.25, borderRadius: 999, fontWeight: 800, textTransform: "none", color: "#fff", background: AI_GRAD,
                      boxShadow: "0 12px 30px -12px rgba(236,72,153,.6)", "&:hover": { filter: "brightness(1.06)" },
                      "&.Mui-disabled": { background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", boxShadow: "none" } }}>
                    {primary.label}
                  </Button>
                ) : (
                  <Button onClick={() => push(primary.to!)}
                    startIcon={<Icon icon={primary.icon} width={18} />} endIcon={<Icon icon="mdi:arrow-right" width={18} />}
                    sx={{ px: 3, py: 1.25, borderRadius: 999, fontWeight: 800, textTransform: "none", color: "#fff", background: AI_GRAD,
                      boxShadow: "0 12px 30px -12px rgba(236,72,153,.6)", "&:hover": { filter: "brightness(1.06)" } }}>
                    {primary.label}
                  </Button>
                )}
                <Button onClick={() => push("/instructor/live-sessions")} startIcon={<Icon icon="mdi:video-outline" width={18} />}
                  sx={{ px: 2.5, py: 1.25, borderRadius: 999, fontWeight: 800, textTransform: "none", color: "#fff",
                    bgcolor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", "&:hover": { bgcolor: "rgba(255,255,255,0.18)" } }}>
                  Live sessions
                </Button>
              </Stack>
            </Box>
          </Box>

          {/* ---- KPI tiles ---- */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
            <Kpi label="Students" value={students} icon="mdi:account-multiple" tint="#6366f1" sub={`${dash?.active_students ?? 0} active this week`} />
            <Kpi label="Cohorts" value={dash?.batches ?? 0} icon="mdi:school-outline" tint="#f59e0b" sub={`${dash?.courses ?? 0} course${(dash?.courses ?? 0) === 1 ? "" : "s"}`} />
            <Kpi label="Avg progress" value={fmtPct(dash?.avg_progress ?? 0)} icon="mdi:chart-line" tint="#10b981" sub={`${fmtPct(dash?.completion_rate ?? 0)} completed`} />
            <Kpi label="At risk" value={atRisk} icon="mdi:alert-outline" tint="#ef4444"
              sub={atRisk > 0 ? <span style={{ color: "#ef4444", fontWeight: 700 }}>need a nudge</span> : "all on track"} />
          </Box>

          {/* ---- Cohort readiness ---- */}
          <ReadinessCard
            ready={dash?.avg_progress ?? 0}
            engagement={students > 0 ? Math.round(((dash?.active_students ?? 0) / students) * 100) : 0}
            progress={dash?.avg_progress ?? 0}
            completion={dash?.completion_rate ?? 0}
            onTrack={onTrackPct}
          />

          {/* ---- Your cohorts ---- */}
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

          {/* ---- Recent submissions ---- */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.15rem" }}>Recent submissions</Typography>
              <Button onClick={() => push("/instructor/assessments")} endIcon={<Icon icon="mdi:chevron-right" width={18} />}
                sx={{ textTransform: "none", fontWeight: 700, color: "#6366f1" }}>Gradebook</Button>
            </Stack>
            <Box sx={{ borderRadius: 3, border: "1px solid var(--border-default)", bgcolor: "var(--card-bg)", overflow: "hidden" }}>
              {(dash?.recent_submissions ?? []).length === 0 ? (
                <Typography sx={{ color: "text.secondary", p: 3 }}>No submissions yet.</Typography>
              ) : (
                (dash?.recent_submissions ?? []).map((s, i) => <SubmissionRow key={s.submission_id} s={s} first={i === 0} onGrade={() => push("/instructor/assessments")} />)
              )}
            </Box>
          </Box>
        </Box>

        {/* ============================ RIGHT RAIL ============================ */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, minWidth: 0 }}>
          <TodayCard
            onTrackPct={onTrackPct}
            liveNow={dash?.live_now ?? 0}
            pending={pending}
            atRisk={atRisk}
            nextSession={nextSession}
            onGrade={() => push("/instructor/assessments")}
            onNudge={() => push("/instructor/students?status=at_risk")}
            onHost={() => push("/instructor/live-sessions")}
          />

          <CohortHealthCard cohorts={dash?.cohorts_detailed ?? []} avg={dash?.avg_progress ?? 0} onReport={() => push("/instructor/cohorts")} />

          <SchedulePanel items={dash?.schedule ?? []} onSchedule={() => push("/instructor/live-sessions")} />

          {/* Needs attention */}
          <Box sx={{ borderRadius: 3, border: "1px solid var(--border-default)", bgcolor: "var(--card-bg)", p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
              <Icon icon="mdi:flag-variant-outline" width={18} style={{ color: "#ef4444" }} />
              <Typography sx={{ fontWeight: 800 }}>Needs attention</Typography>
            </Stack>
            <Typography sx={{ color: "text.secondary", fontSize: "0.78rem", mb: 1.5 }}>AI-flagged · {atRisk} student{atRisk === 1 ? "" : "s"}</Typography>
            <Stack spacing={0.5}>
              {(dash?.at_risk ?? []).map((s) => (
                <Box key={s.student_id} onClick={() => setSelected(s.student_id)} role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") setSelected(s.student_id); }}
                  sx={{ display: "flex", alignItems: "center", gap: 1.25, p: 1, borderRadius: 2, cursor: "pointer",
                    "&:hover": { bgcolor: "color-mix(in srgb, #ef4444 6%, transparent)" } }}>
                  <Box sx={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center",
                    color: "#fff", fontWeight: 800, fontSize: "0.72rem", background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                    {(s.name || s.email || "?").slice(0, 1).toUpperCase()}
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }} noWrap>{s.name || s.email}</Typography>
                    <Typography sx={{ color: "#ef4444", fontSize: "0.74rem" }}>{fmtPct(s.progress)} progress · low</Typography>
                  </Box>
                  <Icon icon="mdi:chevron-right" width={18} style={{ color: "var(--font-tertiary)" }} />
                </Box>
              ))}
              {dash && dash.at_risk.length === 0 && (
                <Typography sx={{ color: "text.secondary", fontSize: "0.84rem", py: 1 }}>No at-risk students. Great job!</Typography>
              )}
            </Stack>
            {dash && dash.at_risk.length > 0 && (
              <Button fullWidth onClick={() => push("/instructor/students?status=at_risk")}
                sx={{ mt: 1.5, py: 0.9, borderRadius: 2, fontWeight: 800, textTransform: "none", color: "#ef4444",
                  bgcolor: "color-mix(in srgb,#ef4444 8%,transparent)" }}>
                Review all at-risk
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <StudentDetailDrawer studentId={selected} open={selected != null} onClose={() => setSelected(null)} />
    </PageShell>
  );
}

/* ------------------------------- primitives ------------------------------- */

/** SVG progress ring. The progress arc is only drawn when pct >= 1, so a near-zero value shows a
 *  clean empty track (no stray rounded-cap dot at 12 o'clock). */
function Ring({ pct, size = 120, stroke = 11, track = "rgba(255,255,255,0.12)", grad = ["#8b5cf6", "#ec4899"], children }: {
  pct: number; size?: number; stroke?: number; track?: string; grad?: [string, string]; children?: React.ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - clamped / 100);
  const id = `rg-${grad[0]}-${grad[1]}`.replace(/[^a-z0-9]/gi, "");
  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={grad[0]} />
            <stop offset="100%" stopColor={grad[1]} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        {clamped >= 1 && (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke}
            strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s ease" }} />
        )}
      </svg>
      <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 0.25, px: 1 }}>{children}</Box>
    </Box>
  );
}

function HeroTask({ eyebrow, icon, title, sub, onClick }: {
  eyebrow: string; icon: string; title: string; sub: string; onClick: () => void;
}) {
  return (
    <Box onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onClick(); }}
      sx={{ cursor: "pointer", p: 1.75, borderRadius: 3, bgcolor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
        display: "flex", gap: 1.25, alignItems: "center", transition: "background .15s", "&:hover": { bgcolor: "rgba(255,255,255,0.12)" } }}>
      <Box sx={{ width: 38, height: 38, flexShrink: 0, borderRadius: 2, display: "grid", placeItems: "center", color: "#fff", background: AI_GRAD }}>
        <Icon icon={icon} width={19} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>{eyebrow}</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: "0.9rem" }} noWrap>{title}</Typography>
        <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)" }} noWrap>{sub}</Typography>
      </Box>
    </Box>
  );
}

function TodayCard({ onTrackPct, liveNow, pending, atRisk, nextSession, onGrade, onNudge, onHost }: {
  onTrackPct: number; liveNow: number; pending: number; atRisk: number;
  nextSession?: InstructorScheduleItem; onGrade: () => void; onNudge: () => void; onHost: () => void;
}) {
  const items = [
    { label: liveNow > 0 ? "Host your live session" : nextSession ? "Prep your next session" : "No session today", done: liveNow === 0 && !nextSession, onClick: onHost },
    { label: pending > 0 ? `Review ${pending} submission${pending === 1 ? "" : "s"}` : "Grading all clear", done: pending === 0, onClick: onGrade },
    { label: atRisk > 0 ? `Check in with ${atRisk} at-risk` : "Everyone on track", done: atRisk === 0, onClick: onNudge },
  ];
  return (
    <Box sx={{ borderRadius: 4, overflow: "hidden", color: "#fff",
      background: "radial-gradient(120% 130% at 10% 0%, #312e81 0%, #1e1b4b 55%, #0f172a 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <Box sx={{ p: 2.5, display: "flex", gap: 2, alignItems: "center" }}>
        <Ring pct={onTrackPct} size={100} grad={["#34d399", "#10b981"]}>
          <Typography sx={{ fontWeight: 900, fontSize: "1.35rem", lineHeight: 1 }}>{fmtPct(onTrackPct)}</Typography>
          <Typography sx={{ fontSize: "0.56rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 0.5 }}>on track</Typography>
        </Ring>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>Today's focus</Typography>
          <Typography sx={{ fontWeight: 900, fontSize: "1.05rem", mt: 0.25, lineHeight: 1.25 }}>
            {liveNow > 0 ? "You're live now" : atRisk > 0 || pending > 0 ? "A few things to clear" : "You're all caught up"}
          </Typography>
          {nextSession && (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.75, color: "rgba(255,255,255,0.7)" }}>
              <Icon icon="mdi:calendar-clock" width={13} />
              <Typography sx={{ fontSize: "0.74rem" }} noWrap>
                Next: {nextSession.topic} · {new Date(nextSession.datetime).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}
              </Typography>
            </Stack>
          )}
        </Box>
      </Box>
      <Box sx={{ px: 2.5, pb: 2.5, display: "grid", gap: 1 }}>
        {items.map((it) => (
          <Box key={it.label} onClick={it.onClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") it.onClick(); }}
            sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 2, cursor: "pointer",
              bgcolor: "rgba(255,255,255,0.05)", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
            <Icon icon={it.done ? "mdi:check-circle" : "mdi:circle-outline"} width={18}
              style={{ color: it.done ? "#34d399" : "rgba(255,255,255,0.5)", flexShrink: 0 }} />
            <Typography sx={{ fontSize: "0.84rem", fontWeight: 600, color: it.done ? "rgba(255,255,255,0.6)" : "#fff",
              textDecoration: it.done ? "line-through" : "none" }}>{it.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function Kpi({ label, value, sub, icon, tint = "#6366f1" }: {
  label: string; value: React.ReactNode; sub?: React.ReactNode; icon: string; tint?: string;
}) {
  return (
    <Box sx={{ borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", borderTop: `3px solid ${tint}`, overflow: "hidden" }}>
      <Box sx={{ p: 2.25 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "text.secondary" }}>{label}</Typography>
          <Box sx={{ width: 30, height: 30, borderRadius: 2, display: "grid", placeItems: "center", color: tint, bgcolor: `color-mix(in srgb, ${tint} 12%, transparent)` }}>
            <Icon icon={icon} width={17} />
          </Box>
        </Stack>
        <Typography sx={{ fontWeight: 900, fontSize: "1.9rem", mt: 0.5, letterSpacing: "-0.01em" }}>{value}</Typography>
        {sub && <Typography sx={{ color: "text.secondary", fontSize: "0.78rem", mt: 0.25 }}>{sub}</Typography>}
      </Box>
    </Box>
  );
}

function ReadinessCard({ ready, engagement, progress, completion, onTrack }: {
  ready: number; engagement: number; progress: number; completion: number; onTrack: number;
}) {
  const signals = [
    { label: "Engagement", hint: "active this week", pct: engagement },
    { label: "Progress", hint: "avg across cohorts", pct: progress },
    { label: "Completion", hint: "content finished", pct: completion },
    { label: "On-track", hint: "students not at risk", pct: onTrack },
  ];
  return (
    <Box sx={{ borderRadius: 4, overflow: "hidden", color: "#fff",
      background: "radial-gradient(120% 130% at 0% 0%, #1e1b4b 0%, #0f172a 60%, #020617 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <Box sx={{ p: { xs: 2.5, md: 3 }, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "auto 1fr" }, gap: 3, alignItems: "center" }}>
        <Stack alignItems="center" spacing={1}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 26, height: 26, borderRadius: 1.5, display: "grid", placeItems: "center", background: AI_GRAD }}>
              <Icon icon="mdi:shield-star-outline" width={15} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.72rem", letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>Cohort readiness</Typography>
          </Box>
          <Ring pct={ready} size={128} grad={["#8b5cf6", "#ec4899"]}>
            <Typography sx={{ fontWeight: 900, fontSize: "1.6rem", lineHeight: 1 }}>{fmtPct(ready)}</Typography>
            <Typography sx={{ fontSize: "0.56rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 0.5 }}>ready</Typography>
          </Ring>
        </Stack>
        <Box sx={{ display: "grid", gap: 1.5 }}>
          {signals.map((s) => {
            const b = band(s.pct);
            return (
              <Box key={s.label}>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.5 }}>
                  <Box>
                    <Typography component="span" sx={{ fontWeight: 800, fontSize: "0.86rem" }}>{s.label}</Typography>
                    <Typography component="span" sx={{ ml: 1, fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>{s.hint}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ px: 0.9, py: 0.2, borderRadius: 999, fontSize: "0.62rem", fontWeight: 800, color: b.color, bgcolor: b.bg }}>{b.label}</Box>
                    <Typography sx={{ fontWeight: 900, fontSize: "0.9rem", minWidth: 44, textAlign: "right" }}>{fmtPct(s.pct)}</Typography>
                  </Stack>
                </Stack>
                <Box sx={{ height: 7, borderRadius: 4, bgcolor: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <Box sx={{ width: `${Math.max(0, Math.min(100, s.pct))}%`, height: "100%", background: AI_GRAD }} />
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

function CohortHealthCard({ cohorts, avg, onReport }: { cohorts: InstructorCohortDetail[]; avg: number; onReport: () => void }) {
  const weakest = [...cohorts].sort((a, b) => a.progress - b.progress)[0];
  return (
    <Box sx={{ borderRadius: 4, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 30, height: 30, borderRadius: 2, display: "grid", placeItems: "center", color: "#fff", background: AI_GRAD }}>
            <Icon icon="mdi:heart-pulse" width={17} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "text.secondary" }}>Cohort</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", lineHeight: 1 }}>Health</Typography>
          </Box>
        </Stack>
        <Button onClick={onReport} endIcon={<Icon icon="mdi:arrow-right" width={15} />}
          sx={{ textTransform: "none", fontWeight: 700, color: "#6366f1", minWidth: 0, fontSize: "0.8rem" }}>Full report</Button>
      </Stack>

      <Box sx={{ p: 1.75, borderRadius: 3, bgcolor: "color-mix(in srgb,#6366f1 7%,transparent)", mb: 2 }}>
        <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "text.secondary" }}>Avg progress · your cohorts</Typography>
        <Stack direction="row" alignItems="baseline" spacing={0.75}>
          <Typography sx={{ fontWeight: 900, fontSize: "2rem", color: "#6366f1", letterSpacing: "-0.01em" }}>{fmtPct(avg)}</Typography>
          <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>{cohorts.length} cohort{cohorts.length === 1 ? "" : "s"} tracked</Typography>
        </Stack>
      </Box>

      <Stack spacing={1.25}>
        {cohorts.slice(0, 6).map((c) => {
          const b = band(c.progress);
          return (
            <Box key={c.id}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.4 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.84rem" }} noWrap>{c.name}</Typography>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ px: 0.8, py: 0.15, borderRadius: 999, fontSize: "0.6rem", fontWeight: 800, color: b.color, bgcolor: b.bg }}>{b.label}</Box>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", minWidth: 42, textAlign: "right" }}>{fmtPct(c.progress)}</Typography>
                </Stack>
              </Stack>
              <Box sx={{ height: 6, borderRadius: 3, bgcolor: "color-mix(in srgb,var(--border-default) 55%,transparent)", overflow: "hidden" }}>
                <Box sx={{ width: `${Math.max(0, Math.min(100, c.progress))}%`, height: "100%", background: c.progress >= 60 ? "#10b981" : c.progress >= 40 ? "#f59e0b" : "#ef4444" }} />
              </Box>
            </Box>
          );
        })}
        {cohorts.length === 0 && <Typography sx={{ color: "text.secondary", fontSize: "0.84rem", py: 1 }}>No cohorts assigned yet.</Typography>}
      </Stack>

      {weakest && weakest.progress < 60 && (
        <Box sx={{ mt: 2, p: 1.5, borderRadius: 2.5, bgcolor: "color-mix(in srgb,#7c3aed 8%,transparent)", display: "flex", gap: 1, alignItems: "flex-start" }}>
          <Icon icon="mdi:sparkles" width={16} style={{ color: "#7c3aed", flexShrink: 0, marginTop: 2 }} />
          <Typography sx={{ fontSize: "0.8rem", color: "var(--font-secondary)", lineHeight: 1.4 }}>
            Focus on <b>{weakest.name}</b> next. It's your lowest-progress cohort at {fmtPct(weakest.progress)}.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

/** Compact overlapping avatars for a cohort's students. */
function RowCascade({ count, grad }: { count: number; grad: string }) {
  const shown = Math.min(Math.max(count, 0), 3);
  const extra = count - shown;
  if (shown === 0) {
    return (
      <Box sx={{ width: 44, height: 44, borderRadius: 2.5, flexShrink: 0, display: "grid", placeItems: "center", color: "#fff", background: grad }}>
        <Icon icon="mdi:account-group" width={22} />
      </Box>
    );
  }
  return (
    <Box sx={{ display: "flex", flexShrink: 0, alignItems: "center" }}>
      {Array.from({ length: shown }).map((_, i) => (
        <Box key={i} sx={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", color: "#fff",
          background: grad, border: "2px solid var(--card-bg)", ml: i === 0 ? 0 : "-12px", zIndex: shown - i }}>
          <Icon icon="mdi:account" width={16} />
        </Box>
      ))}
      {extra > 0 && (
        <Box sx={{ minWidth: 34, height: 34, px: 0.5, borderRadius: 999, display: "grid", placeItems: "center",
          bgcolor: "color-mix(in srgb,#6366f1 16%,transparent)", color: "#4f46e5", border: "2px solid var(--card-bg)", ml: "-12px", fontWeight: 900, fontSize: "0.66rem" }}>
          +{extra}
        </Box>
      )}
    </Box>
  );
}

function CohortRow({ c, grad, onOpen, onHover }: {
  c: InstructorCohortDetail; grad: string; onOpen: () => void; onHover: () => void;
}) {
  return (
    <Box onClick={onOpen} onMouseEnter={onHover} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onOpen(); }}
      sx={{ cursor: "pointer", p: 2, borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)",
        display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr auto" }, gap: 2, alignItems: "center",
        transition: "border-color .15s, box-shadow .15s",
        "&:hover": { borderColor: "color-mix(in srgb, #6366f1 40%, transparent)", boxShadow: "0 12px 30px -20px rgba(99,102,241,.4)" } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
        <RowCascade count={c.student_count} grad={grad} />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.98rem" }} noWrap>{c.name}</Typography>
          <Box sx={{ mt: 0.5, height: 6, borderRadius: 3, bgcolor: "color-mix(in srgb, var(--border-default) 50%, transparent)", overflow: "hidden", maxWidth: 220 }}>
            <Box sx={{ width: `${Math.max(0, Math.min(100, c.progress))}%`, height: "100%", background: grad }} />
          </Box>
        </Box>
      </Stack>
      <Stack direction="row" spacing={2.5} alignItems="center" sx={{ flexShrink: 0 }}>
        <Stat n={c.student_count} label="students" />
        <Stat n={fmtPct(c.avg_score)} label="avg score" />
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
        sx={{ mt: 1.5, py: 1, borderRadius: 2, fontWeight: 800, textTransform: "none", color: "#fff", background: AI_GRAD, "&:hover": { filter: "brightness(1.06)" } }}>
        Schedule session
      </Button>
    </Box>
  );
}

function SubmissionRow({ s, first, onGrade }: { s: InstructorRecentSubmission; first: boolean; onGrade: () => void }) {
  const graded = isGraded(s);
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.75, borderTop: first ? "none" : "1px solid var(--border-default)" }}>
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
        <Chip size="small" label={`${Math.round(s.score)}`} sx={{ fontWeight: 800, color: "#059669", bgcolor: "color-mix(in srgb,#10b981 14%,transparent)" }} />
      ) : (
        <Chip size="small" label="Grade" onClick={onGrade} sx={{ fontWeight: 800, color: "#6366f1", cursor: "pointer", bgcolor: "color-mix(in srgb,#6366f1 12%,transparent)" }} />
      )}
    </Box>
  );
}
