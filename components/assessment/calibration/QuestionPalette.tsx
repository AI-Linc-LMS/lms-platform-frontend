"use client";

import { Box, ButtonBase, Stack, Typography } from "@mui/material";

/**
 * The question navigator on the calibration assessment: every question as a numbered box, coloured
 * by where the learner stands on it, and clickable to jump straight there.
 *
 * Modelled on the exam-style palette the prep platform already uses (and that anyone who has sat a
 * national entrance test knows): five states, a legend with counts. The point is to answer "what
 * have I not done yet?" at a glance, before a submit that cannot be taken back.
 */

export type QuestionStatus = "answered" | "notAnswered" | "notVisited" | "marked" | "answeredMarked";

/** Legend order: what is done, what is left, then what the learner flagged. */
export const STATUS_ORDER: QuestionStatus[] = ["answered", "notAnswered", "notVisited", "marked", "answeredMarked"];

export const STATUS_META: Record<QuestionStatus, { label: string; bg: string; fg: string; border: string }> = {
  answered: { label: "Answered", bg: "#16a34a", fg: "#fff", border: "#16a34a" },
  notAnswered: { label: "Not answered", bg: "#e11d48", fg: "#fff", border: "#e11d48" },
  notVisited: { label: "Not visited", bg: "rgba(255,255,255,0.06)", fg: "rgba(255,255,255,0.75)", border: "rgba(255,255,255,0.16)" },
  marked: { label: "Marked for review", bg: "#7c3aed", fg: "#fff", border: "#7c3aed" },
  answeredMarked: { label: "Answered & marked", bg: "#7c3aed", fg: "#fff", border: "#7c3aed" },
};

/**
 * One question's state. "Not answered" means the learner opened it and moved on without choosing;
 * "not visited" means they have not been there. Marking for review sits on top of either.
 */
export function statusOf(answered: boolean, visited: boolean, marked: boolean): QuestionStatus {
  if (answered && marked) return "answeredMarked";
  if (marked) return "marked";
  if (answered) return "answered";
  if (visited) return "notAnswered";
  return "notVisited";
}

export function countStatuses(statuses: QuestionStatus[]): Record<QuestionStatus, number> {
  const counts: Record<QuestionStatus, number> = {
    answered: 0, notAnswered: 0, notVisited: 0, marked: 0, answeredMarked: 0,
  };
  statuses.forEach((s) => { counts[s] += 1; });
  return counts;
}

/**
 * What still needs attention before submitting, in words, or `null` when nothing does.
 *
 * "Marked" includes answered-and-marked: the learner flagged those to come back to, and submitting
 * is the last chance to.
 */
export function submitWarning(counts: Record<QuestionStatus, number>): string | null {
  const unanswered = counts.notAnswered + counts.notVisited + counts.marked;
  const flagged = counts.marked + counts.answeredMarked;
  const parts: string[] = [];
  if (unanswered) parts.push(`${unanswered} question${unanswered === 1 ? "" : "s"} unanswered`);
  if (flagged) parts.push(`${flagged} marked for review`);
  return parts.length ? parts.join(" and ") : null;
}

function Cell({ n, status, current, onClick }: { n: number; status: QuestionStatus; current: boolean; onClick: () => void }) {
  const meta = STATUS_META[status];
  return (
    <ButtonBase
      onClick={onClick}
      aria-label={`Question ${n} - ${meta.label}${current ? " (current)" : ""}`}
      aria-current={current ? "step" : undefined}
      sx={{
        position: "relative", width: "100%", aspectRatio: "1 / 1", borderRadius: 1.5,
        fontSize: "0.8rem", fontWeight: 800, fontVariantNumeric: "tabular-nums",
        bgcolor: meta.bg, color: meta.fg, border: "1px solid", borderColor: meta.border,
        // The current question is outlined in white on top of its status colour, so the learner
        // sees both where they are and what state it is in.
        outline: current ? "2px solid #fff" : "none", outlineOffset: 2,
        transition: "transform .12s", "&:hover": { transform: "translateY(-1px)" },
      }}
    >
      {n}
      {status === "answeredMarked" && (
        // Answered AND flagged: a green dot on the violet box, so it reads as both at once.
        <Box component="span" sx={{ position: "absolute", top: 3, right: 3, width: 7, height: 7, borderRadius: "50%", bgcolor: "#4ade80", border: "1px solid #0b1220" }} />
      )}
    </ButtonBase>
  );
}

export function QuestionPalette({
  statuses,
  current,
  onJump,
}: {
  statuses: QuestionStatus[];
  current: number;
  onJump: (index: number) => void;
}) {
  const counts = countStatuses(statuses);
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1.25 }}>
        <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: 1, color: "rgba(255,255,255,0.45)" }}>
          QUESTIONS
        </Typography>
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
          {counts.answered + counts.answeredMarked} / {statuses.length} answered
        </Typography>
      </Stack>

      <Box
        role="navigation"
        aria-label="Question navigator"
        sx={{
          display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 0.75,
          // A long paper scrolls inside the panel rather than pushing the integrity checks off-screen.
          maxHeight: 320, overflowY: "auto", p: 0.5, m: -0.5,
        }}
      >
        {statuses.map((s, i) => (
          <Cell key={i} n={i + 1} status={s} current={i === current} onClick={() => onJump(i)} />
        ))}
      </Box>

      <Stack spacing={0.6} sx={{ mt: 1.75 }}>
        {STATUS_ORDER.map((s) => (
          <Stack key={s} direction="row" alignItems="center" spacing={1}>
            <Box sx={{ position: "relative", width: 12, height: 12, borderRadius: 0.75, flexShrink: 0, bgcolor: STATUS_META[s].bg, border: "1px solid", borderColor: STATUS_META[s].border }}>
              {s === "answeredMarked" && (
                <Box component="span" sx={{ position: "absolute", top: -2, right: -2, width: 6, height: 6, borderRadius: "50%", bgcolor: "#4ade80" }} />
              )}
            </Box>
            <Typography sx={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.7)", flex: 1 }}>{STATUS_META[s].label}</Typography>
            <Typography sx={{ fontSize: "0.74rem", fontWeight: 800, color: "rgba(255,255,255,0.85)", fontVariantNumeric: "tabular-nums" }}>
              {counts[s]}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
