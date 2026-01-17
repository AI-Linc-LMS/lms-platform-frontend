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
import { CodingProblemListItem } from "@/lib/services/admin/admin-assessment.service";
import { PaginationControls } from "./PaginationControls";

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
  const startIndex = (page - 1) * limit;
  const paginatedProblems = problems.slice(startIndex, startIndex + limit);
  const totalPages = Math.max(1, Math.ceil(problems.length / limit));

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
                Language
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
                      {problem.topic || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: "#6b7280" }}>
                      {problem.programming_language || "-"}
                    </Typography>
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
    </Paper>
  );
}

