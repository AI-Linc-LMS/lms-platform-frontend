"use client";

import { Box, Skeleton } from "@mui/material";
import {
  HeroSkeleton,
  JobListSkeleton,
  SplitSkeleton,
  J,
  R,
  SkeletonShell,
} from "@/components/jobs-v2/ui";

/**
 * The board's own loading shape: hero, tab track, search + pill rail, results.
 *
 * The route's `loading.tsx` and the client's Suspense fallback both render THIS component, and
 * the first-load skeletons inside `JobBoard` are the same ones, so the sequence is one design
 * crossfading into content rather than `PageShimmerLayout`'s six generic avatar rows reflowing
 * into a job board.
 *
 * At `lg+` the results shape is the split — rail beside pane, one hairline between them — so the
 * hairline does not move when the shimmer is replaced. Below `lg` it is the list, at whichever
 * density the URL asked for. Both are in the DOM and one is hidden with `display`, for the same
 * reason the board itself does it: `useMediaQuery` is `false` on the server and would flash the
 * desktop shape on a phone.
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
            {[168, 92, 104, 84, 112, 128, 96, 132, 88, 104, 80].map((width, i) => (
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

      <Box sx={{ display: { xs: "none", lg: "block" } }}>
        <SplitSkeleton railCount={6} />
      </Box>
      <Box sx={{ display: { xs: "block", lg: "none" } }}>
        <JobListSkeleton count={6} view={view} />
      </Box>
    </Box>
  );
}
