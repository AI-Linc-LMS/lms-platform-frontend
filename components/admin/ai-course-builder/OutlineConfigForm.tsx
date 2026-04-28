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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("common");
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
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
        {t("adminAICourseBuilder.contentConfiguration")}
      </Typography>

      <FormControl size="small" fullWidth>
        <InputLabel>{t("adminAICourseBuilder.contentTypes")}</InputLabel>
        <Select
          multiple
          value={c.content_types ?? ["Quiz", "Article"]}
          onChange={handleContentTypes}
          label={t("adminAICourseBuilder.contentTypes")}
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
        <InputLabel>{t("adminAICourseBuilder.difficultyLevel")}</InputLabel>
        <Select
          value={c.difficulty_level ?? "Medium"}
          onChange={handleDifficulty}
          label={t("adminAICourseBuilder.difficultyLevel")}
        >
          {DIFFICULTY_LEVELS.map((d) => (
            <MenuItem key={d} value={d}>
              {t(`adminCourseBuilder.${d.toLowerCase()}`)}
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
        label={t("adminAICourseBuilder.includeCodingProblems")}
      />

      <TextField
        size="small"
        type="number"
        label={t("adminAICourseBuilder.articlesPerSubmodule")}
        value={c.articles_per_submodule ?? 1}
        onChange={(e) => handleNumber("articles_per_submodule", e.target.value)}
        inputProps={{ min: 0 }}
        fullWidth
      />
      <TextField
        size="small"
        type="number"
        label={t("adminAICourseBuilder.quizzesPerSubmodule")}
        value={c.quizzes_per_submodule ?? 1}
        onChange={(e) => handleNumber("quizzes_per_submodule", e.target.value)}
        inputProps={{ min: 0 }}
        fullWidth
      />
      <TextField
        size="small"
        type="number"
        label={t("adminAICourseBuilder.questionsPerQuiz")}
        value={c.questions_per_quiz ?? 5}
        onChange={(e) => handleNumber("questions_per_quiz", e.target.value)}
        inputProps={{ min: 3}}
        fullWidth
      />
      <TextField
        size="small"
        type="number"
        label={t("adminAICourseBuilder.codingProblemsPerSubmodule")}
        value={c.coding_problems_per_submodule ?? 0}
        onChange={(e) =>
          handleNumber("coding_problems_per_submodule", e.target.value)
        }
        inputProps={{ min: 0, }}
        fullWidth
        disabled={!c.include_coding_problems}
      />
    </Box>
  );
}
