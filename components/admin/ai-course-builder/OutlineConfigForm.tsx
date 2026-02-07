"use client";

import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
  SelectChangeEvent,
} from "@mui/material";
import type { OutlineConfig } from "@/lib/services/admin/ai-course-builder.service";

const CONTENT_TYPES = ["Article", "Quiz",];
const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"] as const;

interface OutlineConfigFormProps {
  config: OutlineConfig;
  onChange: (config: OutlineConfig) => void;
}

const defaultConfig: OutlineConfig = {
  content_types: ["Quiz", "Article"],
  include_coding_problems: false,
  difficulty_level: "Medium",
  articles_per_submodule: 1,
  quizzes_per_submodule: 1,
  questions_per_quiz: 5,
  coding_problems_per_submodule: 0,
};

export function OutlineConfigForm({ config, onChange }: OutlineConfigFormProps) {
  const c = { ...defaultConfig, ...config };

  const handleContentTypes = (e: SelectChangeEvent<string[]>) => {
    const value = e.target.value;
    onChange({
      ...c,
      content_types: typeof value === "string" ? value.split(",") : value,
    });
  };

  const handleDifficulty = (e: SelectChangeEvent<string>) => {
    onChange({
      ...c,
      difficulty_level: e.target.value as "Easy" | "Medium" | "Hard",
    });
  };

  const handleIncludeCoding = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...c,
      include_coding_problems: e.target.checked,
    });
  };

  const handleNumber = (
    field: keyof Pick<
      OutlineConfig,
      | "articles_per_submodule"
      | "quizzes_per_submodule"
      | "questions_per_quiz"
      | "coding_problems_per_submodule"
    >,
    value: string
  ) => {
    const num = parseInt(value, 10);
    if (Number.isNaN(num)) return;
    onChange({ ...c, [field]: num });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151" }}>
        Content configuration
      </Typography>

      <FormControl size="small" fullWidth>
        <InputLabel>Content types</InputLabel>
        <Select
          multiple
          value={c.content_types ?? ["Quiz", "Article"]}
          onChange={handleContentTypes}
          label="Content types"
          renderValue={(selected) => (selected as string[]).join(", ")}
        >
          {CONTENT_TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" fullWidth>
        <InputLabel>Difficulty level</InputLabel>
        <Select
          value={c.difficulty_level ?? "Medium"}
          onChange={handleDifficulty}
          label="Difficulty level"
        >
          {DIFFICULTY_LEVELS.map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControlLabel
        control={
          <Checkbox
            checked={c.include_coding_problems ?? false}
            onChange={handleIncludeCoding}
            color="primary"
          />
        }
        label="Include coding problems"
      />

      <TextField
        size="small"
        type="number"
        label="Articles per submodule"
        value={c.articles_per_submodule ?? 1}
        onChange={(e) => handleNumber("articles_per_submodule", e.target.value)}
        inputProps={{ min: 0, max: 3 }}
        fullWidth
      />
      <TextField
        size="small"
        type="number"
        label="Quizzes per submodule"
        value={c.quizzes_per_submodule ?? 1}
        onChange={(e) => handleNumber("quizzes_per_submodule", e.target.value)}
        inputProps={{ min: 0, max: 2 }}
        fullWidth
      />
      <TextField
        size="small"
        type="number"
        label="Questions per quiz"
        value={c.questions_per_quiz ?? 5}
        onChange={(e) => handleNumber("questions_per_quiz", e.target.value)}
        inputProps={{ min: 3, max: 20 }}
        fullWidth
      />
      <TextField
        size="small"
        type="number"
        label="Coding problems per submodule"
        value={c.coding_problems_per_submodule ?? 0}
        onChange={(e) =>
          handleNumber("coding_problems_per_submodule", e.target.value)
        }
        inputProps={{ min: 0, max: 2 }}
        fullWidth
        disabled={!c.include_coding_problems}
      />
    </Box>
  );
}
