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
          <IconWrapper icon="mdi:alert-circle" size={24} color="var(--error-500, #ef4444)" />
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
            borderColor: "var(--border-default)",
            color: "var(--font-primary)",
            textTransform: "none",
            "&:hover": {
              borderColor: "var(--font-tertiary)",
              backgroundColor: "var(--surface)",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            backgroundColor: "var(--error-500, #ef4444)",
            color: "var(--font-light)",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "var(--error-600, #dc2626)",
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

