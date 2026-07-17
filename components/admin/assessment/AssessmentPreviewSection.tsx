"use client";

import {
  Box,
  Typography,
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
import { StatusChip, CountBadge } from "@/components/admin/assessment/shared";
import { SectionCard, WrittenPromptPreview } from "./SectionCard";
import { MCQQuestionsTable } from "./MCQQuestionsTable";
import { CodingProblemsTable } from "./CodingProblemsTable";
import { PaginationControls } from "./PaginationControls";

interface MCQWithSection extends MCQ {
  sectionId: string;
}

/** Section kicker label (redesign language). Text renders UPPERCASE. */
const kickerSx = {
  fontSize: "0.72rem",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "var(--font-tertiary)",
};

/** Shared card recipe from the style contract. */
const cardSx = {
  borderRadius: "16px",
  bgcolor: "var(--card-bg)",
  border: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
  boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
};

/** Uppercase table-head cell in the kicker voice. */
const headCellSx = {
  fontSize: "0.72rem",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "var(--font-tertiary)",
  bgcolor: "var(--surface)",
  borderBottom: "1px solid var(--border-default)",
};

/** KPI summary tile: accent icon tile + mono value + caption. */
function KpiCard({
  icon,
  accent,
  value,
  caption,
}: {
  icon: string;
  accent: string;
  value: string | number;
  caption: string;
}) {
  return (
    <Box sx={{ ...cardSx, display: "flex", alignItems: "center", gap: 1.5, p: 2 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          bgcolor: `color-mix(in srgb, ${accent} 12%, var(--card-bg) 88%)`,
          color: accent,
        }}
      >
        <IconWrapper icon={icon} size={20} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: "1.3rem",
            lineHeight: 1.1,
            color: "var(--font-primary)",
          }}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "var(--font-secondary)", whiteSpace: "nowrap", display: "block" }}
        >
          {caption}
        </Typography>
      </Box>
    </Box>
  );
}

