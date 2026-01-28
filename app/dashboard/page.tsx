"use client";

import { Box } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { Loading } from "@/components/common/Loading";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function DashboardPage() {
  const { loading, courses, selectedCourseId } = useDashboardData();

  if (loading) {
    return (
      <MainLayout>
        <Loading fullScreen />
      </MainLayout>
    );
  }

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