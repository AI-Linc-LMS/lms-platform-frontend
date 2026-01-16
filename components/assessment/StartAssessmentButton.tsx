"use client";

import { Box, Paper, Typography, Button } from "@mui/material";

interface StartAssessmentButtonProps {
  title: string;
  onStart: () => void;
  isInitializing: boolean;
}

export function StartAssessmentButton({
  title,
  onStart,
  isInitializing,
}: StartAssessmentButtonProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
      }}
    >
      <Paper
        elevation={2}
        sx={{
          maxWidth: 500,
          p: 4,
          textAlign: "center",
        }}
      >
        <Typography variant="h5" fontWeight={600} gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Click the button below to start your assessment in fullscreen mode.
        </Typography>
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={onStart}
          disabled={isInitializing}
          sx={{
            py: 1.5,
            fontSize: "1rem",
            fontWeight: 600,
            backgroundColor: "#374151",
            "&:hover": {
              backgroundColor: "#1f2937",
            },
          }}
        >
          {isInitializing ? "Starting..." : "Start Assessment"}
        </Button>
      </Paper>
    </Box>
  );
}

