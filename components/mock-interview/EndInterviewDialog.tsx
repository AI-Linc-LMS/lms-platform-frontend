"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { memo } from "react";

interface EndInterviewDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const EndInterviewDialog = memo(function EndInterviewDialog({
  open,
  onConfirm,
  onCancel,
}: EndInterviewDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon="mdi:alert-circle" size={24} color="#ef4444" />
          <Typography variant="h6" fontWeight={600}>
            End Interview?
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to end the interview? All your progress will be
          saved and submitted.
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            You can review your answers after submission. Make sure you've
            answered all questions before ending.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          sx={{
            borderColor: "#d1d5db",
            color: "#374151",
            textTransform: "none",
            "&:hover": {
              borderColor: "#9ca3af",
              backgroundColor: "#f9fafb",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            backgroundColor: "#ef4444",
            color: "#ffffff",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#dc2626",
            },
          }}
          startIcon={<IconWrapper icon="mdi:check" size={20} />}
        >
          End Interview
        </Button>
      </DialogActions>
    </Dialog>
  );
});

