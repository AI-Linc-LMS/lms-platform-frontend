"use client";

import { useParams } from "next/navigation";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { Box, ButtonBase } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { JourneyBoard } from "@/components/adaptive-journey/JourneyBoard";

export default function AdaptiveCourseDetailPage() {
  const { push } = useInstantNavigation();
  const params = useParams();
  const courseId = Number(params.courseId);

  // JourneyBoard fetches the journey (which already returns the course) and renders
  // its own loading skeleton, 403 "not enrolled" state, and errors — so there is no
  // page-level getCourse pre-fetch (that was a redundant round-trip + an extra
  // skeleton phase on top of the route shimmer and JourneyBoard's own skeleton).
  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1760, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 5 } }}>
        <ButtonBase
          onClick={() => push("/adaptive-courses")}
          sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} />
          Back to Adaptive Courses
        </ButtonBase>

        <AdaptiveSectionShell meshOpacity={0.18}>
          {Number.isFinite(courseId) && <JourneyBoard courseId={courseId} />}
        </AdaptiveSectionShell>
      </Box>
    </MainLayout>
  );
}
