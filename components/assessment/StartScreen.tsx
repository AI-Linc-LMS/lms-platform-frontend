"use client";

import { Box, Button, Paper, Typography, Alert } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface StartScreenProps {
  title: string;
  isInitializing: boolean;
  onStart: () => void;
}

export function StartScreen({
  title,
  isInitializing,
  onStart,
}: StartScreenProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          maxWidth: 600,
          p: 4,
          textAlign: "center",
        }}
      >
        <IconWrapper
          icon="mdi:shield-account"
          size={64}
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "center",
          }}
        />
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Proctored Assessment
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {title}
        </Typography>

        <Alert severity="warning" sx={{ my: 3, textAlign: "left" }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            This assessment is monitored by AI proctoring
          </Typography>
          <Typography variant="body2" component="div">
            You will be monitored for:
            <ul style={{ marginTop: 8, marginBottom: 0 }}>
              <li>Face presence and visibility</li>
              <li>Looking away from screen</li>
              <li>Multiple people in frame</li>
              <li>Tab switches and fullscreen exits</li>
            </ul>
          </Typography>
        </Alert>

        <Typography variant="body2" color="text.secondary" paragraph>
          Before starting:
        </Typography>
        <Box
          component="ul"
          sx={{
            textAlign: "left",
            pl: 3,
            mb: 3,
            "& li": { mb: 1 },
          }}
        >
          <li>Ensure you are in a well-lit room</li>
          <li>Position yourself clearly in front of the camera</li>
          <li>Remove any distractions from the background</li>
          <li>Ensure no one else will enter the room</li>
          <li>Keep your face visible throughout the assessment</li>
          <li>Do not switch tabs or exit fullscreen</li>
        </Box>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={onStart}
          disabled={isInitializing}
          startIcon={<IconWrapper icon="mdi:play-circle" />}
          sx={{
            py: 1.5,
            fontSize: "1.1rem",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          {isInitializing ? "Initializing..." : "Start Assessment"}
        </Button>
      </Paper>
    </Box>
  );
}
