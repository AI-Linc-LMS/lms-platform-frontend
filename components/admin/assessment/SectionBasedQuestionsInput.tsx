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

  // Auto-select first section if none selected
  useEffect(() => {
    if (!selectedSectionId && quizSections.length > 0) {
      setSelectedSectionId(quizSections[0].id);
    }
  }, [selectedSectionId, quizSections]);

  // Auto-select first coding section if none selected
  useEffect(() => {
    if (!selectedCodingSectionId && codingSections.length > 0 && !selectedSectionId) {
      setSelectedCodingSectionId(codingSections[0].id);
    }
  }, [selectedCodingSectionId, codingSections, selectedSectionId]);

  const currentSection = sections.find((s) => s.id === selectedSectionId);
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Section Selection */}
      <Paper sx={{ p: 2, bgcolor: "#f9fafb" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {quizSections.length > 0 && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, mb: 1, color: "#6366f1" }}
              >
                Quiz Sections
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Select Quiz Section</InputLabel>
                <Select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  label="Select Quiz Section"
                >
                  {quizSections.map((section) => {
                    const mcqCount =
                      sectionMcqIds[section.id]?.length ||
                      manualMCQs[section.id]?.length ||
                      csvMCQs[section.id]?.length ||
                      aiMCQs[section.id]?.length ||
                      0;
                    return (
                      <MenuItem key={section.id} value={section.id}>
                        {section.title} (Order: {section.order})
                        {mcqCount > 0 && (
                          <Chip
                            label={`${mcqCount} questions`}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>
          )}

          {codingSections.length > 0 && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, mb: 1, color: "#10b981" }}
              >
                Coding Sections
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Select Coding Section</InputLabel>
                <Select
                  value={selectedCodingSectionId}
                  onChange={(e) => {
                    setSelectedCodingSectionId(e.target.value);
                    setSelectedSectionId(""); // Clear quiz section selection
                  }}
                  label="Select Coding Section"
                >
                  {codingSections.map((section) => {
                    const problemCount = sectionCodingProblemIds[section.id]?.length || 0;
                    return (
                      <MenuItem key={section.id} value={section.id}>
                        {section.title} (Order: {section.order})
                        {problemCount > 0 && (
                          <Chip
                            label={`${problemCount} problems`}
                            size="small"
                            sx={{ ml: 1, bgcolor: "#d1fae5" }}
                          />
                        )}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>
          )}
        </Box>
      </Paper>

      {selectedSectionId && currentSection && currentSection.type === "quiz" && (
        <>
          <Paper sx={{ p: 2, bgcolor: "#eef2ff" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Adding questions to: {currentSection.title}
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              {currentSection.description || "No description"}
            </Typography>
          </Paper>

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
                </Paper>

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
    </Box>
  );
}

