"use client";

import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  MCQ,
  CodingProblemListItem,
} from "@/lib/services/admin/admin-assessment.service";
import { useMemo, useState } from "react";
import { Section } from "./MultipleSectionsSection";
import { IconWrapper } from "@/components/common/IconWrapper";
import { SectionCard, WrittenPromptPreview } from "./SectionCard";
import { MCQQuestionsTable } from "./MCQQuestionsTable";
import { CodingProblemsTable } from "./CodingProblemsTable";
import { PaginationControls } from "./PaginationControls";

interface MCQWithSection extends MCQ {
  sectionId: string;
}

function truncatePreview(text: string, maxLen: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}…`;
}

function WrittenPromptsPreviewTable({
  prompts,
  page,
  limit,
  onPageChange,
  onLimitChange,
  sectionName,
}: {
  prompts: WrittenPromptPreview[];
  page: number;
  limit: number;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  sectionName?: string;
}) {
  const startIndex = (page - 1) * limit;
  const paginated = prompts.slice(startIndex, startIndex + limit);

  if (prompts.length === 0) {
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
          No written prompts found{sectionName ? ` in ${sectionName}` : ""}
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
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "var(--surface)" }}>
              <TableCell sx={{ fontWeight: 600, width: 56 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Prompt</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100 }}>Marks</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 140 }}>Answer mode</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((row, i) => (
              <TableRow key={`${startIndex + i}-${row.question_text.slice(0, 24)}`}>
                <TableCell>{startIndex + i + 1}</TableCell>
                <TableCell sx={{ maxWidth: { xs: 200, sm: 480 } }}>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {truncatePreview(row.question_text, 400)}
                  </Typography>
                </TableCell>
                <TableCell>{row.max_marks}</TableCell>
                <TableCell>
                  <Chip
                    label={row.answer_mode || "text"}
                    size="small"
                    sx={{
                      bgcolor: "color-mix(in srgb, var(--warning-500) 16%, var(--surface) 84%)",
                      color: "var(--warning-500)",
                      fontWeight: 600,
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <PaginationControls
        totalItems={prompts.length}
        page={page}
        limit={limit}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        itemLabel="prompts"
      />
    </Paper>
  );
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
  getWrittenPromptsForSection?: (sectionId: string) => WrittenPromptPreview[];
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
  getWrittenPromptsForSection,
}: AssessmentPreviewSectionProps) {
  const [mcqPage, setMcqPage] = useState(1);
  const [codingPage, setCodingPage] = useState(1);
  const [writtenPage, setWrittenPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  // Use MCQs with section info if available, otherwise fall back to regular MCQs
  const mcqsToDisplay =
    totalMCQsWithSections ||
    totalMCQs.map((mcq) => ({ ...mcq, sectionId: "" }));

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

  // Group MCQs by section
  const mcqsBySection = useMemo(() => {
    if (!sections || !getMCQsForSection) return {};
    const grouped: Record<string, MCQ[]> = {};
    sections
      .filter((s) => s.type === "quiz")
      .forEach((section) => {
        grouped[section.id] = getMCQsForSection(section.id);
      });
    return grouped;
  }, [sections, getMCQsForSection]);

  // Group coding problems by section
  const codingProblemsBySection = useMemo(() => {
    if (!sections || !getCodingProblemsForSection) return {};
    const grouped: Record<string, CodingProblemListItem[]> = {};
    sections
      .filter((s) => s.type === "coding")
      .forEach((section) => {
        grouped[section.id] = getCodingProblemsForSection(section.id);
      });
    return grouped;
  }, [sections, getCodingProblemsForSection]);

  const writtenPromptsBySection = useMemo(() => {
    if (!sections || !getWrittenPromptsForSection) return {};
    const grouped: Record<string, WrittenPromptPreview[]> = {};
    sections
      .filter((s) => s.type === "subjective")
      .forEach((section) => {
        grouped[section.id] = getWrittenPromptsForSection(section.id);
      });
    return grouped;
  }, [sections, getWrittenPromptsForSection]);

  // Get selected section
  const selectedSection = useMemo(() => {
    if (!selectedSectionId || !sections) return null;
    return sections.find((s) => s.id === selectedSectionId);
  }, [selectedSectionId, sections]);

  // Filter MCQs by selected section (only if it's a quiz section)
  const filteredMCQs = useMemo(() => {
    if (!selectedSectionId || selectedSection?.type !== "quiz") return [];
    return mcqsToDisplay.filter((mcq) => {
      const mcqWithSection = mcq as MCQWithSection;
      return mcqWithSection.sectionId === selectedSectionId;
    });
  }, [mcqsToDisplay, selectedSectionId, selectedSection]);

  // Filter coding problems by selected section (only if it's a coding section)
  const filteredCodingProblems = useMemo(() => {
    if (!selectedSectionId || selectedSection?.type !== "coding") return [];
    return allCodingProblems.filter((problem) => {
      const problemWithSection = problem as CodingProblemListItem & {
        sectionId: string;
      };
      return problemWithSection.sectionId === selectedSectionId;
    });
  }, [allCodingProblems, selectedSectionId, selectedSection]);

  const filteredWrittenPrompts = useMemo((): WrittenPromptPreview[] => {
    if (!selectedSectionId || selectedSection?.type !== "subjective") return [];
    return writtenPromptsBySection[selectedSectionId] || [];
  }, [writtenPromptsBySection, selectedSectionId, selectedSection]);

  // Handle section selection (mutually exclusive)
  const handleSectionSelect = (
    sectionId: string,
    _sectionType: "quiz" | "coding" | "subjective"
  ) => {
    if (selectedSectionId === sectionId) {
      setSelectedSectionId("");
    } else {
      setSelectedSectionId(sectionId);
      setMcqPage(1);
      setCodingPage(1);
      setWrittenPage(1);
    }
  };

  // Helper to get section name by ID
  const getSectionName = (sectionId: string): string => {
    if (!sections || !sectionId) return sectionTitle || "N/A";
    const section = sections.find((s) => s.id === sectionId);
    return section ? section.title : "N/A";
  };

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
      case "SAR":
        return "﷼";
      default:
        return "";
    }
  };

  // Sort sections and move selected to top
  const quizSections = useMemo(() => {
    const filtered = sections?.filter((s) => s.type === "quiz") || [];
    const sorted = [...filtered].sort((a, b) => a.order - b.order);
    if (selectedSectionId && selectedSection?.type === "quiz") {
      const selected = sorted.find((s) => s.id === selectedSectionId);
      const others = sorted.filter((s) => s.id !== selectedSectionId);
      return selected ? [selected, ...others] : sorted;
    }
    return sorted;
  }, [sections, selectedSectionId, selectedSection]);

  const codingSections = useMemo(() => {
    const filtered = sections?.filter((s) => s.type === "coding") || [];
    const sorted = [...filtered].sort((a, b) => a.order - b.order);
    if (selectedSectionId && selectedSection?.type === "coding") {
      const selected = sorted.find((s) => s.id === selectedSectionId);
      const others = sorted.filter((s) => s.id !== selectedSectionId);
      return selected ? [selected, ...others] : sorted;
    }
    return sorted;
  }, [sections, selectedSectionId, selectedSection]);

  const subjectiveSections = useMemo(() => {
    const filtered = sections?.filter((s) => s.type === "subjective") || [];
    const sorted = [...filtered].sort((a, b) => a.order - b.order);
    if (selectedSectionId && selectedSection?.type === "subjective") {
      const selected = sorted.find((s) => s.id === selectedSectionId);
      const others = sorted.filter((s) => s.id !== selectedSectionId);
      return selected ? [selected, ...others] : sorted;
    }
    return sorted;
  }, [sections, selectedSectionId, selectedSection]);

  const totalCodingProblemsCount = codingSections.reduce(
    (sum, section) =>
      sum +
      (getCodingProblemIdsForSection
        ? getCodingProblemIdsForSection(section.id).length
        : 0),
    0
  );

  const totalWrittenPromptsCount = subjectiveSections.reduce((sum, section) => {
    const prompts = writtenPromptsBySection[section.id];
    return sum + (prompts?.length ?? 0);
  }, 0);

  const totalQuestions =
    totalMCQs.length + totalCodingProblemsCount + totalWrittenPromptsCount;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Assessment Overview */}
      <Box>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mb: 3, color: "var(--font-primary)" }}
        >
          Assessment Overview
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, 1fr)",
            },
            gap: 2,
          }}
        >
          <Card sx={{ height: "100%", border: "1px solid var(--border-default)" }}>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <IconWrapper
                  icon="mdi:file-document"
                  size={24}
                  color="var(--accent-indigo)"
                />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {title || "Untitled Assessment"}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                    Duration
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {durationMinutes} minutes
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                    Status
                  </Typography>
                  <Chip
                    label={isActive ? "Active" : "Inactive"}
                    size="small"
                    sx={{
                      bgcolor: isActive ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)" : "color-mix(in srgb, var(--error-500) 14%, var(--surface) 86%)",
                      color: isActive ? "var(--success-500)" : "var(--error-500)",
                      fontWeight: 600,
                    }}
                  />
                </Box>
                {isPaid && price && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                      Price
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {getCurrencySymbol(currency)}
                      {price} ({currency})
                    </Typography>
                  </Box>
                )}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                    Total items (MCQ + coding + written)
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, fontSize: "1.1rem" }}
                  >
                    {totalQuestions}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                    MCQ questions
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {totalMCQs.length}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                    Coding problems
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {totalCodingProblemsCount}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                    Written prompts
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {totalWrittenPromptsCount}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                    Total Sections
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {quizSections.length +
                      codingSections.length +
                      subjectiveSections.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card sx={{ height: "100%", border: "1px solid var(--border-default)" }}>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <IconWrapper icon="mdi:view-list" size={24} color="var(--accent-indigo)" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Sections Summary
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {quizSections.length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1.5, color: "var(--accent-indigo)" }}
                    >
                      Quiz Sections ({quizSections.length})
                    </Typography>
                    {quizSections.map((section) => {
                      const sectionMCQs = mcqsBySection[section.id] || [];
                      const isSelected = selectedSectionId === section.id;
                      return (
                        <SectionCard
                          key={section.id}
                          section={section}
                          isSelected={isSelected}
                          onClick={() =>
                            handleSectionSelect(section.id, "quiz")
                          }
                          sectionMCQs={sectionMCQs}
                          type="quiz"
                        />
                      );
                    })}
                  </Box>
                )}
                {codingSections.length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1.5, color: "var(--success-500)" }}
                    >
                      Coding Sections ({codingSections.length})
                    </Typography>
                    {codingSections.map((section) => {
                      const sectionProblems =
                        codingProblemsBySection[section.id] || [];
                      const isSelected = selectedSectionId === section.id;
                      return (
                        <SectionCard
                          key={section.id}
                          section={section}
                          isSelected={isSelected}
                          onClick={() =>
                            handleSectionSelect(section.id, "coding")
                          }
                          sectionProblems={sectionProblems}
                          type="coding"
                        />
                      );
                    })}
                  </Box>
                )}
                {subjectiveSections.length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1.5, color: "var(--warning-500)" }}
                    >
                      Written Sections ({subjectiveSections.length})
                    </Typography>
                    {subjectiveSections.map((section) => {
                      const prompts = writtenPromptsBySection[section.id] || [];
                      const isSelected = selectedSectionId === section.id;
                      return (
                        <SectionCard
                          key={section.id}
                          section={section}
                          isSelected={isSelected}
                          onClick={() =>
                            handleSectionSelect(section.id, "subjective")
                          }
                          sectionWrittenPrompts={prompts}
                          type="subjective"
                        />
                      );
                    })}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Questions/Problems Preview */}
      {selectedSectionId && selectedSection && (
        <Box sx={{ width: "100%" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
              {selectedSection.type === "quiz"
                ? "MCQ questions"
                : selectedSection.type === "coding"
                ? "Coding problems"
                : "Written prompts"}{" "}
              preview — {selectedSection.title}
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Chip
                label={`${
                  selectedSection.type === "quiz"
                    ? filteredMCQs.length
                    : selectedSection.type === "coding"
                    ? filteredCodingProblems.length
                    : filteredWrittenPrompts.length
                } ${
                  selectedSection.type === "quiz"
                    ? "questions"
                    : selectedSection.type === "coding"
                    ? "problems"
                    : "prompts"
                }`}
                sx={{
                  bgcolor:
                    selectedSection.type === "quiz"
                      ? "var(--accent-indigo)"
                      : selectedSection.type === "coding"
                      ? "var(--success-500)"
                      : "var(--warning-500)",
                  color: "var(--font-light)",
                  fontWeight: 600,
                }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setSelectedSectionId("");
                  setMcqPage(1);
                  setCodingPage(1);
                  setWrittenPage(1);
                }}
                sx={{ textTransform: "none" }}
              >
                Clear Selection
              </Button>
            </Box>
          </Box>
          {selectedSection.type === "quiz" ? (
            <MCQQuestionsTable
              mcqs={filteredMCQs as MCQWithSection[]}
              page={mcqPage}
              limit={limit}
              onPageChange={setMcqPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setMcqPage(1);
              }}
              sectionName={selectedSection.title}
            />
          ) : selectedSection.type === "coding" ? (
            <CodingProblemsTable
              problems={
                filteredCodingProblems as Array<
                  CodingProblemListItem & { sectionId: string }
                >
              }
              page={codingPage}
              limit={limit}
              onPageChange={setCodingPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setCodingPage(1);
              }}
              sectionName={selectedSection.title}
            />
          ) : (
            <WrittenPromptsPreviewTable
              prompts={filteredWrittenPrompts}
              page={writtenPage}
              limit={limit}
              onPageChange={setWrittenPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setWrittenPage(1);
              }}
              sectionName={selectedSection.title}
            />
          )}
        </Box>
      )}

      {/* Empty State - No Section Selected */}
      {!selectedSectionId && (
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            bgcolor: "color-mix(in srgb, var(--surface) 86%, var(--card-bg) 14%)",
            border: "2px dashed var(--border-default)",
          }}
        >
          <Box sx={{ mb: 2 }}>
            <IconWrapper
              icon="mdi:hand-pointing-up"
              size={48}
              color="var(--font-tertiary)"
            />
          </Box>
          <Typography
            variant="h6"
            sx={{ color: "var(--font-secondary)", mb: 1, fontWeight: 600 }}
          >
            Select a Section to Preview Content
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--font-tertiary)" }}>
            Select a section card above to preview quiz questions, coding problems, or written prompts.
          </Typography>
        </Paper>
      )}

      {/* Empty State */}
      {totalMCQs.length === 0 &&
        allCodingProblems.length === 0 &&
        totalWrittenPromptsCount === 0 && (
        <Paper sx={{ p: 4, textAlign: "center", bgcolor: "color-mix(in srgb, var(--surface) 86%, var(--card-bg) 14%)" }}>
          <Box sx={{ mb: 2 }}>
            <IconWrapper
              icon="mdi:alert-circle-outline"
              size={48}
              color="var(--font-tertiary)"
            />
          </Box>
          <Typography variant="h6" sx={{ color: "var(--font-secondary)", mb: 1 }}>
            No Questions Added
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--font-tertiary)" }}>
            Please go back and add questions to your assessment sections.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
