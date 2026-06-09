"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, ButtonBase, Container, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  adaptiveCourseService,
  type AdaptiveCourseSubModule,
} from "@/lib/services/adaptive-course.service";
import { MainLayout } from "@/components/layout/MainLayout";
import { Reveal } from "@/components/scorecard/shared";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";

export default function AdaptiveCourseSubmodulePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Number(params.courseId);
  const submoduleId = Number(params.submoduleId);
  const [submodule, setSubmodule] = useState<AdaptiveCourseSubModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(courseId) || !Number.isFinite(submoduleId)) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await adaptiveCourseService.getSubmodule(courseId, submoduleId);
        if (!cancelled) setSubmodule(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load submodule.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, submoduleId]);

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <ButtonBase
          onClick={() => router.push(`/adaptive-courses/${courseId}`)}
          sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} />
          Back to course
        </ButtonBase>

        <AdaptiveSectionShell meshOpacity={0.18}>
          {loading && (
            <Typography sx={{ color: "text.secondary", textAlign: "center", py: 6 }}>
              Loading…
            </Typography>
          )}
          {error && (
            <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>
              {error}
            </Typography>
          )}

          {submodule && (
            <>
              <AdaptiveSectionHero
                chapter="Submodule"
                title={submodule.title}
                subtitle={submodule.description}
                icon="mdi:tune-vertical"
                accent="indigo"
              />

              {(() => {
                // Build the learning path in the intended order:
                // Watch the video → read the article → take the quiz → practice coding.
                const items: FlowItem[] = [];
                (submodule.video_companions ?? []).forEach((vc) =>
                  items.push({
                    kind: "video",
                    key: `v${vc.id}`,
                    title: vc.title,
                    chips: [
                      ...(vc.duration_seconds > 0 ? [{ icon: "mdi:clock-outline", text: `~${Math.round(vc.duration_seconds / 60)} min` }] : []),
                      ...(vc.check_in_count > 0 ? [{ icon: "mdi:lightning-bolt", text: `${vc.check_in_count} check-ins` }] : []),
                    ],
                    onClick: () => router.push(`/adaptive-courses/${courseId}/submodule/${submoduleId}/video/${vc.id}`),
                  })
                );
                submodule.articles.forEach((a) =>
                  items.push({
                    kind: "article",
                    key: `a${a.article_id}`,
                    title: a.title,
                    chips: [
                      { icon: "mdi:clock-outline", text: `~${a.reading_time_minutes} min` },
                      { icon: "mdi:tune-vertical", text: `${a.default_tier} · adapts` },
                    ],
                    onClick: () => router.push(`/adaptive-courses/${courseId}/submodule/${submoduleId}/article/${a.article_id}`),
                  })
                );
                submodule.quizzes.forEach((q) =>
                  items.push({
                    kind: "quiz",
                    key: `q${q.config_id}`,
                    title: q.quiz_title,
                    chips: [
                      { icon: "mdi:database-outline", text: `${q.mcq_count}-item bank` },
                      { icon: "mdi:arrow-decision-outline", text: `serves ${q.min_questions}–${q.max_questions}` },
                      ...q.target_skills.slice(0, 2).map((s) => ({ icon: "mdi:tag-outline", text: s })),
                    ],
                    onClick: () => router.push(`/adaptive-quizzes/start?configId=${q.config_id}`),
                  })
                );
                (submodule.coding_sets ?? []).forEach((set) =>
                  set.problems.forEach((p) =>
                    items.push({
                      kind: "coding",
                      key: `c${p.problem_id}`,
                      title: p.title,
                      chips: [
                        { icon: "mdi:speedometer", text: p.difficulty_level },
                        ...p.target_skills.slice(0, 2).map((s) => ({ icon: "mdi:tag-outline", text: s })),
                      ],
                      onClick: () =>
                        router.push(`/adaptive-courses/${courseId}/submodule/${submoduleId}/coding/${p.problem_id}?configId=${set.config_id}`),
                    })
                  )
                );

                if (items.length === 0) {
                  return (
                    <Typography sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
                      No content in this submodule yet.
                    </Typography>
                  );
                }

                return (
                  <Box>
                    <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary", mb: 1.5 }}>
                      Your learning path · {items.length} step{items.length === 1 ? "" : "s"}
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      {items.map((it, idx) => (
                        <Reveal key={it.key} delay={Math.min(idx, 8) * 0.05}>
                          <FlowCard item={it} step={idx + 1} />
                        </Reveal>
                      ))}
                    </Box>
                  </Box>
                );
              })()}
            </>
          )}
        </AdaptiveSectionShell>
      </Container>
    </MainLayout>
  );
}

