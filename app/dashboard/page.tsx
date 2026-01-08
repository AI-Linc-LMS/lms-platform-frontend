"use client";

import { Box } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { Loading } from "@/components/common/Loading";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
// import { StatusCards } from "@/components/dashboard/StatusCards";
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
        <WelcomeHeader courseId={selectedCourseId} />
        {/* 
        <Box sx={{ mb: 4 }}>
          <StatusCards
            lessons={{ completed: 42, total: 73 }}
            assignments={{ completed: 8, total: 24 }}
            tests={{ completed: 3, total: 15 }}
          />
        </Box> */}

        <DashboardContent
          courses={courses}
          streakDays={[23, 25, 27]}
          currentStreak={3}
        />
      </Box>
    </MainLayout>
  );
}
