"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  Button,
  TextField,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  IconButton,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export type QuestionType = "text" | "textarea" | "choice" | "multichoice" | "yes_no";

const QUESTION_TYPES: { value: QuestionType; label: string; icon: string }[] = [
  { value: "text", label: "Text", icon: "mdi:format-text" },
  { value: "textarea", label: "Paragraph", icon: "mdi:text-box-outline" },
  { value: "choice", label: "MCQ", icon: "mdi:radiobox-marked" },
  { value: "multichoice", label: "Checkboxes", icon: "mdi:checkbox-multiple-marked-outline" },
  { value: "yes_no", label: "Yes/No", icon: "mdi:toggle-switch-outline" },
];

const DEFAULT_OPTIONS = ["", "", "", ""];

interface ApplicationQuestionsModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    question_text: string;
    question_type: QuestionType;
    is_required: boolean;
    order: number;
    options?: string[];
  }) => Promise<void>;
  nextOrder: number;
}

export function ApplicationQuestionsModal({
  open,
  onClose,
  onSubmit,
  nextOrder,
}: ApplicationQuestionsModalProps) {
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("text");
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<string[]>(DEFAULT_OPTIONS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setQuestionText("");
    setQuestionType("text");
    setIsRequired(false);
    setOptions(DEFAULT_OPTIONS);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleTypeChange = (newType: QuestionType) => {
    setQuestionType(newType);
    if (newType === "yes_no") setOptions(["Yes", "No"]);
    else if (newType === "choice" || newType === "multichoice") setOptions(DEFAULT_OPTIONS);
  };

  const updateOption = (i: number, v: string) =>
    setOptions((prev) => {
      const n = [...prev];
      n[i] = v;
      return n;
    });
  const addOption = () => setOptions((prev) => [...prev, ""]);
  const removeOption = (i: number) => setOptions((prev) => prev.filter((_, j) => j !== i));

  const handleSubmit = useCallback(async () => {
    const text = questionText.trim();
    if (!text) {
      setError("Enter the question text");
      return;
    }
    if (questionType === "choice" || questionType === "multichoice") {
      const valid = options.filter((o) => o.trim());
      if (valid.length < 2) {
        setError("Add at least 2 options");
        return;
      }
    }
    setError(null);
    setSubmitting(true);
    try {
      const payload: Parameters<typeof onSubmit>[0] = {
        question_text: text,
        question_type: questionType,
        is_required: isRequired,
        order: nextOrder,
      };
      if (questionType === "choice" || questionType === "multichoice") {
        payload.options = options.filter((o) => o.trim());
      } else if (questionType === "yes_no") {
        payload.options = ["Yes", "No"];
      }
      await onSubmit(payload);
      resetForm();
      onClose();
    } catch (err) {
      setError((err as Error)?.message ?? "Failed to add question");
    } finally {
      setSubmitting(false);
    }
  }, [questionText, questionType, isRequired, options, nextOrder, onSubmit, onClose, resetForm]);

  const needsOptions = questionType === "choice" || questionType === "multichoice";
  const isYesNo = questionType === "yes_no";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 32px 64px -12px rgba(0,0,0,0.2)",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          pt: 2.5,
          pb: 2,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Add question
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            This will appear on the job application form
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{
            color: "#94a3b8",
            "&:hover": { color: "#64748b", bgcolor: "rgba(0,0,0,0.04)" },
          }}
        >
          <IconWrapper icon="mdi:close" size={24} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 3, pt: 0, pb: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Question input */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", mb: 1 }}>
              Question
            </Typography>
            <TextField
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g. What is your expected salary range?"
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  "&:hover": { bgcolor: "#f1f5f9" },
                  "&.Mui-focused": { bgcolor: "#fff" },
                },
              }}
            />
          </Box>

          {/* Type selector - cards */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", mb: 1.5 }}>
              Type
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {QUESTION_TYPES.map((t) => (
                <Box
                  key={t.value}
                  onClick={() => handleTypeChange(t.value)}
                  sx={{
                    flex: "1 1 0",
                    minWidth: 90,
                    p: 1.5,
                    borderRadius: 2,
                    border: "2px solid",
                    borderColor: questionType === t.value ? "#6366f1" : "#e2e8f0",
                    bgcolor: questionType === t.value ? "rgba(99, 102, 241, 0.06)" : "#fff",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    textAlign: "center",
                    "&:hover": {
                      borderColor: questionType === t.value ? "#6366f1" : "#cbd5e1",
                      bgcolor: questionType === t.value ? "rgba(99, 102, 241, 0.08)" : "#f8fafc",
                    },
                  }}
                >
                  <IconWrapper
                    icon={t.icon}
                    size={22}
                    style={{ color: questionType === t.value ? "#6366f1" : "#94a3b8" }}
                  />
                  <Typography variant="caption" sx={{ display: "block", mt: 0.5, fontWeight: 600, color: questionType === t.value ? "#6366f1" : "#475569" }}>
                    {t.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Options - for MCQ / multichoice */}
          {needsOptions && (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", mb: 1.5 }}>
                Options
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {options.map((opt, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: "#f8fafc",
                      border: "1px solid",
                      borderColor: "transparent",
                      "&:focus-within": { borderColor: "#6366f1", bgcolor: "#fff" },
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#94a3b8", minWidth: 20 }}>
                      {String.fromCharCode(65 + i)}
                    </Typography>
                    <TextField
                      size="small"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      fullWidth
                      variant="standard"
                      InputProps={{ disableUnderline: true }}
                      sx={{ "& .MuiInput-root": { fontSize: "0.9375rem" } }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeOption(i)}
                      disabled={options.length <= 2}
                      sx={{
                        color: options.length <= 2 ? "#cbd5e1" : "#94a3b8",
                        "&:hover": { color: "#dc2626", bgcolor: "rgba(239,68,68,0.08)" },
                      }}
                    >
                      <IconWrapper icon="mdi:close" size={18} />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  size="small"
                  startIcon={<IconWrapper icon="mdi:plus" size={18} />}
                  onClick={addOption}
                  sx={{
                    textTransform: "none",
                    color: "#6366f1",
                    fontWeight: 600,
                    justifyContent: "flex-start",
                    "&:hover": { bgcolor: "rgba(99, 102, 241, 0.06)" },
                  }}
                >
                  Add option
                </Button>
              </Box>
            </Box>
          )}

          {isYesNo && (
            <Box sx={{ py: 1, px: 2, borderRadius: 1.5, bgcolor: "#f0fdf4", border: "1px solid rgba(34,197,94,0.2)" }}>
              <Typography variant="body2" sx={{ color: "#15803d", fontWeight: 500 }}>
                Options: Yes, No
              </Typography>
            </Box>
          )}

          {/* Required toggle */}
          <FormControlLabel
            control={
              <Checkbox
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                sx={{ color: "#94a3b8", "&.Mui-checked": { color: "#6366f1" } }}
              />
            }
            label={<Typography variant="body2" color="text.secondary">Required</Typography>}
          />

          {error && (
            <Box sx={{ py: 1.5, px: 2, borderRadius: 1.5, bgcolor: "#fef2f2", border: "1px solid #fecaca" }}>
              <Typography variant="body2" sx={{ color: "#dc2626", fontWeight: 500 }}>
                {error}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* Footer */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid",
          borderColor: "#e2e8f0",
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.5,
        }}
      >
        <Button onClick={handleClose} sx={{ textTransform: "none", color: "#64748b" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !questionText.trim()}
          startIcon={!submitting && <IconWrapper icon="mdi:check" size={18} />}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            py: 1.25,
            borderRadius: 2,
            bgcolor: "#6366f1",
            boxShadow: "0 1px 3px rgba(99, 102, 241, 0.3)",
            "&:hover": { bgcolor: "#4f46e5", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.35)" },
          }}
        >
          {submitting ? "Adding…" : "Add question"}
        </Button>
      </Box>
    </Dialog>
  );
}
