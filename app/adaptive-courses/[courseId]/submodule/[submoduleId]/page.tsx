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

        <AdaptiveSectionShell>
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

              {submodule.quizzes.length === 0 ? (
                <Typography sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
                  No quizzes in this submodule yet.
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {submodule.quizzes.map((quiz, idx) => (
                    <Reveal key={quiz.config_id} delay={Math.min(idx, 8) * 0.05}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 2,
                          borderRadius: 4,
                          p: 2.25,
                          bgcolor: "color-mix(in srgb, var(--card-bg) 70%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 800, fontSize: "1rem" }}>
                            {quiz.quiz_title}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 1.5, mt: 0.75, flexWrap: "wrap" }}>
                            <Chip icon="mdi:database-outline" text={`${quiz.mcq_count}-item bank`} />
                            <Chip
                              icon="mdi:arrow-decision-outline"
                              text={`serves ${quiz.min_questions}–${quiz.max_questions}`}
                            />
                            {quiz.target_skills.slice(0, 3).map((s) => (
                              <Chip key={s} icon="mdi:tag-outline" text={s} />
                            ))}
                          </Box>
                        </Box>
                        <ButtonBase
                          onClick={() =>
                            router.push(`/adaptive-quizzes/start?configId=${quiz.config_id}`)
                          }
                          sx={{
                            flexShrink: 0,
                            px: 2.5,
                            py: 1.2,
                            borderRadius: 999,
                            fontWeight: 800,
                            color: "white",
                            fontSize: "0.88rem",
                            gap: 0.6,
                            background:
                              "linear-gradient(135deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)",
                            boxShadow: "0 16px 32px -16px rgba(168, 85, 247, 0.55)",
                            "&:hover": { transform: "translateY(-1px)" },
                            transition: "transform 120ms ease",
                          }}
                        >
                          <Icon icon="mdi:play" width={16} />
                          Start
                        </ButtonBase>
                      </Box>
                    </Reveal>
                  ))}
                </Box>
              )}
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
        bgcolor: "color-mix(in srgb, var(--card-bg) 55%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
      }}
    >
      <Icon icon={icon} width={13} />
      {text}
    </Box>
  );
}
