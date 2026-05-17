"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Container, Typography } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { AiLincLoader } from "@/components/common/AiLincLoader";
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
    // Structured-question payloads — present only on the turns where the AI inserted a
    // coding problem or an MCQ during the live interview. The QuestionPerformance row
    // surfaces a "View problem" / "View MCQ" button that re-renders these via
    // StructuredQuestionViewModal so the candidate / reviewer can revisit the exact
    // problem statement, sample I/O, options, etc.
    coding_problem?: {
      statement: string;
      starter_code: string;
      language: string;
      sample_input?: string;
      sample_output?: string;
    };
    mcq_options?: { id: string; text: string }[];
    mcq_multi_select?: boolean;
    mcq_correct_option_ids?: string[];
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
  // True while we're polling for the LLM evaluation to finish. The submit endpoint now
  // returns 202 immediately and runs evaluation in a background thread on the server —
  // the result page polls /detail/ until `evaluation_score.overall_percentage` shows up.
  const [evaluationPending, setEvaluationPending] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stop any active camera streams on this page
  useStopCameraOnMount();

  useEffect(() => {
    const interviewId = Number(params.id);
    if (!interviewId) return;

    let cancelled = false;

    const isEvaluationReady = (data: { evaluation_score?: { overall_percentage?: number } } | null) => {
      return (
        !!data &&
        !!data.evaluation_score &&
        typeof data.evaluation_score.overall_percentage === "number"
      );
    };

    const fetchOnce = async () => {
      try {
        const data = await mockInterviewService.getInterviewDetail(interviewId);
        if (cancelled) return;
        setResult(data as InterviewResult);
        if (isEvaluationReady(data as { evaluation_score?: { overall_percentage?: number } })) {
          setEvaluationPending(false);
          setLoading(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        } else {
          // Server has the row but the background evaluation worker hasn't finished
          // writing the score yet. Stay in pending mode and let the interval re-poll.
          setEvaluationPending(true);
          setLoading(false);
        }
      } catch (error) {
        if (cancelled) return;
        showToast("Failed to load interview result", "error");
        router.push("/mock-interview");
      }
    };

    // First load — always blocks the page with the loader until we know whether the
    // evaluation is ready or pending.
    void fetchOnce();

    // Polling — fires every 1s while we're still waiting on the evaluation worker. The
    // background worker typically finishes in 5-12s with the slimmed eval prompt, so a 1s
    // poll catches it within a second of completion instead of up to 2s of staring at the
    // loader. We give up after ~90s; at that point the worker probably crashed or the LLM
    // is permanently failing, and the page renders whatever's there.
    const maxAttempts = 90;
    let attempt = 0;
    pollIntervalRef.current = setInterval(() => {
      attempt += 1;
      if (attempt > maxAttempts) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setEvaluationPending(false);
        return;
      }
      void fetchOnce();
    }, 1000);

    return () => {
      cancelled = true;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
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


  if (loading) {
    return (
      <MainLayout>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
            py: 8,
          }}
        >
          <AiLincLoader
            variant="inline"
            label="AI LINC · LOADING"
            subMessage="Loading your interview result…"
          />
        </Box>
      </MainLayout>
    );
  }

  if (!result) {
    return null;
  }

  // Evaluation is still being computed by the backend worker — render a loading screen
  // with friendly copy. The poller (set up in the effect above) will keep checking and
  // flip evaluationPending → false once the score is written.
  if (evaluationPending) {
    return (
      <MainLayout>
        <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
          <AiLincLoader
            variant="inline"
            label="EVALUATING YOUR INTERVIEW"
            subMessage="Our AI is reviewing your answers and preparing detailed feedback. This usually takes 5–15 seconds."
            size={260}
          />
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 3,
              color: "var(--font-tertiary)",
              fontStyle: "italic",
            }}
          >
            You can safely keep this page open — your result will appear here as soon as it's ready.
          </Typography>
        </Container>
      </MainLayout>
    );
  }

  // Defensive: if the poller timed out without an evaluation, the backend evaluator
  // probably crashed for this interview. Show a friendly recovery screen instead of
  // crashing on `result.evaluation_score.overall_percentage`.
  if (!result.evaluation_score || typeof result.evaluation_score.overall_percentage !== "number") {
    return (
      <MainLayout>
        <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Evaluation taking longer than usual
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 3 }}>
            Our scoring service is busy. Your transcript is saved — please check back in a minute.
          </Typography>
        </Container>
      </MainLayout>
    );
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
          responses={result.interview_transcript.responses}
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
