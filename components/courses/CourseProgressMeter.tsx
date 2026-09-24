"use client";

import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import type { AdaptiveCourseProgress } from "@/lib/services/adaptive-course.service";
import { PHONE } from "@/components/common/mobile/phone";

/**
 * "Where am I in this course?", on a course card or list row.
 *
 * Reported: on /adaptive-courses a course the learner was halfway through looked exactly
 * like one they had never opened. Every card carried the same six content counts and
 * nothing about the learner.
 *
 * THREE INDEPENDENT CHANNELS carry the state, because one of them is colour and colour
 * alone is not readable by everyone:
 *
 *   1. a worded status  — "Not started" / "In progress" / "Completed"
 *   2. a number         — the percent, and the step count behind it
 *   3. a bar length     — how far along the track the fill sits
 *
 * Remove the colour and all three still answer the question; that is the test to keep
 * passing if this ever gets restyled.
 *
 * THE WORDED STATUS IS THE PRIMARY CHANNEL, AND THE PRODUCTION DATA IS WHY. Measured
 * 2026-09-24 across all 5,742 enrolled (learner, course) pairs: 143 have any progress at
 * all, and 131 of those 143 are under 10% — the median non-zero is 6%. A 6% fill is a
 * three-pixel sliver nobody can tell from an empty track at a glance, so a design resting
 * on the bar (or on the bar's colour) would have left the reported bug unfixed for 92% of
 * the learners who actually have progress. The pill is categorical: it reads the same at
 * 1% as at 60%. Do not demote it to a decoration.
 *
 * The percent is the server's, and the server computes it from the same journey steps the
 * course page's "Overall completion" panel reads. Nothing is derived here — a second
 * formula on the client is how a card ends up claiming 40% and opening a page saying 25%.
 */

type State = AdaptiveCourseProgress["state"];

const STATE_META: Record<State, { icon: string; fg: string; bg: string; border: string; labelKey: string }> = {
  not_started: {
    icon: "mdi:circle-outline",
    fg: "#475569", bg: "color-mix(in srgb, #64748b 12%, transparent)",
    border: "color-mix(in srgb, #64748b 24%, transparent)",
    labelKey: "adaptiveCourseProgress.notStarted",
  },
  in_progress: {
    icon: "mdi:progress-clock",
    fg: "#6d28d9", bg: "color-mix(in srgb, #7c3aed 14%, transparent)",
    border: "color-mix(in srgb, #7c3aed 28%, transparent)",
    labelKey: "adaptiveCourseProgress.inProgress",
  },
  completed: {
    icon: "mdi:check-circle",
    fg: "#047857", bg: "color-mix(in srgb, #059669 14%, transparent)",
    border: "color-mix(in srgb, #059669 30%, transparent)",
    labelKey: "adaptiveCourseProgress.completed",
  },
};

/** The bar's fill. A flat colour per state, so the three read apart in a grid of cards. */
const BAR: Record<State, string> = {
  not_started: "#94a3b8",
  in_progress: "linear-gradient(90deg, #6366f1, #a855f7)",
  completed: "#059669",
};

export function CourseProgressMeter({
  progress,
  compact = false,
}: {
  progress: AdaptiveCourseProgress;
  /** Row layout: status and percent on one line, no step caption. */
  compact?: boolean;
}) {
  const { t } = useTranslation("common");
  const meta = STATE_META[progress.state] ?? STATE_META.not_started;
  // Clamp rather than trust: a bar rendered at 137% is a bug report, and LinearProgress
  // throws a console error outside 0-100.
  const percent = Math.max(0, Math.min(100, Math.round(progress.percent ?? 0)));
  const label = t(meta.labelKey);
  // A started course must never print "0%" beside "In progress" — the two would contradict
  // each other and the 0 is the one a learner believes. The server rounds (the same round()
  // the course page's number goes through, which is why this formats rather than recomputes),
  // so a course long enough for one step to be worth under half a percent lands here. The
  // shortest real course today makes 1 step worth 0.4%, so this is one course away, not
  // hypothetical, and "N of M steps done" underneath carries the exact figure either way.
  const percentText =
    progress.state === "in_progress" && percent === 0 ? "<1%" : `${percent}%`;

  return (
    <Box
      data-testid="course-progress"
      data-progress-state={progress.state}
      sx={{ width: "100%", minWidth: 0 }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        sx={{ mb: 0.75, minWidth: 0 }}
      >
        <Box
          component="span"
          sx={{
            display: "inline-flex", alignItems: "center", gap: 0.4, flexShrink: 1, minWidth: 0,
            px: 0.85, py: 0.25, borderRadius: 999,
            fontSize: "0.68rem", fontWeight: 800, letterSpacing: 0.3,
            color: meta.fg, bgcolor: meta.bg, border: `1px solid ${meta.border}`,
            // 12px is the floor for a badge on a phone; 0.68rem is under it.
            [PHONE]: { fontSize: "0.75rem", px: 1 },
          }}
        >
          <Icon icon={meta.icon} width={13} />
          <Box component="span" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {label}
          </Box>
        </Box>
        <Typography
          component="span"
          sx={{
            flexShrink: 0, fontWeight: 800, fontSize: "0.8rem", color: "var(--font-primary, #0f172a)",
            [PHONE]: { fontSize: "0.85rem" },
          }}
        >
          {percentText}
        </Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={percent}
        aria-label={t("adaptiveCourseProgress.barAria", { percent })}
        sx={{
          height: 6,
          borderRadius: 4,
          bgcolor: "color-mix(in srgb, var(--font-tertiary, #94a3b8) 22%, transparent)",
          "& .MuiLinearProgress-bar": { borderRadius: 4, background: BAR[progress.state] },
          [PHONE]: { height: 8 },
        }}
      />

      {!compact && progress.steps_total > 0 && (
        <Typography
          sx={{
            mt: 0.5, fontSize: "0.72rem", color: "var(--font-tertiary, #64748b)",
            [PHONE]: { fontSize: "0.78rem" },
          }}
        >
          {t("adaptiveCourseProgress.steps", {
            done: progress.steps_done,
            total: progress.steps_total,
          })}
        </Typography>
      )}
    </Box>
  );
}
