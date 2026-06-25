"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Container, Typography } from "@mui/material";
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
import { AdaptiveCourseCard } from "@/components/courses/AdaptiveCourseCard";
import { CoursesNavTabs } from "@/components/courses/CoursesNavTabs";

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
        <CoursesNavTabs active="adaptive" />
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
                  <AdaptiveCourseCard
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
