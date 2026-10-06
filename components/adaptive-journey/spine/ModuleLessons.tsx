"use client";

/**
 * A module's lessons, in the order the learner takes them, inside the module card.
 *
 * The board only knows how MANY items a module holds - `{articles: 5, quizzes: 2, coding: 2}` -
 * so the titles are fetched when the module is opened, not before. A course can run to 53
 * modules; sending every lesson of every one of them on the board request to show the two a
 * learner expands would be a large payload spent mostly on rows nobody looks at.
 *
 * `flowSteps` is the same helper the submodule page itself uses, so the list here is in the
 * same order and says the same things as the page it opens.
 */

import { useEffect, useState } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { adaptiveCourseService, type AdaptiveCourseSubModule } from "@/lib/services/adaptive-course.service";
import { flowSteps, type FlowStep } from "@/lib/adaptive/courseFlow";
import { PHONE } from "@/components/common/mobile/phone";

const KIND: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  video: { icon: "mdi:video-outline", label: "Video", color: "#db2777", bg: "#fdf2f8" },
  article: { icon: "mdi:book-open-page-variant-outline", label: "Article", color: "#6366f1", bg: "#eef2ff" },
  quiz: { icon: "mdi:help-circle-outline", label: "Quiz", color: "#a855f7", bg: "#f5f3ff" },
  coding: { icon: "mdi:lightning-bolt-outline", label: "Code", color: "#0ea5e9", bg: "#ecfeff" },
};

/**
 * What a row says about its own length: "Article · 14m", or just "Quiz" where there is no
 * figure to give.
 *
 * Narrowed on `kind` rather than read off a cast, because `FlowStep` is a discriminated union
 * and only two of its four arms carry a duration at all. A cast would have compiled and then
 * silently printed nothing for the other two.
 */
export function stepMeta(step: FlowStep): string {
  const kind = KIND[step.kind]?.label ?? "Step";
  let mins: number | null = null;
  if (step.kind === "article") {
    mins = step.source.reading_time_minutes || null;
  } else if (step.kind === "video") {
    const secs = step.source.duration_seconds;
    mins = secs ? Math.max(1, Math.round(secs / 60)) : null;
  }
  // Quizzes and coding problems carry no duration, so those rows do not claim one.
  return mins ? `${kind} · ${mins}m` : kind;
}

/** Articles come in reading tiers; nothing else does. */
export function stepTiers(step: FlowStep): number {
  return step.kind === "article" ? (step.source.available_tiers?.length ?? 0) : 0;
}

function LessonRow({ step, isNow }: { step: FlowStep; isNow: boolean }) {
  const { push, prefetch } = useInstantNavigation();
  const k = KIND[step.kind] ?? KIND.article;
  const tiers = stepTiers(step);
  return (
    <Box
      component="button"
      type="button"
      onClick={(e) => { e.stopPropagation(); push(step.href); }}
      onMouseEnter={() => prefetch(step.href)}
      sx={{
        display: "flex", alignItems: "center", gap: 1.25, width: "100%",
        px: 1.75, py: 1.25, border: "none", borderTop: "1px solid #f1f5f9",
        bgcolor: isNow ? "#f5f3ff" : "transparent",
        textAlign: "left", font: "inherit", cursor: "pointer",
        "&:hover": { bgcolor: isNow ? "#ede9fe" : "#f8fafc" },
        "&:focus-visible": { outline: "2px solid #6366f1", outlineOffset: -2 },
        [PHONE]: { minHeight: 56, px: 1.5 },
      }}
    >
      <Box sx={{ width: 30, height: 30, borderRadius: 2, flexShrink: 0, display: "grid", placeItems: "center", color: k.color, bgcolor: k.bg }}>
        <Icon icon={k.icon} width={16} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: isNow ? 800 : 600, fontSize: "0.88rem", color: "#0f172a", [PHONE]: { fontSize: "0.92rem" } }}>
          {step.title}
        </Typography>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Typography sx={{ fontSize: "0.74rem", color: "#94a3b8", [PHONE]: { fontSize: "0.78rem" } }}>
            {stepMeta(step)}
          </Typography>
          {tiers > 1 && (
            <Box
              sx={{
                px: 0.6, borderRadius: 1, border: "1px solid #ddd6fe",
                fontSize: "0.62rem", fontWeight: 800, letterSpacing: 0.4, color: "#6d28d9",
                '[dir="rtl"] &': { letterSpacing: "normal" },
              }}
            >
              {tiers} TIERS
            </Box>
          )}
        </Stack>
      </Box>
      {step.completed ? (
        <Icon icon="mdi:check" width={18} color="#22c55e" />
      ) : isNow ? (
        <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: 0.7, color: "#6d28d9", '[dir="rtl"] &': { letterSpacing: "normal" } }}>
          NOW
        </Typography>
      ) : (
        <Icon icon="mdi:play" width={16} color="#cbd5e1" />
      )}
    </Box>
  );
}

export function ModuleLessons({ courseId, submoduleId }: { courseId: number; submoduleId: number }) {
  const [sm, setSm] = useState<AdaptiveCourseSubModule | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await adaptiveCourseService.getSubmodule(courseId, submoduleId);
        if (!cancelled) setSm(data);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [courseId, submoduleId]);

  if (error) {
    return (
      <Typography sx={{ px: 1.75, py: 1.5, fontSize: "0.82rem", color: "#94a3b8", borderTop: "1px solid #f1f5f9" }}>
        Could not load this module&apos;s lessons. Open the module to see them.
      </Typography>
    );
  }
  if (!sm) {
    return (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1.75, py: 1.75, borderTop: "1px solid #f1f5f9" }}>
        <CircularProgress size={14} thickness={5} sx={{ color: "#a855f7" }} />
        <Typography sx={{ fontSize: "0.82rem", color: "#94a3b8" }}>Loading lessons…</Typography>
      </Stack>
    );
  }

  const steps = flowSteps(sm, courseId);
  if (steps.length === 0) {
    return (
      <Typography sx={{ px: 1.75, py: 1.5, fontSize: "0.82rem", color: "#94a3b8", borderTop: "1px solid #f1f5f9" }}>
        This module has no lessons yet.
      </Typography>
    );
  }
  // "NOW" marks the first thing they have not finished - one row, never several, and none at
  // all once the module is done.
  const nowKey = steps.find((s) => !s.completed)?.key ?? null;

  return (
    // Full-bleed horizontally so the rows read as a list inside the card rather than a nested
    // box. NOT pulled past the bottom: an action row can follow it, and a negative bottom
    // margin would slide the list underneath it. The phone value matches the card's own
    // smaller padding.
    <Box sx={{ mx: -1.75, mt: 1.5, overflow: "hidden", [PHONE]: { mx: -1.5 } }}>
      {steps.map((s) => (
        <LessonRow key={s.key} step={s} isNow={s.key === nowKey} />
      ))}
    </Box>
  );
}
