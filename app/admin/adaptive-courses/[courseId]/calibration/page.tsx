"use client";

import { useParams, useRouter } from "next/navigation";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { CalibrationAdminSection } from "@/components/admin/adaptive-course/CalibrationAdminSection";
import { CalibrationResultsSection } from "@/components/admin/adaptive-course/CalibrationResultsSection";

export default function AdminCalibrationPage() {
  const router = useRouter();
  const courseId = Number(useParams().courseId);

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
        <ButtonBase
          onClick={() => router.push(`/admin/adaptive-courses/${courseId}`)}
          sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} /> Back to course
        </ButtonBase>

        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
          <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}>
            <Icon icon="mdi:shield-half-full" width={22} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: "1.3rem" }}>Calibration</Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
              Generate &amp; edit the test, then review submissions and each student&apos;s AI profile.
            </Typography>
          </Box>
        </Stack>

        <CalibrationAdminSection courseId={courseId} />
        <CalibrationResultsSection courseId={courseId} />
      </Box>
    </MainLayout>
  );
}
