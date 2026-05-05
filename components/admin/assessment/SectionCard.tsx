"use client";

import { Box, Typography, Paper, Chip, Divider } from "@mui/material";
import { Section } from "./MultipleSectionsSection";
import { MCQ, CodingProblemListItem } from "@/lib/services/admin/admin-assessment.service";

export type WrittenPromptPreview = {
  question_text: string;
  max_marks: number;
  answer_mode?: string;
};

interface SectionCardProps {
  section: Section;
  isSelected: boolean;
  onClick: () => void;
  sectionMCQs?: MCQ[];
  sectionProblems?: CodingProblemListItem[];
  sectionWrittenPrompts?: WrittenPromptPreview[];
  type: "quiz" | "coding" | "subjective";
}

export function SectionCard({
  section,
  isSelected,
  onClick,
  sectionMCQs = [],
  sectionProblems = [],
  sectionWrittenPrompts = [],
  type,
}: SectionCardProps) {
  const isQuiz = type === "quiz";
  const isCoding = type === "coding";
  const isWritten = type === "subjective";
  const items = isQuiz
    ? sectionMCQs
    : isCoding
    ? sectionProblems
    : sectionWrittenPrompts;
  const itemsToShow = section.number_of_questions_to_show || items.length;

  // Calculate scores and breakdowns
  let maxPossibleScore = 0;
  let difficultyBreakdown: Record<string, number> = {};
  let answerModeBreakdown: Record<string, number> = {};

  if (isQuiz) {
    const easyCount = sectionMCQs.filter((q) => q.difficulty_level === "Easy").length;
    const mediumCount = sectionMCQs.filter((q) => q.difficulty_level === "Medium").length;
    const hardCount = sectionMCQs.filter((q) => q.difficulty_level === "Hard").length;
    maxPossibleScore =
      easyCount * (section.easyScore || 1) +
      mediumCount * (section.mediumScore || 2) +
      hardCount * (section.hardScore || 3);
    difficultyBreakdown = { Easy: easyCount, Medium: mediumCount, Hard: hardCount };
  } else if (isCoding) {
    const easyCount = sectionProblems.filter((p) => (p.difficulty_level || "").toLowerCase() === "easy").length;
    const mediumCount = sectionProblems.filter((p) => (p.difficulty_level || "").toLowerCase() === "medium").length;
    const hardCount = sectionProblems.filter((p) => (p.difficulty_level || "").toLowerCase() === "hard").length;
    maxPossibleScore =
      easyCount * (section.easyScore || 1) +
      mediumCount * (section.mediumScore || 2) +
      hardCount * (section.hardScore || 3);
    difficultyBreakdown = { Easy: easyCount, Medium: mediumCount, Hard: hardCount };
  } else if (isWritten) {
    maxPossibleScore = sectionWrittenPrompts.reduce((sum, p) => sum + (p.max_marks || 0), 0);
    sectionWrittenPrompts.forEach((p) => {
      const mode = (p.answer_mode || "text").trim() || "text";
      answerModeBreakdown[mode] = (answerModeBreakdown[mode] || 0) + 1;
    });
  }

  const bgColor = isQuiz
    ? isSelected
      ? "color-mix(in srgb, var(--accent-indigo) 18%, var(--surface) 82%)"
      : "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)"
    : isCoding
    ? isSelected
      ? "color-mix(in srgb, var(--success-500) 32%, var(--border-default) 68%)"
      : "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
    : isSelected
    ? "color-mix(in srgb, var(--warning-500) 28%, var(--border-default) 72%)"
    : "color-mix(in srgb, var(--warning-500) 14%, var(--surface) 86%)";
  const borderColor = isQuiz
    ? isSelected
      ? "var(--accent-indigo-dark)"
      : "var(--accent-indigo)"
    : isCoding
    ? isSelected
      ? "var(--success-500)"
      : "var(--success-500)"
    : isSelected
    ? "var(--warning-500)"
    : "var(--warning-500)";
  const chipColor = isQuiz
    ? "var(--accent-indigo)"
    : isCoding
    ? "var(--success-500)"
    : "var(--warning-500)";

  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 2,
        mb: 1.5,
        bgcolor: bgColor,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 1,
        cursor: "pointer",
        transition: "all 0.2s",
        "&:hover": {
          bgcolor: isQuiz
            ? "color-mix(in srgb, var(--accent-indigo) 18%, var(--surface) 82%)"
            : isCoding
            ? "color-mix(in srgb, var(--success-500) 32%, var(--border-default) 68%)"
            : "color-mix(in srgb, var(--warning-500) 22%, var(--border-default) 78%)",
          transform: "translateX(2px)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 1.5,
        }}
      >
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
            {section.title}
          </Typography>
          {section.description && (
            <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block" }}>
              {section.description}
            </Typography>
          )}
        </Box>
        <Chip
          label={`Order ${section.order}`}
          size="small"
          sx={{ bgcolor: chipColor, color: "var(--font-light)", fontWeight: 600 }}
        />
      </Box>
      <Divider sx={{ my: 1.5 }} />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
          },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "var(--font-secondary)", display: "block", mb: 0.5 }}
          >
            {isQuiz ? "Questions" : isCoding ? "Problems" : "Prompts"}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={`Total: ${items.length}`}
              size="small"
              sx={{ bgcolor: "var(--font-light)", fontWeight: 600 }}
            />
            {section.number_of_questions_to_show && (
              <Chip
                label={`Showing: ${itemsToShow}`}
                size="small"
                sx={{
                  bgcolor: isQuiz
                    ? "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)"
                    : isCoding
                    ? "color-mix(in srgb, var(--success-500) 32%, var(--border-default) 68%)"
                    : "color-mix(in srgb, var(--warning-500) 22%, var(--border-default) 78%)",
                  color: isQuiz
                    ? "var(--accent-indigo)"
                    : isCoding
                    ? "var(--success-500)"
                    : "var(--warning-500)",
                  fontWeight: 600,
                }}
              />
            )}
          </Box>
          {Object.keys(difficultyBreakdown).length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1 }}>
              {Object.entries(difficultyBreakdown)
                .filter(([_, count]) => count > 0)
                .map(([level, count]) => (
                  <Chip
                    key={level}
                    label={`${level}: ${count}`}
                    size="small"
                    sx={{
                      bgcolor:
                        level === "Easy"
                          ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                          : level === "Medium"
                          ? "color-mix(in srgb, var(--warning-500) 16%, var(--surface) 84%)"
                          : "color-mix(in srgb, var(--warning-500) 24%, var(--surface) 76%)",
                      color:
                        level === "Easy"
                          ? "var(--success-500)"
                          : level === "Medium"
                          ? "var(--warning-500)"
                          : "var(--error-500)",
                      fontSize: "0.7rem",
                    }}
                  />
                ))}
            </Box>
          )}
          {isWritten && Object.keys(answerModeBreakdown).length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1 }}>
              {Object.entries(answerModeBreakdown).map(([mode, count]) => (
                <Chip
                  key={mode}
                  label={`${mode}: ${count}`}
                  size="small"
                  sx={{
                    bgcolor: "color-mix(in srgb, var(--warning-500) 16%, var(--surface) 84%)",
                    color: "var(--warning-500)",
                    fontSize: "0.7rem",
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "var(--font-secondary)", display: "block", mb: 0.5 }}
          >
            Scoring Configuration
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {isQuiz ? (
              <>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Chip
                    label={`Easy: ${section.easyScore || 1} pts`}
                    size="small"
                    sx={{ bgcolor: "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)", color: "var(--success-500)", fontWeight: 600 }}
                  />
                  <Chip
                    label={`Medium: ${section.mediumScore || 2} pts`}
                    size="small"
                    sx={{ bgcolor: "color-mix(in srgb, var(--warning-500) 16%, var(--surface) 84%)", color: "var(--warning-500)", fontWeight: 600 }}
                  />
                  <Chip
                    label={`Hard: ${section.hardScore || 3} pts`}
                    size="small"
                    sx={{ bgcolor: "color-mix(in srgb, var(--warning-500) 24%, var(--surface) 76%)", color: "var(--error-500)", fontWeight: 600 }}
                  />
                </Box>
                {sectionMCQs.length > 0 && (
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--accent-indigo)", fontWeight: 600, mt: 0.5 }}
                  >
                    Max Possible Score: {maxPossibleScore} points
                  </Typography>
                )}
              </>
            ) : isCoding ? (
              <>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Chip
                    label={`Easy: ${section.easyScore || 1} pts`}
                    size="small"
                    sx={{ bgcolor: "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)", color: "var(--success-500)", fontWeight: 600 }}
                  />
                  <Chip
                    label={`Medium: ${section.mediumScore || 2} pts`}
                    size="small"
                    sx={{ bgcolor: "color-mix(in srgb, var(--warning-500) 16%, var(--surface) 84%)", color: "var(--warning-500)", fontWeight: 600 }}
                  />
                  <Chip
                    label={`Hard: ${section.hardScore || 3} pts`}
                    size="small"
                    sx={{ bgcolor: "color-mix(in srgb, var(--warning-500) 24%, var(--surface) 76%)", color: "var(--error-500)", fontWeight: 600 }}
                  />
                </Box>
                {sectionProblems.length > 0 && (
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--success-500)", fontWeight: 600, mt: 0.5 }}
                  >
                    Max Possible Score: {maxPossibleScore} points
                  </Typography>
                )}
              </>
            ) : (
              <>
                <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block" }}>
                  Marks sum from each prompt (written sections).
                </Typography>
                {sectionWrittenPrompts.length > 0 && (
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--warning-500)", fontWeight: 600, mt: 0.5 }}
                  >
                    Total marks (prompts): {maxPossibleScore}
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

