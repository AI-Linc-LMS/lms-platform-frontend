"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Box, ButtonBase, Skeleton, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { MainLayout } from "@/components/layout/MainLayout";
import { PHONE } from "@/components/common/mobile/phone";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { adaptiveCourseService } from "@/lib/services/adaptive-course.service";
import { LevelTrack } from "@/components/adaptive-course/track/LevelTrack";
import { buildLevels } from "@/components/adaptive-course/track/levels";
import { P } from "@/components/adaptive-journey/practice/practiceTokens";

export default function AdaptiveCourseTrackPage() {
  const { push, prefetch } = useInstantNavigation();
  const params = useParams();
  const courseId = Number(params.courseId);

  const { data: course, isLoading } = useQuery({
    queryKey: ["adaptive-course", courseId],
    queryFn: () => adaptiveCourseService.getCourse(courseId),
    enabled: Number.isFinite(courseId),
  });

  const levels = useMemo(() => buildLevels(course), [course]);
  const href = (submoduleId: number) =>
    `/adaptive-courses/${courseId}/submodule/${submoduleId}`;

  return (
    <MainLayout fullWidthContent>
      <Box sx={{
        maxWidth: 1100, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 5 },
        [PHONE]: { px: 2, pt: 2, pb: 1 },
      }}>
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

        <Typography component="h1" sx={{
          fontSize: "1.6rem", fontWeight: 700, color: P.ink, letterSpacing: "-0.4px",
        }}>
          Practice track
        </Typography>
        <Typography sx={{ color: P.inkFaint, fontSize: "0.92rem", mb: 3 }}>
          Every topic in this course, level by level. Each one groups its problems by the technique
          they drill, so you can see what a topic teaches before you open it.
        </Typography>

        {isLoading ? (
          <Box sx={{ display: "grid", gap: 2, maxWidth: 820, mx: "auto" }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} variant="rounded" height={150} />
            ))}
          </Box>
        ) : (
          <LevelTrack
            levels={levels}
            onOpenTopic={(id) => push(href(id))}
            onPrefetchTopic={(id) => prefetch(href(id))}
          />
        )}
      </Box>
    </MainLayout>
  );
}
