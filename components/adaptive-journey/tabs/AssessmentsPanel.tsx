"use client";

/**
 * Every paper on this course, in one list.
 *
 * Built entirely from the spine the board already sends - the same nodes, the same statuses,
 * the same scores - so this page and the journey can never disagree about whether a paper is
 * open or what it was scored.
 *
 * Numbers it refuses to make up: an average over zero finished papers is not 0%, it is "no
 * score yet"; a paper worth nothing cannot be scored as a percentage; and a locked paper shows
 * the server's own `lockReason` rather than a guess about when it opens.
 */

import { Box, ButtonBase, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { PHONE } from "@/components/common/mobile/phone";
import type { JourneyBoard, JourneyNodeView } from "@/lib/types/adaptive-journey";
import { nodeHref } from "../nodeHref";
import { averageScore, coursePapers } from "./courseTabs";

function pct(n: JourneyNodeView): number | null {
  return n.score.total > 0 ? Math.round((n.score.earned / n.score.total) * 100) : null;
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <Box sx={{ flex: 1, minWidth: 140, p: 1.75, borderRadius: 3, border: "1px solid #eef2f7", bgcolor: "#fff", borderLeft: `3px solid ${color}` }}>
      <Typography sx={{ fontWeight: 800, fontSize: "1.3rem", color: "#0f172a", fontFamily: "ui-monospace, monospace" }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: "0.78rem", color: "#64748b" }}>{label}</Typography>
    </Box>
  );
}

export function AssessmentsPanel({ board, courseId }: { board: JourneyBoard; courseId: number }) {
  const { push, prefetch } = useInstantNavigation();
  const papers = coursePapers(board);
  const done = papers.filter((p) => p.status === "done");
  const avg = averageScore(board);

  return (
    <Box>
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 2.5 }}>
        <Stat value={`${done.length} of ${papers.length}`} label="Papers submitted" color="#22c55e" />
        {/* No average until there is something to average. "0%" would read as a failure. */}
        <Stat value={avg == null ? "—" : `${avg}%`} label={avg == null ? "No score yet" : "Average score"} color="#6366f1" />
        {board.course.fieldTier && (
          <Stat value={board.course.fieldTier} label="Your adaptive level" color="#db2777" />
        )}
      </Stack>

      <Box sx={{ borderRadius: 4, border: "1px solid #eef2f7", bgcolor: "#fff", overflow: "hidden" }}>
        {papers.map((p, i) => {
          const href = nodeHref(p, courseId);
          const score = pct(p);
          const locked = p.status === "locked";
          return (
            <ButtonBase
              key={p.id}
              disabled={!href}
              onClick={() => href && push(href)}
              onMouseEnter={() => href && prefetch(href)}
              sx={{
                display: "flex", alignItems: "center", gap: 1.5, width: "100%",
                px: 2, py: 1.75, textAlign: "left",
                borderTop: i === 0 ? "none" : "1px solid #f1f5f9",
                bgcolor: p.status === "current" ? "#f5f3ff" : "transparent",
                "&:hover": href ? { bgcolor: "#f8fafc" } : {},
                "&.Mui-disabled": { opacity: 1 },
                [PHONE]: { px: 1.5, minHeight: 64 },
              }}
            >
              <Box
                sx={{
                  width: 34, height: 34, borderRadius: 2, flexShrink: 0,
                  display: "grid", placeItems: "center",
                  color: p.status === "done" ? "#15803d" : locked ? "#94a3b8" : "#6d28d9",
                  bgcolor: p.status === "done" ? "#f0fdf4" : locked ? "#f8fafc" : "#f5f3ff",
                }}
              >
                <Icon icon={p.status === "done" ? "mdi:check" : locked ? "mdi:lock" : "mdi:clipboard-text-outline"} width={17} />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: locked ? "#64748b" : "#0f172a" }}>
                  {p.title}
                </Typography>
                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                  <Typography sx={{ fontSize: "0.76rem", color: "#94a3b8" }}>
                    {p.questionCount > 0 ? `${p.questionCount} questions` : "Questions not set"}
                  </Typography>
                  {p.proctored && (
                    <Chip label="Proctored" size="small" sx={{ height: 18, fontSize: "0.62rem", fontWeight: 800, color: "#a855f7", bgcolor: "#f5f3ff" }} />
                  )}
                  {p.weight > 1 && (
                    <Chip label={`counts ${p.weight}×`} size="small" sx={{ height: 18, fontSize: "0.62rem", fontWeight: 800, color: "#b45309", bgcolor: "#fffbeb" }} />
                  )}
                  {locked && p.lockReason && (
                    <Typography sx={{ fontSize: "0.74rem", color: "#94a3b8" }}>· {p.lockReason}</Typography>
                  )}
                </Stack>
              </Box>
              <Box sx={{ flexShrink: 0, textAlign: "right" }}>
                {p.status === "done" ? (
                  <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: score != null && score >= 60 ? "#15803d" : "#b45309" }}>
                    {score == null ? "Submitted" : `${score}%`}
                  </Typography>
                ) : locked ? (
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8" }}>Locked</Typography>
                ) : (
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: "#6d28d9" }}>Start →</Typography>
                )}
              </Box>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}
