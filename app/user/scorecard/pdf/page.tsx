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
    // Allow charts (Recharts ResponsiveContainer) + ring animations a tick
    // to settle. 2s here vs the old 1.5 because we now render 12 sections,
    // not just 2. Playwright's wait_for_selector timeout (45s) gives plenty
    // of headroom.
    const t = setTimeout(() => {
      wrapperRef.current?.setAttribute("data-pdf-ready", "true");
      if (typeof document !== "undefined") document.body.setAttribute("data-pdf-ready", "true");
    }, 2000);
    return () => clearTimeout(t);
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
  const sectionOrder = showAll
    ? [...SECTION_ORDER_PDF]
    : (SECTION_ORDER_PDF as readonly string[]).filter((id) => (enabledModules as string[]).includes(id));

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
            Full learner analytics — overview, trends, skills, weak areas, assessments, interviews, behaviour, peer comparison, achievements, action panel.
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
                  if (!data.mockInterviewPerformance || data.mockInterviewPerformance.totalInterviews === 0) return null;
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
