"use client";

import { Box } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function DashboardPage() {
  const { loading, courses, selectedCourseId } = useDashboardData();

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <DashboardContent
          courses={courses}
          streakDays={[23, 25, 27]}
          currentStreak={3}
        />
      </Box>
    </MainLayout>
  );
}

export const dynamic = "force-dynamic";