"use client";

import { useState } from "react";
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CodingProblemListItem } from "@/lib/services/admin/admin-assessment.service";
import { PaginationControls } from "./PaginationControls";
import { ProblemDescription } from "@/components/coding/ProblemDescription";

interface CodingProblemWithSection extends CodingProblemListItem {
  sectionId: string;
}

interface CodingProblemsTableProps {
  problems: CodingProblemWithSection[];
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  sectionName?: string;
}

export function CodingProblemsTable({
  problems,
  page,
  limit,
  onPageChange,
  onLimitChange,
  sectionName,
}: CodingProblemsTableProps) {
  const [previewProblem, setPreviewProblem] = useState<CodingProblemWithSection | null>(null);
  const startIndex = (page - 1) * limit;
  const paginatedProblems = problems.slice(startIndex, startIndex + limit);
  const totalPages = Math.max(1, Math.ceil(problems.length / limit));

  const problemDataForPreview = (problem: CodingProblemWithSection) => {
    const details: Record<string, unknown> = {
      ...problem,
      title: problem.title,
      name: problem.title,
      problem_title: problem.title,
      problem_statement: problem.problem_statement ?? (problem as any).description ?? "",
    };
    const p = problem as Record<string, unknown>;
    if (p.solution && typeof p.solution === "object" && !Array.isArray(p.solution)) {
      details.pseudo_code = Object.entries(p.solution)
        .map(([lang, code]) => `[${lang}]\n${code}`)
        .join("\n\n");
    }
    return { content_title: problem.title, details };
  };

  if (problems.length === 0) {
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
          No problems found{sectionName ? ` in ${sectionName}` : ""}
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
                Problem
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, fontSize: "0.875rem", width: 120 }}
              >
                Difficulty
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, fontSize: "0.875rem", width: 150 }}
              >
                Topic
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, fontSize: "0.875rem", width: 120 }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedProblems.map((problem, index) => {
              const globalIndex = startIndex + index;
              return (
                <TableRow
                  key={problem.id || globalIndex}
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
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                      {problem.title || `Problem #${problem.id}`}
                    </Typography>
                    {problem.problem_statement && (
                      <Typography
                        variant="caption"
                        sx={{ color: "#6b7280", display: "block" }}
                      >
                        {problem.problem_statement.length > 200
                          ? problem.problem_statement.substring(0, 200) + "..."
                          : problem.problem_statement}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {problem.difficulty_level ? (
                      <Chip
                        label={problem.difficulty_level}
                        size="small"
                        sx={{
                          bgcolor:
                            problem.difficulty_level === "Easy"
                              ? "#fef3c7"
                              : problem.difficulty_level === "Medium"
                              ? "#fde68a"
                              : "#fed7aa",
                          color:
                            problem.difficulty_level === "Easy"
                              ? "#92400e"
                              : problem.difficulty_level === "Medium"
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
                  <TableCell>
                    <Typography variant="body2" sx={{ color: "#6b7280" }}>
                      {problem.tags || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <IconButton
                      size="small"
                      onClick={() => setPreviewProblem(problem)}
                      sx={{ color: "#6366f1" }}
                      title="Preview"
                    >
                      <IconWrapper icon="mdi:eye-outline" size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {problems.length > limit && (
        <PaginationControls
          totalItems={problems.length}
          page={page}
          limit={limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          itemLabel="problems"
        />
      )}

      <Dialog
        open={!!previewProblem}
        onClose={() => setPreviewProblem(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: "90vh", borderRadius: 2 },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Problem Preview</span>
          <IconButton
            size="small"
            onClick={() => setPreviewProblem(null)}
            aria-label="Close"
          >
            <IconWrapper icon="mdi:close" size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {previewProblem && (
            <Box
              sx={{
                overflow: "auto",
                flex: 1,
                minHeight: 0,
              }}
            >
              <ProblemDescription
                problemData={problemDataForPreview(previewProblem)}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Paper>
  );
}

