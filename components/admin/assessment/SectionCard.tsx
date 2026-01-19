"use client";

import { Box, Typography, Paper, Chip, Divider } from "@mui/material";
import { Section } from "./MultipleSectionsSection";
import { MCQ, CodingProblemListItem } from "@/lib/services/admin/admin-assessment.service";

interface SectionCardProps {
  section: Section;
  isSelected: boolean;
  onClick: () => void;
  sectionMCQs?: MCQ[];
  sectionProblems?: CodingProblemListItem[];
  type: "quiz" | "coding";
}

export function SectionCard({
  section,
  isSelected,
  onClick,
  sectionMCQs = [],
  sectionProblems = [],
  type,
}: SectionCardProps) {
  const isQuiz = type === "quiz";
  const items = isQuiz ? sectionMCQs : sectionProblems;
  const itemsToShow = section.number_of_questions_to_show || items.length;

  // Calculate scores and breakdowns
  let maxPossibleScore = 0;
  let difficultyBreakdown: Record<string, number> = {};

  if (isQuiz) {
    const easyCount = sectionMCQs.filter((q) => q.difficulty_level === "Easy").length;
    const mediumCount = sectionMCQs.filter((q) => q.difficulty_level === "Medium").length;
    const hardCount = sectionMCQs.filter((q) => q.difficulty_level === "Hard").length;
    maxPossibleScore =
      easyCount * (section.easyScore || 1) +
      mediumCount * (section.mediumScore || 2) +
      hardCount * (section.hardScore || 3);
    difficultyBreakdown = { Easy: easyCount, Medium: mediumCount, Hard: hardCount };
  } else {
    const easyCount = sectionProblems.filter((p) => (p.difficulty_level || "").toLowerCase() === "easy").length;
    const mediumCount = sectionProblems.filter((p) => (p.difficulty_level || "").toLowerCase() === "medium").length;
    const hardCount = sectionProblems.filter((p) => (p.difficulty_level || "").toLowerCase() === "hard").length;
    maxPossibleScore =
      easyCount * (section.easyScore || 1) +
      mediumCount * (section.mediumScore || 2) +
      hardCount * (section.hardScore || 3);
    difficultyBreakdown = { Easy: easyCount, Medium: mediumCount, Hard: hardCount };
  }

  const bgColor = isQuiz
    ? isSelected
      ? "#e0e7ff"
      : "#eef2ff"
    : isSelected
    ? "#a7f3d0"
    : "#d1fae5";
  const borderColor = isQuiz
    ? isSelected
      ? "#4f46e5"
      : "#6366f1"
    : isSelected
    ? "#059669"
    : "#10b981";
  const chipColor = isQuiz ? "#6366f1" : "#10b981";

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
          bgcolor: isQuiz ? "#e0e7ff" : "#a7f3d0",
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
            <Typography variant="caption" sx={{ color: "#6b7280", display: "block" }}>
              {section.description}
            </Typography>
          )}
        </Box>
        <Chip
          label={`Order ${section.order}`}
          size="small"
          sx={{ bgcolor: chipColor, color: "white", fontWeight: 600 }}
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
            sx={{ color: "#6b7280", display: "block", mb: 0.5 }}
          >
            {isQuiz ? "Questions" : "Problems"}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={`Total: ${items.length}`}
              size="small"
              sx={{ bgcolor: "white", fontWeight: 600 }}
            />
            {section.number_of_questions_to_show && (
              <Chip
                label={`Showing: ${itemsToShow}`}
                size="small"
                sx={{
                  bgcolor: isQuiz ? "#dbeafe" : "#a7f3d0",
                  color: isQuiz ? "#1e40af" : "#065f46",
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
                          ? "#d1fae5"
                          : level === "Medium"
                          ? "#fef3c7"
                          : "#fed7aa",
                      color:
                        level === "Easy"
                          ? "#065f46"
                          : level === "Medium"
                          ? "#92400e"
                          : "#7c2d12",
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
            sx={{ color: "#6b7280", display: "block", mb: 0.5 }}
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
                    sx={{ bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600 }}
                  />
                  <Chip
                    label={`Medium: ${section.mediumScore || 2} pts`}
                    size="small"
                    sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 600 }}
                  />
                  <Chip
                    label={`Hard: ${section.hardScore || 3} pts`}
                    size="small"
                    sx={{ bgcolor: "#fed7aa", color: "#7c2d12", fontWeight: 600 }}
                  />
                </Box>
                {sectionMCQs.length > 0 && (
                  <Typography
                    variant="caption"
                    sx={{ color: "#6366f1", fontWeight: 600, mt: 0.5 }}
                  >
                    Max Possible Score: {maxPossibleScore} points
                  </Typography>
                )}
              </>
            ) : (
              <>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Chip
                    label={`Easy: ${section.easyScore || 1} pts`}
                    size="small"
                    sx={{ bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600 }}
                  />
                  <Chip
                    label={`Medium: ${section.mediumScore || 2} pts`}
                    size="small"
                    sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 600 }}
                  />
                  <Chip
                    label={`Hard: ${section.hardScore || 3} pts`}
                    size="small"
                    sx={{ bgcolor: "#fed7aa", color: "#7c2d12", fontWeight: 600 }}
                  />
                </Box>
                {sectionProblems.length > 0 && (
                  <Typography
                    variant="caption"
                    sx={{ color: "#10b981", fontWeight: 600, mt: 0.5 }}
                  >
                    Max Possible Score: {maxPossibleScore} points
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

