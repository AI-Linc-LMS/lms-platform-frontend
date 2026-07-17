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
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { StatusChip } from "@/components/admin/assessment/shared";
import { MCQ } from "@/lib/services/admin/admin-assessment.service";

interface MCQFormSectionProps {
  mcqs: MCQ[];
  onMCQsChange: (mcqs: MCQ[]) => void;
}

/** Card recipe (contract): soft border + layered shadow on the white card token. */
const cardSx = {
  borderRadius: "16px",
  bgcolor: "var(--card-bg)",
  border: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
  boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
};

/** Section kicker label (contract): tiny, heavy, tracked-out uppercase. */
const kickerSx = {
  fontSize: "0.72rem",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "var(--font-tertiary)",
  fontFamily: "var(--font-jakarta)",
  lineHeight: 1.4,
};

/** Shared selected/idle styling for the correct-answer letter toggles. */
const letterToggleGroupSx = {
  flexWrap: "wrap" as const,
  gap: 1,
  "& .MuiToggleButtonGroup-grouped": {
    border: "1px solid",
    borderColor:
      "color-mix(in srgb, var(--ai-violet) 24%, var(--border-default)) !important",
    borderRadius: "10px !important",
    px: 2,
    py: 1,
    fontWeight: 800,
    fontFamily: "var(--font-jakarta)",
    textTransform: "none" as const,
    color: "var(--font-secondary)",
    "&.Mui-selected": {
      bgcolor: "color-mix(in srgb, var(--ai-violet) 14%, var(--card-bg) 86%)",
      color: "var(--ai-violet)",
      borderColor: "var(--ai-violet) !important",
    },
  },
};

function FieldGroup({
  title,
  hint,
  icon,
  accent = "var(--ai-violet)",
  children,
}: {
  title: string;
  hint?: string;
  icon: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ ...cardSx, p: { xs: 2, sm: 2.5 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            bgcolor: `color-mix(in srgb, ${accent} 12%, var(--card-bg) 88%)`,
          }}
        >
          <IconWrapper icon={icon} size={20} color={accent} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h4" sx={kickerSx}>
            {title}
          </Typography>
          {hint ? (
            <Typography
              variant="caption"
              sx={{ color: "var(--font-secondary)", display: "block", lineHeight: 1.45 }}
            >
              {hint}
            </Typography>
          ) : null}
        </Box>
      </Stack>
      {children}
    </Box>
  );
}

