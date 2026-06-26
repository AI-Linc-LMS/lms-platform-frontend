"use client";

import { Box } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardV2 } from "@/components/dashboard/v2/DashboardV2";

export default function DashboardPage() {
  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <DashboardV2 />
      </Box>
    </MainLayout>
  );
}

export const dynamic = "force-dynamic";
