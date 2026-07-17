"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Alert,
  Paper,
} from "@mui/material";
import { MCQFormSection } from "./MCQFormSection";
import { MCQSelectionSection } from "./MCQSelectionSection";
import { CSVUploadSection } from "./CSVUploadSection";
import { AIGeneratedSection } from "./AIGeneratedSection";
import { CodingProblemSelectionSection } from "./CodingProblemSelectionSection";
import { AIGeneratedCodingSection } from "./AIGeneratedCodingSection";
import { RawCodingProblemSection } from "./RawCodingProblemSection";
import { CodingCSVUploadSection } from "./CodingCSVUploadSection";
import {
  SubjectiveQuestionsFormSection,
  type SubjectiveQuestionDraft,
} from "./SubjectiveQuestionsFormSection";
import { SubjectiveQuestionSelectionSection } from "./SubjectiveQuestionSelectionSection";
import {
  MCQ,
  MCQListItem,
  CodingProblemListItem,
  AssessmentSubjectiveQuestionListItem,
} from "@/lib/services/admin/admin-assessment.service";
import { Section } from "./MultipleSectionsSection";
import { SectionQuestionsSidenav } from "./SectionQuestionsSidenav";
import { IconWrapper } from "@/components/common/IconWrapper";

type MCQInputMethod = "manual" | "existing" | "csv" | "ai";
type CodingInputMethod = "existing" | "ai" | "raw" | "csv";
type SubjectiveInputMethod = "manual" | "existing";

/** One selectable input-method card (redesign mockup): icon tile + title (+ badge) + subtitle. */
interface MethodCardOption<T extends string> {
  value: T;
  title: string;
  subtitle: string;
  icon: string;
  /** Gradient icon tile + "FAST" pill for the AI option. */
  ai?: boolean;
}

