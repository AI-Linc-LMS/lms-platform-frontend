"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, Container, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  adaptiveCourseService,
  type AdaptiveCourseListItem,
} from "@/lib/services/adaptive-course.service";
import { useIsAdaptiveQuizEnabled } from "@/lib/contexts/ClientInfoContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { KpiRail, Reveal } from "@/components/scorecard/shared";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";

export default function AdaptiveCourseListPage() {
  const router = useRouter();
  const featureOn = useIsAdaptiveQuizEnabled();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdaptiveCourseListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!featureOn) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await adaptiveCourseService.listCourses();
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load adaptive courses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [featureOn]);

  const stats = useMemo(() => {
    let modules = 0;
    let quizzes = 0;
    let articles = 0;
    for (const c of items) {
      modules += c.module_count;
      quizzes += c.quiz_count;
      articles += c.article_count;
    }
    return { courses: items.length, modules, quizzes, articles };
  }, [items]);

  if (!featureOn) {
    return (
      <MainLayout>
        <Container sx={{ py: 8, textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {"Adaptive Course isn't enabled for this organisation."}
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1 }}>
            {'Ask your administrator to switch on the "Adaptive Quiz" feature.'}
          </Typography>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1760, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 5 } }}>
        <AdaptiveSectionShell meshOpacity={0.18}>
          <AdaptiveSectionHero
            chapter="Library · Adaptive Engine"
            title="Adaptive Course"
            subtitle="Full courses where every quiz adapts to you in real time — difficulty shifts as your confidence does. Open a course, work through its modules, and let the engine meet you at your level."
            icon="mdi:book-education-outline"
            accent="purple"
          />

          {items.length > 0 && (
            <KpiRail
              items={[
                { value: stats.courses, label: "Courses available", accent: "#6366f1" },
                { value: stats.modules, label: "Modules", accent: "#a855f7" },
                { value: stats.articles, label: "Adaptive articles", accent: "#10b981" },
                { value: stats.quizzes, label: "Adaptive quizzes", accent: "#ec4899" },
              ]}
            />
          )}

          {loading && (
            <Typography sx={{ color: "text.secondary", textAlign: "center", py: 6 }}>
              Loading adaptive courses…
            </Typography>
          )}

          {error && (
            <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>
              {error}
            </Typography>
          )}

          {!loading && !error && items.length === 0 && <EmptyState />}

          {!loading && items.length > 0 && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                gap: 2,
                alignItems: "stretch",
              }}
            >
              {items.map((course, idx) => (
                <Reveal key={course.id} delay={Math.min(idx, 8) * 0.06}>
                  <CourseCard
                    course={course}
                    onOpen={() => router.push(`/adaptive-courses/${course.id}`)}
                  />
                </Reveal>
              ))}
            </Box>
          )}
        </AdaptiveSectionShell>
      </Box>
    </MainLayout>
  );
}

function CourseCard({
  course,
  onOpen,
}: {
  course: AdaptiveCourseListItem;
  onOpen: () => void;
}) {
  return (
    <ButtonBase
      onClick={onOpen}
      sx={{
        width: "100%",
        height: "100%",
        textAlign: "left",
        display: "block",
        borderRadius: 3,
        p: 2.5,
        bgcolor: "var(--card-bg, #fff)",
        border: "1px solid var(--border-default, #ececf1)",
        boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 10px 26px -22px rgba(16,24,40,0.18)",
        transition: "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: "color-mix(in srgb, #6366f1 40%, transparent)",
          boxShadow: "0 20px 40px -26px rgba(99, 102, 241, 0.45)",
        },
      }}
    >
      {course.card_image_url && (
        <Box
          sx={{
            width: "100%",
            aspectRatio: "16 / 9",
            borderRadius: 2.5,
            overflow: "hidden",
            mb: 1.5,
            bgcolor: "color-mix(in srgb, #6366f1 8%, transparent)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={course.card_image_url}
            alt={course.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </Box>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 3,
            display: "grid",
            placeItems: "center",
            color: "white",
            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)",
            boxShadow: "0 14px 26px -14px rgba(168, 85, 247, 0.6)",
          }}
        >
          <Icon icon="mdi:book-education-outline" width={22} />
        </Box>
        <Box
          component="span"
          sx={{
            px: 1,
            py: 0.3,
            borderRadius: 999,
            fontSize: "0.65rem",
            fontWeight: 800,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            color: "#a855f7",
            bgcolor: "color-mix(in srgb, #a855f7 14%, transparent)",
          }}
        >
          Adaptive
        </Box>
      </Box>

      <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.3 }}>
        {course.title}
      </Typography>
      {course.description && (
        <Typography
          sx={{
            color: "text.secondary",
            mt: 0.75,
            fontSize: "0.86rem",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {course.description}
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
        <Metric icon="mdi:view-module-outline" label="modules" value={course.module_count} />
        <Metric icon="mdi:file-tree-outline" label="submodules" value={course.submodule_count} />
        <Metric icon="mdi:book-open-variant" label="articles" value={course.article_count} />
        <Metric icon="mdi:tune-vertical" label="quizzes" value={course.quiz_count} />
        {(course.coding_count ?? 0) > 0 && (
          <Metric icon="mdi:robot-happy-outline" label="coding" value={course.coding_count ?? 0} />
        )}
        {(course.video_count ?? 0) > 0 && (
          <Metric icon="mdi:play-circle-outline" label="videos" value={course.video_count ?? 0} />
        )}
      </Box>
    </ButtonBase>
  );
}

function Metric({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6 }}>
      <Icon icon={icon} width={16} style={{ color: "#6366f1" }} />
      <Typography component="span" sx={{ fontWeight: 800, fontSize: "0.85rem" }}>
        {value}
      </Typography>
      <Typography component="span" sx={{ color: "text.secondary", fontSize: "0.78rem" }}>
        {label}
      </Typography>
    </Box>
  );
}

function EmptyState() {
  return (
    <Box
      sx={{
        p: { xs: 3, md: 5 },
        borderRadius: 4,
        textAlign: "center",
        bgcolor: "color-mix(in srgb, var(--card-bg) 60%, transparent)",
        border: "1px dashed color-mix(in srgb, var(--border-default) 90%, transparent)",
      }}
    >
      <Icon icon="mdi:book-off-outline" width={48} style={{ color: "#a855f7" }} />
      <Typography sx={{ fontWeight: 800, mt: 1.5, fontSize: "1.1rem" }}>
        {"You're not enrolled in any adaptive course yet."}
      </Typography>
      <Typography sx={{ color: "text.secondary", mt: 0.75, maxWidth: 520, mx: "auto", lineHeight: 1.5 }}>
        {"Adaptive courses appear here once your instructor enrolls you. Check back soon — or reach out to your instructor if you're expecting access."}
      </Typography>
    </Box>
  );
}
