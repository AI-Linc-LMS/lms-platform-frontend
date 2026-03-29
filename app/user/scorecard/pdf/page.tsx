"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Container, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { scorecardService } from "@/lib/services/scorecard.service";
import { ScorecardData } from "@/lib/types/scorecard.types";
import { StudentOverviewSection } from "@/components/scorecard/detailed/StudentOverviewSection";
import { LearningConsumptionSection } from "@/components/scorecard/detailed/LearningConsumptionSection";
import { PerformanceTrendsSection } from "@/components/scorecard/detailed/PerformanceTrendsSection";
import { SkillScorecardSection } from "@/components/scorecard/detailed/SkillScorecardSection";
import { WeakAreasSection } from "@/components/scorecard/detailed/WeakAreasSection";
import { AssessmentPerformanceSection } from "@/components/scorecard/detailed/AssessmentPerformanceSection";
import { MockInterviewSection } from "@/components/scorecard/detailed/MockInterviewSection";
import { BehavioralMetricsSection } from "@/components/scorecard/detailed/BehavioralMetricsSection";
import { ComparativeInsightsSection } from "@/components/scorecard/detailed/ComparativeInsightsSection";
import { AchievementsSection } from "@/components/scorecard/detailed/AchievementsSection";
import { ActionPanelSection } from "@/components/scorecard/detailed/ActionPanelSection";

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

  // Signal to Playwright that the scorecard is ready for PDF capture (after charts render).
  // Set on both body and wrapper so the selector [data-pdf-ready] is always findable.
  useEffect(() => {
    if (!data || error) return;
    const t = setTimeout(() => {
      wrapperRef.current?.setAttribute("data-pdf-ready", "true");
      if (typeof document !== "undefined") document.body.setAttribute("data-pdf-ready", "true");
    }, 3200);
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
  const sectionOrder = showAll ? SECTION_ORDER_PDF : (enabledModules as string[]).filter((id) => id !== "export_share");

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
            Performance & Skill Scorecard
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "#666666",
              fontSize: "0.9375rem",
            }}
          >
            Comprehensive view of your learning progress and performance
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {sectionOrder.map((sectionId) => {
            const visible = showAll || (enabledModules && enabledModules.includes(sectionId));
            if (!visible) return null;
            switch (sectionId) {
              case "overview":
                return <StudentOverviewSection key={sectionId} data={data.overview} />;
              case "learning_consumption":
                return <LearningConsumptionSection key={sectionId} data={data.learningConsumption} />;
              case "performance_trends":
                return <PerformanceTrendsSection key={sectionId} initialData={data.performanceTrends} />;
              case "skill_scorecard":
                return <SkillScorecardSection key={sectionId} skills={data.skills} />;
              case "weak_areas":
                return <WeakAreasSection key={sectionId} data={data.weakAreas} />;
              case "assessment_performance":
                return (
                  <AssessmentPerformanceSection
                    key={sectionId}
                    assessments={data.assessmentPerformance}
                    totalAssessmentsAvailable={data.learningConsumption?.practice?.totalAssessmentsPresent}
                  />
                );
              case "mock_interview":
                return <MockInterviewSection key={sectionId} data={data.mockInterviewPerformance} />;
              case "behavioral_metrics":
                return <BehavioralMetricsSection key={sectionId} data={data.behavioralMetrics} />;
              case "comparative_insights":
                return <ComparativeInsightsSection key={sectionId} data={data.comparativeInsights} />;
              case "achievements":
                return <AchievementsSection key={sectionId} data={data.achievements} />;
              case "action_panel":
                return <ActionPanelSection key={sectionId} data={data.actionPanel} />;
              default:
                return null;
            }
          })}
        </Box>
      </Container>
    </Box>
  );
}