function MethodCardGrid<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: MethodCardOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 1.5 }}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Box
            key={opt.value}
            role="radio"
            aria-checked={selected}
            tabIndex={disabled ? -1 : 0}
            onClick={() => { if (!disabled) onChange(opt.value); }}
            onKeyDown={(e) => {
              if (!disabled && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onChange(opt.value); }
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 2,
              borderRadius: "var(--radius-card)",
              cursor: disabled ? "default" : "pointer",
              opacity: disabled && !selected ? 0.55 : 1,
              bgcolor: selected
                ? "color-mix(in srgb, var(--ai-violet) 7%, var(--card-bg) 93%)"
                : "var(--card-bg)",
              border: selected ? "1.5px solid var(--ai-violet)" : "1px solid var(--border-default)",
              transition: "border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease",
              "&:hover": disabled ? {} : { borderColor: "var(--ai-violet)" },
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
                ...(opt.ai
                  ? { background: "var(--gradient-ai)", color: "#fff" }
                  : {
                      bgcolor: "color-mix(in srgb, var(--accent-indigo) 10%, var(--card-bg) 90%)",
                      color: "var(--accent-indigo)",
                    }),
              }}
            >
              <IconWrapper icon={opt.icon} size={22} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Typography sx={{ fontWeight: 700, color: "var(--font-primary)", fontSize: "0.95rem" }}>
                  {opt.title}
                </Typography>
                {opt.ai ? (
                  <Box sx={{ px: 0.8, py: 0.1, borderRadius: 999, fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.06em", color: "#fff", background: "var(--gradient-ai)" }}>
                    FAST
                  </Box>
                ) : null}
              </Box>
              <Typography variant="caption" sx={{ color: "var(--font-tertiary)", display: "block", lineHeight: 1.35 }}>
                {opt.subtitle}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

interface SectionBasedQuestionsInputProps {
  sections: Section[];
  evaluationMode: "auto" | "manual";
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
  subjectiveInputMethodBySection: Record<string, SubjectiveInputMethod>;
  onSubjectiveInputMethodChange: (sectionId: string, method: SubjectiveInputMethod) => void;
  manualSubjectiveQuestions: Record<string, SubjectiveQuestionDraft[]>;
  onManualSubjectiveQuestionsChange: (sectionId: string, rows: SubjectiveQuestionDraft[]) => void;
  sectionSubjectiveQuestionIds: Record<string, number[]>;
  onSectionSubjectiveQuestionIdsChange: (sectionId: string, ids: number[]) => void;
  existingSubjectiveQuestions: AssessmentSubjectiveQuestionListItem[];
  loadingSubjectiveQuestions: boolean;
}

export function SectionBasedQuestionsInput({
  sections,
  evaluationMode,
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
  subjectiveInputMethodBySection,
  onSubjectiveInputMethodChange,
  manualSubjectiveQuestions,
  onManualSubjectiveQuestionsChange,
  sectionSubjectiveQuestionIds,
  onSectionSubjectiveQuestionIdsChange,
  existingSubjectiveQuestions,
  loadingSubjectiveQuestions,
}: SectionBasedQuestionsInputProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string | "">("");
  const [selectedCodingSectionId, setSelectedCodingSectionId] = useState<string | "">("");
  const [selectedSubjectiveSectionId, setSelectedSubjectiveSectionId] = useState<string | "">("");

  const quizSections = useMemo(
    () => sections.filter((s) => s.type === "quiz"),
    [sections]
  );
  const codingSections = useMemo(
    () => sections.filter((s) => s.type === "coding"),
    [sections]
  );
  const subjectiveSections = useMemo(
    () => sections.filter((s) => s.type === "subjective"),
    [sections]
  );

  // Auto-select first section if none selected (mount only)
  useEffect(() => {
    if (!selectedSectionId && !selectedCodingSectionId && !selectedSubjectiveSectionId) {
      if (quizSections.length > 0) setSelectedSectionId(quizSections[0].id);
      else if (codingSections.length > 0) setSelectedCodingSectionId(codingSections[0].id);
      else if (subjectiveSections.length > 0) setSelectedSubjectiveSectionId(subjectiveSections[0].id);
    }
  }, []);

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
      counts[section.id] = sectionCodingProblemIds[section.id]?.length ?? 0;
    });
    return counts;
  }, [codingSections, sectionCodingProblemIds]);

  const sectionSubjectiveCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    subjectiveSections.forEach((section) => {
      const method = subjectiveInputMethodBySection[section.id] ?? "manual";
      if (method === "existing") {
        counts[section.id] = sectionSubjectiveQuestionIds[section.id]?.length ?? 0;
      } else {
        const rows = manualSubjectiveQuestions[section.id] || [];
        counts[section.id] = rows.filter(
          (r) => r.question_text.trim().length > 0 && r.evaluation_prompt.trim().length > 0
        ).length;
      }
    });
    return counts;
  }, [
    subjectiveSections,
    subjectiveInputMethodBySection,
    sectionSubjectiveQuestionIds,
    manualSubjectiveQuestions,
  ]);

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

    subjectiveSections.forEach((section) => {
      if (section.number_of_questions_to_show !== undefined) {
        const n = sectionSubjectiveCounts[section.id] || 0;
        if (n < section.number_of_questions_to_show) {
          errors[section.id] = `Need at least ${section.number_of_questions_to_show} written prompts, but only ${n} added`;
        }
      }
    });

    return errors;
  }, [
    quizSections,
    codingSections,
    subjectiveSections,
    sectionQuestionCounts,
    sectionCodingCounts,
    sectionSubjectiveCounts,
  ]);

  const isSubjectiveFormatLocked = useMemo(() => {
    if (!selectedSubjectiveSectionId) return false;
    const manual = (manualSubjectiveQuestions[selectedSubjectiveSectionId] || []).some(
      (r) => r.question_text.trim() || r.evaluation_prompt.trim()
    );
    const existing = (sectionSubjectiveQuestionIds[selectedSubjectiveSectionId] || []).length > 0;
    return manual || existing;
  }, [selectedSubjectiveSectionId, manualSubjectiveQuestions, sectionSubjectiveQuestionIds]);

  const currentSubjectiveInputMethod = selectedSubjectiveSectionId
    ? (subjectiveInputMethodBySection[selectedSubjectiveSectionId] ?? "manual")
    : "manual";

  const handleSectionSelect = (sectionId: string) => {
    if (!sectionId) {
      setSelectedSectionId("");
      setSelectedCodingSectionId("");
      setSelectedSubjectiveSectionId("");
      return;
    }

    const section = sections.find((s) => s.id === sectionId);
    if (section?.type === "quiz") {
      setSelectedSectionId(sectionId);
      setSelectedCodingSectionId("");
      setSelectedSubjectiveSectionId("");
    } else if (section?.type === "coding") {
      setSelectedCodingSectionId(sectionId);
      setSelectedSectionId("");
      setSelectedSubjectiveSectionId("");
    } else if (section?.type === "subjective") {
      setSelectedSubjectiveSectionId(sectionId);
      setSelectedSectionId("");
      setSelectedCodingSectionId("");
    }
  };

  const currentSelectedId =
    selectedSectionId || selectedCodingSectionId || selectedSubjectiveSectionId;
  const currentSection = sections.find((s) => s.id === currentSelectedId);

  // Guard AFTER all hooks (Rules of Hooks): deleting the last section drops
  // sections to 0 — an early return above the useMemo hooks changed the hook count
  // between renders and crashed with "rendered fewer hooks than expected".
  if (sections.length === 0) {
    return (
      <Alert severity="warning">
        Please add at least one section in the previous step before adding
        questions.
      </Alert>
    );
  }

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
            sectionSubjectiveCounts={sectionSubjectiveCounts}
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
          <Paper elevation={0} sx={{ p: 2.25, borderRadius: "var(--radius-card)", border: "1px solid var(--border-default)", background: "var(--gradient-ai-soft)" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: "var(--font-jakarta)", color: "var(--font-primary)" }}>
              Add questions to{" "}
              <Box component="span" sx={{ color: "var(--ai-violet)" }}>{currentSection.title}</Box>
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
              Pick how you want to add them. Mix and match anytime.
            </Typography>
            {currentSection.number_of_questions_to_show && (
              <Typography variant="body2" sx={{ color: "var(--ai-violet)", mt: 1, fontWeight: 600 }}>
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

          <MethodCardGrid<MCQInputMethod>
            value={currentMcqInputMethod}
            disabled={isFormatLocked}
            onChange={(m) => {
              if (!isFormatLocked && selectedSectionId) {
                onMcqInputMethodChange(selectedSectionId, m);
              }
            }}
            options={[
              { value: "ai", title: "AI Generated", subtitle: "Describe a topic, get questions", icon: "mdi:auto-fix", ai: true },
              { value: "existing", title: "From question bank", subtitle: "Reuse verified items", icon: "mdi:content-copy" },
              { value: "manual", title: "Write manually", subtitle: "Type one at a time", icon: "mdi:pencil-outline" },
              { value: "csv", title: "Bulk upload (CSV)", subtitle: "Import a spreadsheet", icon: "mdi:download-outline" },
            ]}
          />
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

      {selectedSubjectiveSectionId &&
        (() => {
          const subjSection = sections.find((s) => s.id === selectedSubjectiveSectionId);
          if (!subjSection || subjSection.type !== "subjective") return null;
          const selIds =
            sectionSubjectiveQuestionIds[selectedSubjectiveSectionId] || [];
          const manualRows =
            manualSubjectiveQuestions[selectedSubjectiveSectionId] || [];
          return (
            <>
              <Paper
                sx={{
                  p: 2,
                  bgcolor:
                    "color-mix(in srgb, var(--warning-500) 14%, var(--surface) 86%)",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Adding written questions to: {subjSection.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                  {subjSection.description || "No description"}
                </Typography>
                {subjSection.number_of_questions_to_show != null && (
                  <Typography
                    variant="body2"
                    sx={{ color: "var(--warning-500)", mt: 1, fontWeight: 500 }}
                  >
                    Required: {subjSection.number_of_questions_to_show} prompt(s)
                    {sectionSubjectiveCounts[subjSection.id] !== undefined && (
                      <span style={{ marginLeft: 8 }}>
                        ({sectionSubjectiveCounts[subjSection.id]} added)
                      </span>
                    )}
                  </Typography>
                )}
              </Paper>
              {sectionValidationErrors[subjSection.id] && (
                <Alert severity="error">{sectionValidationErrors[subjSection.id]}</Alert>
              )}
              <MethodCardGrid<SubjectiveInputMethod>
                value={currentSubjectiveInputMethod}
                disabled={isSubjectiveFormatLocked}
                onChange={(m) => {
                  if (!isSubjectiveFormatLocked && selectedSubjectiveSectionId) {
                    onSubjectiveInputMethodChange(selectedSubjectiveSectionId, m);
                  }
                }}
                options={[
                  { value: "manual", title: "Write manually", subtitle: "Type one at a time", icon: "mdi:pencil-outline" },
                  { value: "existing", title: "From question bank", subtitle: "Reuse verified items", icon: "mdi:content-copy" },
                ]}
              />
              {isSubjectiveFormatLocked && (
                <Alert severity="info">
                  Clear all prompts in this section to switch input method.
                </Alert>
              )}
              {currentSubjectiveInputMethod === "manual" && (
                <SubjectiveQuestionsFormSection
                  questions={manualRows}
                  onQuestionsChange={(rows) =>
                    onManualSubjectiveQuestionsChange(selectedSubjectiveSectionId, rows)
                  }
                  evaluationMode={evaluationMode}
                />
              )}
              {currentSubjectiveInputMethod === "existing" && (
                <SubjectiveQuestionSelectionSection
                  selectedIds={selIds}
                  onSelectionChange={(ids) =>
                    onSectionSubjectiveQuestionIdsChange(selectedSubjectiveSectionId, ids)
                  }
                  questions={existingSubjectiveQuestions}
                  loading={loadingSubjectiveQuestions}
                />
              )}
            </>
          );
        })()}

      {selectedCodingSectionId && (
        <>
          {(() => {
            const currentCodingSection = sections.find((s) => s.id === selectedCodingSectionId);
            const currentCodingProblemIds = selectedCodingSectionId
              ? sectionCodingProblemIds[selectedCodingSectionId] || []
              : [];

            return currentCodingSection ? (
              <>
                <Paper sx={{ p: 2, bgcolor: "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Adding coding problems to: {currentCodingSection.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                    {currentCodingSection.description || "No description"}
                  </Typography>
                  {currentCodingSection.number_of_questions_to_show && (
                    <Typography variant="body2" sx={{ color: "var(--success-500)", mt: 1, fontWeight: 500 }}>
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

                <MethodCardGrid<CodingInputMethod>
                  value={currentCodingInputMethod}
                  disabled={isCodingFormatLocked}
                  onChange={(m) => {
                    if (!isCodingFormatLocked && selectedCodingSectionId) {
                      onCodingInputMethodChange(selectedCodingSectionId, m);
                    }
                  }}
                  options={[
                    { value: "ai", title: "AI Generated", subtitle: "Describe a topic, get problems", icon: "mdi:auto-fix", ai: true },
                    { value: "existing", title: "From problem bank", subtitle: "Reuse verified problems", icon: "mdi:content-copy" },
                    { value: "raw", title: "Write your own", subtitle: "Author a problem from scratch", icon: "mdi:pencil-outline" },
                    { value: "csv", title: "Bulk upload (CSV)", subtitle: "Import a spreadsheet", icon: "mdi:download-outline" },
                  ]}
                />
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

                {currentCodingInputMethod === "raw" && (
                  <RawCodingProblemSection
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

                {currentCodingInputMethod === "csv" && (
                  <CodingCSVUploadSection
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
            <Paper sx={{ p: 4, textAlign: "center", bgcolor: "color-mix(in srgb, var(--surface) 86%, var(--card-bg) 14%)" }}>
              <Typography variant="h6" sx={{ color: "var(--font-secondary)", mb: 1 }}>
                Select a section to add questions
              </Typography>
              <Typography variant="body2" sx={{ color: "var(--font-tertiary)" }}>
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

