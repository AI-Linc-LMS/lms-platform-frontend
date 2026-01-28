"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Container } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import mockInterviewService from "@/lib/services/mock-interview.service";
import { useToast } from "@/components/common/Toast";
import { useStopCameraOnMount } from "@/lib/hooks/useStopCameraOnMount";
import {
  ResultHeader,
  StudentInfoCard,
  PerformanceSummary,
  ProctoringReport,
  QuestionPerformance,
  OverallFeedback,
} from "@/components/mock-interview/result";

interface InterviewResult {
  id: number;
  title: string;
  topic: string;
  subtopic?: string;
  difficulty: string;
  status: string;
  scheduled_date_time: string;
  duration_minutes: number;
  started_at: string;
  submitted_at: string;
  questions_for_interview: Array<{
    id: number;
    type: string;
    question_text: string;
    expected_key_points: string[];
  }>;
  grading_scheme: Record<
    string,
    {
      criteria: Array<{ points: number; criterion: string }>;
      max_score: number;
      excellent_answer: string;
      good_answer: string;
      average_answer: string;
      poor_answer: string;
    }
  >;
  evaluation_score: {
    overall_score: number;
    max_possible_score: number;
    overall_percentage: number;
    question_scores: Record<
      string,
      {
        score: number;
        max_score: number;
        percentage: number;
        feedback: string;
        strengths: string[];
        improvements: string[];
      }
    >;
    strengths: string[];
    areas_for_improvement: string[];
    overall_feedback: string;
  };
  interview_transcript: {
    metadata: {
      total_questions: number;
      completed_questions: number;
      tabSwitches: number;
      windowSwitches: number;
      fullscreen_exits: number;
      face_validation_failures: number;
      multiple_face_detections: number;
      screenResolution: string;
      userAgent: string;
      timestamp: number;
    };
    logs: Array<{
      type: string;
      severity: string;
      timestamp: string;
      data: any;
    }>;
    responses: any[];
    total_duration_seconds: number;
  };
  student: {
    id: number;
    user_name: string;
    profile_pic_url: string;
    role: string;
  };
  created_at: string;
  updated_at: string;
}

export default function InterviewResultPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | false>(1);

  // Stop any active camera streams on this page
  useStopCameraOnMount();

  useEffect(() => {
    const loadResult = async () => {
      try {
        setLoading(true);
        const data = await mockInterviewService.getInterviewDetail(
          Number(params.id)
        );
        setResult(data as any);
      } catch (error) {
        showToast("Failed to load interview result", "error");
        router.push("/mock-interview");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadResult();
    }
  }, [params.id, router, showToast]);

  const getScoreColor = useCallback((percentage: number) => {
    if (percentage >= 80)
      return { bg: "#d1fae5", color: "#065f46", main: "#10b981" };
    if (percentage >= 60)
      return { bg: "#dbeafe", color: "#1e40af", main: "#3b82f6" };
    if (percentage >= 40)
      return { bg: "#fed7aa", color: "#9a3412", main: "#f59e0b" };
    return { bg: "#fecaca", color: "#991b1b", main: "#ef4444" };
  }, []);

  const getPerformanceLabel = useCallback((percentage: number) => {
    if (percentage >= 80) return "Excellent";
    if (percentage >= 60) return "Good";
    if (percentage >= 40) return "Average";
    return "Needs Improvement";
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }, []);

  const handleQuestionToggle = useCallback((id: number) => {
    setExpandedQuestion((prev) => (prev === id ? false : id));
  }, []);

  const handleBack = useCallback(() => {
    router.push("/mock-interview/previous");
  }, [router]);


  if (!result) {
    return null;
  }

  const scoreColors = getScoreColor(result.evaluation_score.overall_percentage);

  return (
    <MainLayout>
      <ResultHeader
        title={result.title}
        topic={result.topic}
        subtopic={result.subtopic}
        difficulty={result.difficulty}
        duration_minutes={result.duration_minutes}
        overall_percentage={result.evaluation_score.overall_percentage}
        performanceLabel={getPerformanceLabel(
          result.evaluation_score.overall_percentage
        )}
        scoreColors={scoreColors}
        onBack={handleBack}
      />

      <Container maxWidth="xl" sx={{ pb: 6 }}>
        {/* Student Info & Stats */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "300px 1fr" },
            gap: 3,
            mb: 4,
          }}
        >
          <StudentInfoCard
            student={result.student}
            started_at={result.started_at}
            submitted_at={result.submitted_at}
            total_duration_seconds={
              result.interview_transcript.total_duration_seconds
            }
            formatDate={formatDate}
            formatDuration={formatDuration}
          />

          <PerformanceSummary
            overall_score={result.evaluation_score.overall_score}
            max_possible_score={result.evaluation_score.max_possible_score}
            overall_percentage={result.evaluation_score.overall_percentage}
            completed_questions={
              result.interview_transcript.metadata.completed_questions
            }
            total_questions={
              result.interview_transcript.metadata.total_questions
            }
            performanceLabel={getPerformanceLabel(
              result.evaluation_score.overall_percentage
            )}
          />
        </Box>

        {/* Proctoring Report */}
        <ProctoringReport
          tabSwitches={result.interview_transcript.metadata.tabSwitches}
          windowSwitches={result.interview_transcript.metadata.windowSwitches}
          fullscreen_exits={
            result.interview_transcript.metadata.fullscreen_exits
          }
          face_validation_failures={
            result.interview_transcript.metadata.face_validation_failures
          }
        />

        {/* Questions & Performance */}
        <QuestionPerformance
          questions={result.questions_for_interview}
          question_scores={result.evaluation_score.question_scores}
          expandedQuestion={expandedQuestion}
          onQuestionToggle={handleQuestionToggle}
          getScoreColor={getScoreColor}
        />

        {/* Overall Feedback */}
        <OverallFeedback
          areas_for_improvement={result.evaluation_score.areas_for_improvement}
          overall_feedback={result.evaluation_score.overall_feedback}
        />
      </Container>
    </MainLayout>
  );
}
