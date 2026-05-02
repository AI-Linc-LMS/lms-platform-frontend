"use client";

import { lazy, Suspense } from "react";
import { Box, LinearProgress } from "@mui/material";
import { StreakHolders } from "./StreakHolders";
import { StreakTable } from "./StreakTable";
import { ProfileCompletionReminder } from "./ProfileCompletionReminder";
const Leaderboard = lazy(() => import("./Leaderboard").then((module) => ({ default: module.Leaderboard })));

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
      <ProfileCompletionReminder />
      <Suspense
        fallback={
          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: 24,
                  borderRadius: 1,
                backgroundColor: "var(--surface)",
                }}
              />
            </Box>
            <LinearProgress
              sx={{
                height: 2,
                borderRadius: 1,
                mb: 2,
              }}
            />
            <Box
              sx={{
                borderRadius: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--card-bg)",
                minHeight: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LinearProgress sx={{ width: "80%", height: 2 }} />
            </Box>
          </Box>
        }
      >
        <Leaderboard />
      </Suspense>
      <StreakHolders />
      <StreakTable streakDays={streakDays} currentStreak={currentStreak} />
    </Box>
  );
};
