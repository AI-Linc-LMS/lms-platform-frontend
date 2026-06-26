"use client";

import { Box, ButtonBase } from "@mui/material";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { PointsSystemContent } from "@/components/points-system/PointsSystemContent";

export default function PointsSystemPage() {
  const router = useRouter();
  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
        <ButtonBase onClick={() => router.back()} sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.85rem" }}>
          <Icon icon="mdi:arrow-left" width={18} /> Back
        </ButtonBase>
        <PointsSystemContent />
      </Box>
    </MainLayout>
  );
}

export const dynamic = "force-dynamic";
