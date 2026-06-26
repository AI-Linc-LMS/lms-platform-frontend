"use client";

import { Box, Skeleton, Stack } from "@mui/material";

export function DashboardSkeleton({ hideLeaderboard }: { hideLeaderboard: boolean }) {
  return (
    <Box>
      <Skeleton variant="rounded" height={260} sx={{ borderRadius: 5, mb: 2.5 }} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", lg: hideLeaderboard ? "repeat(4,1fr)" : "repeat(5,1fr)" }, gap: 1.5, mb: 2.5 }}>
        {Array.from({ length: hideLeaderboard ? 4 : 5 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={92} sx={{ borderRadius: 3 }} />
        ))}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 390px" }, gap: 2.5 }}>
        <Skeleton variant="rounded" height={420} sx={{ borderRadius: 4 }} />
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={300} sx={{ borderRadius: 4 }} />
          <Skeleton variant="rounded" height={180} sx={{ borderRadius: 4 }} />
        </Stack>
      </Box>
    </Box>
  );
}
