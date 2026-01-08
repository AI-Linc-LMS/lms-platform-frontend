"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmColor?: "primary" | "error" | "warning" | "success";
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  confirmColor = "primary",
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 600,
          color: "#1a1f2e",
          pb: 1,
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body1"
          sx={{
            color: "#4b5563",
            lineHeight: 1.6,
          }}
        >
          {message}
        </Typography>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          gap: 2,
        }}
      >
        <Button
          onClick={onCancel}
          variant="outlined"
          sx={{
            textTransform: "none",
            borderRadius: 2,
            px: 3,
            borderColor: "#e5e7eb",
            color: "#6b7280",
            "&:hover": {
              borderColor: "#d1d5db",
              backgroundColor: "#f9fafb",
            },
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={confirmColor}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            px: 3,
            fontWeight: 600,
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}







