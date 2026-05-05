"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
  Stack,
  Divider,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { MCQ } from "@/lib/services/admin/admin-assessment.service";

interface MCQFormSectionProps {
  mcqs: MCQ[];
  onMCQsChange: (mcqs: MCQ[]) => void;
}

const groupTitleSx = {
  fontSize: "0.7rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: "var(--font-secondary)",
  mb: 0.25,
};

function FieldGroup({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Typography component="h4" variant="subtitle2" sx={groupTitleSx}>
        {title}
      </Typography>
      {hint ? (
        <Typography
          variant="caption"
          sx={{ color: "var(--font-secondary)", display: "block", mb: 1.25, lineHeight: 1.45 }}
        >
          {hint}
        </Typography>
      ) : (
        <Box sx={{ mb: 1 }} />
      )}
      {children}
    </Box>
  );
}

function OptionLetterBadge({ letter }: { letter: "A" | "B" | "C" | "D" }) {
  return (
    <Box
      sx={{
        minWidth: 28,
        height: 28,
        borderRadius: 1,
        display: "grid",
        placeItems: "center",
        fontSize: "0.8125rem",
        fontWeight: 800,
        color: "var(--accent-indigo-dark)",
        bgcolor: "color-mix(in srgb, var(--accent-indigo) 14%, transparent)",
        border: "1px solid color-mix(in srgb, var(--accent-indigo) 22%, transparent)",
      }}
    >
      {letter}
    </Box>
  );
}

