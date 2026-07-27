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
  // NOTE: there used to be a getCourse() fetch here to populate an instructor chip. It was dead:
  // this endpoint is served by LearnerCourseDetailSerializer, whose field list does NOT include
  // `instructors`, so the value was always undefined and the chip never rendered — while the request
  // itself dragged the entire course tree (modules -> submodules -> per-item counts, an N+1 on the
  // backend) on every visit to this page. Removed; JourneyBoard already drives the whole render off
  // the journey payload.

  // JourneyBoard fetches the journey (which already returns the course) and renders
  // its own loading skeleton, 403 "not enrolled" state, and errors - so there is no
  // page-level getCourse pre-fetch for the main content (that was a redundant round-trip).
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
