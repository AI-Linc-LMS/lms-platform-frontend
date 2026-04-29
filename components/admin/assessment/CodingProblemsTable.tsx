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
          bgcolor: "color-mix(in srgb, var(--warning-500) 14%, var(--surface) 86%)",
          border:
            "1px solid color-mix(in srgb, var(--warning-500) 35%, var(--border-default) 65%)",
        }}
      >
        <Typography variant="body1" sx={{ color: "var(--warning-500)", fontWeight: 600 }}>
          No problems found{sectionName ? ` in ${sectionName}` : ""}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        borderRadius: 2,
        boxShadow:
          "0 1px 3px color-mix(in srgb, var(--font-primary) 12%, transparent)",
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
        overflow: "hidden",
        width: "100%",
      }}
    >
      <TableContainer sx={{ width: "100%" }}>
        <Table sx={{ width: "100%" }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "var(--surface)" }}>
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
                  sx={{ "&:hover": { backgroundColor: "var(--surface)" } }}
                >
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "var(--font-secondary)",
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
                        sx={{ color: "var(--font-secondary)", display: "block" }}
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
                              ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                              : problem.difficulty_level === "Medium"
                              ? "color-mix(in srgb, var(--warning-500) 16%, var(--surface) 84%)"
                              : "color-mix(in srgb, var(--warning-500) 20%, var(--surface) 80%)",
                          color:
                            problem.difficulty_level === "Easy"
                              ? "var(--success-500)"
                              : problem.difficulty_level === "Medium"
                              ? "var(--warning-500)"
                              : "var(--warning-500)",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                        }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ color: "var(--font-tertiary)" }}>
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                      {problem.tags || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <IconButton
                      size="small"
                      onClick={() => setPreviewProblem(problem)}
                      sx={{ color: "var(--accent-indigo)" }}
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

