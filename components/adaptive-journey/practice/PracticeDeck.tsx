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

import { useMemo, useState } from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { PHONE } from "@/components/common/mobile/phone";
import { PracticeCard, type PracticeCardItem } from "./PracticeCard";
import { P, RADIUS, focusRing, hairline } from "./practiceTokens";
import { BUDGETS, hiddenByBudget, splitByReadiness, type TimeBudget } from "./readiness";

export function PracticeDeck({
  items,
  firstStep,
}: {
  items: PracticeCardItem[];
  /** The step number of the first card, so numbering continues from the lessons above. */
  firstStep: number;
}) {
  const [budget, setBudget] = useState<TimeBudget>(null);
  const buckets = useMemo(
    () => splitByReadiness(items, budget, firstStep),
    [items, budget, firstStep],
  );
  const hidden = useMemo(() => hiddenByBudget(items, budget), [items, budget]);

  if (items.length === 0) return null;
  const solved = items.filter((i) => i.completed).length;
  // Offered only when a measured minute figure exists to filter on. A control that cannot
  // change anything is worse than no control.
  const canFilterByTime = items.some((i) => i.typicalMinutes != null);

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

      {canFilterByTime && (
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          sx={{ mb: 2, flexWrap: "wrap" }}
          data-testid="practice-budget"
        >
          <Typography sx={{ fontSize: "0.8rem", color: P.inkFaint }}>I have</Typography>
          <Stack
            direction="row"
            role="group"
            aria-label="How long you have"
            sx={{ bgcolor: P.surface, borderRadius: 999, p: 0.4, boxShadow: hairline }}
          >
            {BUDGETS.map((b) => {
              const on = b.value === budget;
              return (
                <ButtonBase
                  key={b.label}
                  onClick={() => setBudget(b.value)}
                  aria-pressed={on}
                  sx={{
                    px: 1.5, py: 0.6, borderRadius: 999,
                    fontSize: "0.79rem", fontWeight: 500,
                    color: on ? "#fff" : P.inkMuted,
                    bgcolor: on ? P.violet : "transparent",
                    "&:focus-visible": { outline: "none", boxShadow: focusRing },
                    [PHONE]: { minHeight: 44, px: 1.75 },
                  }}
                >
                  {b.label}
                </ButtonBase>
              );
            })}
          </Stack>
          {hidden > 0 && (
            // Never a silent cap: a filter that quietly removes work reads as a thinner topic.
            <Typography sx={{ fontSize: "0.78rem", color: P.inkFaint }}>
              {hidden} longer {hidden === 1 ? "one" : "ones"} hidden
            </Typography>
          )}
        </Stack>
      )}

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

      {buckets.length === 0 && (
        <Box
          sx={{
            p: 3, textAlign: "center", borderRadius: `${RADIUS.card}px`,
            bgcolor: P.surface, boxShadow: hairline,
          }}
        >
          <Typography sx={{ fontSize: "0.88rem", color: P.inkMuted }}>
            Nothing here fits {BUDGETS.find((b) => b.value === budget)?.label.toLowerCase()}.
          </Typography>
          <ButtonBase
            onClick={() => setBudget(null)}
            sx={{
              mt: 1, px: 1.5, py: 0.75, borderRadius: `${RADIUS.control}px`,
              fontSize: "0.82rem", fontWeight: 500, color: P.violet,
              "&:focus-visible": { outline: "none", boxShadow: focusRing },
              [PHONE]: { minHeight: 44 },
            }}
          >
            Show everything
          </ButtonBase>
        </Box>
      )}
    </Box>
  );
}
