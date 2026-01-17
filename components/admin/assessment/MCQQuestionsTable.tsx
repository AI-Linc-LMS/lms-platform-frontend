"use client";

import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { MCQ } from "@/lib/services/admin/admin-assessment.service";
import { PaginationControls } from "./PaginationControls";

interface MCQWithSection extends MCQ {
  sectionId: string;
}

interface MCQQuestionsTableProps {
  mcqs: MCQWithSection[];
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  sectionName?: string;
}

export function MCQQuestionsTable({
  mcqs,
  page,
  limit,
  onPageChange,
  onLimitChange,
  sectionName,
}: MCQQuestionsTableProps) {
  const startIndex = (page - 1) * limit;
  const paginatedMCQs = mcqs.slice(startIndex, startIndex + limit);
  const totalPages = Math.max(1, Math.ceil(mcqs.length / limit));

  if (mcqs.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: "center",
          bgcolor: "#fef3c7",
          border: "1px solid #fde68a",
        }}
      >
        <Typography variant="body1" sx={{ color: "#78350f", fontWeight: 600 }}>
          No questions found{sectionName ? ` in ${sectionName}` : ""}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        overflow: "hidden",
        width: "100%",
      }}
    >
      <TableContainer sx={{ width: "100%" }}>
        <Table sx={{ width: "100%" }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f9fafb" }}>
              <TableCell
                sx={{ fontWeight: 600, fontSize: "0.875rem", width: 60 }}
              >
                #
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, fontSize: "0.875rem", minWidth: 400 }}
              >
                Question
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, fontSize: "0.875rem", width: 80 }}
              >
                Correct
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, fontSize: "0.875rem", width: 120 }}
              >
                Difficulty
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedMCQs.map((mcq, index) => {
              const globalIndex = startIndex + index;
              return (
                <TableRow
                  key={globalIndex}
                  sx={{ "&:hover": { backgroundColor: "#f9fafb" } }}
                >
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#6b7280",
                        fontFamily: "monospace",
                        fontWeight: 600,
                      }}
                    >
                      {globalIndex + 1}
                    </Typography>
                  </TableCell>
                  <TableCell
                    sx={{
                      maxWidth: "none",
                      width: "auto",
                      minWidth: 400,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                      {mcq.question_text}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                        mt: 1,
                      }}
                    >
                      {["A", "B", "C", "D"].map((option) => {
                        const optionText = mcq[
                          `option_${option.toLowerCase()}` as keyof MCQ
                        ] as string;
                        const isCorrect = mcq.correct_option === option;
                        return (
                          <Chip
                            key={option}
                            label={`${option}: ${
                              optionText.length > 40
                                ? optionText.substring(0, 40) + "..."
                                : optionText
                            }`}
                            size="small"
                            sx={{
                              bgcolor: isCorrect ? "#d1fae5" : "#f3f4f6",
                              color: isCorrect ? "#065f46" : "#374151",
                              fontWeight: isCorrect ? 600 : 400,
                              fontSize: "0.75rem",
                              height: 24,
                            }}
                          />
                        );
                      })}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={mcq.correct_option}
                      size="small"
                      sx={{
                        bgcolor: "#10b981",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        width: 36,
                        height: 36,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {mcq.difficulty_level ? (
                      <Chip
                        label={mcq.difficulty_level}
                        size="small"
                        sx={{
                          bgcolor:
                            mcq.difficulty_level === "Easy"
                              ? "#fef3c7"
                              : mcq.difficulty_level === "Medium"
                              ? "#fde68a"
                              : "#fed7aa",
                          color:
                            mcq.difficulty_level === "Easy"
                              ? "#92400e"
                              : mcq.difficulty_level === "Medium"
                              ? "#78350f"
                              : "#7c2d12",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                        }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                        -
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {mcqs.length > limit && (
        <PaginationControls
          totalItems={mcqs.length}
          page={page}
          limit={limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          itemLabel="questions"
        />
      )}
    </Paper>
  );
}

