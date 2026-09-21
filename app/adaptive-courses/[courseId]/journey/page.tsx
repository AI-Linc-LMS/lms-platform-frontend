"use client";

import { useParams } from "next/navigation";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { Box, ButtonBase } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { JourneyBoard } from "@/components/adaptive-journey/JourneyBoard";
import { PHONE } from "@/components/common/mobile/phone";

export default function AdaptiveJourneyPage() {
  const { push } = useInstantNavigation();
  const params = useParams();
  const courseId = Number(params.courseId);

  return (
    <MainLayout fullWidthContent>
      {/* On a phone MainLayout's 16px is the gutter; a second 16px here left the board 326px wide. */}
      <Box sx={{ maxWidth: 1500, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 5 }, [PHONE]: { px: 0, pt: 0, pb: 1 } }}>
        <ButtonBase
          onClick={() => push(`/adaptive-courses/${courseId}`)}
          sx={{
            mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem",
            [PHONE]: { minHeight: 44, mb: 1, pr: 1.5, borderRadius: 2 },
          }}
        >
          <Icon icon="mdi:arrow-left" width={18} />
          Back to course
        </ButtonBase>
        <JourneyBoard courseId={courseId} />
      </Box>
    </MainLayout>
  );
}
