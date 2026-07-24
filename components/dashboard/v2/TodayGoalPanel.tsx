"use client";

import { Box, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { AnimatedRing } from "@/components/scorecard/shared";
import type { TodayGoal } from "@/lib/types/dashboard";

const GOAL_ICON: Record<string, string> = {
  lesson: "mdi:book-open-page-variant-outline",
  practice: "mdi:timer-outline",
  quiz: "mdi:help-circle-outline",
};

/**
 * Dark "Today's Goal" card for the dashboard right rail: a progress ring over
 * three daily habits (complete a lesson / 15-min practice / take a quiz) + a
 * rolling last-5-day activity strip. Dark midnight-hyper surface to match the AI
 * briefing + course-readiness cards so the right rail isn't all plain white.
 */
export function TodayGoalPanel({ goal }: { goal: TodayGoal }) {
  const { goals, completedCount, totalCount, percent, lastDays } = goal;

  return (
    <Box
      sx={{
        borderRadius: 4,
        p: { xs: 2, md: 2.5 },
        color: "#fff",
        backgroundColor: "#110b2e",
        backgroundImage: "linear-gradient(160deg, #1a1442 0%, #110b2e 100%)",
        border: "1px solid rgba(168,85,247,0.18)",
        boxShadow: "0 18px 40px -24px rgba(76,29,149,0.6)",
      }}
    >
      <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.18em", color: "rgba(255,255,255,0.55)", mb: 1.5 }}>
        TODAY&apos;S GOAL
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center">
        {/* Ring */}
        <Box sx={{ position: "relative", width: 104, height: 104, flexShrink: 0 }}>
          <AnimatedRing
            value={percent}
            size={104}
            strokeWidth={9}
            color="#34d399"
            colorEnd="#22c55e"
            trackColor="rgba(255,255,255,0.1)"
            showValue={false}
          />
          <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <Typography sx={{ fontWeight: 900, fontSize: "1.5rem", lineHeight: 1 }}>{percent}%</Typography>
            <Typography sx={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.55)", mt: 0.25 }}>
              {completedCount} of {totalCount}
            </Typography>
          </Box>
        </Box>

        {/* Checklist */}
        <Stack spacing={1.1} sx={{ flex: 1, minWidth: 0 }}>
          {goals.map((g) => {
            const showPractice = g.key === "practice" && !g.done && g.minutes != null && g.targetMinutes != null;
            return (
              <Stack key={g.key} direction="row" spacing={1} alignItems="center">
                <Icon
                  icon={g.done ? "mdi:check-circle" : "mdi:circle-outline"}
                  width={20}
                  color={g.done ? "#34d399" : "rgba(255,255,255,0.28)"}
                  style={{ flexShrink: 0 }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    noWrap
                    sx={{ fontSize: "0.9rem", fontWeight: 600, color: g.done ? "#fff" : "rgba(255,255,255,0.62)" }}
                  >
                    {g.label}
                  </Typography>
                  {showPractice && (
                    <Typography sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" }}>
                      {g.minutes} / {g.targetMinutes} min
                    </Typography>
                  )}
                </Box>
              </Stack>
            );
          })}
        </Stack>
      </Stack>

      {/* Last-5-day strip */}
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        {lastDays.map((d) => (
          <Box key={d.date} sx={{ flex: 1, textAlign: "center" }}>
            <Box
              sx={{
                aspectRatio: "1 / 1",
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                mb: 0.6,
                ...(d.active
                  ? { background: "linear-gradient(135deg, #fb923c 0%, #ec4899 100%)", boxShadow: "0 8px 18px -10px rgba(236,72,153,0.6)" }
                  : d.isToday
                    ? { border: "1.5px dashed rgba(168,85,247,0.6)", bgcolor: "rgba(255,255,255,0.03)" }
                    : { bgcolor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }),
              }}
            >
              {d.active ? (
                <Icon icon="mdi:fire" width={18} color="#fff" />
              ) : (
                <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: d.isToday ? "#a855f7" : "rgba(255,255,255,0.25)" }} />
              )}
            </Box>
            <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.06em", color: d.isToday ? "#c4b5fd" : "rgba(255,255,255,0.45)" }}>
              {d.label}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
