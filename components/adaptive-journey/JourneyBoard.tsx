"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, Chip, CircularProgress, LinearProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type {
  JourneyBoard as JourneyBoardData,
  JourneyNodeView,
  JourneyWeekView,
} from "@/lib/types/adaptive-journey";
import { JourneySidePanels } from "./JourneySidePanels";
import { JourneyTopCards } from "./JourneyTopCards";

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

/** "Jul 11 – 14" when same month, else "Jul 11 – Aug 2". */
function fmtRange(a: string, b: string): string {
  try {
    const da = new Date(a);
    const db = new Date(b);
    const mon = (d: Date) => d.toLocaleDateString(undefined, { month: "short" });
    if (mon(da) === mon(db)) return `${mon(da)} ${da.getDate()} – ${db.getDate()}`;
    return `${fmtDate(a)} – ${fmtDate(b)}`;
  } catch {
    return "";
  }
}

function fmtLongDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

function daysLeft(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime() - Date.now();
  return Math.ceil(d / 86_400_000);
}

function contentSummary(n: JourneyNodeView): string {
  if (n.type === "topic" && n.content) {
    const c = n.content;
    const p: string[] = [];
    if (c.videos) p.push(`${c.videos} video${c.videos > 1 ? "s" : ""}`);
    if (c.quizzes) p.push(`${c.quizzes} quiz${c.quizzes > 1 ? "zes" : ""}`);
    if (c.articles) p.push(`${c.articles} article${c.articles > 1 ? "s" : ""}`);
    if (c.coding) p.push(`${c.coding} coding`);
    return p.join(" · ");
  }
  if (n.type === "checkpoint" || n.type === "week_final") {
    const p = ["Proctored"];
    if (n.questionCount) p.push(`${n.questionCount} Qs`);
    p.push(n.weight > 1 ? `counts ${n.weight}×` : "same for all");
    return p.join(" · ");
  }
  if (n.type === "interview") return `AI interviewer · ~${n.durationMinutes ?? 15} min`;
  return "";
}

function nodeLabel(n: JourneyNodeView): { main: string; sub?: string; ai?: boolean } {
  if (n.isCalibration) return { main: "CALIBRATION", sub: "PROCTORED · NON-ADAPTIVE" };
  if (n.type === "topic") return { main: "TOPIC" };
  if (n.type === "checkpoint" || n.type === "week_final")
    return { main: "CHECKPOINT ASSESSMENT", sub: n.proctored ? "PROCTORED · NON-ADAPTIVE" : undefined };
  if (n.type === "interview") return { main: "MOCK INTERVIEW", ai: true };
  return { main: "STEP" };
}

