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
} from "@mui/material";
import {
  MCQ,
  CodingProblemListItem,
} from "@/lib/services/admin/admin-assessment.service";
import { useMemo, useState } from "react";
import { Section } from "./MultipleSectionsSection";
import { IconWrapper } from "@/components/common/IconWrapper";
import { SectionCard } from "./SectionCard";
import { MCQQuestionsTable } from "./MCQQuestionsTable";
import { CodingProblemsTable } from "./CodingProblemsTable";

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

  // Handle section selection (mutually exclusive)
  const handleSectionSelect = (
    sectionId: string,
    sectionType: "quiz" | "coding"
  ) => {
    if (selectedSectionId === sectionId) {
      setSelectedSectionId("");
    } else {
      setSelectedSectionId(sectionId);
      if (sectionType === "quiz") {
        setMcqPage(1);
      } else {
        setCodingPage(1);
      }
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
  const totalCodingProblemsCount = codingSections.reduce(
    (sum, section) =>
      sum +
      (getCodingProblemIdsForSection
        ? getCodingProblemIdsForSection(section.id).length
        : 0),
    0
  );
  const totalQuestions = totalMCQs.length + totalCodingProblemsCount;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Assessment Overview */}
      <Box>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mb: 3, color: "#111827" }}
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
          <Card sx={{ height: "100%", border: "1px solid #e5e7eb" }}>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <IconWrapper
                  icon="mdi:file-document"
                  size={24}
                  color="#6366f1"
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
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
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
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    Status
                  </Typography>
                  <Chip
                    label={isActive ? "Active" : "Inactive"}
                    size="small"
                    sx={{
                      bgcolor: isActive ? "#d1fae5" : "#fee2e2",
                      color: isActive ? "#065f46" : "#991b1b",
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
                    <Typography variant="body2" sx={{ color: "#6b7280" }}>
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
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    Total Questions
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
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    MCQ Questions
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
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    Coding Problems
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
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    Total Sections
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {quizSections.length + codingSections.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card sx={{ height: "100%", border: "1px solid #e5e7eb" }}>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <IconWrapper icon="mdi:view-list" size={24} color="#6366f1" />
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
                      sx={{ fontWeight: 600, mb: 1.5, color: "#6366f1" }}
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
                      sx={{ fontWeight: 600, mb: 1.5, color: "#10b981" }}
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
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827" }}>
              {selectedSection.type === "quiz"
                ? "MCQ Questions"
                : "Coding Problems"}{" "}
              Preview - {selectedSection.title}
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
                    : filteredCodingProblems.length
                } ${
                  selectedSection.type === "quiz" ? "questions" : "problems"
                }`}
                sx={{
                  bgcolor:
                    selectedSection.type === "quiz" ? "#6366f1" : "#10b981",
                  color: "white",
                  fontWeight: 600,
                }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setSelectedSectionId("");
                  if (selectedSection.type === "quiz") {
                    setMcqPage(1);
                  } else {
                    setCodingPage(1);
                  }
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
          ) : (
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
          )}
        </Box>
      )}

      {/* Empty State - No Section Selected */}
      {!selectedSectionId && (
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            bgcolor: "#f9fafb",
            border: "2px dashed #e5e7eb",
          }}
        >
          <Box sx={{ mb: 2 }}>
            <IconWrapper
              icon="mdi:hand-pointing-up"
              size={48}
              color="#9ca3af"
            />
          </Box>
          <Typography
            variant="h6"
            sx={{ color: "#6b7280", mb: 1, fontWeight: 600 }}
          >
            Select a Section to View Questions
          </Typography>
          <Typography variant="body2" sx={{ color: "#9ca3af" }}>
            Click on any section card above to view its questions or problems
          </Typography>
        </Paper>
      )}

      {/* Empty State */}
      {totalMCQs.length === 0 && allCodingProblems.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center", bgcolor: "#f9fafb" }}>
          <Box sx={{ mb: 2 }}>
            <IconWrapper
              icon="mdi:alert-circle-outline"
              size={48}
              color="#9ca3af"
            />
          </Box>
          <Typography variant="h6" sx={{ color: "#6b7280", mb: 1 }}>
            No Questions Added
          </Typography>
          <Typography variant="body2" sx={{ color: "#9ca3af" }}>
            Please go back and add questions to your assessment sections.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
