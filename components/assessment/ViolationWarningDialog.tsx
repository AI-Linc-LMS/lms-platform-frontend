"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface ViolationWarningDialogProps {
  open: boolean;
  violationType: string;
  violationMessage: string;
  violationCount: number;
  maxViolations: number;
  onClose: () => void;
}

export function ViolationWarningDialog({
  open,
  violationType,
  violationMessage,
  violationCount,
  maxViolations,
  onClose,
}: ViolationWarningDialogProps) {
  const getSeverity = (): "warning" | "error" => {
    const remaining = maxViolations - violationCount;
    return remaining <= 2 ? "error" : "warning";
  };

  const getIcon = () => {
    return getSeverity() === "error" ? "mdi:alert-octagon" : "mdi:alert";
  };

  const getColor = () => {
    return getSeverity() === "error" ? "#ef4444" : "#f59e0b";
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon={getIcon()} size={24} color={getColor()} />
          <Typography variant="h6" fontWeight={600}>
            Proctoring Warning
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity={getSeverity()} sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Violation Detected: {violationType}
          </Typography>
          <Typography variant="body2">{violationMessage}</Typography>
        </Alert>
        <Typography variant="body2" paragraph>
          Please ensure you follow the proctoring guidelines. Multiple violations may result in
          assessment termination.
        </Typography>
        <Box
          sx={{
            mt: 2,
            p: 2,
            backgroundColor: "#f9fafb",
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            Current violations: {violationCount} / {maxViolations}
          </Typography>
          {maxViolations - violationCount <= 2 && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              Warning: You are close to the violation threshold. Please ensure you comply with all
              proctoring requirements.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" fullWidth>
          I Understand
        </Button>
      </DialogActions>
    </Dialog>
  );
}

