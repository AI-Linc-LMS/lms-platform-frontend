"use client";

import { Box, Skeleton } from "@mui/material";
import {
  HeroSkeleton,
  JobListSkeleton,
  J,
  R,
  SkeletonShell,
} from "@/components/jobs-v2/ui";

/**
 * The board's own loading shape: hero, tab track, search rail, results.
 *
 * The route's `loading.tsx` and the client's Suspense fallback both render THIS component, and
 * the first-load list skeleton inside `JobBoard` is the same `JobListSkeleton`, so the sequence
 * is one design crossfading into content rather than `PageShimmerLayout`'s six generic avatar
 * rows reflowing into a two-column job grid.
 */
export function BoardShellSkeleton({ view = "card" }: { view?: "card" | "list" }) {
  return (
    <Box>
      <HeroSkeleton />
      <SkeletonShell>
        <Skeleton
          variant="rounded"
          animation="wave"
          width={280}
          height={40}
          sx={{ bgcolor: J.surface2, borderRadius: R.pill, mb: 2 }}
        />
        <Box
          sx={{
            p: 2,
            mb: 2,
            borderRadius: R.card,
            border: `1px solid ${J.hairline}`,
            bgcolor: J.surface,
          }}
        >
          <Skeleton
            variant="rounded"
            animation="wave"
            height={44}
            sx={{ bgcolor: J.surface2, borderRadius: R.pill, maxWidth: 720, mb: 1.5 }}
          />
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {[92, 84, 128, 104, 76, 86, 80].map((width, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                animation="wave"
                width={width}
                height={40}
                sx={{ bgcolor: J.surface2, borderRadius: R.pill }}
              />
            ))}
          </Box>
        </Box>
      </SkeletonShell>
      <JobListSkeleton count={6} view={view} />
    </Box>
  );
}
