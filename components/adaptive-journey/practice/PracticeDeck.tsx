"use client";

/**
 * A topic's coding problems, grouped by whether the learner can do them today.
 *
 * Safe to lift out of the numbered path because coding is ALWAYS last within a topic:
 * `lib/adaptive/courseFlow.ts` builds steps as videos, then articles, then quizzes, then coding,
 * and documents that both this page and every Next button walk that one order. So each card
 * keeps the step number it had as a row, taken from its authored position and never from its
 * position in a bucket - otherwise changing the filter would renumber the course.
 *
 * `auto-fit` with a 215px floor rather than a fixed column count: a topic can have two problems
 * or nine, and a hardcoded three-up leaves one card stranded alone on a second row.
 */

import { useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { PHONE } from "@/components/common/mobile/phone";
import { PracticeCard, type PracticeCardItem } from "./PracticeCard";
import { P, RADIUS } from "./practiceTokens";
import { splitByReadiness } from "./readiness";

export function PracticeDeck({
  items,
  firstStep,
}: {
  items: PracticeCardItem[];
  /** The step number of the first card, so numbering continues from the lessons above. */
  firstStep: number;
}) {
  const buckets = useMemo(() => splitByReadiness(items, firstStep), [items, firstStep]);

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

      {buckets.map((bucket) => (
        <Box key={bucket.key} sx={{ mb: 2.5, "&:last-of-type": { mb: 0 } }}>
          <Box sx={{ mb: 1.25 }}>
            <Typography
              component="h3"
              sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.2px", color: P.ink }}
            >
              {bucket.title}
              <Box
                component="span"
                sx={{
                  ml: 1, fontSize: "0.78rem", fontWeight: 400, color: P.inkFaint,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {bucket.items.filter((i) => i.completed).length}/{bucket.items.length}
              </Box>
            </Typography>
            <Typography sx={{ fontSize: "0.79rem", color: P.inkFaint, mt: 0.1 }}>
              {bucket.why}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              // auto-FILL, not auto-fit. auto-fit collapses the empty tracks and stretches the
              // survivors, so a two-card bucket rendered at half the page width beside a
              // four-card bucket at a quarter - the same card in two sizes on one screen.
              // auto-fill keeps the tracks, so a card is the same size in every bucket.
              gridTemplateColumns: "repeat(auto-fill, minmax(215px, 1fr))",
              gap: 1.5,
              // A grid track is min-width:auto and refuses to shrink below its content, which is
              // how a long problem title pushed this page sideways on a phone before.
              "& > *": { minWidth: 0 },
              [PHONE]: { gridTemplateColumns: "1fr" },
            }}
          >
            {bucket.items.map((item) => (
              <PracticeCard key={item.key} item={item} index={bucket.stepOf(item)} />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
