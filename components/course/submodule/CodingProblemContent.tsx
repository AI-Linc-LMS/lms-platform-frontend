"use client";

import { Box, Paper, Typography, Button } from "@mui/material";
import { CodeEditor } from "@/components/editor/MonacoEditor";
import { ContentDetail } from "@/lib/services/courses.service";

interface CodingProblemContentProps {
  content: ContentDetail;
  onCodeChange?: (value: string | undefined) => void;
  onReset?: () => void;
  onSubmit?: () => void;
}

export function CodingProblemContent({
  content,
  onCodeChange,
  onReset,
  onSubmit,
}: CodingProblemContentProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: "#ffffff",
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: "#1a1f2e", mb: 2 }}
        >
          Coding Problem
        </Typography>
        {content.details?.description && (
          <Box
            dangerouslySetInnerHTML={{
              __html: content.details.description,
            }}
            sx={{
              color: "#4b5563",
              lineHeight: 1.7,
              mb: 2,
              "& p": {
                mb: 1.5,
              },
              "& ul, & ol": {
                pl: 3,
                mb: 1.5,
              },
            }}
          />
        )}
      </Paper>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: "#ffffff",
          borderRadius: 2,
          border: "1px solid #e5e7eb",
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: "#1a1f2e", mb: 2 }}
        >
          Code Editor
        </Typography>
        <CodeEditor
          value={content.details?.starter_code || ""}
          language={content.details?.language || "javascript"}
          height="500px"
          readOnly={false}
          theme="vs-dark"
          onChange={onCodeChange}
        />
        <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onReset}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#6366f1",
              "&:hover": {
                backgroundColor: "#4f46e5",
              },
            }}
            onClick={onSubmit}
          >
            Submit
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

