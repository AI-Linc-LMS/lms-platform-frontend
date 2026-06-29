"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, ButtonBase, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import {
  adaptiveCourseService,
  type AdaptiveCourseVideoLessonSummary,
} from "@/lib/services/adaptive-course.service";
import { VideoLessonPlayer } from "@/components/adaptive-quiz/presentation/VideoLessonPlayer";

export default function AdaptiveVideoLessonPage() {
  const { push, prefetch } = useInstantNavigation();
  const params = useParams();
  const courseId = Number(params.courseId);
  const submoduleId = Number(params.submoduleId);
  const videoLessonId = Number(params.videoLessonId);

  const [lesson, setLesson] = useState<AdaptiveCourseVideoLessonSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(courseId) || !Number.isFinite(submoduleId)) return;
    let cancelled = false;
    (async () => {
      try {
        // The learner submodule payload carries ready video lessons (with resolved
        // URLs) — find ours there rather than adding a separate detail endpoint.
        const sm = await adaptiveCourseService.getSubmodule(courseId, submoduleId);
        const found = (sm.video_lessons ?? []).find((v) => v.video_lesson_id === videoLessonId) ?? null;
        if (!cancelled) {
          setLesson(found);
          if (!found) setError("This video isn't available yet — it may still be rendering.");
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load this video.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, submoduleId, videoLessonId]);

  const backHref = `/adaptive-courses/${courseId}/submodule/${submoduleId}`;

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
        <ButtonBase
          onMouseEnter={() => prefetch(backHref)}
          onClick={() => push(backHref)}
          sx={{ mb: 2, color: "#0891b2", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} />
          Back to topic
        </ButtonBase>

        {loading && (
          <Box sx={{ aspectRatio: "16 / 9", borderRadius: 4, bgcolor: "#0b1220", display: "grid", placeItems: "center" }}>
            <Icon icon="mdi:loading" width={32} className="spin" style={{ color: "#64748b" }} />
          </Box>
        )}
        {!loading && error && (
          <Typography sx={{ color: "text.secondary", textAlign: "center", py: 6 }}>{error}</Typography>
        )}
        {lesson && (
          <>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.3rem", md: "1.6rem" }, mb: 1.5, color: "#0f172a" }}>
              {lesson.title}
            </Typography>
            <VideoLessonPlayer lesson={lesson} />
          </>
        )}
      </Box>
    </MainLayout>
  );
}
