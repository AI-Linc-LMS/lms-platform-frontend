"use client";

/**
 * A week's heading, as a marker on the spine rather than the lid of its own card.
 *
 * It carries exactly what the week card header carried -- the unit label, steps done, points,
 * the due chip, the progress bar and the late-penalty strip -- but it no longer boxes the
 * week's steps in, so the rail runs unbroken from the first step of the course to the last.
 */

import { Box, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PHONE } from "@/components/common/mobile/phone";
import type { JourneyWeekView } from "@/lib/types/adaptive-journey";
import { addDays, daysLeft, fmtDate, fmtRange } from "./dates";

/** The arrow between penalty cells. The cells stack on a phone, so the arrow turns to point down. */
const PENALTY_ARROW = {
  display: "inline-flex",
  alignSelf: "center",
  color: "#cbd5e1",
  [PHONE]: { transform: "rotate(90deg)" },
} as const;

function PenaltyCell({ color, bg, head, sub, note }: { color: string; bg: string; head: string; sub: string; note: string }) {
  return (
    <Box sx={{ flex: 1, p: 1, borderRadius: 2, bgcolor: bg, border: `1px solid ${color}22`, [PHONE]: { p: 1.25 } }}>
      <Typography sx={{ fontSize: "0.74rem", fontWeight: 800, color, [PHONE]: { fontSize: "0.8rem" } }}>{head}</Typography>
      <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#0f172a", [PHONE]: { fontSize: "0.78rem" } }}>{sub}</Typography>
      <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color, mt: 0.25, [PHONE]: { fontSize: "0.78rem" } }}>{note}</Typography>
    </Box>
  );
}

/** The diamond that marks a week on the rail. A week is a waypoint, not a step, so it is not
 *  a numbered circle: squared off and rotated, it reads as a different kind of thing. */
export function WeekMarker({ done, started }: { done: boolean; started: boolean }) {
  const bg = done ? "#22c55e" : started ? "#6366f1" : "#e2e8f0";
  return (
    <Box
      sx={{
        width: 18,
        height: 18,
        transform: "rotate(45deg)",
        borderRadius: "4px",
        bgcolor: bg,
        flexShrink: 0,
        zIndex: 1,
        boxShadow: started && !done ? "0 0 0 4px rgba(99,102,241,0.14)" : "none",
      }}
    />
  );
}

/** The unit heading, named by the course: "Module 3" or "Week 3". The title is only appended
 *  when it adds something — nearly every module in production is literally titled "Week 1",
 *  which would otherwise render "Module 1 · Week 1". The server already suppresses those, and
 *  this stays as a second line of defence for a board served before that shipped. */
export function weekHeading(week: JourneyWeekView, unitNoun: string): string {
  const autoLabel = week.weekNo === 0 ? "Get started" : `${unitNoun} ${week.weekNo}`;
  const title = (week.title || "").trim();
  const showTitle =
    !!title &&
    title.toLowerCase() !== autoLabel.toLowerCase() &&
    !/^(week|module)\s*\d+$/i.test(title);
  return `${autoLabel}${showTitle ? ` · ${title}` : ""}`;
}

