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
  const dl = daysLeft(week.schedule?.dueAt);
  const locked = week.nodes.every((n) => n.status === "locked");
  const youAreHere = week.nodes.some((n) => n.status === "current");

  // A LABEL, not a card. This used to be a full bordered panel with its own icon tile,
  // progress bar and points chip, sitting above a module card that repeats most of it - so one
  // module read as two boxes. The week is a heading over its modules; the module is the
  // component. Everything the panel carried that is per-module (points, progress) lives on the
  // module card already; what is genuinely per-week (the due date, the late-penalty ladder)
  // stays here.
  return (
    <Box sx={{ mb: 1, pt: 0.5 }}>
      <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
        <Typography
          sx={{
            fontSize: "0.72rem", fontWeight: 800, letterSpacing: 1.1,
            textTransform: "uppercase", color: youAreHere ? "#6d28d9" : "#94a3b8",
            '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
            [PHONE]: { fontSize: "0.78rem", letterSpacing: 0.7 },
          }}
        >
          {weekHeading(week, unitNoun)}
        </Typography>
        {youAreHere && (
          <Chip
            size="small"
            label="YOU ARE HERE"
            sx={{
              height: 19, fontSize: "0.58rem", fontWeight: 800, letterSpacing: 0.6,
              color: "white",
              background: "linear-gradient(135deg, var(--module-tile-from, #6366f1) 0%, var(--module-tile-to, #a855f7) 100%)",
              '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
              [PHONE]: { height: 22, fontSize: "0.7rem" },
            }}
          />
        )}
        {week.stepsTotal > 1 && (
          <Typography sx={{ fontSize: "0.74rem", color: "#94a3b8", fontWeight: 600, [PHONE]: { fontSize: "0.78rem" } }}>
            {week.stepsDone} of {week.stepsTotal} done
          </Typography>
        )}
        {locked && <Icon icon="mdi:lock" width={13} color="#94a3b8" />}
        {week.schedule && (
          <Chip
            size="small"
            icon={<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: dl != null && dl < 0 ? "#ef4444" : "#22c55e", ml: 0.75 }} />}
            label={`Due ${fmtDate(week.schedule.dueAt)}${dl != null ? ` · ${dl < 0 ? `${-dl}d overdue` : `${dl}d left`}` : ""}`}
            sx={{
              height: 20, fontWeight: 700, fontSize: "0.7rem",
              color: dl != null && dl < 0 ? "#b91c1c" : "#15803d",
              bgcolor: dl != null && dl < 0 ? "#fef2f2" : "#f0fdf4",
              [PHONE]: { height: 22, fontSize: "0.75rem" },
            }}
          />
        )}
      </Stack>

      {week.penaltyStrip && week.schedule && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch" sx={{ mt: 1 }}>
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
