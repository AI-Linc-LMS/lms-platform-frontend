"use client";

/**
 * One coding problem, as a card.
 *
 * Replaces a full-width timeline row. The rows carried five things the DESIGN.md audit lists as
 * deletions, and this is where they go:
 *
 *   - the 4px coloured left strip ("the single most reliable AI tell")
 *   - the gradient CTA (its light half fails AA on white text)
 *   - `fontWeight: 800`, in a system whose only weights are 400/500/600
 *   - drop shadows for depth, where the ladder is canvas -> surface -> hairline
 *   - four per-content-type brand colours against an accent budget of three uses of one
 *
 * What a learner needs before clicking is, in order: can I do this yet, how hard is it, what is
 * it worth. The reach-ahead chip therefore sits ABOVE the difficulty pill in the DOM on narrow
 * widths, because it changes whether to start at all, which difficulty does not.
 */

import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PHONE } from "@/components/common/mobile/phone";
import {
  DIFFICULTY_LABEL,
  P,
  RADIUS,
  TONE,
  aheadLabel,
  difficultyKey,
  focusRing,
  hairline,
} from "./practiceTokens";

export interface PracticeCardItem {
  key: string;
  title: string;
  difficulty: string;
  /** Techniques this course teaches only later. Empty for a problem the learner is ready for. */
  requiresUpcoming: string[];
  completed: boolean;
  onOpen: () => void;
  onPrefetch?: () => void;
  /** Points this problem is worth, and what was earned if it is done. */
  onOffer?: number;
  earned?: number;
  /**
   * Whole minutes, measured from real attempts. Undefined when too few learners have finished
   * it to publish a median, and then the card says nothing rather than estimating.
   */
  typicalMinutes?: number;
}

const chipBase = {
  display: "inline-flex",
  alignItems: "center",
  height: 22,
  px: 1,
  borderRadius: `${RADIUS.chip}px`,
  fontSize: "0.75rem",
  fontWeight: 500,
  whiteSpace: "nowrap",
  // Arabic: letter-spacing breaks the cursive joins and uppercase is a no-op (DESIGN.md §4).
  '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
} as const;

export function PracticeCard({ item, index }: { item: PracticeCardItem; index: number }) {
  const key = difficultyKey(item.difficulty);
  const tone = TONE[key];
  const ahead = item.requiresUpcoming.length > 0;
  const verb = item.completed ? "Review" : ahead ? "Try anyway" : "Solve";
  // The visible verb sits in an aria-hidden span (it is decoration on a control that is already
  // the whole card), so the card has to say for itself what activating it does. Without this a
  // screen reader reads the title and the points and never reaches a verb.
  const label = `${verb}: ${item.title}. ${DIFFICULTY_LABEL[key]}.` +
    (ahead ? ` Reaches ahead to ${item.requiresUpcoming.join(", ")}, taught later in this course.` : "");

  return (
    <Box
      component="button"
      type="button"
      data-testid="practice-card"
      aria-label={label}
      onMouseEnter={item.onPrefetch}
      onClick={item.onOpen}
      sx={{
        font: "inherit",
        textAlign: "start",
        cursor: "pointer",
        border: 0,
        p: 2,
        minWidth: 0,
        minHeight: 150,
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        borderRadius: `${RADIUS.card}px`,
        bgcolor: P.surface,
        boxShadow: hairline,
        transition: "box-shadow .15s",
        "&:hover": { boxShadow: `0 0 0 1px ${P.inkFaint}33` },
        "&:focus-visible": { outline: "none", boxShadow: focusRing },
        [PHONE]: { minHeight: 0 },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Typography
          component="span"
          sx={{
            fontSize: "0.75rem", fontWeight: 500, color: P.inkFaint,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {String(index).padStart(2, "0")}
        </Typography>
        <Box component="span" sx={{ ...chipBase, color: tone.fg, bgcolor: tone.bg }}>
          {DIFFICULTY_LABEL[key]}
        </Box>
      </Stack>

      <Typography
        component="span"
        sx={{
          fontSize: "0.94rem", fontWeight: 500, lineHeight: 1.35, color: P.ink,
          letterSpacing: "-0.1px",
        }}
      >
        {item.title}
      </Typography>

      {ahead && (
        <Box
          component="span"
          data-testid="practice-ahead"
          sx={{
            ...chipBase,
            height: "auto", py: 0.4, whiteSpace: "normal",
            color: TONE.ahead.fg, bgcolor: TONE.ahead.bg,
            boxShadow: `inset 0 0 0 1px ${TONE.ahead.line}`,
            alignSelf: "flex-start",
          }}
        >
          {aheadLabel(item.requiresUpcoming)}
        </Box>
      )}

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        sx={{ mt: "auto", pt: 0.5, width: "100%" }}
      >
        <Typography
          component="span"
          sx={{
            fontSize: "0.78rem", color: item.completed ? TONE.done.fg : P.inkFaint,
            fontVariantNumeric: "tabular-nums", minWidth: 0,
          }}
        >
          {item.completed
            ? `Solved${item.earned ? ` · ${item.earned} earned` : ""}`
            : [
                item.onOffer != null ? `${item.onOffer} pts` : null,
                // Measured, never derived from difficulty. Absent on most cards at first and
                // spreading as the problem is used, which is the honest direction.
                item.typicalMinutes != null ? `~${item.typicalMinutes} min` : null,
              ].filter(Boolean).join(" · ") || "Not started"}
        </Typography>

        {/* A nested button would be invalid inside the card button, so the action renders as a
            styled span: the whole card is already the control, and the label says what it does. */}
        <Box
          component="span"
          aria-hidden="true"
          sx={{
            flexShrink: 0,
            display: "inline-flex", alignItems: "center", gap: 0.5,
            height: 33, px: 1.5, borderRadius: `${RADIUS.control}px`,
            fontSize: "0.84rem", fontWeight: 500,
            ...(item.completed || ahead
              ? { color: P.violet, boxShadow: hairline }
              : { color: "#fff", bgcolor: P.violet }),
          }}
        >
          {verb}
          <Icon icon="mdi:chevron-right" width={15} />
        </Box>
      </Stack>
    </Box>
  );
}
