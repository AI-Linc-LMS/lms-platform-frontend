"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Button,
  Skeleton,
  CircularProgress,
} from "@mui/material";
import { motion, useScroll, useSpring } from "framer-motion";

import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";
import { AssessmentPerformanceSection } from "@/components/scorecard/detailed/AssessmentPerformanceSection";
import { BehavioralMetricsSection } from "@/components/scorecard/detailed/BehavioralMetricsSection";
import { AchievementsSection } from "@/components/scorecard/detailed/AchievementsSection";
import { ActionPanelSection } from "@/components/scorecard/detailed/ActionPanelSection";
import { ComparativeInsightsSection } from "@/components/scorecard/detailed/ComparativeInsightsSection";
import { LearningConsumptionSection } from "@/components/scorecard/detailed/LearningConsumptionSection";
import { MockInterviewSection } from "@/components/scorecard/detailed/MockInterviewSection";
import { PerformanceTrendsSection } from "@/components/scorecard/detailed/PerformanceTrendsSection";
import { SkillScorecardSection } from "@/components/scorecard/detailed/SkillScorecardSection";
import { StudentOverviewSection } from "@/components/scorecard/detailed/StudentOverviewSection";
import { WeakAreasSection } from "@/components/scorecard/detailed/WeakAreasSection";
import { profileService, type HeatmapData } from "@/lib/services/profile.service";
import { scorecardService } from "@/lib/services/scorecard.service";
import type { ScorecardData } from "@/lib/types/scorecard.types";

const SECTION_ORDER = [
  "overview",
  "activity_heatmap",
  "learning_consumption",
  "performance_trends",
  "skill_scorecard",
  "weak_areas",
  "assessment_performance",
  "mock_interview",
  "behavioral_metrics",
  "comparative_insights",
  "achievements",
  "action_panel",
] as const;

/** Soft editorial backdrop — radial gradient mesh that picks up theme accents. */
function PageBackdrop() {
  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        backgroundImage: [
          "radial-gradient(60% 40% at 8% 0%, color-mix(in srgb, var(--accent-indigo) 14%, transparent), transparent 70%)",
          "radial-gradient(50% 35% at 100% 10%, color-mix(in srgb, var(--accent-cyan) 12%, transparent), transparent 65%)",
          "radial-gradient(40% 30% at 50% 100%, color-mix(in srgb, var(--accent-purple) 10%, transparent), transparent 60%)",
        ].join(", "),
      }}
    />
  );
}

/** Slim top progress bar that tracks scroll — used in user view, hidden in print. */
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    mass: 0.4,
  });
  return (
    <Box
      data-scorecard-pdf-exclude
      component={motion.div}
      style={{ scaleX }}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        transformOrigin: "0% 50%",
        zIndex: 1300,
        background:
          "linear-gradient(90deg, var(--accent-indigo) 0%, var(--accent-cyan) 50%, var(--accent-purple) 100%)",
        pointerEvents: "none",
      }}
    />
  );
}

