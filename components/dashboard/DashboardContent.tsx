"use client";

import { Box } from "@mui/material";

import { ScorecardWidget } from "@/components/scorecard/dashboard/ScorecardWidget";
import {
  useHideLeaderboardView,
  useIsScorecardEnabled,
} from "@/lib/contexts/ClientInfoContext";

import { DashboardSidebar } from "./DashboardSidebar";
import { WelcomeMessage } from "./WelcomeMessage";

interface DashboardContentProps {
  /**
   * Kept so the dashboard's callers need no change, and ignored: the classic "My courses" row
   * this fed was the last classic-course surface on the dashboard and has gone with the module.
   * The adaptive courses have their own panels in DashboardV2.
   */
  courses?: unknown;
  loading?: boolean;
  streakDays?: number[];
  currentStreak?: number;
}

export const DashboardContent = ({
  streakDays,
  currentStreak,
}: DashboardContentProps) => {
  const hideLeaderboardView = useHideLeaderboardView();
  const scorecardEnabled = useIsScorecardEnabled();
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          lg: hideLeaderboardView ? "1fr" : "2fr 1fr",
        },
        gap: 3,
        mb: 4,
        alignItems: "start",
      }}
    >
      <Box>
        <WelcomeMessage />
        <Box sx={{ mt: 3, width: hideLeaderboardView ? "70%" : "auto" }}>
          {scorecardEnabled && <ScorecardWidget />}
        </Box>
      </Box>
      {!hideLeaderboardView && (
        <DashboardSidebar streakDays={streakDays} currentStreak={currentStreak} />
      )}
    </Box>
  );
};
