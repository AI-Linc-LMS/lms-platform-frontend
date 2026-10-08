"use client";

/**
 * A topic's coding problems, as a grid rather than the tail of a single-file timeline.
 *
 * Safe to lift out of the numbered path because coding is ALWAYS last within a topic:
 * `lib/adaptive/courseFlow.ts` builds steps as videos, then articles, then quizzes, then coding,
 * and documents that both this page and every Next button walk that one order. So the deck's
 * cards carry the same step numbers they had as rows, continuing from the lessons above, and the
 * Next button still agrees with what is on screen.
 *
 * `auto-fit` with a 215px floor rather than a fixed column count: a topic can have two problems
 * or nine, and a hardcoded three-up leaves one card stranded alone on a second row.
 */

import { Box, Stack, Typography } from "@mui/material";
import { PHONE } from "@/components/common/mobile/phone";
import { PracticeCard, type PracticeCardItem } from "./PracticeCard";
import { P } from "./practiceTokens";

export function PracticeDeck({
  items,
  firstStep,
}: {
  items: PracticeCardItem[];
  /** The step number of the first card, so numbering continues from the lessons above. */
  firstStep: number;
}) {
  if (items.length === 0) return null;
  const solved = items.filter((i) => i.completed).length;

  return (
    <Box data-testid="practice-deck" sx={{ mt: 3 }}>
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
        gap={1}
        sx={{ mb: 1.5, flexWrap: "wrap" }}
      >
        <Typography
          component="h2"
          sx={{ fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.3px", color: P.ink }}
        >
          Practice
        </Typography>
        <Typography
          sx={{ fontSize: "0.8rem", color: P.inkFaint, fontVariantNumeric: "tabular-nums" }}
        >
          {solved} of {items.length} solved
        </Typography>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(215px, 1fr))",
          gap: 1.5,
          // A grid track is min-width:auto and refuses to shrink below its content, which is how
          // a long problem title pushed this page sideways on a phone before.
          "& > *": { minWidth: 0 },
          [PHONE]: { gridTemplateColumns: "1fr" },
        }}
      >
        {items.map((item, i) => (
          <PracticeCard key={item.key} item={item} index={firstStep + i} />
        ))}
      </Box>
    </Box>
  );
}
