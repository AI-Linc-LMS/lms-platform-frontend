"use client";

import { lazy, Suspense } from "react";
import { Box, LinearProgress } from "@mui/material";
import { StreakHolders } from "./StreakHolders";
import { StreakTable } from "./StreakTable";
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
                  backgroundColor: "#F3F4F6",
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
                border: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
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
