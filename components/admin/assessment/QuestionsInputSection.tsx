"use client";

import { Box, FormControl, InputLabel, Select, MenuItem, Alert } from "@mui/material";
import { MCQFormSection } from "./MCQFormSection";
import { MCQSelectionSection } from "./MCQSelectionSection";
import { CSVUploadSection } from "./CSVUploadSection";
import { AIGeneratedSection } from "./AIGeneratedSection";
import { MCQ, MCQListItem } from "@/lib/services/admin/admin-assessment.service";

type MCQInputMethod = "manual" | "existing" | "csv" | "ai";

interface QuestionsInputSectionProps {
  mcqInputMethod: MCQInputMethod;
  onMcqInputMethodChange: (method: MCQInputMethod) => void;
  manualMCQs: MCQ[];
  onManualMCQsChange: (mcqs: MCQ[]) => void;
  selectedMcqIds: number[];
  onSelectedMcqIdsChange: (ids: number[]) => void;
  csvMCQs: MCQ[];
  onCsvMCQsChange: (mcqs: MCQ[]) => void;
  aiMCQs: MCQ[];
  onAiMCQsChange: (mcqs: MCQ[]) => void;
  existingMCQs: MCQListItem[];
  loadingMCQs: boolean;
}

export function QuestionsInputSection({
  mcqInputMethod,
  onMcqInputMethodChange,
  manualMCQs,
  onManualMCQsChange,
  selectedMcqIds,
  onSelectedMcqIdsChange,
  csvMCQs,
  onCsvMCQsChange,
  aiMCQs,
  onAiMCQsChange,
  existingMCQs,
  loadingMCQs,
}: QuestionsInputSectionProps) {
  const hasManualData = manualMCQs.length > 0;
  const hasExistingData = selectedMcqIds.length > 0;
  const hasCsvData = csvMCQs.length > 0;
  const hasAiData = aiMCQs.length > 0;
  const hasAnyData = hasManualData || hasExistingData || hasCsvData || hasAiData;
  const isFormatLocked = hasAnyData;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
        <MCQFormSection mcqs={manualMCQs} onMCQsChange={onManualMCQsChange} />
      )}

      {mcqInputMethod === "existing" && (
        <MCQSelectionSection
          selectedIds={selectedMcqIds}
          onSelectionChange={onSelectedMcqIdsChange}
          mcqs={existingMCQs}
          loading={loadingMCQs}
        />
      )}

      {mcqInputMethod === "csv" && (
        <CSVUploadSection mcqs={csvMCQs} onMCQsChange={onCsvMCQsChange} />
      )}

      {mcqInputMethod === "ai" && (
        <AIGeneratedSection mcqs={aiMCQs} onMCQsChange={onAiMCQsChange} />
      )}
    </Box>
  );
}

