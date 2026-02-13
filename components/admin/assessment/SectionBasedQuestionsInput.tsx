"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
  Chip,
  Divider,
} from "@mui/material";
import { MCQFormSection } from "./MCQFormSection";
import { MCQSelectionSection } from "./MCQSelectionSection";
import { CSVUploadSection } from "./CSVUploadSection";
import { AIGeneratedSection } from "./AIGeneratedSection";
import { CodingProblemSelectionSection } from "./CodingProblemSelectionSection";
import { AIGeneratedCodingSection } from "./AIGeneratedCodingSection";
import { MCQ, MCQListItem, CodingProblemListItem } from "@/lib/services/admin/admin-assessment.service";
import { Section } from "./MultipleSectionsSection";
import { SectionQuestionsSidenav } from "./SectionQuestionsSidenav";

type MCQInputMethod = "manual" | "existing" | "csv" | "ai";
type CodingInputMethod = "existing" | "ai";

interface SectionBasedQuestionsInputProps {
  sections: Section[];
  mcqInputMethodBySection: Record<string, MCQInputMethod>;
  onMcqInputMethodChange: (sectionId: string, method: MCQInputMethod) => void;
  // Section-based question assignments
  sectionMcqIds: Record<string, number[]>; // sectionId -> MCQ IDs (for existing pool)
  onSectionMcqIdsChange: (sectionId: string, ids: number[]) => void;
  // For manual/csv/ai input
  manualMCQs: Record<string, MCQ[]>; // sectionId -> MCQs
  onManualMCQsChange: (sectionId: string, mcqs: MCQ[]) => void;
  csvMCQs: Record<string, MCQ[]>;
  onCsvMCQsChange: (sectionId: string, mcqs: MCQ[]) => void;
  aiMCQs: Record<string, MCQ[]>;
  onAiMCQsChange: (sectionId: string, mcqs: MCQ[]) => void;
  // Existing pool
  existingMCQs: MCQListItem[];
  loadingMCQs: boolean;
  // Coding problems (per-section method)
  codingInputMethodBySection: Record<string, CodingInputMethod>;
  onCodingInputMethodChange: (sectionId: string, method: CodingInputMethod) => void;
  sectionCodingProblemIds: Record<string, number[]>; // sectionId -> Coding Problem IDs
  onSectionCodingProblemIdsChange: (sectionId: string, ids: number[]) => void;
  aiCodingProblems: Record<string, CodingProblemListItem[]>; // sectionId -> Generated Coding Problems
  onAiCodingProblemsChange: (sectionId: string, problems: CodingProblemListItem[]) => void;
  existingCodingProblems: CodingProblemListItem[];
  loadingCodingProblems: boolean;
}

