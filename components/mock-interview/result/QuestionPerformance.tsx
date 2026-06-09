"use client";

import {
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { memo, useState, useCallback } from "react";
import { StructuredQuestionViewModal } from "./StructuredQuestionViewModal";

interface Question {
  id: number;
  type: string;
  question_text: string;
  expected_key_points: string[];
  // Optional structured-question payloads stamped on `questions_for_interview` during the
  // live interview. Present only for the turns where the AI inserted a coding question
  // or an MCQ; consumed by the View-problem button below to re-render them.
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
}

interface QuestionScore {
  score: number;
  max_score: number;
  percentage: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface TranscriptResponse {
  question_id: number;
  answer?: string;
  question_text?: string;
}

interface QuestionPerformanceProps {
  questions: Question[];
  question_scores: Record<string, QuestionScore>;
  /**
   * The candidate's recorded responses, keyed by question_id. Used to render the candidate's
   * actual answer alongside the AI feedback so a reviewer can see what the candidate said,
   * not just how it scored.
   */
  responses?: TranscriptResponse[];
  expandedQuestion: number | false;
  onQuestionToggle: (id: number) => void;
  getScoreColor: (percentage: number) => { bg: string; color: string; main: string };
}

const QuestionPerformanceComponent = ({
  questions,
  question_scores,
  responses,
  expandedQuestion,
  onQuestionToggle,
  getScoreColor,
}: QuestionPerformanceProps) => {
  const responseById = new Map<number, TranscriptResponse>();
  (responses || []).forEach((r) => {
    if (typeof r.question_id === "number") responseById.set(r.question_id, r);
  });

  // Modal state for the "View problem" / "View MCQ" button on structured questions.
  // Tracks the question id whose problem is being viewed (null = closed).
  const [viewerQuestionId, setViewerQuestionId] = useState<number | null>(null);
  const openViewer = useCallback((id: number) => setViewerQuestionId(id), []);
  const closeViewer = useCallback(() => setViewerQuestionId(null), []);
  const viewerQuestion =
    viewerQuestionId !== null
      ? questions.find((q) => q.id === viewerQuestionId) ?? null
      : null;
  const viewerAnswer =
    viewerQuestionId !== null
      ? responseById.get(viewerQuestionId)?.answer
      : undefined;
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid #e5e7eb",
        mb: 4,
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
        Questions & Performance
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {questions.map((question, index) => {
          const questionScore = question_scores[question.id];
          const percentage = questionScore?.percentage || 0;
          const scoreColor = getScoreColor(percentage);

          return (
            <Accordion
              key={question.id}
              expanded={expandedQuestion === question.id}
              onChange={() => onQuestionToggle(question.id)}
              sx={{
                borderRadius: 2,
                border: "1px solid #e5e7eb",
                "&:before": { display: "none" },
                boxShadow: "none",
              }}
            >
              <AccordionSummary
                expandIcon={<IconWrapper icon="mdi:chevron-down" size={24} />}
                sx={{ "&:hover": { backgroundColor: "#f9fafb" } }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: scoreColor.bg,
                      color: scoreColor.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Box sx={{ flex: 1, mr: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {question.question_text}
                      </Typography>
                      <Chip
                        label={question.type}
                        size="small"
                        sx={{
                          backgroundColor:
                            question.type === "practical" ? "#dbeafe" : "#f3f4f6",
                          color: question.type === "practical" ? "#1e40af" : "#374151",
                          fontSize: "0.7rem",
                          height: 20,
                        }}
                      />
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          flex: 1,
                          height: 8,
                          borderRadius: 1,
                          backgroundColor: "#f3f4f6",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: scoreColor.main,
                            borderRadius: 1,
                          },
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: scoreColor.main, minWidth: 80 }}
                      >
                        {questionScore?.score || 0}/{questionScore?.max_score || 0} (
                        {percentage}%)
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Divider sx={{ mb: 3 }} />

                {/* "View problem" button — only renders for structured turns (coding
                    or MCQ). Opens a read-only modal that re-renders the original problem
                    statement + starter code (coding) or the option list with the correct
                    answer highlighted (MCQ). The reviewer / candidate can revisit the
                    exact payload that was shown during the live interview. */}
                {(() => {
                  const qtype = (question.type || "").toLowerCase();
                  const hasCoding =
                    qtype === "coding" && !!question.coding_problem?.statement;
                  const hasMCQ =
                    qtype === "mcq" && (question.mcq_options?.length ?? 0) >= 2;
                  if (!hasCoding && !hasMCQ) return null;
                  return (
                    <Box sx={{ mb: 3 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={
                          <IconWrapper
                            icon={
                              hasCoding
                                ? "mdi:code-braces"
                                : "mdi:format-list-checks"
                            }
                            size={18}
                          />
                        }
                        onClick={() => openViewer(question.id)}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          borderColor: "var(--accent-indigo)",
                          color: "var(--accent-indigo)",
                          "&:hover": {
                            backgroundColor: "var(--surface-indigo-light)",
                            borderColor: "var(--accent-indigo-dark)",
                          },
                        }}
                      >
                        {hasCoding ? "View coding problem" : "View MCQ"}
                      </Button>
                    </Box>
                  );
                })()}

                {/* Candidate's actual answer (what the user said in response to this
                    question). Pulled from interview_transcript.responses keyed by question id. */}
                {(() => {
                  const candidateAnswer = responseById.get(question.id)?.answer?.trim();
                  if (!candidateAnswer) return null;
                  return (
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, mb: 1, color: "var(--font-primary-dark)" }}
                      >
                        Your Answer
                      </Typography>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          backgroundColor: "var(--surface-indigo-light)",
                          border:
                            "1px solid color-mix(in srgb, var(--accent-indigo) 25%, transparent)",
                          borderRadius: 2,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: "var(--font-primary-dark)" }}
                        >
                          {candidateAnswer}
                        </Typography>
                      </Paper>
                    </Box>
                  );
                })()}

                {/* Feedback */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 1, color: "#1f2937" }}
                  >
                    Feedback
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      backgroundColor: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "#4b5563" }}>
                      {questionScore?.feedback || "No feedback available"}
                    </Typography>
                  </Paper>
                </Box>

                {/* Strengths */}
                {questionScore?.strengths && questionScore.strengths.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        mb: 1,
                        color: "#1f2937",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <IconWrapper icon="mdi:check-circle" size={18} color="#10b981" />
                      Strengths
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {questionScore.strengths.map((strength, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1,
                            p: 1.5,
                            backgroundColor: "#f0fdf4",
                            borderRadius: 2,
                            border: "1px solid #bbf7d0",
                          }}
                        >
                          <IconWrapper
                            icon="mdi:arrow-right-circle"
                            size={18}
                            color="#16a34a"
                          />
                          <Typography variant="body2" sx={{ color: "#15803d" }}>
                            {strength}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Improvements */}
                {questionScore?.improvements && questionScore.improvements.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        mb: 1,
                        color: "#1f2937",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <IconWrapper icon="mdi:lightbulb-on" size={18} color="#f59e0b" />
                      Areas for Improvement
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {questionScore.improvements.map((improvement, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1,
                            p: 1.5,
                            backgroundColor: "#fef3c7",
                            borderRadius: 2,
                            border: "1px solid #fde68a",
                          }}
                        >
                          <IconWrapper
                            icon="mdi:arrow-right-circle"
                            size={18}
                            color="#d97706"
                          />
                          <Typography variant="body2" sx={{ color: "#b45309" }}>
                            {improvement}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Expected Key Points — only when present (guards against missing/empty
                    expected_key_points so a structured/coding turn without them doesn't crash
                    or render an empty heading). */}
                {(question.expected_key_points ?? []).length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, mb: 1, color: "#1f2937" }}
                    >
                      Expected Key Points
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      {(question.expected_key_points ?? []).map((point, idx) => (
                        <Box
                          key={idx}
                          sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
                        >
                          <IconWrapper icon="mdi:circle-small" size={18} color="#6b7280" />
                          <Typography variant="body2" sx={{ color: "#6b7280" }}>
                            {point}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
      <StructuredQuestionViewModal
        open={viewerQuestionId !== null}
        onClose={closeViewer}
        question={viewerQuestion}
        candidateAnswer={viewerAnswer}
      />
    </Paper>
  );
};

export const QuestionPerformance = memo(QuestionPerformanceComponent);
QuestionPerformance.displayName = "QuestionPerformance";