function NodeRow({ node, courseId, stepNo, dueAt }: { node: JourneyNodeView; courseId: number; stepNo: number; dueAt?: string | null }) {
  const router = useRouter();
  const l = nodeLabel(node);
  const done = node.status === "done";
  const current = node.status === "current";
  const locked = node.status === "locked";
  const navigable = !locked && ((node.type === "topic" && !!node.ref.submoduleId) || node.type === "interview");

  const go = () => {
    if (!navigable) return;
    if (node.type === "topic" && node.ref.submoduleId) router.push(`/adaptive-courses/${courseId}/submodule/${node.ref.submoduleId}`);
    else if (node.type === "interview") router.push("/mock-interview/courses");
  };

  const circle = done ? (
    <Box sx={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "#22c55e", color: "white", flexShrink: 0, zIndex: 1 }}>
      <Icon icon="mdi:check" width={16} />
    </Box>
  ) : current ? (
    <Box sx={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "#6366f1", color: "white", fontWeight: 800, fontSize: "0.8rem", flexShrink: 0, zIndex: 1, boxShadow: "0 0 0 4px rgba(99,102,241,0.18)" }}>
      {stepNo}
    </Box>
  ) : (
    <Box sx={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "#e2e8f0", color: "#94a3b8", flexShrink: 0, zIndex: 1 }}>
      <Icon icon="mdi:lock" width={14} />
    </Box>
  );

  return (
    <Stack direction="row" spacing={1.75} alignItems="stretch">
      {/* timeline rail */}
      <Stack alignItems="center" sx={{ flexShrink: 0 }}>
        {circle}
        <Box sx={{ width: "2px", flex: 1, bgcolor: "#eef2f7", my: 0.25 }} />
      </Stack>

      <Box
        onClick={go}
        sx={{
          flex: 1, mb: 1.5, p: 1.75, borderRadius: 3, border: "1px solid",
          borderColor: current ? "#c7d2fe" : "#eef2f7",
          bgcolor: current ? "#fbfbff" : "#fff",
          opacity: locked ? 0.72 : 1,
          cursor: navigable ? "pointer" : "default",
          transition: "border-color .15s",
          "&:hover": navigable ? { borderColor: "#a5b4fc" } : {},
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
              <Typography sx={{ fontSize: "0.64rem", fontWeight: 800, letterSpacing: 0.6, color: "#64748b" }}>{l.main}</Typography>
              {l.sub && <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: 0.5, color: "#a855f7" }}>· {l.sub}</Typography>}
              {l.ai && <Chip label="+AI" size="small" sx={{ height: 16, fontSize: "0.56rem", fontWeight: 800, color: "#7c3aed", bgcolor: "#ede9fe" }} />}
            </Stack>
            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a", mt: 0.25 }}>{node.title}</Typography>
            {contentSummary(node) && (
              <Typography sx={{ fontSize: "0.76rem", color: "#94a3b8", mt: 0.25 }}>{contentSummary(node)}</Typography>
            )}
          </Box>
          <Box sx={{ textAlign: "right", flexShrink: 0 }}>
            {done ? (
              <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: "#15803d" }}>
                {node.score.earned}<span style={{ color: "#94a3b8", fontWeight: 600 }}>/{node.score.total}</span>
                <Typography component="span" sx={{ fontSize: "0.66rem", color: "#94a3b8", display: "block", fontWeight: 600 }}>earned</Typography>
              </Typography>
            ) : (
              <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: "#475569" }}>
                {node.score.total}<span style={{ fontSize: "0.66rem", color: "#94a3b8", fontWeight: 600 }}> pts</span>
                <Typography component="span" sx={{ fontSize: "0.66rem", color: "#94a3b8", display: "block", fontWeight: 600 }}>on offer</Typography>
              </Typography>
            )}
          </Box>
        </Stack>

        {current && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ mt: 1.5 }}>
            <Typography sx={{ fontSize: "0.74rem", color: "#15803d", fontWeight: 600 }}>
              <Icon icon="mdi:circle" width={7} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Available now · earn full {node.score.total} pts{dueAt ? ` before ${fmtDate(dueAt)}` : ""}
            </Typography>
            {navigable && (
              <ButtonBase onClick={go} sx={{ px: 2, py: 0.85, borderRadius: 2, fontWeight: 800, fontSize: "0.8rem", color: "white", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}>
                Continue →
              </ButtonBase>
            )}
          </Stack>
        )}
        {locked && node.lockReason && (
          <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8", mt: 1 }}>
            <Icon icon="mdi:lock-outline" width={12} style={{ verticalAlign: "middle", marginRight: 3 }} />
            {node.lockReason}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

function WeekCard({ week, courseId, startStep }: { week: JourneyWeekView; courseId: number; startStep: number }) {
  const pct = week.totals.total > 0 ? Math.round((week.totals.earned / week.totals.total) * 100) : 0;
  const dl = daysLeft(week.schedule?.dueAt);
  const locked = week.nodes.every((n) => n.status === "locked");
  let step = startStep;

  return (
    <Box sx={{ border: "1px solid #eef2f7", borderRadius: 4, overflow: "hidden", bgcolor: "#fff", mb: 2 }}>
      <Box sx={{ p: { xs: 2, md: 2.5 }, bgcolor: "#fafbff", borderBottom: "1px solid #eef2f7" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Icon icon="mdi:calendar-month" width={18} color="#a855f7" />
            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>
              {week.weekNo === 0 ? "Get started" : `Week ${week.weekNo}`}{week.title ? ` · ${week.title}` : ""}
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 600 }}>
              {week.stepsDone} of {week.stepsTotal} steps done
            </Typography>
            {locked && <Icon icon="mdi:lock" width={14} color="#94a3b8" />}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {week.schedule && (
              <Chip
                size="small"
                icon={<Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: dl != null && dl < 0 ? "#ef4444" : "#22c55e", ml: 0.75 }} />}
                label={`Due ${fmtDate(week.schedule.dueAt)}${dl != null ? ` · ${dl < 0 ? `${-dl}d overdue` : `${dl} days left`}` : ""}`}
                sx={{ fontWeight: 700, fontSize: "0.74rem", color: dl != null && dl < 0 ? "#b91c1c" : "#15803d", bgcolor: dl != null && dl < 0 ? "#fef2f2" : "#f0fdf4" }}
              />
            )}
            <Chip
              size="small"
              icon={<Icon icon="mdi:trophy" width={14} />}
              label={`${week.totals.earned} / ${week.totals.total} pts`}
              sx={{ fontWeight: 800, fontSize: "0.74rem", color: "#6d28d9", bgcolor: "#ede9fe", "& .MuiChip-icon": { color: "#6d28d9" } }}
            />
          </Stack>
        </Stack>

        <LinearProgress variant="determinate" value={pct} sx={{ mt: 1.5, height: 6, borderRadius: 3, bgcolor: "#eef2f7", "& .MuiLinearProgress-bar": { borderRadius: 3, background: "linear-gradient(90deg, #6366f1, #a855f7)" } }} />

        {week.penaltyStrip && week.schedule && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch" sx={{ mt: 1.5 }}>
            <PenaltyCell color="#15803d" bg="#f0fdf4" head="On time" sub={`by ${fmtDate(week.schedule.dueAt)}`} note="Full score" />
            <Icon icon="mdi:arrow-right" width={16} style={{ color: "#cbd5e1", alignSelf: "center" }} />
            <PenaltyCell color="#b45309" bg="#fffbeb" head="1–4 days late" sub={fmtRange(addDays(week.schedule.dueAt, 1), addDays(week.penaltyStrip.zeroAfter, -1))} note="−50% penalty" />
            <Icon icon="mdi:arrow-right" width={16} style={{ color: "#cbd5e1", alignSelf: "center" }} />
            <PenaltyCell color="#b91c1c" bg="#fef2f2" head="After deadline" sub={`from ${fmtDate(week.penaltyStrip.zeroAfter)}`} note="−100% · no credit" />
          </Stack>
        )}
      </Box>

      <Box sx={{ p: { xs: 1.5, md: 2 } }}>
        {week.nodes.map((n) => {
          step += 1;
          return <NodeRow key={n.id} node={n} courseId={courseId} stepNo={step} dueAt={week.schedule?.dueAt} />;
        })}
      </Box>
    </Box>
  );
}

