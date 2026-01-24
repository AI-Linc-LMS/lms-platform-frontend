"use client";

import { Box, Paper, Typography, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { CodeEditor } from "@/components/editor/MonacoEditor";
import { getMonacoLanguage } from "@/components/coding/utils/languageUtils";

interface CodingProblemEditorProps {
  code: string;
  selectedLanguage: string;
  availableLanguages: Array<{ value: string; label: string; monacoLanguage: string }>;
  onLanguageChange: (language: string) => void;
}

export function CodingProblemEditor({
  code,
  selectedLanguage,
  availableLanguages,
  onLanguageChange,
}: CodingProblemEditorProps) {
  return (
    <Box
      sx={{
        width: { xs: "100%", md: "50%" },
        height: { xs: "50%", md: "100%" },
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Code Editor
        </Typography>
        {availableLanguages.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Language</InputLabel>
            <Select
              value={selectedLanguage}
              label="Language"
              onChange={(e) => onLanguageChange(e.target.value)}
            >
              {availableLanguages.map((lang) => (
                <MenuItem key={lang.value} value={lang.value}>
                  {lang.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Paper>
      <Box sx={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
        <CodeEditor
          value={code}
          language={selectedLanguage ? getMonacoLanguage(selectedLanguage) : "python"}
          height="100%"
          readOnly={true}
          theme="vs-dark"
        />
      </Box>
    </Box>
  );
}