export function SectionBasedQuestionsInput({
  sections,
  mcqInputMethodBySection,
  onMcqInputMethodChange,
  sectionMcqIds,
  onSectionMcqIdsChange,
  manualMCQs,
  onManualMCQsChange,
  csvMCQs,
  onCsvMCQsChange,
  aiMCQs,
  onAiMCQsChange,
  existingMCQs,
  loadingMCQs,
  codingInputMethodBySection,
  onCodingInputMethodChange,
  sectionCodingProblemIds,
  onSectionCodingProblemIdsChange,
  aiCodingProblems,
  onAiCodingProblemsChange,
  existingCodingProblems,
  loadingCodingProblems,
}: SectionBasedQuestionsInputProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string | "">("");
  const [selectedCodingSectionId, setSelectedCodingSectionId] = useState<string | "">("");

  const quizSections = useMemo(
    () => sections.filter((s) => s.type === "quiz"),
    [sections]
  );
  const codingSections = useMemo(
    () => sections.filter((s) => s.type === "coding"),
    [sections]
  );

  // Auto-select first section if none selected (only on mount)
  useEffect(() => {
    if (!selectedSectionId && !selectedCodingSectionId && quizSections.length > 0) {
      setSelectedSectionId(quizSections[0].id);
    } else if (!selectedSectionId && !selectedCodingSectionId && codingSections.length > 0) {
      setSelectedCodingSectionId(codingSections[0].id);
    }
  }, []); // Only run on mount

  const currentManualMCQs = selectedSectionId
    ? manualMCQs[selectedSectionId] || []
    : [];
  const currentSelectedIds = selectedSectionId
    ? sectionMcqIds[selectedSectionId] || []
    : [];
  const currentCsvMCQs = selectedSectionId
    ? csvMCQs[selectedSectionId] || []
    : [];
  const currentAiMCQs = selectedSectionId
    ? aiMCQs[selectedSectionId] || []
    : [];

  // Per-section format lock: only lock the current section when it has data
  const isFormatLocked = useMemo(() => {
    if (!selectedSectionId) return false;
    const manual = (manualMCQs[selectedSectionId] || []).length > 0;
    const existing = (sectionMcqIds[selectedSectionId] || []).length > 0;
    const csv = (csvMCQs[selectedSectionId] || []).length > 0;
    const ai = (aiMCQs[selectedSectionId] || []).length > 0;
    return manual || existing || csv || ai;
  }, [selectedSectionId, manualMCQs, sectionMcqIds, csvMCQs, aiMCQs]);

  const isCodingFormatLocked = useMemo(() => {
    if (!selectedCodingSectionId) return false;
    const idsLen = (sectionCodingProblemIds[selectedCodingSectionId] || []).length;
    const aiLen = (aiCodingProblems[selectedCodingSectionId] || []).length;
    return idsLen > 0 || aiLen > 0;
  }, [selectedCodingSectionId, sectionCodingProblemIds, aiCodingProblems]);

  const currentMcqInputMethod = selectedSectionId
    ? (mcqInputMethodBySection[selectedSectionId] ?? "manual")
    : "manual";
  const currentCodingInputMethod = selectedCodingSectionId
    ? (codingInputMethodBySection[selectedCodingSectionId] ?? "existing")
    : "existing";

  if (sections.length === 0) {
    return (
      <Alert severity="warning">
        Please add at least one section in the previous step before adding
        questions.
      </Alert>
    );
  }

  // Calculate question counts for sidenav (total from all sources)
  const sectionQuestionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    quizSections.forEach((section) => {
      let total = 0;
      if (sectionMcqIds[section.id]) total += sectionMcqIds[section.id].length;
      if (manualMCQs[section.id]) total += manualMCQs[section.id].length;
      if (csvMCQs[section.id]) total += csvMCQs[section.id].length;
      if (aiMCQs[section.id]) total += aiMCQs[section.id].length;
      counts[section.id] = total;
    });
    return counts;
  }, [quizSections, sectionMcqIds, manualMCQs, csvMCQs, aiMCQs]);

  const sectionCodingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    codingSections.forEach((section) => {
      // Count only selected IDs (both "existing" and "ai" store selected ids here; avoid double-counting with aiCodingProblems)
      counts[section.id] = sectionCodingProblemIds[section.id]?.length ?? 0;
    });
    return counts;
  }, [codingSections, sectionCodingProblemIds]);

  // Check validation errors for sections (insufficient questions)
  const sectionValidationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    
    // Check quiz sections
    quizSections.forEach((section) => {
      if (section.number_of_questions_to_show !== undefined) {
        const totalQuestions = sectionQuestionCounts[section.id] || 0;
        if (totalQuestions < section.number_of_questions_to_show) {
          errors[section.id] = `Need at least ${section.number_of_questions_to_show} questions, but only ${totalQuestions} selected`;
        }
      }
    });
    
    // Check coding sections
    codingSections.forEach((section) => {
      if (section.number_of_questions_to_show !== undefined) {
        const totalProblems = sectionCodingCounts[section.id] || 0;
        if (totalProblems < section.number_of_questions_to_show) {
          errors[section.id] = `Need at least ${section.number_of_questions_to_show} problems, but only ${totalProblems} selected`;
        }
      }
    });
    
    return errors;
  }, [quizSections, codingSections, sectionQuestionCounts, sectionCodingCounts]);

  const handleSectionSelect = (sectionId: string) => {
    if (!sectionId) {
      setSelectedSectionId("");
      setSelectedCodingSectionId("");
      return;
    }
    
    const section = sections.find((s) => s.id === sectionId);
    if (section?.type === "quiz") {
      setSelectedSectionId(sectionId);
      setSelectedCodingSectionId("");
    } else if (section?.type === "coding") {
      setSelectedCodingSectionId(sectionId);
      setSelectedSectionId("");
    }
  };

  const currentSelectedId = selectedSectionId || selectedCodingSectionId;
  const currentSection = sections.find((s) => s.id === currentSelectedId);

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(12, 1fr)",
          },
          gap: 2,
          height: "100%",
          m: 0,
        }}
      >
        {/* Sidenav */}
        <Box
          sx={{
            gridColumn: { xs: "1", sm: "span 4", md: "span 3", lg: "span 3" },
            pr: { xs: 0, sm: 1 },
          }}
        >
          <SectionQuestionsSidenav
            sections={sections}
            selectedSectionId={currentSelectedId}
            onSectionSelect={handleSectionSelect}
            sectionQuestionCounts={sectionQuestionCounts}
            sectionCodingCounts={sectionCodingCounts}
          />
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            gridColumn: { xs: "1", sm: "span 8", md: "span 9", lg: "span 9" },
            pl: { xs: 0, sm: 1 },
          }}
        >
          <Box 
            sx={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: 2.5,
              width: "100%",
              height: "100%",
              minHeight: { xs: "auto", sm: "calc(100vh - 120px)" },
            }}
          >
          {selectedSectionId && currentSection && currentSection.type === "quiz" && (
        <>
          <Paper sx={{ p: 2, bgcolor: "#eef2ff" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Adding questions to: {currentSection.title}
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              {currentSection.description || "No description"}
            </Typography>
            {currentSection.number_of_questions_to_show && (
              <Typography variant="body2" sx={{ color: "#6366f1", mt: 1, fontWeight: 500 }}>
                Required: {currentSection.number_of_questions_to_show} questions
                {sectionQuestionCounts[currentSection.id] !== undefined && (
                  <span style={{ marginLeft: 8 }}>
                    ({sectionQuestionCounts[currentSection.id]} selected)
                  </span>
                )}
              </Typography>
            )}
          </Paper>
          {sectionValidationErrors[currentSection.id] && (
            <Alert severity="error">
              {sectionValidationErrors[currentSection.id]}
            </Alert>
          )}

          <FormControl fullWidth>
            <InputLabel>Question Input Method</InputLabel>
            <Select
              value={currentMcqInputMethod}
              onChange={(e) => {
                if (!isFormatLocked && selectedSectionId) {
                  onMcqInputMethodChange(selectedSectionId, e.target.value as MCQInputMethod);
                }
              }}
              label="Question Input Method"
              disabled={isFormatLocked}
            >
              <MenuItem value="manual">Manual Entry</MenuItem>
              <MenuItem value="existing">Choose from Existing</MenuItem>
              <MenuItem value="csv">Bulk Upload (CSV)</MenuItem>
              <MenuItem value="ai">AI Generated</MenuItem>
            </Select>
          </FormControl>
          {isFormatLocked && (
            <Alert severity="info">
              You cannot switch to another format once you have added questions to this section.
              Remove all questions from this section first to change the format.
            </Alert>
          )}

          {currentMcqInputMethod === "manual" && (
            <MCQFormSection
              mcqs={currentManualMCQs}
              onMCQsChange={(mcqs) =>
                onManualMCQsChange(selectedSectionId, mcqs)
              }
            />
          )}

          {currentMcqInputMethod === "existing" && (
            <MCQSelectionSection
              selectedIds={currentSelectedIds}
              onSelectionChange={(ids) =>
                onSectionMcqIdsChange(selectedSectionId, ids)
              }
              mcqs={existingMCQs}
              loading={loadingMCQs}
            />
          )}

          {currentMcqInputMethod === "csv" && (
            <CSVUploadSection
              mcqs={currentCsvMCQs}
              onMCQsChange={(mcqs) =>
                onCsvMCQsChange(selectedSectionId, mcqs)
              }
            />
          )}

          {currentMcqInputMethod === "ai" && (
            <AIGeneratedSection
              mcqs={currentAiMCQs}
              onMCQsChange={(mcqs) =>
                onAiMCQsChange(selectedSectionId, mcqs)
              }
            />
          )}
        </>
      )}

      {selectedCodingSectionId && (
        <>
          {(() => {
            const currentCodingSection = sections.find((s) => s.id === selectedCodingSectionId);
            const currentCodingProblemIds = selectedCodingSectionId
              ? sectionCodingProblemIds[selectedCodingSectionId] || []
              : [];

            return currentCodingSection ? (
              <>
                <Paper sx={{ p: 2, bgcolor: "#d1fae5" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Adding coding problems to: {currentCodingSection.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    {currentCodingSection.description || "No description"}
                  </Typography>
                  {currentCodingSection.number_of_questions_to_show && (
                    <Typography variant="body2" sx={{ color: "#10b981", mt: 1, fontWeight: 500 }}>
                      Required: {currentCodingSection.number_of_questions_to_show} problems
                      {sectionCodingCounts[currentCodingSection.id] !== undefined && (
                        <span style={{ marginLeft: 8 }}>
                          ({sectionCodingCounts[currentCodingSection.id]} selected)
                        </span>
                      )}
                    </Typography>
                  )}
                </Paper>
                {sectionValidationErrors[currentCodingSection.id] && (
                  <Alert severity="error">
                    {sectionValidationErrors[currentCodingSection.id]}
                  </Alert>
                )}

                <FormControl fullWidth>
                  <InputLabel>Coding Problem Input Method</InputLabel>
                  <Select
                    value={currentCodingInputMethod}
                    onChange={(e) => {
                      if (!isCodingFormatLocked && selectedCodingSectionId) {
                        onCodingInputMethodChange(selectedCodingSectionId, e.target.value as CodingInputMethod);
                      }
                    }}
                    label="Coding Problem Input Method"
                    disabled={isCodingFormatLocked}
                  >
                    <MenuItem value="existing">Choose from Existing</MenuItem>
                    <MenuItem value="ai">AI Generated</MenuItem>
                  </Select>
                </FormControl>
                {isCodingFormatLocked && (
                  <Alert severity="info">
                    You cannot switch to another format once you have added coding problems to this section.
                    Remove all coding problems from this section first to change the format.
                  </Alert>
                )}

                {currentCodingInputMethod === "existing" && (
                  <CodingProblemSelectionSection
                    selectedIds={currentCodingProblemIds}
                    onSelectionChange={(ids) =>
                      onSectionCodingProblemIdsChange(selectedCodingSectionId, ids)
                    }
                    codingProblems={existingCodingProblems}
                    loading={loadingCodingProblems}
                  />
                )}

                {currentCodingInputMethod === "ai" && (
                  <AIGeneratedCodingSection
                    codingProblemIds={currentCodingProblemIds}
                    onCodingProblemIdsChange={(ids) =>
                      onSectionCodingProblemIdsChange(selectedCodingSectionId, ids)
                    }
                    generatedProblems={selectedCodingSectionId ? (aiCodingProblems[selectedCodingSectionId] || []) : []}
                    onGeneratedProblemsChange={(problems) =>
                      onAiCodingProblemsChange(selectedCodingSectionId, problems)
                    }
                  />
                )}
              </>
            ) : null;
          })()}
        </>
      )}

          {!currentSelectedId && (
            <Paper sx={{ p: 4, textAlign: "center", bgcolor: "#f9fafb" }}>
              <Typography variant="h6" sx={{ color: "#6b7280", mb: 1 }}>
                Select a section to add questions
              </Typography>
              <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                Choose a section from the sidebar to start adding questions or
                coding problems.
              </Typography>
            </Paper>
          )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

