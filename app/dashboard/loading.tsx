"use client";

import { Box } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardSkeleton } from "@/components/dashboard/v2/DashboardSkeleton";
import { useHideLeaderboardView } from "@/lib/contexts/ClientInfoContext";

/**
 * Route-level loading UI for /dashboard.
 *
 * Renders the page's REAL shell (MainLayout fullWidthContent + the same max-width Box) and the REAL
 * skeleton DashboardV2 shows while it fetches (DashboardSkeleton). This previously rendered a generic
 * `PageShimmerLayout variant="grid"`, so signing in showed a grid shimmer and then a completely
 * different dashboard skeleton — two visibly different loading states back to back. Matching them
 * makes the whole load read as ONE continuous state.
 */
export default function DashboardLoading() {
  const hideLeaderboard = useHideLeaderboardView();
  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1600, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
        <DashboardSkeleton hideLeaderboard={hideLeaderboard} />
      </Box>
    </MainLayout>
  );
}
