"use client";

import { useCallback, useMemo, useState } from "react";
import { Box, Container } from "@mui/material";
import {
  ResultHeader,
  StudentInfoCard,
  PerformanceSummary,
  ProctoringReport,
  OverallFeedback,
} from "@/components/mock-interview/result";
import { AdminQuestionPerformance } from "./AdminQuestionPerformance";
import type { AdminInterviewDetail } from "@/lib/services/admin/admin-mock-interview.service";

interface AdminInterviewResultAdapterProps {
  data: AdminInterviewDetail;
  onBack: () => void;
}

function getScoreColor(percentage: number) {
  if (percentage >= 80) return { bg: "#d1fae5", color: "#065f46", main: "#10b981" };
  if (percentage >= 60) return { bg: "#dbeafe", color: "#1e40af", main: "#3b82f6" };
  if (percentage >= 40) return { bg: "#fed7aa", color: "#9a3412", main: "#f59e0b" };
  return { bg: "#fecaca", color: "#991b1b", main: "#ef4444" };
}

function getPerformanceLabel(percentage: number) {
  if (percentage >= 80) return "Excellent";
  if (percentage >= 60) return "Good";
  if (percentage >= 40) return "Average";
  return "Needs Improvement";
}

function computeMaxPossibleScore(gradingScheme?: AdminInterviewDetail["grading_scheme"]): number {
  if (!gradingScheme?.criteria) return 100;
  const vals = Object.values(gradingScheme.criteria).filter(
    (v): v is number => typeof v === "number"
  );
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) : 100;
}

export function AdminInterviewResultAdapter({
  data,
  onBack,
}: AdminInterviewResultAdapterProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<number | false>(
    data.questions_for_interview?.[0]?.question_number ?? 1
  );

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

  const formatDurationSeconds = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }, []);

  const evaluationScore = data.evaluation_score;
  const maxPossibleScore = useMemo(
    () => computeMaxPossibleScore(data.grading_scheme),
    [data.grading_scheme]
  );
  const overallScore = evaluationScore?.overall_score ?? 0;
  const overallPercentage = maxPossibleScore > 0 ? (overallScore / maxPossibleScore) * 100 : 0;
  const scoreColors = useMemo(() => getScoreColor(overallPercentage), [overallPercentage]);
  const performanceLabel = useMemo(
    () => getPerformanceLabel(overallPercentage),
    [overallPercentage]
  );

  const totalDurationSeconds = useMemo(() => {
    const mins = data.time_taken_minutes ?? 0;
    return Math.round(mins * 60);
  }, [data.time_taken_minutes]);

  const studentMapped = useMemo(
    () => ({
      user_name: data.student_name,
      profile_pic_url: "",
      role: "Student",
    }),
    [data.student_name]
  );

  const metadata = data.interview_transcript?.metadata;
  const hasProctoringData =
    metadata &&
    (metadata.tabSwitches !== undefined ||
      metadata.windowSwitches !== undefined ||
      metadata.fullscreen_exits !== undefined ||
      metadata.face_validation_failures !== undefined);

  const questions = data.questions_for_interview ?? [];
  const responses = data.interview_transcript?.responses ?? [];
  const totalQuestions = questions.length;
  const completedQuestions = responses.length;

  const handleQuestionToggle = useCallback((questionNumber: number) => {
    setExpandedQuestion((prev) => (prev === questionNumber ? false : questionNumber));
  }, []);

  return (
    <>
      <ResultHeader
        title={data.title}
        topic={data.topic}
        subtopic={data.subtopic}
        difficulty={data.difficulty}
        duration_minutes={data.duration_minutes}
        overall_percentage={Math.round(overallPercentage)}
        performanceLabel={performanceLabel}
        scoreColors={scoreColors}
        onBack={onBack}
        backLabel="Back to Mock Interview Admin"
      />

      <Container maxWidth="xl" sx={{ pb: 6 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "300px 1fr" },
            gap: 3,
            mb: 4,
          }}
        >
          <StudentInfoCard
            student={studentMapped}
            started_at={data.started_at ?? data.created_at}
            submitted_at={data.submitted_at ?? data.created_at}
            total_duration_seconds={totalDurationSeconds}
            formatDate={formatDate}
            formatDuration={formatDurationSeconds}
          />

          <PerformanceSummary
            overall_score={overallScore}
            max_possible_score={maxPossibleScore}
            overall_percentage={Math.round(overallPercentage)}
            completed_questions={completedQuestions}
            total_questions={totalQuestions}
            performanceLabel={performanceLabel}
          />
        </Box>

        {hasProctoringData && (
          <ProctoringReport
            tabSwitches={metadata?.tabSwitches ?? 0}
            windowSwitches={metadata?.windowSwitches ?? 0}
            fullscreen_exits={metadata?.fullscreen_exits ?? 0}
            face_validation_failures={metadata?.face_validation_failures ?? 0}
          />
        )}

        <AdminQuestionPerformance
          questions={questions}
          responses={responses}
          evaluationScore={evaluationScore}
          expandedQuestion={expandedQuestion}
          onQuestionToggle={handleQuestionToggle}
        />

        <OverallFeedback
          areas_for_improvement={[]}
          overall_feedback={evaluationScore?.feedback ?? "No feedback available."}
        />
      </Container>
    </>
  );
}
