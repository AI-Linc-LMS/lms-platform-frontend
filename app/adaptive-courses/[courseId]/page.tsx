"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, ButtonBase, Typography } from "@mui/material";
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
          onClick={() => router.push("/adaptive-courses")}
          sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} />
          Back to Adaptive Courses
        </ButtonBase>

        <AdaptiveSectionShell meshOpacity={0.18}>
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
                onClick={() => router.push("/adaptive-courses")}
                sx={{ mt: 2.5, px: 2.5, py: 1, borderRadius: 999, fontWeight: 800, color: "white", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}
              >
                Back to Adaptive Courses
              </ButtonBase>
            </Box>
          )}

          {course && (
            <>
              {course.header_image_url && (
                <Box
                  sx={{
                    width: "100%",
                    aspectRatio: { xs: "16 / 9", md: "1024 / 300" },
                    borderRadius: 4,
                    overflow: "hidden",
                    mb: 3,
                    bgcolor: "color-mix(in srgb, #6366f1 8%, transparent)",
                    boxShadow: "0 18px 44px -22px rgba(99,102,241,0.45)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={course.header_image_url}
                    alt={course.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </Box>
              )}
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
                        bgcolor: "var(--card-bg, #fff)",
                        border: "1px solid var(--border-default, #ececf1)", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 10px 26px -22px rgba(16,24,40,0.18)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.75 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2.5,
                            display: "grid",
                            placeItems: "center",
                            color: "white",
                            flexShrink: 0,
                            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                            boxShadow: "0 12px 24px -14px rgba(168,85,247,0.6)",
                          }}
                        >
                          <Icon icon="mdi:calendar-week-outline" width={22} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a855f7" }}>
                            Week {mod.weekno}
                          </Typography>
                          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.25 }}>
                            {mod.title}
                          </Typography>
                        </Box>
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
                              borderRadius: 2.5,
                              p: 1.75,
                              bgcolor: "var(--bg-subtle, #fafafb)",
                              border: "1px solid var(--border-default, #ececf1)",
                              transition: "transform 120ms ease, border-color 120ms ease, background 120ms ease",
                              "&:hover": {
                                transform: "translateY(-1px)",
                                borderColor: "color-mix(in srgb, #6366f1 45%, transparent)",
                                bgcolor: "var(--card-bg, #fff)",
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
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
                              {sub.articles.length > 0 && (
                                <CountChip icon="mdi:book-open-variant" count={sub.articles.length} label="article" accent="#a855f7" />
                              )}
                              {sub.quizzes.length > 0 && (
                                <CountChip icon="mdi:tune-vertical" count={sub.quizzes.length} label="quiz" accent="#6366f1" />
                              )}
                              {(sub.coding_sets ?? []).reduce((n, s) => n + s.problems.length, 0) > 0 && (
                                <CountChip
                                  icon="mdi:robot-happy-outline"
                                  count={(sub.coding_sets ?? []).reduce((n, s) => n + s.problems.length, 0)}
                                  label="coding"
                                  accent="#ec4899"
                                />
                              )}
                              {(sub.video_companions?.length ?? 0) > 0 && (
                                <CountChip icon="mdi:play-circle-outline" count={sub.video_companions?.length ?? 0} label="video" accent="#0ea5e9" />
                              )}
                              <Icon icon="mdi:chevron-right" width={20} style={{ opacity: 0.4, flexShrink: 0 }} />
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
      </Box>
    </MainLayout>
  );
}

/** Compact count chip — neutral pill, accent only on the icon, so a row of them
 *  (article / quiz / coding / video) reads as a tidy strip rather than a stack of
 *  coloured blobs. */
function CountChip({
  icon,
  count,
  label,
  accent,
}: {
  icon: string;
  count: number;
  label: string;
  accent: string;
}) {
  return (
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
        fontWeight: 700,
        whiteSpace: "nowrap",
        color: "text.secondary",
        bgcolor: "var(--bg-subtle, #f6f6f8)",
        border: "1px solid var(--border-default, #ececf1)",
      }}
    >
      <Icon icon={icon} width={14} style={{ color: accent }} />
      {count} {label}
    </Box>
  );
}
