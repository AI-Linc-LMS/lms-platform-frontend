"use client";

/**
 * The course as a ladder of levels, inside the course page.
 *
 * It was a separate route first (`/adaptive-courses/{id}/track`), reached by a button. That is
 * the wrong shape: the ladder is a VIEW of this course, not a different place, and a learner
 * who followed it lost the tab bar and had to navigate back to reach the tutor or the papers.
 * The route stays - it is linkable and already shared - and renders the same component.
 *
 * Fetches nothing until the tab is opened, like `ModuleLessons`: the course detail is a large
 * payload and most visits never leave the journey tab.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Skeleton, Typography } from "@mui/material";

import { adaptiveCourseService } from "@/lib/services/adaptive-course.service";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { LevelTrack } from "@/components/adaptive-course/track/LevelTrack";
import { buildLevels } from "@/components/adaptive-course/track/levels";
import { P } from "@/components/adaptive-journey/practice/practiceTokens";

export function LevelsPanel({ courseId }: { courseId: number }) {
  const { push, prefetch } = useInstantNavigation();
  const { data: course, isLoading, isError } = useQuery({
    queryKey: ["adaptive-course", courseId],
    queryFn: () => adaptiveCourseService.getCourse(courseId),
    enabled: Number.isFinite(courseId),
  });

  const levels = useMemo(() => buildLevels(course), [course]);
  const href = (submoduleId: number) =>
    `/adaptive-courses/${courseId}/submodule/${submoduleId}`;

  if (isError) {
    return (
      <Typography sx={{ color: "#b91c1c", fontSize: "0.9rem", py: 4, textAlign: "center" }}>
        The practice track could not be loaded.
      </Typography>
    );
  }

  return (
    <Box data-testid="levels-panel" sx={{ maxWidth: 900, mx: "auto" }}>
      <Typography sx={{ color: P.inkFaint, fontSize: "0.9rem", mb: 3, textAlign: "center" }}>
        Every topic in this course, level by level. Each one groups its problems by the technique
        they drill, so you can see what a topic teaches before you open it.
      </Typography>

      {isLoading ? (
        <Box sx={{ display: "grid", gap: 2, maxWidth: 820, mx: "auto" }}>
          {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={170} />)}
        </Box>
      ) : (
        <LevelTrack
          levels={levels}
          onOpenTopic={(id) => push(href(id))}
          onPrefetchTopic={(id) => prefetch(href(id))}
        />
      )}
    </Box>
  );
}

export default LevelsPanel;