function PenaltyCell({ color, bg, head, sub, note }: { color: string; bg: string; head: string; sub: string; note: string }) {
  return (
    <Box sx={{ flex: 1, p: 1, borderRadius: 2, bgcolor: bg, border: `1px solid ${color}22` }}>
      <Typography sx={{ fontSize: "0.74rem", fontWeight: 800, color }}>{head}</Typography>
      <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>{sub}</Typography>
      <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color, mt: 0.25 }}>{note}</Typography>
    </Box>
  );
}

function Hero({ board, courseId }: { board: JourneyBoardData; courseId: number }) {
  const router = useRouter();
  const c = board.course;
  const [liked, setLiked] = useState(false);
  const subject = c.title.split(/[—-]/)[0].trim() || "Course";

  // Resume target: the current node's submodule, else the first navigable topic.
  const current = board.weeks.flatMap((w) => w.nodes).find((n) => n.status === "current" && n.ref.submoduleId);
  const firstTopic = board.weeks.flatMap((w) => w.nodes).find((n) => n.type === "topic" && n.ref.submoduleId);
  const resumeSub = current?.ref.submoduleId ?? firstTopic?.ref.submoduleId;
  const meta: { icon: string; label: string }[] = [];
  if (c.startedAt) meta.push({ icon: "mdi:calendar-check", label: `Started ${fmtLongDate(c.startedAt)}` });
  meta.push({ icon: "mdi:account-group", label: `${c.enrolledCount} enrolled` });
  meta.push({ icon: "mdi:certificate-outline", label: `Certificate on ${c.certificateThreshold}%` });
  if (c.estHours) meta.push({ icon: "mdi:clock-outline", label: `~${c.estHours} hrs` });

  return (
    <Box sx={{ borderRadius: 5, p: { xs: 2.5, md: 3.5 }, mb: 2.5, color: "white", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 55%, #c026d3 100%)", boxShadow: "0 24px 60px -28px rgba(124,58,237,0.6)" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.7)", mb: 1 }}>‹ My Courses / {c.title}</Typography>
          <Stack direction="row" spacing={0.75} sx={{ mb: 1 }}>
            <Chip label={subject} size="small" sx={{ fontWeight: 700, color: "white", bgcolor: "rgba(255,255,255,0.18)" }} />
            <Chip icon={<Icon icon="mdi:certificate" width={14} color="white" />} label="Certified track" size="small" sx={{ fontWeight: 700, color: "white", bgcolor: "rgba(255,255,255,0.18)", "& .MuiChip-icon": { color: "white" } }} />
          </Stack>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.7rem", md: "2.2rem" }, lineHeight: 1.1 }}>{c.title}</Typography>
          {c.description && (
            <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.82)", mt: 1, maxWidth: 620, lineHeight: 1.5 }}>{c.description}</Typography>
          )}
          <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mt: 1.75 }}>
            {meta.map((m) => (
              <Stack key={m.label} direction="row" spacing={0.5} alignItems="center" sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.85)" }}>
                <Icon icon={m.icon} width={15} />
                {m.label}
              </Stack>
            ))}
          </Stack>
        </Box>
        <ButtonBase onClick={() => setLiked((v) => !v)} sx={{ flexShrink: 0, flexDirection: "column", gap: 0.25, p: 1, borderRadius: 3, bgcolor: "rgba(255,255,255,0.14)" }}>
          <Icon icon={liked ? "mdi:heart" : "mdi:heart-outline"} width={22} color="white" />
        </ButtonBase>
      </Stack>

      {/* AI-tuned banner */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} justifyContent="space-between" sx={{ mt: 2.5, p: 2, borderRadius: 3, bgcolor: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.15)" }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,0.15)", flexShrink: 0 }}>
            <Icon icon="mdi:auto-fix" width={20} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography sx={{ fontWeight: 800, fontSize: "0.92rem" }}>AI has tuned this course to you</Typography>
              {c.fieldTier && <Chip label={`LEVEL · ${c.fieldTier.toUpperCase()}`} size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 800, color: "#7c3aed", bgcolor: "white" }} />}
            </Stack>
            <Typography sx={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.8)", mt: 0.25, lineHeight: 1.45 }}>
              {c.fieldTier
                ? "Based on your calibration baseline, quizzes start at the right difficulty and articles open at your reading tier. Retake the calibration anytime to recalibrate."
                : "Complete the calibration assessment and the course retunes itself — quizzes start at the right difficulty and articles open at your reading tier."}
            </Typography>
          </Box>
        </Stack>
        <ButtonBase
          disabled={!resumeSub}
          onClick={() => resumeSub && router.push(`/adaptive-courses/${courseId}/submodule/${resumeSub}`)}
          sx={{ flexShrink: 0, px: 2.25, py: 1, borderRadius: 2, fontWeight: 800, fontSize: "0.82rem", color: "#7c3aed", bgcolor: "white", "&.Mui-disabled": { opacity: 0.5 } }}
        >
          Resume learning →
        </ButtonBase>
      </Stack>
    </Box>
  );
}

