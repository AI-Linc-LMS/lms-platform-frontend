"use client";

import { Box } from "@mui/material";
import { MyCoursesSection } from "./MyCoursesSection";
import { DashboardSidebar } from "./DashboardSidebar";
import { WelcomeMessage } from "./WelcomeMessage";
import { ScorecardWidget } from "@/components/scorecard/dashboard/ScorecardWidget";
import { Course as CourseCardCourse } from "@/components/course/interfaces";
import { useHideLeaderboardView } from "@/lib/contexts/ClientInfoContext";

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