/** Section-group row header: icon tile + label + count badge. */
function SectionGroupHeader({
  icon,
  accent,
  label,
  count,
}: {
  icon: string;
  accent: string;
  label: string;
  count: number;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          bgcolor: `color-mix(in srgb, ${accent} 12%, var(--card-bg) 88%)`,
          color: accent,
        }}
      >
        <IconWrapper icon={icon} size={18} />
      </Box>
      <Typography
        sx={{
          fontFamily: "var(--font-jakarta)",
          fontWeight: 700,
          fontSize: "0.95rem",
          color: "var(--font-primary)",
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        {label}
      </Typography>
      <CountBadge count={count} label="sections" />
    </Box>
  );
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
      <Box
        sx={{
          ...cardSx,
          border:
            "1.5px dashed color-mix(in srgb, var(--warning-500) 45%, var(--border-default) 55%)",
          p: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: "color-mix(in srgb, var(--warning-500) 12%, var(--card-bg) 88%)",
            color: "var(--warning-500)",
          }}
        >
          <IconWrapper icon="mdi:pencil-off-outline" size={22} />
        </Box>
        <Typography sx={{ color: "var(--font-primary)", fontWeight: 700 }}>
          No written prompts found{sectionName ? ` in ${sectionName}` : ""}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ ...cardSx, overflow: "hidden", width: "100%" }}>
      <TableContainer sx={{ width: "100%" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headCellSx, width: 56 }}>#</TableCell>
              <TableCell sx={headCellSx}>Prompt</TableCell>
              <TableCell sx={{ ...headCellSx, width: 100 }}>Marks</TableCell>
              <TableCell sx={{ ...headCellSx, width: 140 }}>Answer mode</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((row, i) => (
              <TableRow key={`${startIndex + i}-${row.question_text.slice(0, 24)}`}>
                <TableCell
                  sx={{ fontFamily: "var(--font-mono)", color: "var(--font-tertiary)" }}
                >
                  {startIndex + i + 1}
                </TableCell>
                <TableCell sx={{ maxWidth: { xs: 200, sm: 480 } }}>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {truncatePreview(row.question_text, 400)}
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--font-primary)" }}
                >
                  {row.max_marks}
                </TableCell>
                <TableCell>
                  <StatusChip
                    label={row.answer_mode || "text"}
                    tone="warning"
                    icon="mdi:pencil-outline"
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
    </Box>
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
        <Typography sx={{ ...kickerSx, mb: 1.5 }}>Assessment overview</Typography>

        {/* Identity card: title + status/paid chips */}
        <Box
          sx={{
            ...cardSx,
            p: 2.5,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
            mb: 1.5,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              bgcolor: "color-mix(in srgb, var(--accent-indigo) 12%, var(--card-bg) 88%)",
              color: "var(--accent-indigo)",
            }}
          >
            <IconWrapper icon="mdi:file-document" size={22} />
          </Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: "var(--font-jakarta)",
                fontWeight: 800,
                fontSize: "1.2rem",
                lineHeight: 1.25,
                color: "var(--font-primary)",
              }}
            >
              {title || "Untitled Assessment"}
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--font-tertiary)", display: "block", mt: 0.25 }}>
              Final review of structure and content before you create
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
            <StatusChip
              label={isActive ? "Active" : "Inactive"}
              tone={isActive ? "success" : "neutral"}
              icon={isActive ? "mdi:check-circle-outline" : "mdi:pause-circle-outline"}
            />
            {isPaid && price && (
              <StatusChip
                label={`${getCurrencySymbol(currency)}${price} · ${currency}`}
                tone="warning"
                icon="mdi:cash"
              />
            )}
          </Box>
        </Box>

        {/* KPI summary tiles */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              lg: "repeat(6, 1fr)",
            },
            gap: 1.5,
          }}
        >
          <KpiCard
            icon="mdi:clock-outline"
            accent="var(--accent-indigo)"
            value={`${durationMinutes}m`}
            caption="Duration"
          />
          <KpiCard
            icon="mdi:format-list-numbered"
            accent="var(--ai-violet)"
            value={totalQuestions}
            caption="Total items"
          />
          <KpiCard
            icon="mdi:help-circle-outline"
            accent="var(--accent-indigo)"
            value={totalMCQs.length}
            caption="MCQ questions"
          />
          <KpiCard
            icon="mdi:code-tags"
            accent="var(--success-500)"
            value={totalCodingProblemsCount}
            caption="Coding problems"
          />
          <KpiCard
            icon="mdi:pencil-outline"
            accent="var(--warning-500)"
            value={totalWrittenPromptsCount}
            caption="Written prompts"
          />
          <KpiCard
            icon="mdi:view-grid-outline"
            accent="var(--accent-indigo)"
            value={
              quizSections.length +
              codingSections.length +
              subjectiveSections.length
            }
            caption="Sections"
          />
        </Box>
      </Box>

      {/* Sections Summary */}
      <Box>
        <Typography sx={{ ...kickerSx, mb: 1.5 }}>Sections summary</Typography>
        <Box sx={{ ...cardSx, p: 2.5 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {quizSections.length > 0 && (
              <Box>
                <SectionGroupHeader
                  icon="mdi:help-circle-outline"
                  accent="var(--accent-indigo)"
                  label="Quiz sections"
                  count={quizSections.length}
                />
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
                <SectionGroupHeader
                  icon="mdi:code-tags"
                  accent="var(--success-500)"
                  label="Coding sections"
                  count={codingSections.length}
                />
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
                <SectionGroupHeader
                  icon="mdi:pencil-outline"
                  accent="var(--warning-500)"
                  label="Written sections"
                  count={subjectiveSections.length}
                />
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
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ ...kickerSx, mb: 0.5 }}>
                {selectedSection.type === "quiz"
                  ? "MCQ questions"
                  : selectedSection.type === "coding"
                  ? "Coding problems"
                  : "Written prompts"}{" "}
                preview
              </Typography>
              <Typography
                sx={{
                  fontFamily: "var(--font-jakarta)",
                  fontWeight: 800,
                  fontSize: "1.15rem",
                  lineHeight: 1.3,
                  color: "var(--font-primary)",
                }}
              >
                {selectedSection.title}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <StatusChip
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
                tone={
                  selectedSection.type === "quiz"
                    ? "info"
                    : selectedSection.type === "coding"
                    ? "success"
                    : "warning"
                }
                icon="mdi:counter"
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
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  color: "var(--font-primary)",
                  borderColor: "var(--border-default)",
                  "&:hover": {
                    borderColor: "var(--accent-indigo)",
                    bgcolor: "transparent",
                  },
                }}
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
        <Box
          sx={{
            ...cardSx,
            border:
              "1.5px dashed color-mix(in srgb, var(--accent-indigo) 35%, var(--border-default) 65%)",
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "color-mix(in srgb, var(--accent-indigo) 12%, var(--card-bg) 88%)",
              color: "var(--accent-indigo)",
            }}
          >
            <IconWrapper icon="mdi:hand-pointing-up" size={28} />
          </Box>
          <Typography
            sx={{
              fontFamily: "var(--font-jakarta)",
              fontWeight: 700,
              fontSize: "1rem",
              color: "var(--font-primary)",
            }}
          >
            Select a Section to Preview Content
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--font-tertiary)", maxWidth: 420 }}>
            Select a section card above to preview quiz questions, coding problems, or written prompts.
          </Typography>
        </Box>
      )}

      {/* Empty State */}
      {totalMCQs.length === 0 &&
        allCodingProblems.length === 0 &&
        totalWrittenPromptsCount === 0 && (
        <Box
          sx={{
            ...cardSx,
            border:
              "1.5px dashed color-mix(in srgb, var(--warning-500) 45%, var(--border-default) 55%)",
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "color-mix(in srgb, var(--warning-500) 12%, var(--card-bg) 88%)",
              color: "var(--warning-500)",
            }}
          >
            <IconWrapper icon="mdi:alert-circle-outline" size={28} />
          </Box>
          <Typography
            sx={{
              fontFamily: "var(--font-jakarta)",
              fontWeight: 700,
              fontSize: "1rem",
              color: "var(--font-primary)",
            }}
          >
            No Questions Added
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--font-tertiary)", maxWidth: 420 }}>
            Please go back and add questions to your assessment sections.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