function OptionLetterBadge({ letter }: { letter: "A" | "B" | "C" | "D" }) {
  return (
    <Box
      sx={{
        minWidth: 32,
        height: 32,
        borderRadius: 2,
        display: "grid",
        placeItems: "center",
        fontSize: "0.8125rem",
        fontWeight: 800,
        fontFamily: "var(--font-jakarta)",
        color: "var(--ai-violet)",
        bgcolor: "color-mix(in srgb, var(--ai-violet) 12%, var(--card-bg) 88%)",
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
    // Keep editingIndex pointing at the same row after a delete shifts indices — else
    // editing question B then deleting earlier question A would overwrite the wrong row.
    if (editingIndex !== null) {
      if (editingIndex === index) {
        setEditingIndex(null);
        setFormData(emptyForm());
      } else if (index < editingIndex) {
        setEditingIndex(editingIndex - 1);
      }
    }
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
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: "color-mix(in srgb, var(--ai-violet) 12%, var(--card-bg) 88%)",
          }}
        >
          <IconWrapper icon="mdi:help-circle-outline" size={22} color="var(--ai-violet)" />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              lineHeight: 1.2,
              fontFamily: "var(--font-jakarta)",
              color: "var(--font-primary)",
            }}
          >
            {editingIndex !== null ? "Edit question" : "Add MCQ questions"}
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)", mt: 0.25 }}>
            Single choice (one key) or multiple select (exact set of correct options).
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={2}>
        <FieldGroup
          title="Question stem"
          hint="The prompt learners see above the choices."
          icon="mdi:text-box-outline"
        >
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

        <FieldGroup
          title="Answer choices"
          hint="Four options; learners pick one (MCQ) or several (MSQ) depending on type below."
          icon="mdi:format-list-bulleted-square"
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
                    <InputAdornment position="start" sx={{ mr: 0.75 }}>
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

        <FieldGroup
          title="Type & grading"
          hint="Choose MCQ vs MSQ, then mark which option letters are correct."
          icon="mdi:checkbox-marked-circle-outline"
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
                    <IconWrapper icon="mdi:radiobox-marked" size={20} color="var(--ai-violet)" />
                    <span>Single choice (MCQ)</span>
                  </Stack>
                </MenuItem>
                <MenuItem value="multiple">
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <IconWrapper icon="mdi:checkbox-multiple-marked-outline" size={20} color="var(--ai-violet)" />
                    <span>Multiple select (MSQ)</span>
                  </Stack>
                </MenuItem>
              </Select>
            </FormControl>

            {isMsq ? (
              <Box
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  border: "1px solid",
                  borderColor: msqNeedsMore
                    ? "color-mix(in srgb, var(--warning-500) 45%, var(--border-default))"
                    : "color-mix(in srgb, var(--ai-violet) 22%, var(--border-default))",
                  bgcolor: msqNeedsMore
                    ? "color-mix(in srgb, var(--warning-500) 6%, var(--card-bg))"
                    : "color-mix(in srgb, var(--ai-violet) 5%, var(--card-bg))",
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
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      fontFamily: "var(--font-jakarta)",
                      color: "var(--font-primary)",
                    }}
                  >
                    Correct options
                  </Typography>
                  <Box sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>
                    <StatusChip
                      label={`${msqCount} selected · need ≥ 2`}
                      tone={msqNeedsMore ? "warning" : "success"}
                      icon={msqNeedsMore ? "mdi:alert-circle-outline" : "mdi:check-circle-outline"}
                    />
                  </Box>
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
                  sx={letterToggleGroupSx}
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
                    ...letterToggleGroupSx,
                    "& .MuiToggleButtonGroup-grouped": {
                      ...letterToggleGroupSx["& .MuiToggleButtonGroup-grouped"],
                      px: 2.25,
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

        <FieldGroup
          title="Metadata"
          hint="Optional tagging for reports and filtering."
          icon="mdi:tag-outline"
          accent="var(--accent-indigo)"
        >
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

        <FieldGroup
          title="Explanation & skills"
          hint="Shown after submit when you enable explanations."
          icon="mdi:lightbulb-on-outline"
          accent="var(--accent-indigo)"
        >
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
            <Button
              variant="outlined"
              onClick={handleCancel}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                px: 2.5,
                color: "var(--font-primary)",
                borderColor: "var(--border-default)",
                "&:hover": {
                  borderColor: "var(--accent-indigo)",
                  bgcolor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)",
                },
              }}
            >
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
              px: 2.75,
              py: 1,
              borderRadius: 2,
              color: "#fff",
              background: "var(--gradient-ai)",
              boxShadow: "0 10px 22px -12px color-mix(in srgb, var(--ai-violet) 70%, transparent)",
              "&:hover": { background: "var(--gradient-ai)", filter: "brightness(1.05)" },
              "&.Mui-disabled": {
                color: "var(--font-secondary)",
                background: "color-mix(in srgb, var(--ai-violet) 18%, var(--surface) 82%)",
              },
            }}
          >
            {editingIndex !== null ? "Update question" : "Add question"}
          </Button>
        </Box>
      </Stack>

      {mcqs.length > 0 && (
        <Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 800,
              mb: 1.5,
              fontFamily: "var(--font-jakarta)",
              color: "var(--font-primary)",
            }}
          >
            Added questions{" "}
            <Box
              component="span"
              sx={{ fontFamily: "var(--font-mono)", fontSize: "0.9em", color: "var(--font-secondary)" }}
            >
              ({mcqs.length})
            </Box>
          </Typography>
          {mcqs.map((mcq, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                ...cardSx,
                p: 2.25,
                mb: 1.5,
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
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 800, fontFamily: "var(--font-jakarta)", color: "var(--font-primary)" }}
                  >
                    Question{" "}
                    <Box component="span" sx={{ fontFamily: "var(--font-mono)" }}>
                      {index + 1}
                    </Box>
                  </Typography>
                  <StatusChip
                    label={mcq.question_style === "multiple" ? "MSQ" : "MCQ"}
                    tone={mcq.question_style === "multiple" ? "warning" : "info"}
                    icon={
                      mcq.question_style === "multiple"
                        ? "mdi:checkbox-multiple-marked-outline"
                        : "mdi:radiobox-marked"
                    }
                  />
                </Stack>
                <Box sx={{ display: "flex", gap: 0.75, flexShrink: 0 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(index)}
                    sx={{
                      color: "var(--accent-indigo)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "10px",
                      "&:hover": {
                        borderColor: "var(--accent-indigo)",
                        bgcolor: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                      },
                    }}
                    aria-label="Edit question"
                  >
                    <IconWrapper icon="mdi:pencil" size={18} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(index)}
                    sx={{
                      color: "var(--error-500)",
                      border: "1px solid color-mix(in srgb, var(--error-500) 35%, transparent)",
                      borderRadius: "10px",
                      "&:hover": {
                        borderColor: "var(--error-500)",
                        bgcolor: "color-mix(in srgb, var(--error-500) 8%, transparent)",
                      },
                    }}
                    aria-label="Delete question"
                  >
                    <IconWrapper icon="mdi:delete" size={18} />
                  </IconButton>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ mb: 1.25, lineHeight: 1.5, color: "var(--font-primary)" }}>
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
                        borderRadius: "10px",
                        bgcolor: isCorrect
                          ? "color-mix(in srgb, var(--success-500) 8%, transparent)"
                          : "transparent",
                      }}
                    >
                      <OptionLetterBadge letter={letter} />
                      <Typography variant="body2" sx={{ flex: 1, pt: 0.5, color: "var(--font-primary)" }}>
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
                  Multiple select, exact set: {(mcq.correct_options || []).join(", ")}
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
