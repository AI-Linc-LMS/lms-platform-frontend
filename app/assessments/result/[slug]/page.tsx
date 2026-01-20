"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Box, Button } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { Loading } from "@/components/common/Loading";
import {
  assessmentService,
  AssessmentResult,
} from "@/lib/services/assessment.service";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AssessmentResultHeader } from "@/components/assessment/result/AssessmentResultHeader";
import { ScoreDisplay } from "@/components/assessment/result/ScoreDisplay";
import { EnhancedStatsBar } from "@/components/assessment/result/EnhancedStatsBar";
import { TopicWiseBreakdown } from "@/components/assessment/result/TopicWiseBreakdown";
import { StrengthsWeaknesses } from "@/components/assessment/result/StrengthsWeaknesses";
import { EnhancedSkillsTags } from "@/components/assessment/result/EnhancedSkillsTags";
import { OverallFeedback } from "@/components/assessment/result/OverallFeedback";
import { PsychometricResultView } from "@/components/assessment/result/PsychometricResultView";
import {
  mockAptitudeTestData,
  getMockPsychometricData,
} from "@/lib/mock-data/assessment-mock-data";
import { EyeMovementViolations } from "@/components/assessment/result/EyeMovementViolations";

export default function AssessmentResultPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const [assessmentResult, setAssessmentResult] =
    useState<AssessmentResult | null>(null);
  const [psychometricData, setPsychometricData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const forcePsychometric = searchParams?.get("type") === "psychometric";

  useEffect(() => {
    if (!slug) return;

    let isCancelled = false;

    const loadData = async () => {
      if (isCancelled) return;
      await loadAssessmentResult();
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  const loadAssessmentResult = async () => {
    try {
      // Check if it's a psychometric assessment by slug or query parameter
      const slugLower = slug?.toLowerCase() || "";
      const isPsychometric = 
        forcePsychometric ||
        slugLower === "psychometric-personality-v1" || 
        slugLower.includes("psychometric") ||
        slugLower === "psychometric" ||
        slugLower.includes("k-disha") ||
        slugLower.includes("kdisha");
      
      // For psychometric assessments, use mock data for now
      if (isPsychometric) {
        // Simulate a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 300));
        // Get different mock data based on slug or random selection
        setPsychometricData(getMockPsychometricData(slug));
        setLoading(false);
        return;
      }

      // For all other assessments, use real API call
      const result = await assessmentService.getAssessmentResult(slug);
      
      // Detection Logic:
      // 1. If response has 'assessment_meta' field → Psychometric Assessment
      // 2. If response has 'stats' field → Aptitude Test Assessment
      if ((result as any).assessment_meta) {
        // Psychometric assessment detected (from API)
        setPsychometricData(result as any);
      } else {
        // Aptitude test or other assessment type - use original structure
      setAssessmentResult(result);
      }
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

  // If psychometric assessment, render psychometric view
  if (psychometricData) {
    return (
      <MainLayout>
        <div className="w-full bg-slate-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
            <button
              onClick={() => router.push("/assessments")}
              className="mb-4 sm:mb-6 text-slate-600 hover:text-blue-600 font-semibold flex items-center gap-2 transition-colors text-sm sm:text-base"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="hidden xs:inline">Back to Assessments</span>
              <span className="xs:hidden">Back</span>
            </button>
          </div>
          <PsychometricResultView data={psychometricData} />
        </div>
      </MainLayout>
    );
  }

  if (!assessmentResult) {
    return null;
  }

  const { stats } = assessmentResult;
  
  // Extract strengths and weaknesses from topic-wise stats
  const getStrengthsAndWeaknesses = () => {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    if (stats.topic_wise_stats) {
      Object.entries(stats.topic_wise_stats).forEach(([topic, topicStats]) => {
        if (topicStats.accuracy_percent >= 70) {
          strengths.push(
            `Strong performance in ${topic} (${topicStats.accuracy_percent.toFixed(1)}% accuracy)`
          );
        } else if (topicStats.accuracy_percent < 50) {
          weaknesses.push(
            `Needs improvement in ${topic} (${topicStats.accuracy_percent.toFixed(1)}% accuracy)`
          );
        }
      });
    }
    
    // If no topic-wise stats, use generic feedback
    if (strengths.length === 0 && weaknesses.length === 0) {
      if (stats.accuracy_percent >= 70) {
        strengths.push("Strong understanding of core concepts");
        strengths.push("Good problem-solving approach");
      } else {
        weaknesses.push("Consider reviewing fundamental concepts");
        weaknesses.push("Practice more to improve accuracy");
      }
    }
    
    return { strengths, weaknesses };
  };

  const { strengths, weaknesses } = getStrengthsAndWeaknesses();

  // Generate feedback points based on performance
  const getFeedbackPoints = () => {
    const feedback: string[] = [];
    const accuracy = stats.accuracy_percent;
    
    if (accuracy >= 80) {
      feedback.push("Excellent performance! You have demonstrated a strong grasp of the concepts");
      feedback.push("Your analytical approach to problems is commendable");
      feedback.push("Continue practicing to maintain this high level of performance");
    } else if (accuracy >= 60) {
      feedback.push("Good performance overall with room for improvement");
      feedback.push("Focus on areas where you had difficulty to boost your score");
      feedback.push("Practice more scenario-based questions to enhance your skills");
    } else if (accuracy >= 40) {
      feedback.push("You have a basic understanding but need more practice");
      feedback.push("Review the topics where you struggled the most");
      feedback.push("Focus on understanding core concepts before moving to advanced topics");
    } else {
      feedback.push("Consider revisiting the fundamental concepts");
      feedback.push("Practice regularly to improve your understanding");
      feedback.push("Don't hesitate to seek help or additional resources");
    }
    
    if (stats.attempted_questions < stats.total_questions) {
      feedback.push(`You attempted ${stats.attempted_questions} out of ${stats.total_questions} questions. Try to attempt all questions next time.`);
    }
    
    return feedback;
  };

  const feedbackPoints = getFeedbackPoints();

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
          <AssessmentResultHeader 
            assessmentTitle={assessmentResult.assessment_name}
            status={assessmentResult.status}
          />

          {/* Prominent Score Display */}
          <ScoreDisplay
            score={stats.score}
            maximumMarks={stats.maximum_marks}
            accuracy={stats.accuracy_percent}
            percentile={stats.percentile}
          />

          {/* Enhanced Stats Bar */}
          <EnhancedStatsBar
            totalQuestions={stats.total_questions}
            attemptedQuestions={stats.attempted_questions}
            correctAnswers={stats.correct_answers}
            incorrectAnswers={stats.incorrect_answers}
            timeTakenMinutes={stats.time_taken_minutes}
            totalTimeMinutes={stats.total_time_minutes}
          />

          {/* Eye Movement Violations */}
          {assessmentResult.proctoring?.eye_movement_count && assessmentResult.proctoring.eye_movement_count > 0 && (
            <EyeMovementViolations
              violations={assessmentResult.proctoring.eye_movement_violations || []}
              count={assessmentResult.proctoring.eye_movement_count}
            />
          )}

          {/* Topic-wise Breakdown */}
          {stats.topic_wise_stats && Object.keys(stats.topic_wise_stats).length > 0 && (
            <TopicWiseBreakdown topicWiseStats={stats.topic_wise_stats} />
          )}

          {/* Strengths & Weaknesses */}
          <StrengthsWeaknesses
            strengths={strengths}
            weaknesses={weaknesses}
          />

          {/* Skills Tags */}
          {((Array.isArray(stats.top_skills) && stats.top_skills.length > 0) || 
            (Array.isArray(stats.low_skills) && stats.low_skills.length > 0)) && (
            <EnhancedSkillsTags
              strongSkills={Array.isArray(stats.top_skills) ? stats.top_skills : []}
              weakSkills={Array.isArray(stats.low_skills) ? stats.low_skills : []}
            />
          )}

          {/* Overall Feedback */}
          <OverallFeedback
            feedbackPoints={feedbackPoints}
          />
        </Box>
      </Box>
    </MainLayout>
  );
}
