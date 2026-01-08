"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Button } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { Loading } from "@/components/common/Loading";
import {
  assessmentService,
  ScholarshipStatus,
} from "@/lib/services/assessment.service";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AssessmentResultHeader } from "@/components/assessment/result/AssessmentResultHeader";
import { AssessmentStatsBar } from "@/components/assessment/result/AssessmentStatsBar";
import { PerformanceMetrics } from "@/components/assessment/result/PerformanceMetrics";
import { StrengthsWeaknesses } from "@/components/assessment/result/StrengthsWeaknesses";
import { SkillsTags } from "@/components/assessment/result/SkillsTags";
import { OverallFeedback } from "@/components/assessment/result/OverallFeedback";

export default function AssessmentResultPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [scholarshipStatus, setScholarshipStatus] =
    useState<ScholarshipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    if (!slug) return;

    let isCancelled = false;

    const loadData = async () => {
      if (isCancelled) return;
      await loadScholarshipStatus();
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  const loadScholarshipStatus = async () => {
    try {
      const status = await assessmentService.getScholarshipStatus(slug);
      setScholarshipStatus(status);
      // Try to extract title from URL or set a default
      setAssessmentTitle(
        slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
      );
    } catch (error: any) {
      showToast("Failed to load assessment results", "error");
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <MainLayout>
        <Loading fullScreen />
      </MainLayout>
    );
  }

  if (!scholarshipStatus) {
    return null;
  }

  return (
    <MainLayout>
      <Box
        sx={{
          width: "100%",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 3 },
          maxWidth: "1200px",
          mx: "auto",
        }}
      >
        {/* Back Button */}
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
          onClick={() => router.push("/assessments")}
          sx={{
            mb: 3,
            color: "#6b7280",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": {
              backgroundColor: "rgba(99, 102, 241, 0.08)",
              color: "#6366f1",
            },
          }}
        >
          Back to Assessments
        </Button>

        {/* RESULTS VIEW */}
        <Box>
          {/* Header */}
          <AssessmentResultHeader assessmentTitle={assessmentTitle} />

          {/* Quick Stats Bar */}
          <AssessmentStatsBar
            score={scholarshipStatus.score}
            totalQuestions={25}
            answeredQuestions={Math.floor((scholarshipStatus.score / 100) * 25)}
            duration={45}
            accuracy={scholarshipStatus.score}
          />

          {/* Performance Metrics */}
          <PerformanceMetrics
            overallAccuracy={scholarshipStatus.score}
            testDuration={45}
            performancePercentile={scholarshipStatus.score}
          />

          {/* Strengths & Weaknesses */}
          <StrengthsWeaknesses
            strengths={[
              "Strong understanding of core concepts",
              "Excellent problem-solving skills demonstrated",
              "Good time management throughout the assessment",
            ]}
            weaknesses={[
              "Consider reviewing advanced topics for better clarity",
              "Practice more scenario-based questions",
              "Focus on speed-accuracy balance",
            ]}
          />

          {/* Skills Tags */}
          <SkillsTags
            strongSkills={["Problem Solving", "Critical Thinking", "Analysis", "Logic"]}
            weakSkills={["Advanced Concepts", "Time Management", "Application"]}
          />

          {/* Overall Feedback */}
          <OverallFeedback
            feedbackPoints={[
              "You have demonstrated a solid grasp of fundamental concepts",
              "Your analytical approach to problems shows promise",
              "Continue practicing to improve speed and accuracy",
              "Focus on understanding advanced topics in greater depth",
            ]}
          />
        </Box>
      </Box>
    </MainLayout>
  );
}
