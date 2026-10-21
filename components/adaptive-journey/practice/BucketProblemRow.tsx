"use client";

/**
 * One coding problem as a dense row inside a technique bucket.
 *
 * The card version of this (`PracticeCard`) is right when problems are the page: six cards in a
 * grid, each with its own CTA, reads as six decisions. Inside a bucket the decision is already
 * made - the rule is *solve any one of these* - so the row's job is to let a learner compare
 * four problems at a glance and pick one, which cards at 215px wide actively prevent.
 *
 * Deliberately NOT carried over from the card:
 *   - the step number. Numbering implies a sequence, and a bucket is explicitly unordered: any
 *     one problem covers it. A number here would contradict the rule stated two inches below.
 *   - the `Solve` / `Try anyway` button. The row is the control; a button inside a control is
 *     both a nested-interactive a11y fault and, at four rows a bucket, pure noise.
 *   - the filled difficulty pill. Four filled chips per bucket out-shout the bucket heading.
 *     Difficulty survives as coloured text in the meta cluster, which keeps the signal and
 *     drops the fill.
 *
 * The reach-ahead warning is the one thing that may not be shortened to an icon: it changes
 * whether to start at all, and `aheadLabel` names the concepts. It gets its own line.
 */

import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { PHONE } from "@/components/common/mobile/phone";
import type { PracticeCardItem } from "./PracticeCard";
import {
  DIFFICULTY_LABEL,
  P,
  TONE,
  aheadLabel,
  difficultyKey,
  focusRing,
} from "./practiceTokens";

/** The completion marker. Empty ring, or a green tick once the problem has been passed. */
function DoneMark({ done }: { done: boolean }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 20,
        height: 20,
        flexShrink: 0,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        border: done ? "1.5px solid #6ee7b7" : `1.5px solid ${P.hairline}`,
        backgroundColor: done ? "#ecfdf5" : "transparent",
        color: TONE.done.fg,
        transition: "border-color 120ms ease, background-color 120ms ease",
      }}
    >
      {done ? <Icon icon="mdi:check" width={13} /> : null}
    </Box>
  );
}

export function BucketProblemRow({ item }: { item: PracticeCardItem }) {
  const key = difficultyKey(item.difficulty);
  const ahead = item.requiresUpcoming.length > 0;
  const points = item.completed ? item.earned : item.onOffer;
  const verb = item.completed ? "Review" : ahead ? "Try anyway" : "Solve";

  // The row's visible text is a title and three abbreviated figures; none of them says what
  // pressing it does, and "12 min" read aloud after a title is a riddle. So the control states
  // its own action and expands the figures it abbreviates.
  const label =
    `${verb}: ${item.title}. ${DIFFICULTY_LABEL[key]}.` +
    (item.typicalMinutes ? ` Typically ${item.typicalMinutes} minutes.` : "") +
    (points ? ` ${points} points.` : "") +
    (ahead
      ? ` Reaches ahead to ${item.requiresUpcoming.join(", ")}, taught later in this course.`
      : "");

  return (
    <ButtonBase
      data-testid="bucket-problem-row"
      data-done={item.completed ? "true" : "false"}
      aria-label={label}
      onMouseEnter={item.onPrefetch}
      onFocus={item.onPrefetch}
      onClick={item.onOpen}
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: 1.25,
        // 44px is the phone tap floor (components/common/phoneTap.ts); a one-line row lands at
        // exactly that, so the minimum is the natural height rather than padding bolted on.
        minHeight: 44,
        px: { xs: 1, sm: 1.25 },
        py: 1,
        borderRadius: "8px",
        textAlign: "start",
        justifyContent: "flex-start",
        color: P.ink,
        "&:hover": { backgroundColor: "#f8fafc" },
        "&:focus-visible": { boxShadow: focusRing },
      }}
    >
      <Box sx={{ pt: "1px" }}>
        <DoneMark done={item.completed} />
      </Box>

      <Box sx={{ minWidth: 0, flex: 1, [PHONE]: { flexBasis: "calc(100% - 46px)" } }}>
        <Typography
          sx={{
            fontSize: "0.875rem",
            fontWeight: 500,
            lineHeight: 1.4,
            // Solved is carried by the green tick alone. A strikethrough on the title reads as
            // "withdrawn", not "done", and a learner may still want to revisit the problem.
            color: item.completed ? P.inkMuted : P.ink,
          }}
        >
          {item.title}
        </Typography>
        {ahead ? (
          <Typography
            sx={{
              mt: 0.25,
              fontSize: "0.72rem",
              lineHeight: 1.35,
              color: TONE.ahead.fg,
            }}
          >
            {aheadLabel(item.requiresUpcoming)}
          </Typography>
        ) : null}
      </Box>

      {/* The figures a learner compares across rows. Tabular digits so they line up down the
          column. On a phone the title claims the whole line and this wraps beneath it, indented
          past the tick - hiding it there would delete the only estimate of effort a learner has
          before opening the problem, which is the figure they most need on the smallest screen. */}
      <Stack
        aria-hidden
        direction="row"
        alignItems="center"
        gap={0.75}
        sx={{
          flexShrink: 0,
          flexWrap: "wrap",
          pt: "2px",
          fontSize: "0.72rem",
          fontVariantNumeric: "tabular-nums",
          color: P.inkFaint,
          whiteSpace: "nowrap",
          // MUI's Stack is `content-box`, so a 100% basis plus the 30px indent measured 348px
          // inside a 334px row and clipped the points off every phone row. Caught by reading
          // scrollWidth in Chromium; the computed style of the row itself looked fine.
          boxSizing: "border-box",
          [PHONE]: { pt: 0, pl: "30px", flexBasis: "100%" },
        }}
      >
        <Box component="span" sx={{ color: TONE[key].fg, fontWeight: 500 }}>
          {DIFFICULTY_LABEL[key]}
        </Box>
        {item.typicalMinutes ? <Box component="span">· {item.typicalMinutes} min</Box> : null}
        {points ? <Box component="span">· {points} pts</Box> : null}
      </Stack>
    </ButtonBase>
  );
}

export default BucketProblemRow;
