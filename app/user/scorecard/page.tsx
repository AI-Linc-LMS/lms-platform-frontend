"use client";

import { useState, useEffect } from "react";
import { Box, Container, Typography, Button, Paper } from "@mui/material";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
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
import { ExportShareSection } from "@/components/scorecard/detailed/ExportShareSection";

export default function ScorecardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ScorecardData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const scorecardData = await scorecardService.getScorecardData();
        setData(scorecardData);
      } catch (error) {
        console.error("Failed to load scorecard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Typography variant="body1" sx={{ color: "#666666" }}>
            Loading scorecard...
          </Typography>
        </Container>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Typography variant="body1" sx={{ color: "#666666" }}>
            Failed to load scorecard data.
          </Typography>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box
        sx={{
          width: "100%",
          backgroundColor: "#f9fafb",
          minHeight: "100vh",
          pb: 4,
        }}
      >
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Box>
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
            <Button
              variant="outlined"
              startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
              onClick={() => router.push("/dashboard")}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "#0a66c2",
                borderColor: "#0a66c2",
                borderRadius: "24px",
                px: 2.5,
                py: 1,
                "&:hover": {
                  borderColor: "#004182",
                  backgroundColor: "rgba(10, 102, 194, 0.05)",
                },
                display: { xs: "none", sm: "flex" },
              }}
            >
              Back to Dashboard
            </Button>
          </Box>

          {/* Sections */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <StudentOverviewSection data={data.overview} />
            <LearningConsumptionSection data={data.learningConsumption} />
            <PerformanceTrendsSection data={data.performanceTrends} />
            <SkillScorecardSection skills={data.skills} />
            <WeakAreasSection data={data.weakAreas} />
            <AssessmentPerformanceSection assessments={data.assessmentPerformance} />
            <MockInterviewSection data={data.mockInterviewPerformance} />
            <BehavioralMetricsSection data={data.behavioralMetrics} />
            <ComparativeInsightsSection data={data.comparativeInsights} />
            <AchievementsSection data={data.achievements} />
            <ActionPanelSection data={data.actionPanel} />
            <ExportShareSection />
          </Box>
        </Container>
      </Box>
    </MainLayout>
  );
}
