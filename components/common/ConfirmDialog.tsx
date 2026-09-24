"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ResponsiveDialog } from "@/components/common/mobile/ResponsiveDialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmColor?: "primary" | "error" | "warning" | "success";
  /**
   * The confirmed action is running. The dialog then cannot be dismissed - no backdrop click, no
   * Escape - and both buttons are inert, so a second click cannot fire the action twice and
   * nobody walks away from a half-finished delete.
   *
   * This used to hold on the phone sheet only, and the desktop dialog ignored it: the same
   * request that a phone protected could be abandoned mid-flight with a click outside it.
   */
  busy?: boolean;
}

/** Phone actions: full width (the sheet footer does that) and a 48px thumb target. */
const SHEET_BUTTON = { minHeight: 48, textTransform: "none", borderRadius: 2 } as const;

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  confirmColor = "primary",
  busy = false,
}: ConfirmDialogProps) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));

  // A centred dialog on a phone lands mid-screen with its buttons out of thumb reach; the
  // same question comes up from the bottom as a sheet instead.
  if (isPhone) {
    return (
      <ResponsiveDialog
        open={open}
        onClose={() => {
          if (!busy) onCancel();
        }}
        title={title}
        hideCloseButton={busy}
        data-testid="confirm-dialog-sheet"
        footer={
          <>
            <Button onClick={onCancel} disabled={busy} variant="outlined" sx={SHEET_BUTTON}>
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={busy}
              variant="contained"
              color={confirmColor}
              sx={{ ...SHEET_BUTTON, fontWeight: 600 }}
            >
              {confirmText}
            </Button>
          </>
        }
      >
        <Typography
          sx={{ color: "var(--font-secondary)", lineHeight: 1.6, whiteSpace: "pre-line", fontSize: "0.95rem" }}
        >
          {message}
        </Typography>
      </ResponsiveDialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!busy) onCancel();
      }}
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
          color: "var(--font-primary)",
          pb: 1,
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body1"
          sx={{
            color: "var(--font-secondary)",
            lineHeight: 1.6,
            // A message may list things one per line (what a delete would remove, say).
            whiteSpace: "pre-line",
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
          disabled={busy}
          variant="outlined"
          sx={{
            textTransform: "none",
            borderRadius: 2,
            px: 3,
            borderColor: "var(--border-default)",
            color: "var(--font-secondary)",
            "&:hover": {
              borderColor: "var(--font-tertiary)",
              backgroundColor: "var(--surface)",
            },
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={busy}
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
