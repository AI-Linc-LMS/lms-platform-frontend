"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Chip, CircularProgress, LinearProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type {
  JourneyBoard as JourneyBoardData,
  JourneyNodeView,
  JourneyWeekView,
  NodeStatus,
  NodeType,
} from "@/lib/types/adaptive-journey";
import { JourneySidePanels } from "./JourneySidePanels";
import { JourneyTopCards } from "./JourneyTopCards";

const STATUS_STYLE: Record<NodeStatus, { color: string; bg: string; label: string }> = {
  done: { color: "#15803d", bg: "#dcfce7", label: "Done" },
  current: { color: "#4338ca", bg: "#e0e7ff", label: "Current" },
  locked: { color: "#64748b", bg: "#f1f5f9", label: "Locked" },
};

const NODE_ICON: Record<NodeType, string> = {
  topic: "mdi:book-open-variant",
  checkpoint: "mdi:shield-check",
  interview: "mdi:robot-outline",
  week_final: "mdi:flag-checkered",
};

const NODE_LABEL: Record<NodeType, string> = {
  topic: "Topic",
  checkpoint: "Checkpoint",
  interview: "Mock Interview",
  week_final: "Week Final",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

function contentSummary(c: NonNullable<JourneyNodeView["content"]>): string {
  const parts: string[] = [];
  if (c.articles) parts.push(`${c.articles} article${c.articles > 1 ? "s" : ""}`);
  if (c.quizzes) parts.push(`${c.quizzes} quiz${c.quizzes > 1 ? "zes" : ""}`);
  if (c.coding) parts.push(`${c.coding} coding`);
  if (c.videos) parts.push(`${c.videos} video${c.videos > 1 ? "s" : ""}`);
  return parts.join(" · ");
}

function NodeCard({ node, courseId }: { node: JourneyNodeView; courseId: number }) {
  const router = useRouter();
  const s = STATUS_STYLE[node.status];
  const isProctored = node.type === "checkpoint" || node.type === "week_final";
  const navigable =
    node.status !== "locked" &&
    ((node.type === "topic" && !!node.ref.submoduleId) || node.type === "interview");
  const go = () => {
    if (!navigable) return;
    if (node.type === "topic" && node.ref.submoduleId) {
      router.push(`/adaptive-courses/${courseId}/submodule/${node.ref.submoduleId}`);
    } else if (node.type === "interview") {
      router.push("/mock-interview/courses");
    }
  };
  return (
    <Box
      onClick={go}
      sx={{
        display: "flex",
        gap: 1.5,
        alignItems: "center",
        p: 1.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: node.status === "current" ? "#c7d2fe" : "#eef2f7",
        bgcolor: node.status === "current" ? "#fbfbff" : "#fff",
        opacity: node.status === "locked" ? 0.72 : 1,
        cursor: navigable ? "pointer" : "default",
        transition: "border-color 0.15s",
        "&:hover": navigable ? { borderColor: "#a5b4fc" } : {},
      }}
    >
      <Box
        sx={{
          width: 38, height: 38, borderRadius: "10px", flexShrink: 0,
          display: "grid", placeItems: "center", color: s.color, bgcolor: s.bg,
        }}
      >
        <Icon icon={node.status === "locked" ? "mdi:lock-outline" : NODE_ICON[node.type]} width={20} />
      </Box>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: 0.4, color: "#64748b", textTransform: "uppercase" }}>
            {node.isCalibration ? "Calibration" : NODE_LABEL[node.type]}
          </Typography>
          {node.weight === 2 && (
            <Chip label="2× weight" size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700, bgcolor: "#fef3c7", color: "#b45309" }} />
          )}
          {isProctored && (
            <Chip label="Proctored" size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700, bgcolor: "#ede9fe", color: "#6d28d9" }} />
          )}
        </Stack>
        <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {node.title}
        </Typography>
        {node.content && contentSummary(node.content) && (
          <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8", mt: 0.25 }}>
            {contentSummary(node.content)}
          </Typography>
        )}
        {node.status === "locked" && node.lockReason && (
          <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8", mt: 0.25 }}>🔒 {node.lockReason}</Typography>
        )}
      </Box>

      <Box sx={{ textAlign: "right", flexShrink: 0 }}>
        {node.status === "done" ? (
          <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: "#15803d" }}>
            {node.score.earned}<span style={{ color: "#94a3b8", fontWeight: 600 }}>/{node.score.total}</span>
          </Typography>
        ) : (
          <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: "#475569" }}>
            {node.score.total} <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8" }}>pts</span>
          </Typography>
        )}
        <Chip label={s.label} size="small" sx={{ mt: 0.5, height: 18, fontSize: "0.6rem", fontWeight: 700, color: s.color, bgcolor: s.bg }} />
      </Box>
    </Box>
  );
}

