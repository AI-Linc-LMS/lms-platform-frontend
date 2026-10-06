"use client";

/**
 * A course, as a single page.
 *
 * This file used to be the whole thing - hero, week cards, step rows, date helpers and all,
 * in 600 lines. It is now the shell: it loads the board, and lays out the hero, the top cards,
 * the spine and the side panels. The parts live in `./spine` and `./JourneyHero`.
 *
 * `contentSummary` and `isAssessmentNode` are re-exported because tests and callers import
 * them from this path. Their definitions moved to `./spine/nodeVisuals`.
 */

import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type { JourneyBoard as JourneyBoardData } from "@/lib/types/adaptive-journey";
import { JourneySidePanels } from "./JourneySidePanels";
import { JourneyTopCards } from "./JourneyTopCards";
import { JourneyHero } from "./JourneyHero";
import { Spine } from "./spine/Spine";
import { JourneyBoardSkeleton } from "@/components/courses/CourseSkeletons";
import { PHONE } from "@/components/common/mobile/phone";

export { contentSummary, isAssessmentNode } from "./spine/nodeVisuals";

export function JourneyBoard({ courseId }: { courseId: number; showHeader?: boolean }) {
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

  if (loading) return <JourneyBoardSkeleton />;
  if (notEnrolled) {
    return <Typography sx={{ color: "#64748b", py: 6, textAlign: "center" }}>You are not enrolled in this course.</Typography>;
  }
  if (error || !board) {
    return <Typography sx={{ color: "#b91c1c", py: 6, textAlign: "center" }}>{error || "Journey unavailable."}</Typography>;
  }

  // Never fall back to the legacy week→submodule list. A 0-node board is only transient now
  // (the BE backfills a topic node per submodule on every GET); render the new-UI shell with a
  // calm "being set up" placeholder so the page never regresses to the old look.
  const hasNodes = board.weeks.some((w) => w.nodes.length > 0);
  if (!hasNodes) {
    return (
      <Box>
        <JourneyHero board={board} courseId={courseId} />
        <JourneyTopCards courseId={courseId} calibration={board.calibration} interview={board.interview} />
        <Box sx={{ mt: 2.5, p: { xs: 3, md: 5 }, borderRadius: 4, textAlign: "center", border: "1px solid #eef2f7", bgcolor: "#fff", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}>
          <Box sx={{ width: 52, height: 52, mx: "auto", mb: 1.5, borderRadius: "50%", display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, var(--module-tile-from, #6366f1) 0%, var(--module-tile-to, #a855f7) 100%)" }}>
            <Icon icon="mdi:map-marker-path" width={26} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>Your learning journey is being set up</Typography>
          <Typography sx={{ fontSize: "0.85rem", color: "#64748b", mt: 0.5, maxWidth: 460, mx: "auto", lineHeight: 1.5 }}>
            We&apos;re mapping this course&apos;s sections into your adaptive path. Refresh in a moment - your weeks and steps will appear here.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <JourneyHero board={board} courseId={courseId} />
      <JourneyTopCards courseId={courseId} calibration={board.calibration} interview={board.interview} />

      {/* minmax(0,1fr): a bare 1fr column is as wide as its widest child, which pushed the week
          cards past a phone's edge. Below lg the side panels follow the weeks in one column. */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", lg: "minmax(0,1fr) 390px" }, gap: 2.5, [PHONE]: { gap: 2, "& > *": { minWidth: 0 } } }}>
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 1.25 }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box sx={{ width: 34, height: 34, borderRadius: 2.5, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, var(--module-tile-from, #6366f1) 0%, var(--module-tile-to, #a855f7) 100%)", boxShadow: "0 8px 18px -10px var(--module-hero-shadow, rgba(124,58,237,0.6))" }}>
                <Icon icon="mdi:map-marker-path" width={19} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>Course Overview</Typography>
                <Typography sx={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Your learning journey · {board.course.sections} sections · {board.course.items} items
                </Typography>
              </Box>
            </Stack>
            {board.contentLocked ? (
              <Chip icon={<Icon icon="mdi:auto-fix" width={15} />} label="Adaptive paths on" size="small" sx={{ fontWeight: 800, color: "#6d28d9", bgcolor: "#ede9fe", border: "1px solid #ddd6fe", "& .MuiChip-icon": { color: "#6d28d9" } }} />
            ) : (
              <Chip icon={<Icon icon="mdi:lock-open-variant-outline" width={15} />} label="Open access" size="small" sx={{ fontWeight: 800, color: "#047857", bgcolor: "#d1fae5", border: "1px solid #a7f3d0", "& .MuiChip-icon": { color: "#047857" } }} />
            )}
          </Stack>

          {board.contentLocked ? (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1.5, mb: 2, borderRadius: 2.5, backgroundImage: "linear-gradient(135deg, #faf5ff, #fff1f7)", border: "1px solid #f0e7fb" }}>
              <Icon icon="mdi:calendar-alert" width={17} color="#a855f7" style={{ flexShrink: 0 }} />
              <Typography sx={{ fontSize: "0.8rem", color: "#475569", lineHeight: 1.4 }}>
                Each week has its own due date. Late penalties apply to the <b style={{ color: "#7c3aed" }}>points earned</b> for that week - finish before the date to keep 100%.
              </Typography>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1.5, mb: 2, borderRadius: 2.5, backgroundImage: "linear-gradient(135deg, #ecfdf5, #f0fdfa)", border: "1px solid #bbf7d0" }}>
              <Icon icon="mdi:lock-open-variant-outline" width={17} color="#059669" style={{ flexShrink: 0 }} />
              <Typography sx={{ fontSize: "0.8rem", color: "#475569", lineHeight: 1.4 }}>
                Every step is <b style={{ color: "#047857" }}>open</b> - learn in any order and earn <b style={{ color: "#047857" }}>full points anytime</b>. No due dates, no late penalties.
              </Typography>
            </Stack>
          )}

          <Spine
            weeks={board.weeks}
            courseId={courseId}
            stepStarts={stepStarts}
            unitNoun={board.unitNoun || "Week"}
            fieldTier={board.course.fieldTier}
          />
        </Box>

        <Box>
          <JourneySidePanels courseId={courseId} board={board} />
        </Box>
      </Box>
    </Box>
  );
}
