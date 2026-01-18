"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function AssessmentResultPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [assessmentResult, setAssessmentResult] =
    useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

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
      const result = await assessmentService.getAssessmentResult(slug);
      setAssessmentResult(result);
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
