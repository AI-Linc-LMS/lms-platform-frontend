"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Container, Typography } from "@mui/material";

import { AchievementsSection } from "@/components/scorecard/detailed/AchievementsSection";
import { ActionPanelSection } from "@/components/scorecard/detailed/ActionPanelSection";
import { AssessmentPerformanceSection } from "@/components/scorecard/detailed/AssessmentPerformanceSection";
import { BehavioralMetricsSection } from "@/components/scorecard/detailed/BehavioralMetricsSection";
import { ComparativeInsightsSection } from "@/components/scorecard/detailed/ComparativeInsightsSection";
import { LearningConsumptionSection } from "@/components/scorecard/detailed/LearningConsumptionSection";
import { MockInterviewSection } from "@/components/scorecard/detailed/MockInterviewSection";
import { PerformanceTrendsSection } from "@/components/scorecard/detailed/PerformanceTrendsSection";
import { SkillScorecardSection } from "@/components/scorecard/detailed/SkillScorecardSection";
import { StudentOverviewSection } from "@/components/scorecard/detailed/StudentOverviewSection";
import { WeakAreasSection } from "@/components/scorecard/detailed/WeakAreasSection";
import { ScorecardStaticRenderProvider } from "@/components/scorecard/shared";
import { scorecardService } from "@/lib/services/scorecard.service";
import type { ScorecardData } from "@/lib/types/scorecard.types";

// Same ordering as /user/scorecard so the PDF mirrors what learners see.
// `activity_heatmap` is intentionally omitted: the heatmap data is not
// available via the PDF-token endpoint (separate auth path), so we cannot
// render it here. The filter below falls back to SHOW-ALL if an admin's
// enabledModules intersection ends up empty.
const SECTION_ORDER_PDF = [
  "overview",
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

export default function ScorecardPdfPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t");
  const clientId = searchParams.get("client_id");
  const [data, setData] = useState<ScorecardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token || !clientId) {
      setError("Invalid or expired link.");
      return;
    }
    let cancelled = false;
    scorecardService
      .getScorecardDataForPdf(token, clientId)
      .then((scorecardData) => {
        if (!cancelled) setData(scorecardData);
      })
      .catch(() => {
        if (!cancelled) setError("Invalid or expired link.");
      });
    return () => {
      cancelled = true;
    };
  }, [token, clientId]);

  useEffect(() => {
    if (!data || error) return;
    if (typeof document === "undefined") return;

    let cancelled = false;
    const markReady = () => {
      if (cancelled) return;
      wrapperRef.current?.setAttribute("data-pdf-ready", "true");
      document.body.setAttribute("data-pdf-ready", "true");
    };

    // Real readiness signals instead of a fixed 2s timer:
    //   1. document.fonts.ready  - webfonts loaded so text width is final
    //   2. every Recharts ResponsiveContainer has measured itself (non-zero box)
    //   3. a final double-rAF to let any post-layout paints settle
    // Fall back to a 4s ceiling so a misbehaving chart never strands the
    // PDF print indefinitely.
    const start = performance.now();
    const HARD_TIMEOUT_MS = 4000;

    const allChartsMeasured = (): boolean => {
      const containers = document.querySelectorAll<HTMLElement>(
        ".recharts-responsive-container",
      );
      // No charts present is fine - readiness is just "nothing left to wait for".
      if (containers.length === 0) return true;
      for (const c of Array.from(containers)) {
        const rect = c.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
      }
      return true;
    };

    const tick = () => {
      if (cancelled) return;
      const elapsed = performance.now() - start;
      if (elapsed >= HARD_TIMEOUT_MS) {
        markReady();
        return;
      }
      if (!allChartsMeasured()) {
        requestAnimationFrame(tick);
        return;
      }
      // Charts are measured. Give layout one more double-rAF so any post-
      // measurement paint (axis ticks, line strokes) actually lands.
      requestAnimationFrame(() => {
        requestAnimationFrame(markReady);
      });
    };

    const fontsReady: Promise<unknown> =
      typeof document !== "undefined" && "fonts" in document && document.fonts
        ? document.fonts.ready
        : Promise.resolve();
    fontsReady.then(() => {
      if (cancelled) return;
      requestAnimationFrame(tick);
    });

    return () => {
      cancelled = true;
    };
  }, [data, error]);

  if (error || (!token && !clientId)) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f9fafb",
          p: 3,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          {error ?? "Invalid or expired link."}
        </Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f9fafb",
          p: 3,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Loading scorecard...
        </Typography>
      </Box>
    );
  }

  const enabledModules = data.scorecardConfig?.enabledModules;
  const showAll = !enabledModules || enabledModules.length === 0;
  const filteredSections = showAll
    ? [...SECTION_ORDER_PDF]
    : (SECTION_ORDER_PDF as readonly string[]).filter((id) => (enabledModules as string[]).includes(id));
  // Guard against an empty intersection (e.g. admin enabled only modules
  // the PDF can't render - like activity_heatmap). Fall back to show-all
  // so the PDF always contains content.
  const sectionOrder = filteredSections.length > 0 ? filteredSections : [...SECTION_ORDER_PDF];

  return (
    <Box
      ref={wrapperRef}
      sx={{
        width: "100%",
        backgroundColor: "#f9fafb",
        minHeight: "100vh",
        pb: 4,
      }}
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#000000",
              fontSize: { xs: "1.75rem", sm: "2rem" },
              mb: 0.5,
            }}
          >
            Learning scorecard
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "#666666",
              fontSize: "0.9375rem",
            }}
          >
            Full learner analytics - overview, trends, skills, weak areas, assessments, interviews, behaviour, peer comparison, achievements, action panel.
          </Typography>
        </Box>

        <ScorecardStaticRenderProvider>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {sectionOrder.map((sectionId) => {
              switch (sectionId) {
                case "overview":
                  return <StudentOverviewSection key={sectionId} data={data.overview} readOnly />;
                case "learning_consumption":
                  return <LearningConsumptionSection key={sectionId} data={data.learningConsumption} />;
                case "performance_trends":
                  if (!data.performanceTrends) return null;
                  return (
                    <PerformanceTrendsSection
                      key={sectionId}
                      initialData={data.performanceTrends}
                      readOnly
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
                  if (!data.mockInterviewPerformance) return null;
                  return (
                    <MockInterviewSection
                      key={sectionId}
                      data={data.mockInterviewPerformance}
                    />
                  );
                case "behavioral_metrics":
                  if (!data.behavioralMetrics) return null;
                  return <BehavioralMetricsSection key={sectionId} data={data.behavioralMetrics} />;
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
                  return <AchievementsSection key={sectionId} data={data.achievements} />;
                case "action_panel":
                  if (!data.actionPanel) return null;
                  return <ActionPanelSection key={sectionId} data={data.actionPanel} />;
                default:
                  return null;
              }
            })}
          </Box>
        </ScorecardStaticRenderProvider>
      </Container>
    </Box>
  );
}
