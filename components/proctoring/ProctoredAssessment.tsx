"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  LinearProgress,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useProctoringWithLogging } from "@/lib/hooks/useProctoringWithLogging";

interface ProctoredAssessmentProps {
  assessmentId: number;
  assessmentTitle: string;
  maxViolations?: number;
  children: React.ReactNode;
}

/**
 * A component that wraps an assessment with proctoring functionality
 * Automatically starts proctoring when the assessment begins
 * and monitors for violations throughout
 */
export function ProctoredAssessment({
  assessmentId,
  assessmentTitle,
  maxViolations = 10,
  children,
}: ProctoredAssessmentProps) {
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [showTerminationDialog, setShowTerminationDialog] = useState(false);

  const {
    isActive,
    isInitializing,
    status,
    faceCount,
    violations,
    error,
    startProctoring,
    stopProctoring,
    videoRef,
  } = useProctoringWithLogging({
    assessmentId,
    autoLogViolations: true,
    captureSnapshots: true,
    detectionInterval: 1000,
    violationCooldown: 3000,
    onViolation: (violation) => {
      // Show warning for high-severity violations
      if (violation.severity === "high") {
        setWarningMessage(violation.message);
        setShowWarningDialog(true);
      }
    },
    onLogSuccess: (violationId) => {
      // Violation logged successfully
    },
    onLogError: (error) => {
      // Silently handle violation logging error
    },
  });

  // Monitor violation count
  useEffect(() => {
    const highSeverityViolations = violations.filter(
      (v) => v.severity === "high"
    ).length;

    if (highSeverityViolations >= maxViolations) {
      setShowTerminationDialog(true);
    }
  }, [violations, maxViolations]);

  const handleStartAssessment = async () => {
    try {
      await startProctoring();
      setAssessmentStarted(true);
    } catch (err) {
      alert(
        "Failed to start proctoring. Please ensure your camera is accessible and try again."
      );
    }
  };

  const handleTerminateAssessment = () => {
    stopProctoring();
    // TODO: Submit assessment with violation flag
    alert("Assessment terminated due to excessive violations.");
    window.location.href = "/assessments";
  };

  const getStatusColor = () => {
    switch (status) {
      case "NORMAL":
        return "#10b981";
      case "WARNING":
        return "#f59e0b";
      case "VIOLATION":
        return "#ef4444";
    }
  };

  // Show start screen if not started
  if (!assessmentStarted) {
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
            color="#667eea"
            style={{ marginBottom: 16 }}
          />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Proctored Assessment
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {assessmentTitle}
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
                <li>Suspicious behavior</li>
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
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleStartAssessment}
            disabled={isInitializing}
            startIcon={<IconWrapper icon="mdi:play-circle" />}
            sx={{
              py: 1.5,
              fontSize: "1.1rem",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            {isInitializing ? "Initializing Camera..." : "Start Assessment"}
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      {/* Proctoring Status Bar */}
      <Paper
        elevation={0}
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          p: 1.5,
          borderRadius: 0,
          backgroundColor: "#fff",
          borderBottom: `3px solid ${getStatusColor()}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Chip
            icon={<IconWrapper icon="mdi:shield-check" size={16} />}
            label="PROCTORING ACTIVE"
            color={status === "NORMAL" ? "success" : "error"}
            size="small"
            sx={{ fontWeight: 600 }}
          />
          <Typography variant="body2" color="text.secondary">
            Status: <strong>{status}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Faces: <strong>{faceCount}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Violations:{" "}
            <strong
              style={{
                color:
                  violations.length >= maxViolations ? "#ef4444" : "inherit",
              }}
            >
              {violations.length}/{maxViolations}
            </strong>
          </Typography>
        </Box>
      </Paper>

      {/* Camera Preview (Small, bottom-right corner) */}
      <Paper
        elevation={3}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 1200,
          overflow: "hidden",
          borderRadius: 2,
          border: `3px solid ${getStatusColor()}`,
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: 240,
            height: 180,
            display: "block",
            transform: "scaleX(-1)", // Mirror effect
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            borderRadius: 1,
            px: 1,
            py: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "#fff", fontWeight: 600, fontSize: "0.7rem" }}
          >
            <IconWrapper
              icon="mdi:record-circle"
              size={12}
              color="#ef4444"
              style={{ marginRight: 4, animation: "pulse 2s infinite" }}
            />
            RECORDING
          </Typography>
        </Box>
      </Paper>

      {/* Assessment Content */}
      <Box sx={{ pt: 10, pb: 4 }}>{children}</Box>

      {/* Warning Dialog */}
      <Dialog
        open={showWarningDialog}
        onClose={() => setShowWarningDialog(false)}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper icon="mdi:alert" size={24} color="#f59e0b" />
            <Typography variant="h6" fontWeight={600}>
              Proctoring Warning
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {warningMessage}
          </Alert>
          <Typography variant="body2">
            Please ensure you follow the proctoring guidelines. Multiple
            violations may result in assessment termination.
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }} fontWeight={600}>
            Current violations: {violations.length} / {maxViolations}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowWarningDialog(false)}
            variant="contained"
          >
            I Understand
          </Button>
        </DialogActions>
      </Dialog>

      {/* Termination Dialog */}
      <Dialog
        open={showTerminationDialog}
        onClose={() => {}}
        disableEscapeKeyDown
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper icon="mdi:alert-octagon" size={24} color="#ef4444" />
            <Typography variant="h6" fontWeight={600} color="error">
              Assessment Terminated
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Maximum violation threshold reached ({maxViolations} violations)
          </Alert>
          <Typography variant="body2">
            Your assessment has been terminated due to excessive proctoring
            violations. All progress has been saved and will be reviewed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleTerminateAssessment}
            variant="contained"
            color="error"
          >
            Exit Assessment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

