"use client";

import { Box } from "@mui/material";

import { Course as CourseCardCourse } from "@/components/course/interfaces";
import { ScorecardWidget } from "@/components/scorecard/dashboard/ScorecardWidget";
import { useHideLeaderboardView } from "@/lib/contexts/ClientInfoContext";

import { DashboardSidebar } from "./DashboardSidebar";
import { MyCoursesSection } from "./MyCoursesSection";
import { WelcomeMessage } from "./WelcomeMessage";

interface DashboardContentProps {
  courses: CourseCardCourse[];
  loading?: boolean;
  streakDays?: number[];
  currentStreak?: number;
}

export const DashboardContent = ({
  courses,
  loading,
  streakDays,
  currentStreak,
}: DashboardContentProps) => {
  const hideLeaderboardView = useHideLeaderboardView();
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
          <ScorecardWidget />
          <MyCoursesSection courses={courses} loading={loading} />
        </Box>
      </Box>
      {!hideLeaderboardView && (
        <DashboardSidebar streakDays={streakDays} currentStreak={currentStreak} />
      )}
    </Box>
  );
};