export function WeekBand({ week, unitNoun = "Week" }: { week: JourneyWeekView; unitNoun?: string }) {
  const pct = week.totals.total > 0 ? Math.round((week.totals.earned / week.totals.total) * 100) : 0;
  const dl = daysLeft(week.schedule?.dueAt);
  const locked = week.nodes.every((n) => n.status === "locked");
  // The learner's place in a long course. On a twelve-week board the current week is otherwise
  // indistinguishable from the eleven others until you read every status chip.
  const youAreHere = week.nodes.some((n) => n.status === "current");

  return (
    <Box
      sx={{
        mb: 1.5,
        p: { xs: 1.75, md: 2.25 },
        borderRadius: 3.5,
        border: "1px solid",
        borderColor: youAreHere ? "#c7d2fe" : "#e9e6f7",
        backgroundImage: "linear-gradient(135deg, #f5f3ff 0%, #fdf2f8 100%)",
        boxShadow: youAreHere
          ? "0 0 0 3px rgba(99,102,241,0.10), 0 12px 30px -26px rgba(99,102,241,0.5)"
          : "0 12px 30px -26px rgba(99,102,241,0.5)",
        [PHONE]: { p: 1.5 },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
        <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap">
          <Box sx={{ width: 32, height: 32, borderRadius: 2, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, var(--module-tile-from, #6366f1) 0%, var(--module-tile-to, #a855f7) 100%)", boxShadow: "0 8px 18px -10px var(--module-hero-shadow, rgba(124,58,237,0.6))" }}>
            <Icon icon="mdi:calendar-month" width={18} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>
            {weekHeading(week, unitNoun)}
          </Typography>
          {youAreHere && (
            <Chip
              size="small"
              label="YOU ARE HERE"
              sx={{
                height: 20, fontSize: "0.6rem", fontWeight: 800, letterSpacing: 0.6,
                color: "white",
                background: "linear-gradient(135deg, var(--module-tile-from, #6366f1) 0%, var(--module-tile-to, #a855f7) 100%)",
                '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
                [PHONE]: { height: 22, fontSize: "0.7rem" },
              }}
            />
          )}
          <Typography sx={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
            {week.stepsDone} of {week.stepsTotal} steps done
          </Typography>
          {locked && <Icon icon="mdi:lock" width={14} color="#64748b" />}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {week.schedule && (
            <Chip
              size="small"
              icon={<Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: dl != null && dl < 0 ? "#ef4444" : "#22c55e", ml: 0.75 }} />}
              label={`Due ${fmtDate(week.schedule.dueAt)}${dl != null ? ` · ${dl < 0 ? `${-dl}d overdue` : `${dl} days left`}` : ""}`}
              sx={{ fontWeight: 700, fontSize: "0.74rem", color: dl != null && dl < 0 ? "#b91c1c" : "#15803d", bgcolor: dl != null && dl < 0 ? "#fef2f2" : "#f0fdf4", [PHONE]: { fontSize: "0.78rem" } }}
            />
          )}
          <Chip
            size="small"
            icon={<Icon icon="mdi:trophy" width={14} />}
            label={`${week.totals.earned} / ${week.totals.total} pts`}
            sx={{ fontWeight: 800, fontSize: "0.74rem", color: "#6d28d9", bgcolor: "#ede9fe", "& .MuiChip-icon": { color: "#6d28d9" }, [PHONE]: { fontSize: "0.78rem" } }}
          />
        </Stack>
      </Stack>

      <LinearProgress variant="determinate" value={pct} sx={{ mt: 1.5, height: 6, borderRadius: 3, bgcolor: "#eef2f7", "& .MuiLinearProgress-bar": { borderRadius: 3, background: "linear-gradient(90deg, #6366f1, #a855f7)" } }} />

      {week.penaltyStrip && week.schedule && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch" sx={{ mt: 1.5 }}>
          <PenaltyCell color="#15803d" bg="#f0fdf4" head="On time" sub={`by ${fmtDate(week.schedule.dueAt)}`} note="Full score" />
          <Box component="span" sx={PENALTY_ARROW}><Icon icon="mdi:arrow-right" width={16} /></Box>
          <PenaltyCell color="#b45309" bg="#fffbeb" head="1–4 days late" sub={fmtRange(addDays(week.schedule.dueAt, 1), addDays(week.penaltyStrip.zeroAfter, -1))} note="−50% penalty" />
          <Box component="span" sx={PENALTY_ARROW}><Icon icon="mdi:arrow-right" width={16} /></Box>
          <PenaltyCell color="#b91c1c" bg="#fef2f2" head="After deadline" sub={`from ${fmtDate(week.penaltyStrip.zeroAfter)}`} note="−100% · no credit" />
        </Stack>
      )}
    </Box>
  );
}
