"use client";

import { Box, Paper, Typography, Button, Chip, Alert } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useProctoring } from "@/lib/hooks/useProctoring";
import { ProctoringViolationType } from "@/lib/services/proctoring.service";

interface ProctoringMonitorProps {
  autoStart?: boolean;
  showVideo?: boolean;
  onViolationThresholdReached?: (violationCount: number) => void;
  maxViolations?: number;
}

export function ProctoringMonitor({
  autoStart = false,
  showVideo = true,
  onViolationThresholdReached,
  maxViolations = 5,
}: ProctoringMonitorProps) {
  const {
    isActive,
    isInitializing,
    faceCount,
    status,
    latestViolation,
    violations,
    error,
    startProctoring,
    stopProctoring,
    takeSnapshot,
    clearViolations,
    getStatistics,
    videoRef,
  } = useProctoring({
    autoStart,
    detectionInterval: 1000,
    violationCooldown: 3000,
    minFaceSize: 15,
    maxFaceSize: 70,
    lookingAwayThreshold: 0.25,
  });

  // Check violation threshold
  if (
    onViolationThresholdReached &&
    violations.length >= maxViolations &&
    violations.length % maxViolations === 0
  ) {
    onViolationThresholdReached(violations.length);
  }

  const getStatusColor = () => {
    switch (status) {
      case "NORMAL":
        return "success";
      case "WARNING":
        return "warning";
      case "VIOLATION":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "NORMAL":
        return "mdi:check-circle";
      case "WARNING":
        return "mdi:alert";
      case "VIOLATION":
        return "mdi:alert-octagon";
      default:
        return "mdi:help-circle";
    }
  };

  const getViolationIcon = (type: ProctoringViolationType) => {
    switch (type) {
      case "NO_FACE":
        return "mdi:account-off";
      case "MULTIPLE_FACES":
        return "mdi:account-multiple";
      case "LOOKING_AWAY":
        return "mdi:eye-off";
      case "EYE_MOVEMENT":
        return "mdi:eye-arrow-right";
      case "FACE_TOO_CLOSE":
        return "mdi:arrow-expand-left";
      case "FACE_TOO_FAR":
        return "mdi:arrow-expand-right";
      case "POOR_LIGHTING":
        return "mdi:lightbulb-off";
      default:
        return "mdi:alert";
    }
  };

  const handleSnapshot = async () => {
    const snapshot = await takeSnapshot();
    if (snapshot) {
      // Download snapshot
      const link = document.createElement("a");
      link.href = snapshot;
      link.download = `proctoring-snapshot-${Date.now()}.jpg`;
      link.click();
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 800, mx: "auto" }}>
      {/* Status Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          border: "1px solid #e5e7eb",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Chip
            icon={<IconWrapper icon={getStatusIcon()} size={18} />}
            label={status}
            color={getStatusColor()}
            sx={{ fontWeight: 600 }}
          />
          <Typography variant="body2" color="text.secondary">
            Faces Detected: <strong>{faceCount}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Violations: <strong>{violations.length}</strong>
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          {!isActive ? (
            <Button
              variant="contained"
              startIcon={<IconWrapper icon="mdi:play" />}
              onClick={startProctoring}
              disabled={isInitializing}
              sx={{ textTransform: "none" }}
            >
              {isInitializing ? "Starting..." : "Start Monitoring"}
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                startIcon={<IconWrapper icon="mdi:camera" />}
                onClick={handleSnapshot}
                sx={{ textTransform: "none" }}
              >
                Snapshot
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<IconWrapper icon="mdi:stop" />}
                onClick={stopProctoring}
                sx={{ textTransform: "none" }}
              >
                Stop
              </Button>
            </>
          )}
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Video Feed */}
      {showVideo && (
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            border: "1px solid #e5e7eb",
            borderRadius: 2,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              backgroundColor: "#000",
            }}
          />

          {/* Overlay Status Indicator */}
          {isActive && (
            <Box
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Chip
                icon={<IconWrapper icon="mdi:record-circle" size={16} />}
                label="MONITORING"
                color="error"
                size="small"
                sx={{
                  fontWeight: 600,
                  animation: "pulse 2s infinite",
                  "@keyframes pulse": {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: 0.7 },
                  },
                }}
              />

              {latestViolation && (
                <Chip
                  icon={
                    <IconWrapper
                      icon={getViolationIcon(latestViolation.type)}
                      size={16}
                    />
                  }
                  label={latestViolation.message}
                  color={
                    latestViolation.severity === "high"
                      ? "error"
                      : latestViolation.severity === "medium"
                      ? "warning"
                      : "default"
                  }
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>
          )}
        </Paper>
      )}

      {/* Violation History */}
      {violations.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: "1px solid #e5e7eb",
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              Recent Violations
            </Typography>
            <Button
              size="small"
              startIcon={<IconWrapper icon="mdi:delete" />}
              onClick={clearViolations}
              sx={{ textTransform: "none" }}
            >
              Clear
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {violations.slice(-5).map((violation, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor:
                    violation.severity === "high"
                      ? "#fee2e2"
                      : violation.severity === "medium"
                      ? "#fef3c7"
                      : "#f3f4f6",
                }}
              >
                <IconWrapper
                  icon={getViolationIcon(violation.type)}
                  size={20}
                  color={
                    violation.severity === "high"
                      ? "#dc2626"
                      : violation.severity === "medium"
                      ? "#f59e0b"
                      : "#6b7280"
                  }
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {violation.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(violation.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
                <Chip
                  label={violation.severity.toUpperCase()}
                  size="small"
                  color={
                    violation.severity === "high"
                      ? "error"
                      : violation.severity === "medium"
                      ? "warning"
                      : "default"
                  }
                />
              </Box>
            ))}
          </Box>

          {violations.length > 5 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block", textAlign: "center" }}
            >
              Showing last 5 of {violations.length} violations
            </Typography>
          )}
        </Paper>
      )}

      {/* Statistics (for debugging) */}
      {isActive && process.env.NODE_ENV === "development" && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mt: 2,
            border: "1px solid #e5e7eb",
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" fontWeight={600} mb={1}>
            Statistics
          </Typography>
          <pre style={{ fontSize: 12, margin: 0 }}>
            {JSON.stringify(getStatistics(), null, 2)}
          </pre>
        </Paper>
      )}
    </Box>
  );
}

