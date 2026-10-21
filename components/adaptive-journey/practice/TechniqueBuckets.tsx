"use client";

/**
 * A topic's coding problems grouped by TECHNIQUE, and the bonus that covering them all unlocks.
 *
 * Different axis from `PracticeDeck`, which groups by whether a learner can do a problem today
 * (readiness, time budget). This groups by what the problem teaches: inside Binary Search,
 * "Sort modification" and "Search answer" are two different things to learn, and a learner who
 * has only ever done one of them has not learned binary search. That is also why completion
 * can be stated across these groups - *solve at least one problem from each bucket* - where a
 * count of six could not tell six of one technique from one of each of six.
 *
 * The server decides both the grouping and whether the bonus is unlocked. This component never
 * recomputes either: `satisfied` is per-bucket and means "at least one solved", NOT
 * `solved === total`, and a client that re-derived it from the problem rows would eventually
 * disagree with the server about whether a learner had finished the module.
 *
 * Renders nothing when the set has no buckets. 2,776 live sets are in that state, and the page
 * keeps drawing the flat deck it has always drawn.
 */

import { useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { PHONE } from "@/components/common/mobile/phone";
import { PracticeCard, type PracticeCardItem } from "./PracticeCard";
import { P, RADIUS, hairline } from "./practiceTokens";

export interface TechniqueBucket {
  id: number;
  name: string;
  slug: string;
  description: string;
  order: number;
  total: number;
  solved: number;
  /** At least one solved. The rule is one PER bucket, not all of them. */
  satisfied: boolean;
}

/** A practice card plus the bucket it belongs to. */
export type BucketedItem = PracticeCardItem & { bucketId: number | null };

/** The ring that carries `solved/total`, lit once the bucket is satisfied. */
function CountRing({ solved, total, satisfied }: { solved: number; total: number; satisfied: boolean }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 42, height: 42, flexShrink: 0, borderRadius: "50%",
        display: "grid", placeItems: "center",
        fontSize: "0.72rem", fontWeight: 700, fontVariantNumeric: "tabular-nums",
        color: satisfied ? "#047857" : P.inkFaint,
        backgroundColor: satisfied ? "#ecfdf5" : P.surface,
        boxShadow: satisfied ? "0 0 0 1px #a7f3d0" : hairline,
      }}
    >
      {solved}/{total}
    </Box>
  );
}

export function TechniqueBuckets({
  buckets,
  items,
  bonusUnlocked,
  firstStep,
}: {
  buckets: TechniqueBucket[];
  items: BucketedItem[];
  bonusUnlocked: boolean;
  /** Step number of the first card, so numbering continues from the lessons above. */
  firstStep: number;
}) {
  const grouped = useMemo(() => {
    const byBucket = new Map<number, BucketedItem[]>();
    for (const item of items) {
      if (item.bucketId == null) continue;
      const list = byBucket.get(item.bucketId);
      if (list) list.push(item);
      else byBucket.set(item.bucketId, [item]);
    }
    return byBucket;
  }, [items]);

  // Numbering follows the authored order across the whole set, not the position inside a
  // bucket - otherwise regrouping the problems would renumber the course.
  const stepOf = useMemo(() => {
    const n = new Map<string, number>();
    items.forEach((item, i) => n.set(item.key, firstStep + i));
    return n;
  }, [items, firstStep]);

  if (buckets.length === 0) return null;

  return (
    <Box data-testid="technique-buckets" sx={{ mt: 3 }}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" gap={1}
             sx={{ mb: 1.5, flexWrap: "wrap" }}>
        <Typography component="h2"
          sx={{ fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.3px", color: P.ink }}>
          Practice
        </Typography>
        <Typography sx={{ fontSize: "0.8rem", color: P.inkFaint, fontVariantNumeric: "tabular-nums" }}>
          {buckets.filter((b) => b.satisfied).length} of {buckets.length} techniques covered
        </Typography>
      </Stack>

      <Stack spacing={2}>
        {buckets.map((bucket) => {
          const members = grouped.get(bucket.id) ?? [];
          return (
            <Box
              key={bucket.id}
              data-testid="technique-bucket"
              data-satisfied={bucket.satisfied ? "true" : "false"}
              sx={{
                borderRadius: `${RADIUS.card}px`,
                backgroundColor: P.surface,
                boxShadow: hairline,
                p: { xs: 1.5, sm: 2 },
                [PHONE]: { p: 1.5 },
              }}
            >
              <Stack direction="row" alignItems="center" gap={1.25} sx={{ mb: members.length ? 1.5 : 0 }}>
                <CountRing solved={bucket.solved} total={bucket.total} satisfied={bucket.satisfied} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: "1rem", fontWeight: 600, color: P.ink }}>
                    {bucket.name}
                  </Typography>
                  {bucket.description ? (
                    <Typography sx={{ fontSize: "0.8rem", color: P.inkFaint }}>
                      {bucket.description}
                    </Typography>
                  ) : null}
                </Box>
              </Stack>

              {/* `auto-FILL`, not `auto-fit`. Both avoid a fixed column count, which would
                  strand a card alone on a second row - but auto-fit collapses the empty tracks,
                  so a bucket holding one problem stretched that card across the full width
                  while its four-problem neighbour showed a tidy row of four. auto-fill keeps
                  the tracks, so every card is the same width whatever the bucket holds. */}
              <Box sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(215px, 1fr))",
                gap: 1.5,
                [PHONE]: { gridTemplateColumns: "1fr" },
              }}>
                {members.map((item) => (
                  <PracticeCard key={item.key} item={item} index={stepOf.get(item.key) ?? 0} />
                ))}
              </Box>
            </Box>
          );
        })}
      </Stack>

      <Box
        data-testid="topic-bonus"
        data-unlocked={bonusUnlocked ? "true" : "false"}
        sx={{
          mt: 2, p: { xs: 1.75, sm: 2 },
          borderRadius: `${RADIUS.card}px`,
          display: "flex", alignItems: "center", gap: 1.5,
          backgroundColor: bonusUnlocked ? "#ecfdf5" : "#f8fafc",
          boxShadow: bonusUnlocked ? "0 0 0 1px #a7f3d0" : hairline,
        }}
      >
        <Box sx={{
          width: 38, height: 38, flexShrink: 0, borderRadius: "50%",
          display: "grid", placeItems: "center",
          backgroundColor: bonusUnlocked ? "#d1fae5" : "#eef2f7",
          color: bonusUnlocked ? "#047857" : P.inkFaint,
        }}>
          <Icon icon={bonusUnlocked ? "mdi:trophy-outline" : "mdi:lock-outline"} width={19} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: P.ink }}>
            Topic bonus
          </Typography>
          <Typography sx={{ fontSize: "0.82rem", color: P.inkMuted }}>
            {bonusUnlocked
              ? "Unlocked — you have covered every technique in this topic."
              : "Unlocks once you solve at least one problem from each bucket."}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default TechniqueBuckets;
