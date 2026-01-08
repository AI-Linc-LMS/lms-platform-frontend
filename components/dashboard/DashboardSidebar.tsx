"use client";

import { Box } from "@mui/material";
import { StreakTable } from "./StreakTable";

interface DashboardSidebarProps {
  streakDays?: number[];
  currentStreak?: number;
}

export const DashboardSidebar = ({
  streakDays,
  currentStreak,
}: DashboardSidebarProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <StreakTable streakDays={streakDays} currentStreak={currentStreak} />
    </Box>
  );
};
