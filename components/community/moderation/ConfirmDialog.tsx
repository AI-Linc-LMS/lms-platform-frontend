"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      slotProps={{
        paper: {
          elevation: 0,
          sx: {
            borderRadius: 2,
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--card-bg)",
            minWidth: 400,
          },
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, fontWeight: 700 }}>
        {destructive && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "var(--error-100)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:alert-outline" size={20} color="var(--ats-error-muted)" />
          </Box>
        )}
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: "var(--font-secondary)" }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          disabled={busy}
          sx={{ textTransform: "none", color: "var(--font-secondary)" }}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={busy}
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: destructive
              ? "var(--ats-error-muted)"
              : "var(--accent-indigo)",
            color: "var(--font-light)",
            "&:hover": {
              backgroundColor: destructive
                ? "var(--error-600)"
                : "var(--accent-indigo-dark)",
            },
          }}
        >
          {busy ? "Working…" : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