function WeekCard({ week, courseId }: { week: JourneyWeekView; courseId: number }) {
  const pct = week.totals.total > 0 ? Math.round((week.totals.earned / week.totals.total) * 100) : 0;
  return (
    <Box sx={{ border: "1px solid #eef2f7", borderRadius: 3, overflow: "hidden", bgcolor: "#fff" }}>
      <Box sx={{ p: 2, bgcolor: "#fafbff", borderBottom: "1px solid #eef2f7" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Icon icon="mdi:calendar-week" width={18} color="#6366f1" />
            <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", color: "#0f172a" }}>
              {week.weekNo === 0 ? "Get started" : `Week ${week.weekNo}`}
              {week.title ? ` · ${week.title}` : ""}
            </Typography>
          </Stack>
          <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#6366f1" }}>
            {week.totals.earned} / {week.totals.total} pts
          </Typography>
        </Stack>

        {week.schedule && (
          <Stack direction="row" spacing={1.5} sx={{ mt: 1 }} flexWrap="wrap">
            <Typography sx={{ fontSize: "0.72rem", color: "#15803d", fontWeight: 600 }}>
              On time → {fmtDate(week.schedule.dueAt)} · full points
            </Typography>
            {week.penaltyStrip && (
              <>
                <Typography sx={{ fontSize: "0.72rem", color: "#b45309", fontWeight: 600 }}>
                  1–4 days late · −50%
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: "#b91c1c", fontWeight: 600 }}>
                  After {fmtDate(week.penaltyStrip.zeroAfter)} · no credit
                </Typography>
              </>
            )}
          </Stack>
        )}
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{ mt: 1.25, height: 6, borderRadius: 3, bgcolor: "#eef2f7", "& .MuiLinearProgress-bar": { bgcolor: "#6366f1" } }}
        />
      </Box>

      <Stack spacing={1} sx={{ p: 1.5 }}>
        {week.nodes.map((n) => (
          <NodeCard key={n.id} node={n} courseId={courseId} />
        ))}
      </Stack>
    </Box>
  );
}

export function JourneyBoard({
  courseId,
  fallback,
  showHeader = true,
}: {
  courseId: number;
  fallback?: ReactNode;
  showHeader?: boolean;
}) {
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

  // Course has no journey layout yet (admin hasn't built one) — show the fallback.
  const hasNodes = board.weeks.some((w) => w.nodes.length > 0);
  if (!hasNodes && fallback) {
    return <>{fallback}</>;
  }

  const pc = board.progressCard;
  const overallPct = pc.pointsTotal > 0 ? Math.round((pc.pointsEarned / pc.pointsTotal) * 100) : 0;

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 340px" }, gap: 3 }}>
      {/* Main column */}
      <Box>
        {/* Header */}
        {showHeader && (
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 900, fontSize: "1.5rem", color: "#0f172a" }}>{board.course.title}</Typography>
            {board.course.fieldTier && (
              <Chip
                icon={<Icon icon="mdi:tune-variant" width={16} />}
                label={`Tuned to you · ${board.course.fieldTier}${board.course.abilityIndex != null ? ` (${Math.round(board.course.abilityIndex)})` : ""}`}
                sx={{ fontWeight: 700, bgcolor: "#ede9fe", color: "#6d28d9" }}
              />
            )}
          </Stack>
        )}

        {/* AI-tuned banner */}
        {board.course.fieldTier && (
          <Box
            sx={{
              display: "flex", alignItems: "center", gap: 1.5, p: 2, mb: 2.5, borderRadius: 3, color: "white",
              background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
            }}
          >
            <Icon icon="mdi:auto-fix" width={24} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 800 }}>AI has tuned this course to you</Typography>
              <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.82)" }}>
                Based on your calibration baseline, quizzes start at the right difficulty and articles open at your
                reading tier. Retake the calibration anytime to recalibrate.
              </Typography>
            </Box>
          </Box>
        )}

        {/* Calibration + Interviewer cards */}
        <JourneyTopCards courseId={courseId} calibration={board.calibration} />

        {/* Course overview — journey timeline */}
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a", mb: 1.5 }}>
          Course overview · your learning journey
        </Typography>
        <Stack spacing={2}>
          {board.weeks.map((w) => (
            <WeekCard key={w.weekNo} week={w} courseId={courseId} />
          ))}
        </Stack>
      </Box>

      {/* Sidebar */}
      <Box>
        <Box sx={{ p: 2, mb: 2, borderRadius: 3, border: "1px solid #eef2f7", bgcolor: "#fff" }}>
          <Typography sx={{ fontWeight: 800, color: "#0f172a", mb: 1 }}>Your progress</Typography>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline">
            <Typography sx={{ fontSize: "0.8rem", color: "#64748b" }}>Overall completion</Typography>
            <Typography sx={{ fontWeight: 900, fontSize: "1.4rem", color: "#6366f1" }}>{overallPct}%</Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={overallPct}
            sx={{ mt: 0.5, height: 8, borderRadius: 4, bgcolor: "#eef2f7", "& .MuiLinearProgress-bar": { bgcolor: "#6366f1" } }}
          />
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
            <Box>
              <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Points</Typography>
              <Typography sx={{ fontWeight: 800, color: "#0f172a" }}>{pc.pointsEarned} <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>/ {pc.pointsTotal}</span></Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>On-time</Typography>
              <Typography sx={{ fontWeight: 800, color: "#15803d" }}>{pc.onTimeRate != null ? `${Math.round(pc.onTimeRate * 100)}%` : "—"}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Nodes</Typography>
              <Typography sx={{ fontWeight: 800, color: "#0f172a" }}>{pc.nodesDone}/{pc.nodesTotal}</Typography>
            </Box>
          </Stack>
        </Box>

        <JourneySidePanels courseId={courseId} />
      </Box>
    </Box>
  );
}
