"use client";

import { Box } from "@mui/material";
import { MyCoursesSection } from "./MyCoursesSection";
import { DashboardSidebar } from "./DashboardSidebar";
import { WelcomeMessage } from "./WelcomeMessage";
import { Course as CourseCardCourse } from "@/components/course/interfaces";

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
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          lg: "2fr 1fr",
        },
        gap: 3,
        mb: 4,
        alignItems: "start",
      }}
    >
      <Box>
        <WelcomeMessage />
        <Box sx={{ mt: 3 }}>
          <MyCoursesSection courses={courses} loading={loading} />
        </Box>
      </Box>
      <DashboardSidebar streakDays={streakDays} currentStreak={currentStreak} />
    </Box>
  );
};
