"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { Box, ButtonBase, Chip, Stack } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { JourneyBoard } from "@/components/adaptive-journey/JourneyBoard";
import { adaptiveCourseService } from "@/lib/services/adaptive-course.service";

export default function AdaptiveCourseDetailPage() {
  const { push } = useInstantNavigation();
  const params = useParams();
  const courseId = Number(params.courseId);
  // Assigned instructor(s), shown as the public code (or real name). Fetched with a small course-only
  // call because JourneyBoard drives the main render off the journey payload, not getCourse.
  const [instructors, setInstructors] = useState<{ name: string }[]>([]);

  useEffect(() => {
    if (!Number.isFinite(courseId)) return;
    let cancelled = false;
    (async () => {
      try {
        const course = await adaptiveCourseService.getCourse(courseId);
        if (!cancelled) setInstructors(course.instructors ?? []);
      } catch {
        /* non-fatal — the instructor line is optional decoration */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

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

        {instructors.length > 0 && (
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "text.secondary", fontSize: "0.85rem", fontWeight: 600 }}>
              <Icon icon="mdi:account-tie-outline" width={16} />
              Instructor{instructors.length > 1 ? "s" : ""}:
            </Box>
            {instructors.map((i, idx) => (
              <Chip
                key={idx}
                size="small"
                label={i.name}
                sx={{ fontWeight: 700, bgcolor: "color-mix(in srgb, #6366f1 12%, transparent)", color: "#4f46e5" }}
              />
            ))}
          </Stack>
        )}

        <AdaptiveSectionShell meshOpacity={0.18}>
          {Number.isFinite(courseId) && <JourneyBoard courseId={courseId} />}
        </AdaptiveSectionShell>
      </Box>
    </MainLayout>
  );
}
