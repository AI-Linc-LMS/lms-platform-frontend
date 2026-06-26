"use client";

import { Box, Stack } from "@mui/material";
import { keyframes } from "@mui/system";

// Modern gradient-sweep shimmer (replaces the dated MUI pulse skeleton).
const sweep = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

function Shimmer({ h, sx }: { h: number | string; sx?: object }) {
  return (
    <Box
      sx={{
        height: h,
        borderRadius: 3,
        background: "linear-gradient(90deg, #eef2f7 25%, #f8fafc 50%, #eef2f7 75%)",
        backgroundSize: "200% 100%",
        animation: `${sweep} 1.5s ease-in-out infinite`,
        ...sx,
      }}
    />
  );
}

export function DashboardSkeleton({ hideLeaderboard }: { hideLeaderboard: boolean }) {
  const stat = hideLeaderboard ? 4 : 5;
  return (
    <Box
      role="status"
      aria-busy="true"
      sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 390px" }, gap: 2.5, alignItems: "start" }}
    >
      {/* Left column: hero → stat cards → readiness → continue */}
      <Box sx={{ minWidth: 0 }}>
        <Shimmer h={262} sx={{ borderRadius: 5, mb: 2.5 }} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(3,1fr)", lg: `repeat(${stat},1fr)` }, gap: 1.5, mb: 2.5 }}>
          {Array.from({ length: stat }).map((_, i) => <Shimmer key={i} h={92} />)}
        </Box>
        <Shimmer h={430} sx={{ borderRadius: 4, mb: 2.5 }} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", lg: "repeat(3,1fr)" }, gap: 2 }}>
          {Array.from({ length: 3 }).map((_, i) => <Shimmer key={i} h={240} sx={{ borderRadius: 4 }} />)}
        </Box>
      </Box>

      {/* Sidebar: skill profile → certificate → up next → leaderboard */}
      <Stack spacing={2}>
        <Shimmer h={320} sx={{ borderRadius: 4 }} />
        <Shimmer h={200} sx={{ borderRadius: 4 }} />
        <Shimmer h={180} sx={{ borderRadius: 4 }} />
        {!hideLeaderboard && <Shimmer h={220} sx={{ borderRadius: 4 }} />}
      </Stack>
    </Box>
  );
}
