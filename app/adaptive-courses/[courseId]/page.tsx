"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { Box, ButtonBase, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  adaptiveCourseService,
  type AdaptiveCourseDetail,
} from "@/lib/services/adaptive-course.service";
import { MainLayout } from "@/components/layout/MainLayout";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { JourneyBoard } from "@/components/adaptive-journey/JourneyBoard";
import { JourneyBoardSkeleton } from "@/components/courses/CourseSkeletons";

export default function AdaptiveCourseDetailPage() {
  const { push } = useInstantNavigation();
  const params = useParams();
  const courseId = Number(params.courseId);
  const [course, setCourse] = useState<AdaptiveCourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notEnrolled, setNotEnrolled] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(courseId)) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await adaptiveCourseService.getCourse(courseId);
        if (!cancelled) setCourse(data);
      } catch (e) {
        if (cancelled) return;
        const httpStatus = (e as { response?: { status?: number } })?.response?.status;
        if (httpStatus === 403) {
          setNotEnrolled(true);
        } else {
          setError(e instanceof Error ? e.message : "Failed to load course.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

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
          {loading && <JourneyBoardSkeleton />}
          {error && (
            <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>
              {error}
            </Typography>
          )}

          {notEnrolled && (
            <Box sx={{ textAlign: "center", py: 6, px: 2 }}>
              <Icon icon="mdi:lock-outline" width={48} style={{ color: "#a855f7" }} />
              <Typography sx={{ fontWeight: 800, mt: 1.5, fontSize: "1.1rem" }}>
                {"You're not enrolled in this course."}
              </Typography>
              <Typography sx={{ color: "text.secondary", mt: 0.75, maxWidth: 520, mx: "auto", lineHeight: 1.5 }}>
                {"Ask your instructor to enroll you, then it'll appear in your Adaptive Courses."}
              </Typography>
              <ButtonBase
                onClick={() => push("/adaptive-courses")}
                sx={{ mt: 2.5, px: 2.5, py: 1, borderRadius: 999, fontWeight: 800, color: "white", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}
              >
                Back to Adaptive Courses
              </ButtonBase>
            </Box>
          )}

          {/* New adaptive journey UI only — the legacy week/submodule fallback has been removed; the
              BE guarantees a topic node per submodule, and JourneyBoard renders a new-UI empty state
              for any transient 0-node board. */}
          {course && <JourneyBoard courseId={courseId} />}
        </AdaptiveSectionShell>
      </Box>
    </MainLayout>
  );
}
