"use client";

import { Box, Typography, Paper, Chip, Pagination, Select, MenuItem, FormControl, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { MCQ } from "@/lib/services/admin/admin-assessment.service";
import { useMemo, useState } from "react";

interface AssessmentPreviewSectionProps {
  title: string;
  durationMinutes: number;
  isActive: boolean;
  isPaid: boolean;
  price: string;
  currency: string;
  sectionTitle: string;
  totalMCQs: MCQ[];
}

export function AssessmentPreviewSection({
  title,
  durationMinutes,
  isActive,
  isPaid,
  price,
  currency,
  sectionTitle,
  totalMCQs,
}: AssessmentPreviewSectionProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const paginatedMCQs = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return totalMCQs.slice(startIndex, endIndex);
  }, [totalMCQs, page, limit]);

  const totalPages = Math.max(1, Math.ceil(totalMCQs.length / limit));

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case "INR":
        return "₹";
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "GBP":
        return "£";
      default:
        return "";
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Assessment Summary
      </Typography>
      <Paper sx={{ p: 2, bgcolor: "#f9fafb" }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Title:</strong> {title}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Duration:</strong> {durationMinutes} minutes
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Status:</strong> {isActive ? "Active" : "Inactive"}
        </Typography>
        {isPaid && price && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Price:</strong> {getCurrencySymbol(currency)}
            {price} ({currency})
          </Typography>
        )}
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Total Questions:</strong> {totalMCQs.length}
        </Typography>
        <Typography variant="body2">
          <strong>Section:</strong> {sectionTitle}
        </Typography>
      </Paper>

      {/* Questions Preview */}
      {totalMCQs.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Questions Preview ({totalMCQs.length})
          </Typography>
          <Paper sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: 60 }}>
                      #
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Question
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Correct
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Difficulty
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedMCQs.map((mcq, index) => {
                    const globalIndex = (page - 1) * limit + index;
                    return (
                      <TableRow
                        key={globalIndex}
                        sx={{
                          "&:hover": { backgroundColor: "#f9fafb" },
                        }}
                      >
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ color: "#6b7280", fontFamily: "monospace" }}
                          >
                            #{globalIndex + 1}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 400 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 500, mb: 1 }}
                          >
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
                            <Chip
                              label={`A: ${mcq.option_a.length > 30 ? mcq.option_a.substring(0, 30) + "..." : mcq.option_a}`}
                              size="small"
                              sx={{
                                bgcolor:
                                  mcq.correct_option === "A"
                                    ? "#d1fae5"
                                    : "#f3f4f6",
                                color:
                                  mcq.correct_option === "A"
                                    ? "#065f46"
                                    : "#374151",
                                fontWeight: mcq.correct_option === "A" ? 600 : 400,
                                fontSize: "0.75rem",
                                height: 24,
                              }}
                            />
                            <Chip
                              label={`B: ${mcq.option_b.length > 30 ? mcq.option_b.substring(0, 30) + "..." : mcq.option_b}`}
                              size="small"
                              sx={{
                                bgcolor:
                                  mcq.correct_option === "B"
                                    ? "#d1fae5"
                                    : "#f3f4f6",
                                color:
                                  mcq.correct_option === "B"
                                    ? "#065f46"
                                    : "#374151",
                                fontWeight: mcq.correct_option === "B" ? 600 : 400,
                                fontSize: "0.75rem",
                                height: 24,
                              }}
                            />
                            <Chip
                              label={`C: ${mcq.option_c.length > 30 ? mcq.option_c.substring(0, 30) + "..." : mcq.option_c}`}
                              size="small"
                              sx={{
                                bgcolor:
                                  mcq.correct_option === "C"
                                    ? "#d1fae5"
                                    : "#f3f4f6",
                                color:
                                  mcq.correct_option === "C"
                                    ? "#065f46"
                                    : "#374151",
                                fontWeight: mcq.correct_option === "C" ? 600 : 400,
                                fontSize: "0.75rem",
                                height: 24,
                              }}
                            />
                            <Chip
                              label={`D: ${mcq.option_d.length > 30 ? mcq.option_d.substring(0, 30) + "..." : mcq.option_d}`}
                              size="small"
                              sx={{
                                bgcolor:
                                  mcq.correct_option === "D"
                                    ? "#d1fae5"
                                    : "#f3f4f6",
                                color:
                                  mcq.correct_option === "D"
                                    ? "#065f46"
                                    : "#374151",
                                fontWeight: mcq.correct_option === "D" ? 600 : 400,
                                fontSize: "0.75rem",
                                height: 24,
                              }}
                            />
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
                              width: 32,
                              height: 32,
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

            {/* Pagination */}
            {totalMCQs.length > 0 && (
              <Box
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderTop: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: { xs: 1.5, sm: 2 },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#6b7280",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                  >
                    Showing{" "}
                    {Math.min(totalMCQs.length, (page - 1) * limit + 1)} to{" "}
                    {Math.min(totalMCQs.length, page * limit)} of {totalMCQs.length} questions
                  </Typography>
                  <FormControl
                    size="small"
                    sx={{
                      minWidth: { xs: 100, sm: 120 },
                      "& .MuiInputBase-root": {
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      },
                    }}
                  >
                    <Select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      displayEmpty
                    >
                      <MenuItem value={10}>10 per page</MenuItem>
                      <MenuItem value={25}>25 per page</MenuItem>
                      <MenuItem value={50}>50 per page</MenuItem>
                      <MenuItem value={100}>100 per page</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                  size="small"
                  showFirstButton={false}
                  showLastButton={false}
                  boundaryCount={1}
                  siblingCount={0}
                  disabled={totalPages <= 1}
                  sx={{
                    "& .MuiPaginationItem-root": {
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    },
                  }}
                />
              </Box>
            )}
          </Paper>
        </Box>
      )}

      <Typography variant="body2" color="text.secondary">
        Review the details above and click "Create Assessment" to proceed.
      </Typography>
    </Box>
  );
}