export function JourneyBoard({ courseId, fallback }: { courseId: number; fallback?: ReactNode; showHeader?: boolean }) {
  const [board, setBoard] = useState<JourneyBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notEnrolled, setNotEnrolled] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(courseId)) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await adaptiveJourneyService.getJourney(courseId);
        if (!cancelled) setBoard(data);
      } catch (e) {
        if (cancelled) return;
        const status = (e as { response?: { status?: number } })?.response?.status;
        if (status === 403) setNotEnrolled(true);
        else setError(e instanceof Error ? e.message : "Failed to load journey.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const stepStarts = useMemo(() => {
    const starts: number[] = [];
    let acc = 0;
    for (const w of board?.weeks ?? []) {
      starts.push(acc);
      acc += w.nodes.length;
    }
    return starts;
  }, [board]);

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
        <CircularProgress sx={{ color: "#6366f1" }} />
      </Box>
    );
  }
  if (notEnrolled) {
    return <Typography sx={{ color: "#64748b", py: 6, textAlign: "center" }}>You are not enrolled in this course.</Typography>;
  }
  if (error || !board) {
    return <Typography sx={{ color: "#b91c1c", py: 6, textAlign: "center" }}>{error || "Journey unavailable."}</Typography>;
  }

  const hasNodes = board.weeks.some((w) => w.nodes.length > 0);
  if (!hasNodes && fallback) {
    return (
      <>
        <Hero board={board} courseId={courseId} />
        {fallback}
      </>
    );
  }

  return (
    <Box>
      <Hero board={board} courseId={courseId} />
      <JourneyTopCards courseId={courseId} calibration={board.calibration} interview={board.interview} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 330px" }, gap: 2.5 }}>
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 1.25 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>Course Overview</Typography>
              <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                Your learning journey · {board.course.sections} sections · {board.course.items} items
              </Typography>
            </Box>
            <Chip icon={<Icon icon="mdi:auto-fix" width={15} />} label="Adaptive paths on" size="small" sx={{ fontWeight: 700, color: "#6d28d9", bgcolor: "#ede9fe", "& .MuiChip-icon": { color: "#6d28d9" } }} />
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #eef2f7" }}>
            <Icon icon="mdi:note-edit-outline" width={16} color="#94a3b8" style={{ flexShrink: 0 }} />
            <Typography sx={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.4 }}>
              Each week has its own due date. Late penalties apply to the <b>points earned</b> for that week — finish before the date to keep 100%.
            </Typography>
          </Stack>

          {board.weeks.map((w, i) => (
            <WeekCard key={w.weekNo} week={w} courseId={courseId} startStep={stepStarts[i] ?? 0} />
          ))}
        </Box>

        <Box>
          <JourneySidePanels courseId={courseId} board={board} />
        </Box>
      </Box>
    </Box>
  );
}
