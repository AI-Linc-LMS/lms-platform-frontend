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
  const inlineFor = (m: MCQInputMethod): MCQ[] =>
    m === "manual" ? manualMCQs : m === "csv" ? csvMCQs : m === "ai" ? aiMCQs : [];
  const setInlineFor = (m: MCQInputMethod, v: MCQ[]) => {
    if (m === "manual") onManualMCQsChange(v);
    else if (m === "csv") onCsvMCQsChange(v);
    else if (m === "ai") onAiMCQsChange(v);
  };

  // Keep-as-pool (P2): switching the input method carries the current method's
  // inline questions into the target method (deduped by text), so a switch never
  // drops questions you already added or AI-generated. (Switching to/from
  // "Choose from Existing", which references persisted ids, keeps its own buffer.)
  const handleMethodChange = (next: MCQInputMethod) => {
    if (next === mcqInputMethod) return;
    const carry = inlineFor(mcqInputMethod);
    if (carry.length > 0 && next !== "existing") {
      const target = inlineFor(next);
      const seen = new Set(target.map((m) => (m.question_text || "").trim()));
      const merged = [...target];
      for (const q of carry) {
        const key = (q.question_text || "").trim();
        if (key && !seen.has(key)) {
          merged.push(q);
          seen.add(key);
        }
      }
      setInlineFor(next, merged);
    }
    onMcqInputMethodChange(next);
  };

  const hasInlineData = inlineFor(mcqInputMethod).length > 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <FormControl fullWidth>
        <InputLabel>Question Input Method</InputLabel>
        <Select
          value={mcqInputMethod}
          onChange={(e) => handleMethodChange(e.target.value as MCQInputMethod)}
          label="Question Input Method"
        >
          <MenuItem value="manual">Manual Entry</MenuItem>
          <MenuItem value="existing">Choose from Existing</MenuItem>
          <MenuItem value="csv">Bulk Upload (CSV)</MenuItem>
          <MenuItem value="ai">AI Generated</MenuItem>
        </Select>
      </FormControl>
      {hasInlineData && (
        <Alert severity="info">
          Switching the input method keeps the questions you already added or
          generated. They carry over to the new method.
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

