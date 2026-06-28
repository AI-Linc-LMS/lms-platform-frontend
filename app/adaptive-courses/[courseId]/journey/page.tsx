"use client";

import { useParams } from "next/navigation";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { Box, ButtonBase } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { JourneyBoard } from "@/components/adaptive-journey/JourneyBoard";

export default function AdaptiveJourneyPage() {
  const { push } = useInstantNavigation();
  const params = useParams();
  const courseId = Number(params.courseId);

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1500, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 5 } }}>
        <ButtonBase
          onClick={() => push(`/adaptive-courses/${courseId}`)}
          sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} />
          Back to course
        </ButtonBase>
        <JourneyBoard courseId={courseId} />
      </Box>
    </MainLayout>
  );
}
