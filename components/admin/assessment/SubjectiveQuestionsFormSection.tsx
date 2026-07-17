"use client";

import {
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { AssessmentSubjectiveQuestionWrite } from "@/lib/services/admin/admin-assessment.service";

export type SubjectiveQuestionDraft = AssessmentSubjectiveQuestionWrite & {
  max_marks: number;
};

const emptyQuestion = (): SubjectiveQuestionDraft => ({
  question_text: "",
  evaluation_prompt: "",
  max_marks: 5,
  question_type: "",
  answer_mode: "text",
});

/** Section kicker label (design contract): tiny, heavy, tracked-out uppercase. */
const kickerSx = {
  fontSize: "0.72rem",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "var(--font-tertiary)",
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
      <Typography component="h4" variant="subtitle2" sx={{ ...kickerSx, mb: 0.25 }}>
        {title}
      </Typography>
      {hint ? (
        <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 1.25 }}>
          {hint}
        </Typography>
      ) : (
        <Box sx={{ mb: 1 }} />
      )}
      {children}
    </Box>
  );
}

interface SubjectiveQuestionsFormSectionProps {
  questions: SubjectiveQuestionDraft[];
  onQuestionsChange: (rows: SubjectiveQuestionDraft[]) => void;
  evaluationMode: "auto" | "manual";
}

export function SubjectiveQuestionsFormSection({
  questions,
  onQuestionsChange,
  evaluationMode,
}: SubjectiveQuestionsFormSectionProps) {
  const rows = questions.length > 0 ? questions : [emptyQuestion()];

  const updateRow = (index: number, patch: Partial<SubjectiveQuestionDraft>) => {
    const base = questions.length > 0 ? [...questions] : [emptyQuestion()];
    base[index] = { ...base[index], ...patch };
    onQuestionsChange(base);
  };

  const addRow = () => {
    const base = questions.length > 0 ? [...questions] : [emptyQuestion()];
    onQuestionsChange([...base, emptyQuestion()]);
  };

  const removeRow = (index: number) => {
    const base = questions.length > 0 ? [...questions] : [emptyQuestion()];
    const next = base.filter((_, i) => i !== index);
    onQuestionsChange(next.length > 0 ? next : []);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
        Add written prompts. Evaluation prompt guides AI grading (manual assessments skip AI on submit).
      </Typography>
      {rows.map((q, index) => (
        <Paper
          key={index}
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: "16px",
            border: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
            boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
            bgcolor: "var(--card-bg)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {/* Ordinal tile: mono number on an indigo-tinted rounded square */}
              <Box
                sx={{
                  minWidth: 28,
                  height: 28,
                  borderRadius: 1,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  color: "var(--accent-indigo)",
                  bgcolor: "color-mix(in srgb, var(--accent-indigo) 12%, var(--card-bg) 88%)",
                }}
              >
                {index + 1}
              </Box>
              <Typography component="h4" variant="subtitle2" sx={kickerSx}>
                Written question
              </Typography>
            </Box>
            {(questions.length > 0 ? questions.length > 1 : rows.length > 1) && (
              <Button
                size="small"
                onClick={() => removeRow(index)}
                startIcon={<IconWrapper icon="mdi:delete-outline" size={18} />}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  color: "var(--error-500)",
                  "&:hover": {
                    bgcolor: "color-mix(in srgb, var(--error-500) 8%, transparent)",
                  },
                }}
              >
                Remove
              </Button>
            )}
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <FieldGroup title="Prompt & rubric">
              <TextField
                label="Question text"
                value={q.question_text}
                onChange={(e) => updateRow(index, { question_text: e.target.value })}
                fullWidth
                required
                multiline
                minRows={2}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Evaluation prompt (rubric for AI / admins)"
                value={q.evaluation_prompt}
                onChange={(e) => updateRow(index, { evaluation_prompt: e.target.value })}
                fullWidth
                required
                multiline
                minRows={2}
              />
            </FieldGroup>
            <FieldGroup title="Grading & answer mode">
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="Max marks"
                  type="number"
                  value={q.max_marks}
                  onChange={(e) =>
                    updateRow(index, { max_marks: Math.max(1, Number(e.target.value) || 1) })
                  }
                  inputProps={{ min: 1 }}
                  sx={{ "& input": { fontFamily: "var(--font-mono)" } }}
                />
                <TextField
                  label="Type label (optional)"
                  value={q.question_type ?? ""}
                  onChange={(e) => updateRow(index, { question_type: e.target.value })}
                />
                <FormControl fullWidth>
                  <InputLabel id={`answer-mode-${index}`}>Answer mode</InputLabel>
                  <Select
                    labelId={`answer-mode-${index}`}
                    label="Answer mode"
                    value={q.answer_mode ?? "text"}
                    onChange={(e) =>
                      updateRow(index, { answer_mode: String(e.target.value) })
                    }
                  >
                    <MenuItem value="text">Text only</MenuItem>
                    <MenuItem value="text_image">Text + image</MenuItem>
                    <MenuItem value="file_upload" disabled={evaluationMode === "auto"}>
                      File upload (manual eval)
                    </MenuItem>
                    <MenuItem value="video" disabled={evaluationMode === "auto"}>
                      Video (manual eval)
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </FieldGroup>
          </Box>
          {evaluationMode === "auto" ? (
            <Typography variant="caption" sx={{ display: "block", mt: 1.5, color: "var(--font-secondary)" }}>
              File upload and video require manual evaluation — switch evaluation mode on step 1 or choose text modes.
            </Typography>
          ) : null}
          {index < rows.length - 1 ? (
            <Divider sx={{ mt: 2, borderColor: "var(--border-default)" }} />
          ) : null}
        </Paper>
      ))}
      <Button
        variant="outlined"
        onClick={addRow}
        startIcon={<IconWrapper icon="mdi:plus" size={18} />}
        sx={{
          alignSelf: "flex-start",
          textTransform: "none",
          fontWeight: 700,
          borderRadius: 2,
          px: 2.25,
          color: "var(--font-primary)",
          borderColor: "var(--border-default)",
          "&:hover": {
            borderColor: "var(--accent-indigo)",
            bgcolor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)",
          },
        }}
      >
        Add another question
      </Button>
    </Box>
  );
}