export function MCQFormSection({ mcqs, onMCQsChange }: MCQFormSectionProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const emptyForm = (): MCQ => ({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "A",
    question_style: "single",
    correct_options: [],
    explanation: "",
    difficulty_level: "Medium",
    topic: "",
    skills: "",
  });

  const [formData, setFormData] = useState<MCQ>(emptyForm());

  const handleAddMCQ = () => {
    if (!formData.question_text.trim()) {
      return;
    }
    if (
      !formData.option_a.trim() ||
      !formData.option_b.trim() ||
      !formData.option_c.trim() ||
      !formData.option_d.trim()
    ) {
      return;
    }

    const style = formData.question_style === "multiple" ? "multiple" : "single";
    let payload: MCQ = { ...formData, question_style: style };
    if (style === "multiple") {
      const opts = Array.from(
        new Set(
          (formData.correct_options || [])
            .map((x) => String(x).toUpperCase())
            .filter((x): x is "A" | "B" | "C" | "D" =>
              ["A", "B", "C", "D"].includes(x),
            ),
        ),
      ).sort();
      if (opts.length < 2) {
        return;
      }
      payload.correct_options = opts;
      payload.correct_option = opts[0]!;
    } else {
      payload.question_style = "single";
      payload.correct_options = [formData.correct_option];
    }

    if (editingIndex !== null) {
      const updated = [...mcqs];
      updated[editingIndex] = payload;
      onMCQsChange(updated);
      setEditingIndex(null);
    } else {
      onMCQsChange([...mcqs, payload]);
    }

    setFormData(emptyForm());
  };

  const handleEdit = (index: number) => {
    const m = mcqs[index]!;
    setFormData({
      ...emptyForm(),
      ...m,
      question_style: m.question_style || "single",
      correct_options:
        m.correct_options && m.correct_options.length > 0
          ? [...m.correct_options]
          : [],
    });
    setEditingIndex(index);
  };

  const handleDelete = (index: number) => {
    const updated = mcqs.filter((_, i) => i !== index);
    onMCQsChange(updated);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setFormData(emptyForm());
  };

  const isMsq = formData.question_style === "multiple";
  const msqCount = (formData.correct_options || []).length;
  const msqNeedsMore = isMsq && msqCount < 2;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            display: "grid",
            placeItems: "center",
            bgcolor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent-indigo) 20%, transparent)",
          }}
        >
          <IconWrapper icon="mdi:help-circle-outline" size={22} color="var(--accent-indigo-dark)" />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            {editingIndex !== null ? "Edit question" : "Add MCQ questions"}
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)", mt: 0.25 }}>
            Single choice (one key) or multiple select (exact set of correct options).
          </Typography>
        </Box>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 2,
          border: "1px solid",
          borderColor:
            "color-mix(in srgb, var(--accent-indigo) 26%, var(--border-default) 74%)",
          bgcolor: "color-mix(in srgb, var(--surface) 88%, var(--card-bg) 12%)",
          boxShadow: "0 1px 3px color-mix(in srgb, var(--font-primary) 8%, transparent)",
        }}
      >
        <Stack spacing={2.75}>
          <FieldGroup title="Question stem" hint="The prompt learners see above the choices.">
            <TextField
              label="Question text"
              value={formData.question_text}
              onChange={(e) =>
                setFormData({ ...formData, question_text: e.target.value })
              }
              fullWidth
              required
              multiline
              rows={3}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </FieldGroup>

          <Divider sx={{ borderColor: "color-mix(in srgb, var(--accent-indigo) 10%, var(--border-default))" }} />

          <FieldGroup
            title="Answer choices"
            hint="Four options; learners pick one (MCQ) or several (MSQ) depending on type below."
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              {(
                [
                  ["A", "option_a"],
                  ["B", "option_b"],
                  ["C", "option_c"],
                  ["D", "option_d"],
                ] as const
              ).map(([letter, key]) => (
                <TextField
                  key={key}
                  label={`Option ${letter}`}
                  value={formData[key]}
                  onChange={(e) =>
                    setFormData({ ...formData, [key]: e.target.value })
                  }
                  fullWidth
                  required
                  inputProps={{ maxLength: 255 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ mr: 0.5 }}>
                        <OptionLetterBadge letter={letter} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              ))}
            </Box>
          </FieldGroup>

          <Divider sx={{ borderColor: "color-mix(in srgb, var(--accent-indigo) 10%, var(--border-default))" }} />

          <FieldGroup
            title="Type & grading"
            hint="Choose MCQ vs MSQ, then mark which option letters are correct."
          >
            <Stack spacing={2}>
              <FormControl fullWidth sx={{ maxWidth: { sm: 360 } }}>
                <InputLabel id="mcq-question-type-label">Question type</InputLabel>
                <Select
                  labelId="mcq-question-type-label"
                  value={isMsq ? "multiple" : "single"}
                  label="Question type"
                  onChange={(e) => {
                    const v = e.target.value as "single" | "multiple";
                    setFormData({
                      ...formData,
                      question_style: v,
                      correct_options: v === "multiple" ? formData.correct_options || [] : [],
                    });
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="single">
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <IconWrapper icon="mdi:radiobox-marked" size={20} color="var(--accent-indigo)" />
                      <span>Single choice (MCQ)</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="multiple">
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <IconWrapper icon="mdi:checkbox-multiple-marked-outline" size={20} color="var(--accent-indigo)" />
                      <span>Multiple select (MSQ)</span>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>

              {isMsq ? (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: msqNeedsMore
                      ? "color-mix(in srgb, var(--warning-500) 45%, var(--border-default))"
                      : "color-mix(in srgb, var(--accent-indigo) 18%, var(--border-default))",
                    bgcolor: msqNeedsMore
                      ? "color-mix(in srgb, var(--warning-500) 6%, var(--card-bg))"
                      : "color-mix(in srgb, var(--accent-indigo) 6%, var(--card-bg))",
                    transition: "border-color 0.2s ease, background-color 0.2s ease",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    alignItems={{ sm: "center" }}
                    justifyContent="space-between"
                    sx={{ mb: 1.5 }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
                      Correct options
                    </Typography>
                    <Chip
                      size="small"
                      label={`${msqCount} selected · need ≥ 2`}
                      sx={{
                        alignSelf: { xs: "flex-start", sm: "center" },
                        fontWeight: 700,
                        bgcolor: msqNeedsMore
                          ? "color-mix(in srgb, var(--warning-500) 14%, transparent)"
                          : "color-mix(in srgb, var(--success-500) 14%, transparent)",
                        color: "var(--font-primary-dark)",
                        border: "1px solid",
                        borderColor: msqNeedsMore
                          ? "color-mix(in srgb, var(--warning-500) 35%, transparent)"
                          : "color-mix(in srgb, var(--success-500) 35%, transparent)",
                      }}
                    />
                  </Stack>
                  <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 1.5 }}>
                    Toggle every letter that must be selected for a fully correct answer (exact set).
                  </Typography>
                  <ToggleButtonGroup
                    exclusive={false}
                    value={formData.correct_options || []}
                    onChange={(_, next) => {
                      const letters = (next as ("A" | "B" | "C" | "D")[]).filter(Boolean);
                      setFormData({
                        ...formData,
                        correct_options: [...letters].sort() as MCQ["correct_options"],
                      });
                    }}
                    aria-label="MSQ correct options"
                    sx={{
                      flexWrap: "wrap",
                      gap: 1,
                      "& .MuiToggleButtonGroup-grouped": {
                        border: "1px solid",
                        borderColor: "color-mix(in srgb, var(--accent-indigo) 22%, var(--border-default)) !important",
                        borderRadius: "10px !important",
                        px: 2,
                        py: 1,
                        fontWeight: 800,
                        textTransform: "none",
                        "&.Mui-selected": {
                          bgcolor: "color-mix(in srgb, var(--accent-indigo) 18%, transparent)",
                          color: "var(--accent-indigo-dark)",
                          borderColor: "var(--accent-indigo) !important",
                        },
                      },
                    }}
                  >
                    {(["A", "B", "C", "D"] as const).map((letter) => (
                      <ToggleButton key={letter} value={letter} aria-label={`Correct ${letter}`}>
                        {letter}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
              ) : (
                <Box>
                  <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 1 }}>
                    Correct option (one letter)
                  </Typography>
                  <ToggleButtonGroup
                    exclusive
                    value={formData.correct_option}
                    onChange={(_, v) => {
                      const next = (v ?? formData.correct_option) as "A" | "B" | "C" | "D";
                      setFormData({ ...formData, correct_option: next });
                    }}
                    aria-label="MCQ correct option"
                    sx={{
                      flexWrap: "wrap",
                      gap: 1,
                      "& .MuiToggleButtonGroup-grouped": {
                        border: "1px solid",
                        borderColor: "color-mix(in srgb, var(--accent-indigo) 22%, var(--border-default)) !important",
                        borderRadius: "10px !important",
                        px: 2.25,
                        py: 1,
                        fontWeight: 800,
                        textTransform: "none",
                        "&.Mui-selected": {
                          bgcolor: "color-mix(in srgb, var(--accent-indigo) 18%, transparent)",
                          color: "var(--accent-indigo-dark)",
                          borderColor: "var(--accent-indigo) !important",
                        },
                      },
                    }}
                  >
                    {(["A", "B", "C", "D"] as const).map((letter) => (
                      <ToggleButton key={letter} value={letter} aria-label={`Correct ${letter}`}>
                        {letter}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
              )}
            </Stack>
          </FieldGroup>

          <Divider sx={{ borderColor: "color-mix(in srgb, var(--accent-indigo) 10%, var(--border-default))" }} />

          <FieldGroup title="Metadata" hint="Optional tagging for reports and filtering.">
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>Difficulty level</InputLabel>
                <Select
                  value={formData.difficulty_level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      difficulty_level: e.target.value as "Easy" | "Medium" | "Hard",
                    })
                  }
                  label="Difficulty level"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="Easy">Easy</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Hard">Hard</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Topic"
                value={formData.topic}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
                fullWidth
                inputProps={{ maxLength: 255 }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Box>
          </FieldGroup>

          <Divider sx={{ borderColor: "color-mix(in srgb, var(--accent-indigo) 10%, var(--border-default))" }} />

          <FieldGroup title="Explanation & skills" hint="Shown after submit when you enable explanations.">
            <Stack spacing={2}>
              <TextField
                label="Explanation"
                value={formData.explanation}
                onChange={(e) =>
                  setFormData({ ...formData, explanation: e.target.value })
                }
                fullWidth
                multiline
                rows={2}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
              <TextField
                label="Skills"
                value={formData.skills}
                onChange={(e) =>
                  setFormData({ ...formData, skills: e.target.value })
                }
                fullWidth
                inputProps={{ maxLength: 255 }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Stack>
          </FieldGroup>

          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", flexWrap: "wrap", pt: 0.5 }}>
            {editingIndex !== null && (
              <Button variant="outlined" onClick={handleCancel} sx={{ textTransform: "none", fontWeight: 600 }}>
                Cancel
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleAddMCQ}
              disabled={
                !formData.question_text.trim() ||
                !formData.option_a.trim() ||
                !formData.option_b.trim() ||
                !formData.option_c.trim() ||
                !formData.option_d.trim() ||
                (isMsq && msqCount < 2)
              }
              startIcon={<IconWrapper icon="mdi:plus" size={18} />}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                px: 2.5,
                py: 1,
                borderRadius: 2,
                bgcolor: "var(--accent-indigo)",
                boxShadow: "0 4px 14px color-mix(in srgb, var(--accent-indigo) 32%, transparent)",
                "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
              }}
            >
              {editingIndex !== null ? "Update question" : "Add question"}
            </Button>
          </Box>
        </Stack>
      </Paper>

      {mcqs.length > 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
            Added questions ({mcqs.length})
          </Typography>
          {mcqs.map((mcq, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 2,
                mb: 1.5,
                borderRadius: 2,
                border: "1px solid var(--border-default)",
                bgcolor: "var(--card-bg)",
                position: "relative",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 1,
                  gap: 1,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    Question {index + 1}
                  </Typography>
                  <Chip
                    size="small"
                    label={mcq.question_style === "multiple" ? "MSQ" : "MCQ"}
                    sx={{
                      fontWeight: 700,
                      height: 22,
                      bgcolor:
                        mcq.question_style === "multiple"
                          ? "color-mix(in srgb, var(--warning-500) 12%, transparent)"
                          : "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
                    }}
                  />
                </Stack>
                <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(index)}
                    sx={{ color: "var(--accent-indigo)" }}
                    aria-label="Edit question"
                  >
                    <IconWrapper icon="mdi:pencil" size={18} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(index)}
                    sx={{ color: "var(--error-500)" }}
                    aria-label="Delete question"
                  >
                    <IconWrapper icon="mdi:delete" size={18} />
                  </IconButton>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ mb: 1.25, lineHeight: 1.5 }}>
                {mcq.question_text}
              </Typography>
              <Stack spacing={0.75}>
                {(["A", "B", "C", "D"] as const).map((letter) => {
                  const label =
                    letter === "A"
                      ? mcq.option_a
                      : letter === "B"
                        ? mcq.option_b
                        : letter === "C"
                          ? mcq.option_c
                          : mcq.option_d;
                  const correctSet =
                    mcq.question_style === "multiple" && mcq.correct_options?.length
                      ? new Set(mcq.correct_options)
                      : new Set(mcq.correct_option ? [mcq.correct_option] : []);
                  const isCorrect = correctSet.has(letter);
                  return (
                    <Stack
                      key={letter}
                      direction="row"
                      spacing={1}
                      alignItems="flex-start"
                      sx={{
                        py: 0.5,
                        px: 1,
                        borderRadius: 1,
                        bgcolor: isCorrect
                          ? "color-mix(in srgb, var(--success-500) 8%, transparent)"
                          : "transparent",
                      }}
                    >
                      <OptionLetterBadge letter={letter} />
                      <Typography variant="body2" sx={{ flex: 1, pt: 0.35 }}>
                        {label}
                        {isCorrect && (
                          <IconWrapper
                            icon="mdi:check-decagram"
                            size={16}
                            color="var(--success-500)"
                            style={{ marginLeft: 8, verticalAlign: "middle" }}
                          />
                        )}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
              {mcq.question_style === "multiple" && (
                <Typography variant="caption" sx={{ color: "var(--font-secondary)", mt: 1, display: "block" }}>
                  Multiple select — exact set: {(mcq.correct_options || []).join(", ")}
                </Typography>
              )}
              {mcq.difficulty_level && (
                <Typography variant="caption" sx={{ color: "var(--font-secondary)", mt: 0.75, display: "block" }}>
                  Difficulty: {mcq.difficulty_level}
                  {mcq.topic ? ` · Topic: ${mcq.topic}` : ""}
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
