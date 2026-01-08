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
import { getMonacoLanguage } from "./utils/languageUtils";

interface LanguageOption {
  value: string;
  label: string;
  monacoLanguage: string;
}

interface CodeEditorPanelProps {
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

export function CodeEditorPanel({
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
}: CodeEditorPanelProps) {
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
          p: { xs: 1, md: 1, lg: 1.5 },
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          gap: { xs: 1, md: 1, lg: 1.5 },
          alignItems: "center",
          flexWrap: "wrap",
          backgroundColor: "#f9fafb",
          flexShrink: 0,
        }}
      >
        <FormControl size="small" sx={{ minWidth: { xs: 120, md: 130, lg: 150 } }}>
          <InputLabel sx={{ fontSize: { xs: "0.875rem", lg: "1rem" } }}>Language</InputLabel>
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
          startIcon={<IconWrapper icon="mdi:restore" size={16} />}
          sx={{ fontSize: { xs: "0.75rem", md: "0.8rem", lg: "0.875rem" } }}
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
              <CircularProgress size={16} />
            ) : (
              <IconWrapper icon="mdi:play" size={16} />
            )
          }
          sx={{
            borderColor: "#6366f1",
            color: "#6366f1",
            fontSize: { xs: "0.75rem", md: "0.8rem", lg: "0.875rem" },
            "&:hover": {
              borderColor: "#4f46e5",
              backgroundColor: "#f5f3ff",
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
              <CircularProgress size={16} />
            ) : (
              <IconWrapper icon="mdi:check" size={16} />
            )
          }
          sx={{
            backgroundColor: canSubmit ? "#10b981" : "#9ca3af",
            fontSize: { xs: "0.75rem", md: "0.8rem", lg: "0.875rem" },
            "&:hover": {
              backgroundColor: canSubmit ? "#059669" : "#9ca3af",
            },
            "&:disabled": {
              backgroundColor: "#d1d5db",
              color: "#9ca3af",
            },
          }}
        >
          {submitting
            ? "Submitting..."
            : canSubmit
            ? "Submit"
            : "Run Tests First"}
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

