"use client";

import { Box, Typography, Paper, Chip, Pagination, Select, MenuItem, FormControl, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider } from "@mui/material";
import { MCQ, CodingProblemListItem } from "@/lib/services/admin/admin-assessment.service";
import { useMemo, useState } from "react";
import { Section } from "./MultipleSectionsSection";

interface MCQWithSection extends MCQ {
  sectionId: string;
}

interface AssessmentPreviewSectionProps {
  title: string;
  durationMinutes: number;
  isActive: boolean;
  isPaid: boolean;
  price: string;
  currency: string;
  sectionTitle: string;
  totalMCQs: MCQ[];
  totalMCQsWithSections?: MCQWithSection[];
  sections?: Section[];
  getMCQsForSection?: (sectionId: string) => MCQ[];
  getCodingProblemIdsForSection?: (sectionId: string) => number[];
  getCodingProblemsForSection?: (sectionId: string) => CodingProblemListItem[];
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
  totalMCQsWithSections,
  sections,
  getMCQsForSection,
  getCodingProblemIdsForSection,
  getCodingProblemsForSection,
}: AssessmentPreviewSectionProps) {
  const [mcqPage, setMcqPage] = useState(1);
  const [codingPage, setCodingPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Use MCQs with section info if available, otherwise fall back to regular MCQs
  const mcqsToDisplay = totalMCQsWithSections || totalMCQs.map((mcq, index) => ({ ...mcq, sectionId: "" }));

  // Get all coding problems with section info
  const allCodingProblems = useMemo(() => {
    if (!sections || !getCodingProblemsForSection) return [];
    const problems: Array<CodingProblemListItem & { sectionId: string }> = [];
    sections
      .filter((s) => s.type === "coding")
      .forEach((section) => {
        const sectionProblems = getCodingProblemsForSection(section.id);
        sectionProblems.forEach((problem) => {
          problems.push({ ...problem, sectionId: section.id });
        });
      });
    return problems;
  }, [sections, getCodingProblemsForSection]);

  const paginatedMCQs = useMemo(() => {
    const startIndex = (mcqPage - 1) * limit;
    const endIndex = startIndex + limit;
    return mcqsToDisplay.slice(startIndex, endIndex);
  }, [mcqsToDisplay, mcqPage, limit]);

  const paginatedCodingProblems = useMemo(() => {
    const startIndex = (codingPage - 1) * limit;
    const endIndex = startIndex + limit;
    return allCodingProblems.slice(startIndex, endIndex);
  }, [allCodingProblems, codingPage, limit]);

  // Helper to get section name by ID
  const getSectionName = (sectionId: string): string => {
    if (!sections || !sectionId) return sectionTitle || "N/A";
    const section = sections.find((s) => s.id === sectionId);
    return section ? section.title : "N/A";
  };

  const totalMCQPages = Math.max(1, Math.ceil(totalMCQs.length / limit));
  const totalCodingPages = Math.max(1, Math.ceil(allCodingProblems.length / limit));

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
          <strong>Total Questions:</strong> {(() => {
            const codingProblemsCount = sections && getCodingProblemIdsForSection
              ? sections
                  .filter((s) => s.type === "coding")
                  .reduce((sum, section) => sum + getCodingProblemIdsForSection(section.id).length, 0)
              : 0;
            return totalMCQs.length + codingProblemsCount;
          })()}
        </Typography>
        {sections && sections.length > 0 ? (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Sections:</strong>
            </Typography>
            {sections
              .sort((a, b) => a.order - b.order)
              .map((section) => {
                if (section.type === "quiz") {
                  const sectionMCQs = getMCQsForSection
                    ? getMCQsForSection(section.id)
                    : [];
                  return (
                    <Box key={section.id} sx={{ ml: 2, mb: 1 }}>
                      <Typography variant="body2">
                        • {section.title} ({section.type}) - Order: {section.order} - {sectionMCQs.length} questions
                      </Typography>
                    </Box>
                  );
                } else if (section.type === "coding") {
                  const codingProblemIds = getCodingProblemIdsForSection
                    ? getCodingProblemIdsForSection(section.id)
                    : [];
                  return (
                    <Box key={section.id} sx={{ ml: 2, mb: 1 }}>
                      <Typography variant="body2">
                        • {section.title} ({section.type}) - Order: {section.order} - {codingProblemIds.length} coding problems
                      </Typography>
                    </Box>
                  );
                }
                return null;
              })}
          </Box>
        ) : (
          <Typography variant="body2">
            <strong>Section:</strong> {sectionTitle}
          </Typography>
        )}
      </Paper>

      {/* Questions Preview */}
      {totalMCQs.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            MCQ Questions Preview ({totalMCQs.length})
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
                    {sections && sections.length > 0 && (
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: 150 }}>
                        Section
                      </TableCell>
                    )}
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
                    const globalIndex = (mcqPage - 1) * limit + index;
                    const mcqWithSection = mcq as MCQWithSection;
                    const sectionName = getSectionName(mcqWithSection.sectionId);
                    const section = sections?.find((s) => s.id === mcqWithSection.sectionId);
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
                        {sections && sections.length > 0 && (
                          <TableCell>
                            <Chip
                              label={sectionName}
                              size="small"
                              sx={{
                                bgcolor: section?.type === "quiz" ? "#eef2ff" : "#d1fae5",
                                color: section?.type === "quiz" ? "#6366f1" : "#10b981",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                            />
                          </TableCell>
                        )}
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
                    {Math.min(totalMCQs.length, (mcqPage - 1) * limit + 1)} to{" "}
                    {Math.min(totalMCQs.length, mcqPage * limit)} of {totalMCQs.length} questions
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
                        setMcqPage(1);
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
                  count={totalMCQPages}
                  page={mcqPage}
                  onChange={(_, value) => setMcqPage(value)}
                  color="primary"
                  size="small"
                  showFirstButton={false}
                  showLastButton={false}
                  boundaryCount={1}
                  siblingCount={0}
                  disabled={totalMCQPages <= 1}
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

      {/* Coding Problems Preview */}
      {allCodingProblems.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Coding Problems Preview ({allCodingProblems.length})
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
                      Title
                    </TableCell>
                    {sections && sections.length > 1 && (
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: 150 }}>
                        Section
                      </TableCell>
                    )}
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Difficulty
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Topic
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Language
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCodingProblems.map((problem, index) => {
                    const globalIndex = (codingPage - 1) * limit + index;
                    const problemWithSection = problem as CodingProblemListItem & { sectionId: string };
                    const sectionName = getSectionName(problemWithSection.sectionId);
                    const section = sections?.find((s) => s.id === problemWithSection.sectionId);
                    return (
                      <TableRow
                        key={problem.id || globalIndex}
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
                            {problem.title || `Problem #${problem.id}`}
                          </Typography>
                          {problem.problem_statement && (
                            <Typography
                              variant="caption"
                              sx={{ color: "#6b7280", display: "block" }}
                            >
                              {problem.problem_statement.length > 100
                                ? problem.problem_statement.substring(0, 100) + "..."
                                : problem.problem_statement}
                            </Typography>
                          )}
                        </TableCell>
                        {sections && sections.length > 1 && (
                          <TableCell>
                            <Chip
                              label={sectionName}
                              size="small"
                              sx={{
                                bgcolor: "#d1fae5",
                                color: "#10b981",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                            />
                          </TableCell>
                        )}
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

            {/* Pagination */}
            {allCodingProblems.length > 0 && (
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
                    {Math.min(allCodingProblems.length, (codingPage - 1) * limit + 1)} to{" "}
                    {Math.min(allCodingProblems.length, codingPage * limit)} of {allCodingProblems.length} problems
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
                        setCodingPage(1);
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
                  count={totalCodingPages}
                  page={codingPage}
                  onChange={(_, value) => setCodingPage(value)}
                  color="primary"
                  size="small"
                  showFirstButton={false}
                  showLastButton={false}
                  boundaryCount={1}
                  siblingCount={0}
                  disabled={totalCodingPages <= 1}
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