function Chip({ icon, text }: { icon: string; text: string }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.4,
        px: 1,
        py: 0.3,
        borderRadius: 999,
        fontSize: "0.74rem",
        fontWeight: 700,
        color: "text.secondary",
        bgcolor: "var(--bg-subtle, #f6f6f8)",
        border: "1px solid var(--border-default, #ececf1)",
      }}
    >
      <Icon icon={icon} width={13} />
      {text}
    </Box>
  );
}

type FlowKind = "video" | "article" | "quiz" | "coding";

interface FlowItem {
  kind: FlowKind;
  key: string;
  title: string;
  chips: { icon: string; text: string }[];
  onClick: () => void;
}

/** Per-content-type identity: each step gets its own colour, icon, and verb so
 *  the four content types read as distinct stages of one learning path. */
const FLOW_META: Record<FlowKind, { label: string; badge: string; actionIcon: string; action: string; accent: string }> = {
  video: { label: "Watch", badge: "mdi:play-circle-outline", actionIcon: "mdi:play", action: "Watch", accent: "#0ea5e9" },
  article: { label: "Read", badge: "mdi:book-open-variant", actionIcon: "mdi:book-open-page-variant-outline", action: "Read", accent: "#a855f7" },
  quiz: { label: "Quiz", badge: "mdi:tune-vertical", actionIcon: "mdi:play", action: "Start", accent: "#6366f1" },
  coding: { label: "Practice", badge: "mdi:code-tags", actionIcon: "mdi:code-tags", action: "Solve", accent: "#ec4899" },
};

function FlowCard({ item, step }: { item: FlowItem; step: number }) {
  const m = FLOW_META[item.kind];
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 2.25,
        borderRadius: 4,
        bgcolor: "var(--card-bg, #fff)",
        border: "1px solid var(--border-default, #ececf1)",
        borderLeft: `3px solid ${m.accent}`,
        boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 10px 26px -22px rgba(16,24,40,0.18)",
        transition: "transform 120ms ease, box-shadow 120ms ease",
        "&:hover": { transform: "translateY(-1px)", boxShadow: `0 16px 34px -22px color-mix(in srgb, ${m.accent} 55%, transparent)` },
      }}
    >
      {/* Type badge with step number */}
      <Box sx={{ position: "relative", flexShrink: 0 }}>
        <Box
          sx={{
            width: 46, height: 46, borderRadius: 3, display: "grid", placeItems: "center",
            color: m.accent, bgcolor: `color-mix(in srgb, ${m.accent} 12%, transparent)`,
          }}
        >
          <Icon icon={m.badge} width={24} />
        </Box>
        <Box
          sx={{
            position: "absolute", top: -6, left: -6, minWidth: 20, height: 20, px: 0.4, borderRadius: 999,
            display: "grid", placeItems: "center", fontSize: "0.64rem", fontWeight: 800, color: "#fff",
            bgcolor: m.accent, border: "2px solid var(--card-bg, #fff)",
          }}
        >
          {step}
        </Box>
      </Box>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: "0.64rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: m.accent }}>
          Step {step} · {m.label}
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: "1rem", lineHeight: 1.3 }}>{item.title}</Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 0.75, flexWrap: "wrap" }}>
          {item.chips.map((c, i) => (
            <Chip key={i} icon={c.icon} text={c.text} />
          ))}
        </Box>
      </Box>

      <ButtonBase
        onClick={item.onClick}
        sx={{
          flexShrink: 0, px: 2.5, py: 1.2, borderRadius: 999, fontWeight: 800, color: "white", fontSize: "0.88rem", gap: 0.6,
          background: `linear-gradient(135deg, ${m.accent} 0%, color-mix(in srgb, ${m.accent} 60%, #ec4899) 130%)`,
          boxShadow: `0 14px 28px -16px color-mix(in srgb, ${m.accent} 75%, transparent)`,
        }}
      >
        <Icon icon={m.actionIcon} width={16} />
        {m.action}
      </ButtonBase>
    </Box>
  );
}
