"use client";

import {
  Paper,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { memo, Fragment } from "react";
import type {
  AdminQuestionForInterview,
  TranscriptResponse,
  EvaluationScore,
} from "@/lib/services/admin/admin-mock-interview.service";

interface AdminQuestionPerformanceProps {
  questions: AdminQuestionForInterview[];
  responses: TranscriptResponse[];
  evaluationScore?: EvaluationScore | null;
  expandedQuestion: number | false;
  onQuestionToggle: (questionNumber: number) => void;
}

function getResponseForQuestion(
  responses: TranscriptResponse[],
  questionNumber: number
): string | undefined {
  const r = responses.find((x) => x.question_number === questionNumber);
  return r?.response;
}

const AdminQuestionPerformanceComponent = ({
  questions,
  responses,
  evaluationScore,
  expandedQuestion,
  onQuestionToggle,
}: AdminQuestionPerformanceProps) => {
  const criteriaLabels: Record<string, string> = {
    technical_accuracy: "Technical Accuracy",
    communication: "Communication",
    problem_solving: "Problem Solving",
    code_quality: "Code Quality",
  };

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
        Questions & Responses
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {questions.map((q, index) => {
          const response = getResponseForQuestion(responses, q.question_number);
          const isExpanded = expandedQuestion === q.question_number;
          const itemKey = `question-${q.question_number}-${index}`;

          return (
            <Fragment key={itemKey}>
              <Accordion
                expanded={isExpanded}
                onChange={() => onQuestionToggle(q.question_number)}
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
                      backgroundColor: "#e0e7ff",
                      color: "#4338ca",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
                    {q.question}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 1, color: "#1f2937" }}
                  >
                    Student Response
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
                    <Typography variant="body2" sx={{ color: "#4b5563", whiteSpace: "pre-wrap" }}>
                      {response || "No response recorded"}
                    </Typography>
                  </Paper>
                </Box>
              </AccordionDetails>
            </Accordion>
            </Fragment>
          );
        })}
      </Box>

      {/* Criteria breakdown - show once for the whole interview */}
      {evaluationScore && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "#1f2937" }}>
            Evaluation Criteria
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
              gap: 2,
            }}
          >
            {(["technical_accuracy", "communication", "problem_solving", "code_quality"] as const).map(
              (key) => {
                const value = evaluationScore[key];
                if (value == null) return null;
                return (
                  <Box
                    key={key}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "#16a34a", fontWeight: 600 }}>
                      {criteriaLabels[key]}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#15803d" }}>
                      {value}
                    </Typography>
                  </Box>
                );
              }
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export const AdminQuestionPerformance = memo(AdminQuestionPerformanceComponent);
AdminQuestionPerformance.displayName = "AdminQuestionPerformance";
