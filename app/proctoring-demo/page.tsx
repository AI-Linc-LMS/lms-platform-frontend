"use client";

import { Box, Container, Typography, Paper } from "@mui/material";
import { ProctoringMonitor } from "@/components/proctoring/ProctoringMonitor";

export default function ProctoringDemoPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          border: "1px solid #e5e7eb",
          borderRadius: 2,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
        }}
      >
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Proctoring System Demo
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Test the AI-powered face detection proctoring system. The system will
          monitor for:
        </Typography>
        <Box
          component="ul"
          sx={{
            mt: 2,
            pl: 3,
            "& li": { mb: 0.5 },
          }}
        >
          <li>No face detected</li>
          <li>Multiple faces in frame</li>
          <li>Looking away from screen</li>
          <li>Being too close or too far from camera</li>
          <li>Poor lighting conditions</li>
        </Box>
      </Paper>

      <ProctoringMonitor
        autoStart={false}
        showVideo={true}
        maxViolations={5}
        onViolationThresholdReached={(count) => {
          alert(
            `You have reached ${count} violations. Please follow the proctoring guidelines.`
          );
        }}
      />

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mt: 4,
          border: "1px solid #e5e7eb",
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" fontWeight={600} gutterBottom>
          How to Use
        </Typography>
        <Box component="ol" sx={{ pl: 3, "& li": { mb: 1 } }}>
          <li>Click "Start Monitoring" to begin face detection</li>
          <li>
            Ensure your face is clearly visible and centered in the camera
          </li>
          <li>Try different scenarios to trigger violations:</li>
          <Box component="ul" sx={{ pl: 3, mt: 1 }}>
            <li>Look away from the screen</li>
            <li>Move too close or too far from camera</li>
            <li>Have someone else enter the frame</li>
            <li>Cover your face or move out of frame</li>
          </Box>
          <li>Click "Snapshot" to capture the current frame</li>
          <li>Click "Stop" when done testing</li>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mt: 3,
          border: "1px solid #fef3c7",
          borderRadius: 2,
          backgroundColor: "#fffbeb",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          <strong>Note:</strong> This is a demo page. In production, the
          proctoring system should be integrated with your assessment/exam
          pages. All violations should be logged to the backend for review.
        </Typography>
      </Paper>
    </Container>
  );
}

