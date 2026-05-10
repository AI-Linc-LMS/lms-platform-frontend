"use client";

import { Box, Paper } from "@mui/material";

/** Loading placeholder shaped like a ThreadCard, using the global shimmer. */
export function ThreadCardSkeleton() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: "1px solid var(--border-default)",
        borderRadius: 2,
        background: "var(--card-bg)",
      }}
    >
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 2 }}>
        <Box className="community-skeleton" sx={{ width: 44, height: 44, borderRadius: "50%" }} />
        <Box sx={{ flex: 1 }}>
          <Box className="community-skeleton" sx={{ width: 140, height: 14, mb: 0.75 }} />
          <Box className="community-skeleton" sx={{ width: 80, height: 11 }} />
        </Box>
      </Box>
      <Box className="community-skeleton" sx={{ width: "82%", height: 18, mb: 1.5 }} />
      <Box className="community-skeleton" sx={{ width: "100%", height: 12, mb: 0.75 }} />
      <Box className="community-skeleton" sx={{ width: "92%", height: 12, mb: 0.75 }} />
      <Box className="community-skeleton" sx={{ width: "60%", height: 12, mb: 2 }} />
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", borderTop: "1px solid var(--border-default)", pt: 2 }}>
        <Box className="community-skeleton" sx={{ width: 60, height: 24, borderRadius: 12 }} />
        <Box className="community-skeleton" sx={{ width: 60, height: 24, borderRadius: 12 }} />
        <Box sx={{ flex: 1 }} />
        <Box className="community-skeleton" sx={{ width: 70, height: 24, borderRadius: 12 }} />
      </Box>
    </Paper>
  );
}

export function ThreadFeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {Array.from({ length: count }).map((_, i) => (
        <ThreadCardSkeleton key={i} />
      ))}
    </Box>
  );
}
