"use client";

import { useEffect, useState } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { nextStep, type FlowKind, type NextStep } from "@/lib/adaptive/courseFlow";
import { adaptiveCourseService } from "@/lib/services/adaptive-course.service";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { PHONE } from "@/components/common/mobile/phone";

const KIND_LABEL: Record<FlowKind, string> = {
  video: "Video", article: "Article", quiz: "Quiz", coding: "Coding problem",
};

interface NextStepState {
  next: NextStep | null;
  /** The server's word on whether the step the learner is on was already finished before today. */
  alreadyCompleted: boolean;
}

/**
 * Where Next goes from step `currentKey` of topic `submoduleId`, plus whether that step was
 * already complete.
 *
 * Reads the course outline for the order and the topic for completion: the outline does not carry
 * per-learner completion, and a learner reopening a video they finished last week should see Next
 * straight away rather than having to watch it to the end again.
 *
 * Any failure yields `next: null` and the card simply does not render. A missing Next button is an
 * inconvenience; a Next button pointing at the wrong place is a bug.
 */
export function useNextStep(courseId: number, submoduleId: number, currentKey: string | null): NextStepState {
  const [state, setState] = useState<NextStepState>({ next: null, alreadyCompleted: false });

  useEffect(() => {
    if (!currentKey || !Number.isFinite(courseId) || !Number.isFinite(submoduleId)) return;
    let cancelled = false;
    Promise.all([
      adaptiveCourseService.getCourse(courseId),
      adaptiveCourseService.getSubmodule(courseId, submoduleId).catch(() => null),
    ])
      .then(([course, topic]) => {
        if (cancelled) return;
        const [kind, rawId] = currentKey.split(":");
        const id = Number(rawId);
        const done = !!topic && (
          (kind === "video" && topic.video_companions?.some((v) => v.id === id && v.completed)) ||
          (kind === "article" && topic.articles?.some((a) => a.article_id === id && a.completed)) ||
          (kind === "quiz" && topic.quizzes?.some((q) => q.config_id === id && q.completed)) ||
          (kind === "coding" && topic.coding_sets?.some((s) => s.problems.some((p) => p.problem_id === id && p.completed)))
        );
        setState({ next: nextStep(course, submoduleId, currentKey), alreadyCompleted: !!done });
      })
      .catch(() => {
        if (!cancelled) setState({ next: null, alreadyCompleted: false });
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, submoduleId, currentKey]);

  return state;
}

/**
 * The card at the end of a step that takes the learner on to what comes next.
 *
 * It names the destination instead of just saying "Next", because a learner who finishes a topic
 * is about to leave it. "Next module · Week 3" warns them before they click; a bare Next that
 * dropped them into a new week would be a surprise.
 */
export function NextStepCard({ next, courseTitle }: { next: NextStep | null; courseTitle?: string }) {
  const { push, prefetch } = useInstantNavigation();
  if (!next) return null;

  const { eyebrow, title, action, icon } =
    next.kind === "step"
      ? { eyebrow: `Up next · ${KIND_LABEL[next.step]}`, title: next.title, action: "Next", icon: "mdi:arrow-right" }
      : next.kind === "topic"
        ? {
            eyebrow: next.newModule ? `Next module · ${next.moduleTitle}` : "Next topic",
            title: next.title,
            action: next.newModule ? "Start next module" : "Next topic",
            icon: "mdi:arrow-right",
          }
        : {
            eyebrow: "Course complete",
            title: courseTitle ? `You have reached the end of ${courseTitle}.` : "You have reached the end of this course.",
            action: "Back to course",
            icon: "mdi:flag-checkered",
          };

  return (
    <Box
      data-testid="next-step-card"
      sx={{
        mt: 3, p: { xs: 2, md: 2.5 }, borderRadius: 4, display: "flex", alignItems: "center", gap: 2,
        flexWrap: { xs: "wrap", sm: "nowrap" },
        border: "1px solid var(--border-default, #ececf1)", bgcolor: "var(--card-bg, #fff)",
        boxShadow: "0 16px 40px -28px rgba(99,102,241,0.55)",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "#7c3aed", [PHONE]: { fontSize: "0.75rem" } }}>
          {eyebrow}
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: "1rem", mt: 0.25, overflowWrap: "anywhere" }}>{title}</Typography>
      </Box>
      <ButtonBase
        onMouseEnter={() => prefetch(next.href)}
        onClick={() => push(next.href)}
        sx={{
          px: 2.5, py: 1.1, borderRadius: 999, fontWeight: 800, fontSize: "0.9rem", gap: 0.75, color: "white",
          flexShrink: 0, width: { xs: "100%", sm: "auto" },
          // Full width on a phone already; 48px tall so it is the obvious thumb target.
          [PHONE]: { minHeight: 48, fontSize: "0.95rem" },
          background: "linear-gradient(135deg, var(--module-tile-from, #6366f1) 0%, var(--module-tile-to, #a855f7) 100%)",
        }}
      >
        {action}
        <Icon icon={icon} width={18} />
      </ButtonBase>
    </Box>
  );
}
