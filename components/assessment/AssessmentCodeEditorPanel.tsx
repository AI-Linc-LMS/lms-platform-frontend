"use client";

import {
  Box,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CodeEditor } from "@/components/editor/MonacoEditor";
import { getMonacoLanguage } from "@/components/coding/utils/languageUtils";

interface LanguageOption {
  value: string;
  label: string;
  monacoLanguage: string;
}

interface AssessmentCodeEditorPanelProps {
  code: string;
  selectedLanguage: string;
  availableLanguages: LanguageOption[];
  running: boolean;
  submitting: boolean;
  canSubmit: boolean;
  onCodeChange: (value: string) => void;
  onLanguageChange: (language: string) => void;
  onReset: () => void;
  onRun: () => void;
  onSubmit: () => void;
}

export function AssessmentCodeEditorPanel({
  code,
  selectedLanguage,
  availableLanguages,
  running,
  submitting,
  canSubmit,
  onCodeChange,
  onLanguageChange,
  onReset,
  onRun,
  onSubmit,
}: AssessmentCodeEditorPanelProps) {
  const monacoLanguage = getMonacoLanguage(selectedLanguage);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {/* Language Selector and Actions */}
      <Box
        sx={{
          p: { xs: 1.5, md: 2 },
          borderBottom: "1px solid var(--border-default)",
          display: "flex",
          gap: { xs: 1.5, md: 2 },
          alignItems: "center",
          flexWrap: "wrap",
          backgroundColor: "var(--surface)",
          flexShrink: 0,
        }}
      >
        <FormControl
          size="small"
          sx={{ minWidth: { xs: 120, md: 130, lg: 150 } }}
        >
          <InputLabel sx={{ fontSize: { xs: "0.875rem", lg: "1rem" } }}>
            Language
          </InputLabel>
          <Select
            value={selectedLanguage}
            label="Language"
            onChange={(e) => onLanguageChange(e.target.value)}
            sx={{ fontSize: { xs: "0.875rem", lg: "1rem" } }}
          >
            {availableLanguages.map((lang) => (
              <MenuItem key={lang.value} value={lang.value}>
                {lang.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        <Button
          variant="outlined"
          size="small"
          onClick={onReset}
          startIcon={<IconWrapper icon="mdi:restore" size={18} />}
          sx={{
            fontSize: "0.875rem",
            fontWeight: 500,
            px: 2,
            py: 0.75,
            textTransform: "none",
            borderColor: "var(--border-light)",
            color: "var(--font-secondary)",
            "&:hover": {
              borderColor: "var(--font-tertiary)",
              backgroundColor: "var(--surface)",
            },
          }}
        >
          Reset
        </Button>

        <Button
          variant="outlined"
          size="small"
          onClick={onRun}
          disabled={running || submitting}
          startIcon={
            running ? (
              <CircularProgress size={18} />
            ) : (
              <IconWrapper icon="mdi:play" size={18} />
            )
          }
          sx={{
            borderColor: "var(--accent-indigo)",
            color: "var(--accent-indigo)",
            fontSize: "0.875rem",
            fontWeight: 600,
            px: 2.5,
            py: 0.75,
            textTransform: "none",
            "&:hover": {
              borderColor: "var(--accent-indigo-dark)",
              backgroundColor: "color-mix(in srgb, var(--surface-blue-light) 90%, var(--card-bg))",
            },
            "&:disabled": {
              borderColor: "var(--border-default)",
              color: "var(--font-tertiary)",
            },
          }}
        >
          {running ? "Running..." : "Run"}
        </Button>

        <Button
          variant="contained"
          size="small"
          onClick={onSubmit}
          disabled={running || submitting || !canSubmit}
          startIcon={
            submitting ? (
              <CircularProgress size={18} />
            ) : (
              <IconWrapper icon="mdi:check" size={18} />
            )
          }
          sx={{
            backgroundColor: canSubmit ? "var(--course-cta)" : "var(--font-secondary)",
            color: "var(--font-light)",
            fontSize: "0.875rem",
            fontWeight: 600,
            px: 2.5,
            py: 0.75,
            textTransform: "none",
            "&:hover": {
              backgroundColor: canSubmit ? "var(--assessment-success-strong)" : "var(--neutral-500)",
            },
            "&:disabled": {
              backgroundColor: "var(--border-light)",
              color: "var(--font-tertiary)",
            },
          }}
        >
        {submitting
        ? "Submitting..."
        : canSubmit
        ? "Final Code Submission"
        : "Check with Test Cases"}
        </Button>
      </Box>

      {/* Code Editor */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CodeEditor
          value={code}
          language={monacoLanguage}
          height="100%"
          readOnly={false}
          theme="vs-dark"
          onChange={(value) => onCodeChange(value || "")}
        />
      </Box>
    </Box>
  );
}