export default function ScorecardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ScorecardData | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [scorecardData, heatmapRes] = await Promise.all([
        scorecardService.getScorecardData(),
        profileService
          .getUserActivityHeatmap()
          .catch(() => ({ heatmap_data: {} as HeatmapData })),
      ]);
      setData(scorecardData);
      setHeatmapData(heatmapRes.heatmap_data ?? {});
    } catch {
      /* Error state: data remains null */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <MainLayout>
        <Box
          sx={{
            position: "relative",
            width: "100%",
            backgroundColor: "var(--background)",
            minHeight: "100vh",
            pb: 6,
            overflow: "hidden",
          }}
        >
          <PageBackdrop />
          <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 }, position: "relative", zIndex: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 5 }}>
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width={140} height={20} sx={{ mb: 1.5 }} />
                <Skeleton variant="text" width="60%" height={72} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="40%" height={24} />
              </Box>
              <Skeleton variant="rounded" width={180} height={44} sx={{ display: { xs: "none", sm: "block" } }} />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Skeleton variant="rounded" height={420} animation="wave" sx={{ borderRadius: 4 }} />
              <Skeleton variant="rounded" height={260} animation="wave" sx={{ borderRadius: 4 }} />
              <Skeleton variant="rounded" height={520} animation="wave" sx={{ borderRadius: 4 }} />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1 }}>
                <CircularProgress size={18} sx={{ color: "var(--accent-indigo)" }} />
                <Typography variant="body2" sx={{ color: "var(--font-secondary)", fontWeight: 500 }}>
                  Curating your scorecard…
                </Typography>
              </Box>
            </Box>
          </Container>
        </Box>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Typography variant="body1" sx={{ color: "var(--font-secondary)" }}>
            Failed to load scorecard data.
          </Typography>
        </Container>
      </MainLayout>
    );
  }

  const enabledModules = data.scorecardConfig?.enabledModules;
  const showAll = !enabledModules || enabledModules.length === 0;

  const sectionOrder = showAll
    ? [...SECTION_ORDER]
    : (SECTION_ORDER as readonly string[]).filter((id) =>
        (enabledModules as string[]).includes(id),
      );

  const firstName = (data.overview.studentName || "").trim().split(/\s+/)[0] || "Learner";

  return (
    <MainLayout>
      <ScrollProgressBar />
      <Box
        sx={{
          position: "relative",
          width: "100%",
          backgroundColor: "var(--background)",
          minHeight: "100vh",
          pb: { xs: 4, md: 8 },
          overflow: "hidden",
        }}
      >
        <PageBackdrop />
        <Container
          maxWidth="xl"
          sx={{ py: { xs: 4, md: 6 }, position: "relative", zIndex: 1 }}
        >
          {/* Wrapper for PDF export capture */}
          <Box data-scorecard-pdf-content>
            {/* Editorial header */}
            <Box
              component={motion.header}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "flex-end" },
                gap: 3,
                mb: { xs: 4, md: 6 },
              }}
            >
              <Box sx={{ maxWidth: 820 }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.25,
                    py: 0.5,
                    mb: 2,
                    borderRadius: 999,
                    border: "1px solid color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
                    background:
                      "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                    color: "var(--accent-indigo)",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--accent-indigo)",
                      boxShadow: "0 0 0 4px color-mix(in srgb, var(--accent-indigo) 20%, transparent)",
                    }}
                  />
                  Learning Scorecard · {firstName}
                </Box>
                <Typography
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    color: "var(--font-primary)",
                    fontSize: { xs: "2.25rem", sm: "3rem", md: "3.75rem", lg: "4.25rem" },
                    lineHeight: 0.98,
                    letterSpacing: "-0.045em",
                    mb: 1.5,
                  }}
                >
                  Your learning,{" "}
                  <Box
                    component="span"
                    sx={{
                      background:
                        "linear-gradient(120deg, var(--accent-indigo) 0%, var(--accent-cyan) 50%, var(--accent-purple) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    quantified.
                  </Box>
                </Typography>
                <Typography
                  sx={{
                    color: "var(--font-secondary)",
                    fontSize: { xs: "1rem", md: "1.125rem" },
                    maxWidth: 620,
                    lineHeight: 1.55,
                  }}
                >
                  A bird&apos;s-eye view of your performance, momentum, and content
                  consumption across every program you&apos;re enrolled in.
                </Typography>
              </Box>
              <Button
                data-scorecard-pdf-exclude
                variant="outlined"
                startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
                onClick={() => router.push("/dashboard")}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  color: "var(--accent-indigo)",
                  borderColor: "color-mix(in srgb, var(--accent-indigo) 40%, transparent)",
                  borderRadius: 999,
                  px: 2.5,
                  py: 1,
                  backdropFilter: "blur(8px)",
                  backgroundColor: "color-mix(in srgb, var(--card-bg) 60%, transparent)",
                  "&:hover": {
                    borderColor: "var(--accent-indigo)",
                    backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                  },
                  display: { xs: "none", sm: "inline-flex" },
                  flexShrink: 0,
                }}
              >
                Back to Dashboard
              </Button>
            </Box>

            {/* Sections - order from enabled_modules when configured */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 3, md: 4 } }}>
              {sectionOrder.map((sectionId) => {
                const visible = showAll || (enabledModules && enabledModules.includes(sectionId));
                if (!visible) return null;
                switch (sectionId) {
                  case "overview":
                    return <StudentOverviewSection key={sectionId} data={data.overview} />;
                  case "activity_heatmap":
                    return <ActivityHeatmap key={sectionId} heatmapData={heatmapData} />;
                  case "learning_consumption":
                    return (
                      <LearningConsumptionSection
                        key={sectionId}
                        data={data.learningConsumption}
                      />
                    );
                  case "performance_trends":
                    // performanceTrends is optional on ScorecardData — earlier
                    // backend deploys may not return it; render the section
                    // only when the umbrella payload included it.
                    if (!data.performanceTrends) return null;
                    return (
                      <PerformanceTrendsSection
                        key={sectionId}
                        initialData={data.performanceTrends}
                      />
                    );
                  case "skill_scorecard":
                    if (!data.skills || data.skills.length === 0) return null;
                    return <SkillScorecardSection key={sectionId} data={data.skills} />;
                  case "weak_areas":
                    if (!data.weakAreas) return null;
                    return <WeakAreasSection key={sectionId} data={data.weakAreas} />;
                  case "assessment_performance":
                    if (!data.assessmentPerformance || data.assessmentPerformance.length === 0) return null;
                    return (
                      <AssessmentPerformanceSection
                        key={sectionId}
                        data={data.assessmentPerformance}
                      />
                    );
                  case "mock_interview":
                    if (!data.mockInterviewPerformance || data.mockInterviewPerformance.totalInterviews === 0) return null;
                    return (
                      <MockInterviewSection
                        key={sectionId}
                        data={data.mockInterviewPerformance}
                      />
                    );
                  case "behavioral_metrics":
                    if (!data.behavioralMetrics) return null;
                    return (
                      <BehavioralMetricsSection
                        key={sectionId}
                        data={data.behavioralMetrics}
                      />
                    );
                  case "comparative_insights":
                    if (!data.comparativeInsights) return null;
                    return (
                      <ComparativeInsightsSection
                        key={sectionId}
                        data={data.comparativeInsights}
                      />
                    );
                  case "achievements":
                    if (!data.achievements) return null;
                    return (
                      <AchievementsSection
                        key={sectionId}
                        data={data.achievements}
                      />
                    );
                  case "action_panel":
                    if (!data.actionPanel) return null;
                    return (
                      <ActionPanelSection
                        key={sectionId}
                        data={data.actionPanel}
                      />
                    );
                  default:
                    return null;
                }
              })}
            </Box>
          </Box>
        </Container>
      </Box>
    </MainLayout>
  );
}
