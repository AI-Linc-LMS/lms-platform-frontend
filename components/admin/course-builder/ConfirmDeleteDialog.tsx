"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";

interface ConfirmDeleteDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "#111827" }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "#6b7280" }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onCancel} disabled={loading} sx={{ color: "#6b7280" }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color="error"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
