"use client";

import { useCallback, useMemo, useState } from "react";
import { Box, Container } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  ResultHeader,
  StudentInfoCard,
  PerformanceSummary,
  ProctoringReport,
  OverallFeedback,
  QuestionPerformance,
} from "@/components/mock-interview/result";
import type {
  AdminInterviewDetail,
  RawQuestionScore,
} from "@/lib/services/admin/admin-mock-interview.service";

interface AdminInterviewResultAdapterProps {
  data: AdminInterviewDetail;
  onBack: () => void;
}

function getScoreColor(percentage: number) {
  if (percentage >= 80) {
    return {
      bg: "color-mix(in srgb, var(--success-500) 16%, transparent)",
      color: "var(--success-500)",
      main: "var(--success-500)",
    };
  }
  if (percentage >= 60) {
    return {
      bg: "color-mix(in srgb, var(--accent-indigo) 16%, transparent)",
      color: "var(--accent-indigo)",
      main: "var(--accent-indigo)",
    };
  }
  if (percentage >= 40) {
    return {
      bg: "color-mix(in srgb, var(--warning-500) 16%, transparent)",
      color: "var(--warning-500)",
      main: "var(--warning-500)",
    };
  }
  return {
    bg: "color-mix(in srgb, var(--error-500) 16%, transparent)",
    color: "var(--error-500)",
    main: "var(--error-500)",
  };
}

function getPerformanceLabel(percentage: number, t: (key: string) => string) {
  if (percentage >= 80) return t("adminMockInterview.excellent");
  if (percentage >= 60) return t("adminMockInterview.good");
  if (percentage >= 40) return t("adminMockInterview.average");
  return t("adminMockInterview.needsImprovement");
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
  const { t } = useTranslation("common");
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
    () => getPerformanceLabel(overallPercentage, t),
    [overallPercentage, t]
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

  const questionsForRender = useMemo(
    () =>
      (data.questions_full ?? []).map((q) => ({
        id: q.id,
        type: q.type ?? "conceptual",
        question_text: q.question_text ?? "",
        expected_key_points: q.expected_key_points ?? [],
        coding_problem: (
          q as unknown as { coding_problem?: NonNullable<unknown> }
        ).coding_problem as
          | {
              statement: string;
              starter_code: string;
              language: string;
              sample_input?: string;
              sample_output?: string;
            }
          | undefined,
        mcq_options: (
          q as unknown as { mcq_options?: { id: string; text: string }[] }
        ).mcq_options,
        mcq_multi_select: (
          q as unknown as { mcq_multi_select?: boolean }
        ).mcq_multi_select,
        mcq_correct_option_ids: (
          q as unknown as { mcq_correct_option_ids?: string[] }
        ).mcq_correct_option_ids,
      })),
    [data.questions_full],
  );

  const responsesForRender = useMemo(
    () =>
      (data.responses_full ?? []).map((r) => ({
        question_id: r.question_id,
        answer: r.answer,
        question_text: r.question_text,
      })),
    [data.responses_full],
  );

  const questionScoresForRender = useMemo<Record<string, RawQuestionScore & { percentage: number; feedback: string; strengths: string[]; improvements: string[] }>>(() => {
    const out: Record<string, RawQuestionScore & {
      percentage: number;
      feedback: string;
      strengths: string[];
      improvements: string[];
    }> = {};
    for (const [k, v] of Object.entries(data.question_scores ?? {})) {
      out[k] = {
        score: v.score ?? 0,
        max_score: v.max_score ?? 0,
        percentage: v.percentage ?? (v.max_score ? Math.round((v.score / v.max_score) * 100) : 0),
        feedback: v.feedback ?? "",
        strengths: v.strengths ?? [],
        improvements: v.improvements ?? [],
      };
    }
    return out;
  }, [data.question_scores]);

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
        backLabel={t("adminMockInterview.backToMockInterviewAdmin")}
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
            looking_away_count={
              (metadata as { looking_away_count?: number } | undefined)?.looking_away_count ?? 0
            }
            multiple_face_detections={
              (metadata as { multiple_face_detections?: number } | undefined)?.multiple_face_detections ?? 0
            }
          />
        )}

        <QuestionPerformance
          questions={questionsForRender}
          question_scores={questionScoresForRender}
          responses={responsesForRender}
          expandedQuestion={expandedQuestion}
          onQuestionToggle={handleQuestionToggle}
          getScoreColor={getScoreColor}
        />

        <OverallFeedback
          areas_for_improvement={evaluationScore?.areas_for_improvement ?? []}
          overall_feedback={evaluationScore?.feedback ?? t("adminMockInterview.noFeedbackAvailable")}
        />
      </Container>
    </>
  );
}
