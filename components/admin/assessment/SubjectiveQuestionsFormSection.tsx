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
            p: 2,
            border: "1px solid var(--border-default)",
            borderRadius: 2,
            bgcolor: "var(--card-bg)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Question {index + 1}
            </Typography>
            {(questions.length > 0 ? questions.length > 1 : rows.length > 1) && (
              <Button
                size="small"
                color="error"
                onClick={() => removeRow(index)}
                startIcon={<IconWrapper icon="mdi:delete-outline" size={18} />}
              >
                Remove
              </Button>
            )}
          </Box>
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
            sx={{ mb: 2 }}
          />
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
          {evaluationMode === "auto" ? (
            <Typography variant="caption" sx={{ display: "block", mt: 1.5, color: "var(--font-secondary)" }}>
              File upload and video require manual evaluation — switch evaluation mode on step 1 or choose text modes.
            </Typography>
          ) : null}
          {index < rows.length - 1 ? <Divider sx={{ mt: 2 }} /> : null}
        </Paper>
      ))}
      <Button
        variant="outlined"
        onClick={addRow}
        startIcon={<IconWrapper icon="mdi:plus" size={18} />}
        sx={{ alignSelf: "flex-start" }}
      >
        Add another question
      </Button>
    </Box>
  );
}
