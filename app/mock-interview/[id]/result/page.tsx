"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Button, Container, Typography } from "@mui/material";
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
      title?: string;
      constraints?: string[];
      examples?: Array<{ input: string; output: string; explanation?: string }>;
      time_complexity_expectation?: string;
      space_complexity_expectation?: string;
      input_format?: string;
      output_format?: string;
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
      looking_away_count?: number;
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
  const [gatedRelease, setGatedRelease] = useState<null | {
    title: string;
    scheduled_release_at: string | null;
    release_mode: string;
    message: string;
  }>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stop any active camera streams on this page
  useStopCameraOnMount();

  useEffect(() => {
    const interviewId = Number(params.id);
    if (!interviewId) return;

    let cancelled = false;

    const isEvaluationReady = (
      data: { evaluation_score?: { overall_percentage?: number; question_scores?: unknown } } | null,
    ) => {
      return (
        !!data &&
        !!data.evaluation_score &&
        typeof data.evaluation_score.overall_percentage === "number" &&
        // Require question_scores to be a real object too, so a half-written evaluation
        // keeps polling briefly instead of rendering an incomplete result.
        !!data.evaluation_score.question_scores &&
        typeof data.evaluation_score.question_scores === "object"
      );
    };

    const fetchOnce = async () => {
      try {
        const data = await mockInterviewService.getInterviewDetail(interviewId);
        if (cancelled) return;
        // Level-gauge (adaptive calibration) attempts are "no marks, no right or wrong" — the
        // backend hands back a redirect instead of scores; send the student to their course's
        // level insight rather than rendering a scored result page.
        const gaugeShape = data as { is_level_gauge?: boolean; redirect_url?: string };
        if (gaugeShape?.is_level_gauge) {
          router.replace(gaugeShape.redirect_url || "/adaptive-courses");
          return;
        }
        const gatedShape = data as {
          result_visible_to_student?: boolean;
          title?: string;
          scheduled_release_at?: string | null;
          result_release_mode?: string;
          message?: string;
        };
        if (gatedShape && gatedShape.result_visible_to_student === false) {
          setGatedRelease({
            title: gatedShape.title || "Interview",
            scheduled_release_at: gatedShape.scheduled_release_at ?? null,
            release_mode: gatedShape.result_release_mode || "manual",
            message:
              gatedShape.message ||
              "Your interview was submitted successfully. The evaluation will be released by your instructor.",
          });
          setEvaluationPending(false);
          setLoading(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          return;
        }
        setResult(data as InterviewResult);
        if (isEvaluationReady(data as { evaluation_score?: { overall_percentage?: number } })) {
          setEvaluationPending(false);
          setLoading(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        } else {
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
      return { bg: "var(--surface-green-light)", color: "var(--success-strong)", main: "var(--course-cta)" };
    if (percentage >= 60)
      return { bg: "var(--surface-blue-light)", color: "var(--info-strong)", main: "var(--accent-blue-light)" };
    if (percentage >= 40)
      return { bg: "var(--warning-surface)", color: "var(--warning-strong)", main: "var(--warning-amber)" };
    return { bg: "var(--error-surface)", color: "var(--error-strong)", main: "var(--ats-error)" };
  }, []);

  const getPerformanceLabel = useCallback((percentage: number) => {
    if (percentage >= 80) return "Excellent";
    if (percentage >= 60) return "Good";
    if (percentage >= 40) return "Average";
    return "Needs Improvement";
  }, []);

  const formatDate = useCallback((dateString: string | null | undefined) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime()) || date.getTime() <= 0) return "—";
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

  if (gatedRelease) {
    const scheduledText = gatedRelease.scheduled_release_at
      ? new Date(gatedRelease.scheduled_release_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;
    return (
      <MainLayout>
        <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, mb: 2, color: "var(--font-primary-dark)" }}
          >
            Interview submitted successfully
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "var(--font-secondary)", mb: 3, lineHeight: 1.6 }}
          >
            {gatedRelease.message}
          </Typography>
          {scheduledText && (
            <Typography
              variant="body2"
              sx={{
                color: "var(--accent-indigo)",
                fontWeight: 600,
                mb: 4,
              }}
            >
              Scheduled release: {scheduledText}
            </Typography>
          )}
          <Box
            sx={{
              display: "inline-flex",
              gap: 2,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Button
              variant="contained"
              onClick={() => router.push("/mock-interview")}
              sx={{
                px: 2.5,
                py: 1.25,
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "var(--accent-indigo)",
                color: "var(--font-light)",
                "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
              }}
            >
              Back to interviews
            </Button>
          </Box>
        </Container>
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

  // Normalized view-model: the API can return partial/missing nested objects (a
  // half-written evaluation, an interview with no transcript metadata, etc.). Accessing
  // those directly is what made the user-side result page throw a blank/error screen while
  // the admin page — which maps through its own defaulting adapter — worked. Default every
  // field once here and render from these locals only.
  const evaluation = {
    overall_score: result.evaluation_score.overall_score ?? 0,
    max_possible_score: result.evaluation_score.max_possible_score ?? 0,
    overall_percentage: result.evaluation_score.overall_percentage ?? 0,
    question_scores: result.evaluation_score.question_scores ?? {},
    strengths: result.evaluation_score.strengths ?? [],
    areas_for_improvement: result.evaluation_score.areas_for_improvement ?? [],
    overall_feedback: result.evaluation_score.overall_feedback ?? "",
  };
  const transcript = result.interview_transcript ?? ({} as InterviewResult["interview_transcript"]);
  const metadata = transcript.metadata ?? ({} as InterviewResult["interview_transcript"]["metadata"]);
  const responses = Array.isArray(transcript.responses) ? transcript.responses : [];
  const questions = Array.isArray(result.questions_for_interview)
    ? result.questions_for_interview
    : [];
  const totalDurationSeconds = transcript.total_duration_seconds ?? 0;

  const scoreColors = getScoreColor(evaluation.overall_percentage);

  return (
    <MainLayout>
      <ResultHeader
        title={result.title}
        topic={result.topic}
        subtopic={result.subtopic}
        difficulty={result.difficulty}
        duration_minutes={result.duration_minutes}
        overall_percentage={evaluation.overall_percentage}
        performanceLabel={getPerformanceLabel(evaluation.overall_percentage)}
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
            started_at={(() => {
              const candidate = result.started_at;
              if (candidate) {
                const d = new Date(candidate);
                if (!Number.isNaN(d.getTime()) && d.getTime() > 0) return candidate;
              }
              if (result.submitted_at && totalDurationSeconds) {
                const submitted = new Date(result.submitted_at);
                if (!Number.isNaN(submitted.getTime()) && submitted.getTime() > 0) {
                  return new Date(
                    submitted.getTime() - totalDurationSeconds * 1000,
                  ).toISOString();
                }
              }
              return result.created_at;
            })()}
            submitted_at={result.submitted_at}
            total_duration_seconds={totalDurationSeconds}
            formatDate={formatDate}
            formatDuration={formatDuration}
          />

          <PerformanceSummary
            overall_score={evaluation.overall_score}
            max_possible_score={evaluation.max_possible_score}
            overall_percentage={evaluation.overall_percentage}
            completed_questions={metadata.completed_questions ?? responses.length}
            total_questions={metadata.total_questions ?? questions.length}
            performanceLabel={getPerformanceLabel(evaluation.overall_percentage)}
          />
        </Box>

        {/* Proctoring Report */}
        <ProctoringReport
          tabSwitches={metadata.tabSwitches ?? 0}
          windowSwitches={metadata.windowSwitches ?? 0}
          fullscreen_exits={metadata.fullscreen_exits ?? 0}
          face_validation_failures={metadata.face_validation_failures ?? 0}
          looking_away_count={metadata.looking_away_count ?? 0}
          multiple_face_detections={metadata.multiple_face_detections ?? 0}
        />

        {/* Questions & Performance */}
        <QuestionPerformance
          questions={questions}
          question_scores={evaluation.question_scores}
          responses={responses}
          expandedQuestion={expandedQuestion}
          onQuestionToggle={handleQuestionToggle}
          getScoreColor={getScoreColor}
        />

        {/* Overall Feedback */}
        <OverallFeedback
          areas_for_improvement={evaluation.areas_for_improvement}
          overall_feedback={evaluation.overall_feedback}
        />
      </Container>
    </MainLayout>
  );
}
