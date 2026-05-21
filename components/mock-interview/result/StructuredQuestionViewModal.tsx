"use client";

import { memo } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export interface StructuredQuestionViewModalProps {
  open: boolean;
  onClose: () => void;
  question:
    | {
        id: number;
        type: string;
        question_text: string;
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
      }
    | null;
  candidateAnswer?: string;
}

function parseCodingAnswer(answer: string | undefined): { code: string; language?: string } {
  if (!answer) return { code: "" };
  const match = answer.match(/^\[Coding answer\s*·\s*([^\]]+)\]\s*\n([\s\S]*)$/);
  if (match) {
    return { code: match[2], language: match[1].trim() };
  }
  return { code: answer };
}

function parseMCQAnswer(answer: string | undefined): string[] {
  if (!answer) return [];
  const match = answer.match(/\(ids:\s*([^)]*)\)/i);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && s !== "—");
}

const StructuredQuestionViewModalComponent = ({
  open,
  onClose,
  question,
  candidateAnswer,
}: StructuredQuestionViewModalProps) => {
  if (!question) return null;
  const qtype = (question.type || "").toLowerCase();
  const isCoding = qtype === "coding" && !!question.coding_problem;
  const isMCQ = qtype === "mcq" && (question.mcq_options?.length ?? 0) >= 2;

  if (!isCoding && !isMCQ) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isCoding ? "lg" : "sm"}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: "var(--card-bg)",
          color: "var(--font-primary-dark)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          borderBottom: "1px solid var(--border-default)",
          backgroundColor: "var(--surface)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <IconWrapper
            icon={isCoding ? "mdi:code-braces" : "mdi:format-list-checks"}
            size={22}
            color="var(--accent-indigo)"
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {isCoding ? "Coding Question" : "Multiple Choice Question"}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close" size="small">
          <IconWrapper icon="mdi:close" size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        {question.question_text && (
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              mb: 2.5,
              backgroundColor: "var(--surface-indigo-light)",
              border: "1px solid var(--accent-indigo)",
              borderRadius: 2,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "var(--accent-indigo)",
                mb: 0.5,
              }}
            >
              Interviewer said
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
              {question.question_text}
            </Typography>
          </Paper>
        )}

        {isCoding && question.coding_problem && (
          <CodingProblemView
            problem={question.coding_problem}
            candidateAnswer={candidateAnswer}
          />
        )}

        {isMCQ && question.mcq_options && (
          <MCQView
            options={question.mcq_options}
            multiSelect={!!question.mcq_multi_select}
            correctIds={question.mcq_correct_option_ids || []}
            candidateSelectedIds={parseMCQAnswer(candidateAnswer)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

function CodingProblemView({
  problem,
  candidateAnswer,
}: {
  problem: NonNullable<StructuredQuestionViewModalProps["question"]>["coding_problem"];
  candidateAnswer?: string;
}) {
  if (!problem) return null;
  const submitted = parseCodingAnswer(candidateAnswer);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Section title="Problem">
        <Typography
          variant="body2"
          sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
        >
          {problem.statement}
        </Typography>
      </Section>

      {problem.sample_input && (
        <Section title="Sample Input">
          <CodeBlock content={problem.sample_input} />
        </Section>
      )}
      {problem.sample_output && (
        <Section title="Sample Output">
          <CodeBlock content={problem.sample_output} />
        </Section>
      )}

      <Section
        title={`Starter Code (${problem.language || "code"})`}
        chip={problem.language ? problem.language.toUpperCase() : undefined}
      >
        <CodeBlock content={problem.starter_code} maxHeight={260} />
      </Section>

      {submitted.code && (
        <Section
          title="Candidate's Submission"
          chip={submitted.language ? submitted.language.toUpperCase() : undefined}
        >
          <CodeBlock content={submitted.code} maxHeight={320} />
        </Section>
      )}
    </Box>
  );
}

function MCQView({
  options,
  multiSelect,
  correctIds,
  candidateSelectedIds,
}: {
  options: { id: string; text: string }[];
  multiSelect: boolean;
  correctIds: string[];
  candidateSelectedIds: string[];
}) {
  const correctSet = new Set(correctIds);
  const selectedSet = new Set(candidateSelectedIds);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "var(--font-secondary)",
          mb: 0.25,
        }}
      >
        {multiSelect ? "Multi-select" : "Single-select"} · Options
      </Typography>
      {options.map((opt) => {
        const isCorrect = correctSet.has(opt.id);
        const wasPicked = selectedSet.has(opt.id);
        const borderColor = wasPicked
          ? isCorrect
            ? "var(--ats-success)"
            : "var(--ats-error)"
          : isCorrect
            ? "var(--ats-success)"
            : "var(--border-default)";
        const bg = wasPicked
          ? isCorrect
            ? "color-mix(in srgb, var(--ats-success) 14%, var(--card-bg))"
            : "color-mix(in srgb, var(--ats-error) 12%, var(--card-bg))"
          : isCorrect
            ? "color-mix(in srgb, var(--ats-success) 6%, var(--card-bg))"
            : "var(--card-bg)";
        return (
          <Box
            key={opt.id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 1.5,
              py: 1.25,
              borderRadius: 2,
              border: "1px solid",
              borderColor,
              backgroundColor: bg,
            }}
          >
            <Box
              component="span"
              sx={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                backgroundColor: isCorrect
                  ? "var(--ats-success)"
                  : "var(--surface)",
                color: isCorrect ? "var(--font-light)" : "var(--font-secondary)",
                fontWeight: 700,
                fontSize: "0.7rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              {opt.id}
            </Box>
            <Typography variant="body2" sx={{ flex: 1 }}>
              {opt.text}
            </Typography>
            {isCorrect && (
              <IconWrapper
                icon="mdi:check-circle"
                size={18}
                color="var(--ats-success)"
              />
            )}
            {wasPicked && !isCorrect && (
              <IconWrapper
                icon="mdi:close-circle"
                size={18}
                color="var(--ats-error)"
              />
            )}
            {wasPicked && (
              <Box
                component="span"
                sx={{
                  px: 0.75,
                  py: 0.15,
                  borderRadius: 1,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  backgroundColor: isCorrect
                    ? "var(--ats-success)"
                    : "var(--ats-error)",
                  color: "var(--font-light)",
                }}
              >
                Your pick
              </Box>
            )}
          </Box>
        );
      })}
      {candidateSelectedIds.length === 0 && (
        <Typography
          variant="caption"
          sx={{ color: "var(--font-tertiary)", fontStyle: "italic", mt: 0.5 }}
        >
          No selection was recorded for this question.
        </Typography>
      )}
    </Box>
  );
}

function Section({
  title,
  chip,
  children,
}: {
  title: string;
  chip?: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 0.75,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "var(--font-secondary)",
          }}
        >
          {title}
        </Typography>
        {chip && (
          <Box
            component="span"
            sx={{
              px: 0.75,
              py: 0.1,
              borderRadius: 1,
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              backgroundColor: "var(--surface-indigo-light)",
              color: "var(--accent-indigo)",
            }}
          >
            {chip}
          </Box>
        )}
      </Box>
      {children}
    </Box>
  );
}

function CodeBlock({
  content,
  maxHeight,
}: {
  content: string;
  maxHeight?: number;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--surface)",
        maxHeight,
        overflow: maxHeight ? "auto" : "visible",
      }}
    >
      <Box
        component="pre"
        sx={{
          m: 0,
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Cascadia Mono', monospace",
          fontSize: "0.82rem",
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          color: "var(--font-primary-dark)",
        }}
      >
        {content}
      </Box>
    </Paper>
  );
}

export const StructuredQuestionViewModal = memo(
  StructuredQuestionViewModalComponent,
);
StructuredQuestionViewModal.displayName = "StructuredQuestionViewModal";
