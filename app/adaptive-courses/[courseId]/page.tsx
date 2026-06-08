"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, ButtonBase, Container, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  adaptiveCourseService,
  type AdaptiveCourseDetail,
} from "@/lib/services/adaptive-course.service";
import { MainLayout } from "@/components/layout/MainLayout";
import { Reveal } from "@/components/scorecard/shared";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";

export default function AdaptiveCourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Number(params.courseId);
  const [course, setCourse] = useState<AdaptiveCourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(courseId)) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await adaptiveCourseService.getCourse(courseId);
        if (!cancelled) setCourse(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load course.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <ButtonBase
          onClick={() => router.push("/adaptive-courses")}
          sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} />
          Back to Adaptive Courses
        </ButtonBase>

        <AdaptiveSectionShell>
          {loading && (
            <Typography sx={{ color: "text.secondary", textAlign: "center", py: 6 }}>
              Loading course…
            </Typography>
          )}
          {error && (
            <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>
              {error}
            </Typography>
          )}

          {course && (
            <>
              <AdaptiveSectionHero
                chapter="Adaptive Course"
                title={course.title}
                subtitle={course.description}
                icon="mdi:book-education-outline"
                accent="purple"
              />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {course.modules.map((mod, mIdx) => (
                  <Reveal key={mod.id} delay={Math.min(mIdx, 8) * 0.05}>
                    <Box
                      sx={{
                        borderRadius: 4,
                        p: { xs: 2, md: 2.5 },
                        bgcolor: "color-mix(in srgb, var(--card-bg) 70%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.75 }}>
                        <Box
                          sx={{
                            minWidth: 34,
                            height: 34,
                            px: 1,
                            borderRadius: 2,
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 800,
                            fontSize: "0.8rem",
                            color: "white",
                            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                          }}
                        >
                          W{mod.weekno}
                        </Box>
                        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>
                          {mod.title}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {mod.submodules.map((sub) => (
                          <ButtonBase
                            key={sub.id}
                            onClick={() =>
                              router.push(`/adaptive-courses/${course.id}/submodule/${sub.id}`)
                            }
                            sx={{
                              width: "100%",
                              textAlign: "left",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 1.5,
                              borderRadius: 3,
                              p: 1.75,
                              bgcolor: "color-mix(in srgb, var(--card-bg) 55%, transparent)",
                              border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                              transition: "transform 120ms ease, border-color 120ms ease",
                              "&:hover": {
                                transform: "translateY(-1px)",
                                borderColor: "color-mix(in srgb, #a855f7 50%, transparent)",
                              },
                            }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                                {sub.title}
                              </Typography>
                              {sub.description && (
                                <Typography
                                  sx={{
                                    color: "text.secondary",
                                    fontSize: "0.82rem",
                                    mt: 0.25,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  {sub.description}
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                              {sub.articles.length > 0 && (
                                <Box
                                  component="span"
                                  sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    px: 1,
                                    py: 0.4,
                                    borderRadius: 999,
                                    fontSize: "0.72rem",
                                    fontWeight: 800,
                                    color: "#a855f7",
                                    bgcolor: "color-mix(in srgb, #a855f7 12%, transparent)",
                                  }}
                                >
                                  <Icon icon="mdi:book-open-variant" width={14} />
                                  {sub.articles.length} article{sub.articles.length === 1 ? "" : "s"}
                                </Box>
                              )}
                              {sub.quizzes.length > 0 && (
                                <Box
                                  component="span"
                                  sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    px: 1,
                                    py: 0.4,
                                    borderRadius: 999,
                                    fontSize: "0.72rem",
                                    fontWeight: 800,
                                    color: "#6366f1",
                                    bgcolor: "color-mix(in srgb, #6366f1 12%, transparent)",
                                  }}
                                >
                                  <Icon icon="mdi:tune-vertical" width={14} />
                                  {sub.quizzes.length} quiz{sub.quizzes.length === 1 ? "" : "zes"}
                                </Box>
                              )}
                              {(() => {
                                const codingCount = (sub.coding_sets ?? []).reduce((n, s) => n + s.problems.length, 0);
                                return codingCount > 0 ? (
                                  <Box
                                    component="span"
                                    sx={{
                                      display: "inline-flex", alignItems: "center", gap: 0.5,
                                      px: 1, py: 0.4, borderRadius: 999, fontSize: "0.72rem", fontWeight: 800,
                                      color: "#ec4899", bgcolor: "color-mix(in srgb, #ec4899 12%, transparent)",
                                    }}
                                  >
                                    <Icon icon="mdi:robot-happy-outline" width={14} />
                                    {codingCount} coding
                                  </Box>
                                ) : null;
                              })()}
                              <Icon icon="mdi:chevron-right" width={20} style={{ opacity: 0.5 }} />
                            </Box>
                          </ButtonBase>
                        ))}
                      </Box>
                    </Box>
                  </Reveal>
                ))}
              </Box>
            </>
          )}
        </AdaptiveSectionShell>
      </Container>
    </MainLayout>
  );
}
