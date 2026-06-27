"use client";

import { Box } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardV2 } from "@/components/dashboard/v2/DashboardV2";
import { AdaptivePromo } from "@/components/courses/AdaptivePromo";

export default function DashboardPage() {
  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1600, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
        {/* New-adaptive-courses banner + first-time intro guide (legacy-only students). */}
        <AdaptivePromo />
        <DashboardV2 />
      </Box>
    </MainLayout>
  );
}

export const dynamic = "force-dynamic";
