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
 *
 * LAYOUT. Buckets are lists inside a balanced two-column masonry, not a grid of cards. A bucket
 * holds one problem or eight, and a uniform grid has to pick between stretching the small ones
 * across a row and stranding the large ones; columns packed by `balanceColumns` let a bucket be
 * exactly as tall as it is. The rows themselves are `BucketProblemRow` rather than
 * `PracticeCard` because the choice inside a bucket is "which ONE of these", which wants four
 * comparable lines, not four cards each with its own call to action.
 */

import { useMemo } from "react";
import { Box, Stack, Typography, useMediaQuery } from "@mui/material";
import { Icon } from "@iconify/react";

import { AdaptiveInfoTip } from "@/components/adaptive-quiz/shared/AdaptiveInfoTip";
import { PHONE } from "@/components/common/mobile/phone";
import type { PracticeCardItem } from "./PracticeCard";
import { BucketProblemRow } from "./BucketProblemRow";
import { balanceColumns } from "./balanceColumns";
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

/**
 * `solved/total`, lit once the bucket is satisfied.
 *
 * A plain circle, and deliberately not a progress arc sweeping towards `total`: the rule is one
 * problem per bucket, so an arc at 1-of-8 would draw a learner who has FINISHED this bucket as
 * one eighth done. The ring turning green at the first solve is the honest picture of a rule
 * that only ever asks for one.
 */
function CountRing({ solved, total, satisfied }: { solved: number; total: number; satisfied: boolean }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 38, height: 38, flexShrink: 0, borderRadius: "50%",
        display: "grid", placeItems: "center",
        fontSize: "0.7rem", fontWeight: 600, fontVariantNumeric: "tabular-nums",
        color: satisfied ? "#047857" : P.inkFaint,
        backgroundColor: satisfied ? "#ecfdf5" : "transparent",
        border: `1.5px solid ${satisfied ? "#6ee7b7" : P.hairline}`,
      }}
    >
      {solved}/{total}
    </Box>
  );
}

/** What a bucket is, behind the (i). `description` is authored per bucket and is often blank. */
function BucketTip({ name, description }: { name: string; description: string }) {
  return (
    <AdaptiveInfoTip title="Buckets" ariaLabel={`What the ${name} bucket is for`} placement="left">
      {description ? <p>{description}</p> : null}
      <p>
        Problems in a topic are grouped by the technique they drill. Solving <strong>any one</strong>{" "}
        problem in a bucket covers that technique, and covering every bucket completes the topic.
      </p>
    </AdaptiveInfoTip>
  );
}

function BucketCard({ bucket, members }: { bucket: TechniqueBucket; members: BucketedItem[] }) {
  return (
    <Box
      data-testid="technique-bucket"
      data-satisfied={bucket.satisfied ? "true" : "false"}
      sx={{
        borderRadius: `${RADIUS.card}px`,
        backgroundColor: P.surface,
        boxShadow: hairline,
        // The rows run to the card's own edges, so the card clips them to its radius.
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1.25}
        sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5 }}
      >
        <CountRing solved={bucket.solved} total={bucket.total} satisfied={bucket.satisfied} />
        <Typography
          sx={{
            flex: 1, minWidth: 0,
            fontSize: "0.98rem", fontWeight: 600, color: P.ink, lineHeight: 1.3,
          }}
        >
          {bucket.name}
        </Typography>
        <BucketTip name={bucket.name} description={bucket.description} />
      </Stack>

      <Box sx={{ px: { xs: 0.5, sm: 0.75 }, pb: 0.75 }}>
        {members.length === 0 ? (
          <Typography sx={{ px: 1.25, py: 1, fontSize: "0.8rem", color: P.inkFaint }}>
            No problems in this bucket yet.
          </Typography>
        ) : (
          members.map((item, i) => (
            <Box
              key={item.key}
              sx={{
                // borderTop on all but the first, never borderBottom on all but the last: the
                // rule then cannot land on the card's own bottom edge when a bucket is clipped.
                borderTop: i === 0 ? "none" : `1px solid ${P.hairline}`,
              }}
            >
              <BucketProblemRow item={item} />
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}

export function TechniqueBuckets({
  buckets,
  items,
  bonusUnlocked,
}: {
  buckets: TechniqueBucket[];
  items: BucketedItem[];
  bonusUnlocked: boolean;
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

  // The column COUNT has to be known in JS, not only in CSS. Two balanced columns read down
  // then across; collapsing them with a media query leaves two stacked lists whose flattened
  // order is no longer the server's - with buckets of 1, 8 and 1 the packer yields [1,1] and
  // [8], which stacks as 1,1,8 against an authored 1,8,1. So narrow renders ONE column, which
  // `balanceColumns` returns untouched. 900px is the same breakpoint RoadmapSpine branches on.
  //
  // `useMediaQuery` is false during SSR and the first client paint, so the first frame is the
  // single column. That is the right way round: its order is correct at every width, and only
  // a wide viewport reflows - a phone never sees the two-column frame at all.
  const wide = useMediaQuery("(min-width:900px)");
  const columns = useMemo(
    () => balanceColumns(buckets, (b) => grouped.get(b.id)?.length ?? 0, wide ? 2 : 1),
    [buckets, grouped, wide],
  );

  if (buckets.length === 0) return null;

  const covered = buckets.filter((b) => b.satisfied).length;

  return (
    <Box data-testid="technique-buckets" sx={{ mt: 3 }}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" gap={1}
             sx={{ mb: 1.5, flexWrap: "wrap" }}>
        <Typography component="h2"
          sx={{ fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.3px", color: P.ink }}>
          Practice
        </Typography>
        <Typography sx={{ fontSize: "0.8rem", color: P.inkFaint, fontVariantNumeric: "tabular-nums" }}>
          {covered} of {buckets.length} techniques covered
        </Typography>
      </Stack>

      {/* Two real columns rather than CSS `columns`, which is free until a bucket is taller than
          the column and then splits it across the gutter in spite of `break-inside: avoid`. */}
      <Box
        data-testid="bucket-columns"
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
          alignItems: "start",
          gap: 2,
          [PHONE]: { gap: 1.5 },
        }}
      >
        {columns.map((col, i) => (
          <Stack key={i} spacing={2} sx={{ minWidth: 0, [PHONE]: { gap: 1.5 } }}>
            {col.map((bucket) => (
              <BucketCard key={bucket.id} bucket={bucket} members={grouped.get(bucket.id) ?? []} />
            ))}
          </Stack>
        ))}
      </Box>

      <Box
        data-testid="topic-bonus"
        data-unlocked={bonusUnlocked ? "true" : "false"}
        sx={{
          mt: 2, px: { xs: 1.5, sm: 2 }, py: 1.5,
          borderRadius: `${RADIUS.card}px`,
          display: "flex", alignItems: "center", gap: 1.5,
          backgroundColor: bonusUnlocked ? "#ecfdf5" : "#f8fafc",
          boxShadow: bonusUnlocked ? "0 0 0 1px #a7f3d0" : hairline,
        }}
      >
        <Box sx={{
          width: 34, height: 34, flexShrink: 0, borderRadius: "50%",
          display: "grid", placeItems: "center",
          backgroundColor: bonusUnlocked ? "#d1fae5" : "#eef2f7",
          color: bonusUnlocked ? "#047857" : P.inkFaint,
        }}>
          <Icon icon={bonusUnlocked ? "mdi:trophy-outline" : "mdi:lock-outline"} width={18} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.92rem", fontWeight: 600, color: P.ink }}>
            Topic bonus
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: P.inkMuted }}>
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
