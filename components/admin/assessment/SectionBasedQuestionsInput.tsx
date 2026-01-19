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
  mcqInputMethod: MCQInputMethod;
  onMcqInputMethodChange: (method: MCQInputMethod) => void;
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
  // Coding problems
  codingInputMethod: CodingInputMethod;
  onCodingInputMethodChange: (method: CodingInputMethod) => void;
  sectionCodingProblemIds: Record<string, number[]>; // sectionId -> Coding Problem IDs
  onSectionCodingProblemIdsChange: (sectionId: string, ids: number[]) => void;
  aiCodingProblems: Record<string, CodingProblemListItem[]>; // sectionId -> Generated Coding Problems
  onAiCodingProblemsChange: (sectionId: string, problems: CodingProblemListItem[]) => void;
  existingCodingProblems: CodingProblemListItem[];
  loadingCodingProblems: boolean;
}

export function SectionBasedQuestionsInput({
  sections,
  mcqInputMethod,
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
  codingInputMethod,
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

  const hasManualData = Object.values(manualMCQs).some(
    (mcqs) => mcqs.length > 0
  );
  const hasExistingData = Object.values(sectionMcqIds).some(
    (ids) => ids.length > 0
  );
  const hasCsvData = Object.values(csvMCQs).some((mcqs) => mcqs.length > 0);
  const hasAiData = Object.values(aiMCQs).some((mcqs) => mcqs.length > 0);
  const hasAnyData = hasManualData || hasExistingData || hasCsvData || hasAiData;
  const isFormatLocked = hasAnyData;

  // Check if coding problems have been added (format lock for coding)
  // Check both existing selections and AI generated problems
  const hasCodingData = Object.values(sectionCodingProblemIds).some(
    (ids) => ids.length > 0
  ) || Object.values(aiCodingProblems).some(
    (problems) => problems.length > 0
  );
  const isCodingFormatLocked = hasCodingData;

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
      let total = 0;
      if (sectionCodingProblemIds[section.id]) total += sectionCodingProblemIds[section.id].length;
      if (aiCodingProblems[section.id]) total += aiCodingProblems[section.id].length;
      counts[section.id] = total;
    });
    return counts;
  }, [codingSections, sectionCodingProblemIds, aiCodingProblems]);

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
              value={mcqInputMethod}
              onChange={(e) => {
                if (!isFormatLocked) {
                  onMcqInputMethodChange(e.target.value as MCQInputMethod);
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
              You cannot switch to another format once you have added questions.
              Please remove all questions first to change the format.
            </Alert>
          )}

          {mcqInputMethod === "manual" && (
            <MCQFormSection
              mcqs={currentManualMCQs}
              onMCQsChange={(mcqs) =>
                onManualMCQsChange(selectedSectionId, mcqs)
              }
            />
          )}

          {mcqInputMethod === "existing" && (
            <MCQSelectionSection
              selectedIds={currentSelectedIds}
              onSelectionChange={(ids) =>
                onSectionMcqIdsChange(selectedSectionId, ids)
              }
              mcqs={existingMCQs}
              loading={loadingMCQs}
            />
          )}

          {mcqInputMethod === "csv" && (
            <CSVUploadSection
              mcqs={currentCsvMCQs}
              onMCQsChange={(mcqs) =>
                onCsvMCQsChange(selectedSectionId, mcqs)
              }
            />
          )}

          {mcqInputMethod === "ai" && (
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
                    value={codingInputMethod}
                    onChange={(e) => {
                      if (!isCodingFormatLocked) {
                        onCodingInputMethodChange(e.target.value as CodingInputMethod);
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
                    You cannot switch to another format once you have added coding problems.
                    Please remove all coding problems first to change the format.
                  </Alert>
                )}

                {codingInputMethod === "existing" && (
                  <CodingProblemSelectionSection
                    selectedIds={currentCodingProblemIds}
                    onSelectionChange={(ids) =>
                      onSectionCodingProblemIdsChange(selectedCodingSectionId, ids)
                    }
                    codingProblems={existingCodingProblems}
                    loading={loadingCodingProblems}
                  />
                )}

                {codingInputMethod === "ai" && (
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

