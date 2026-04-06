"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Typography,
  Button,
  Box,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface FullscreenExitConfirmDialogProps {
  open: boolean;
  /** Continue the test — re-enters fullscreen. */
  onCancel: () => void;
  /** Submit the assessment. */
  onSubmit: () => void;
}

export function FullscreenExitConfirmDialog({
  open,
  onCancel,
  onSubmit,
}: FullscreenExitConfirmDialogProps) {
  const container =
    typeof document !== "undefined"
      ? () => document.fullscreenElement ?? document.body
      : undefined;

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
          onCancel();
        }
      }}
      disableEscapeKeyDown={false}
      maxWidth="sm"
      fullWidth
      container={container}
      sx={{ zIndex: 14000 }}
      slotProps={{
        backdrop: {
          sx: {
            zIndex: 14000,
            backgroundColor: "rgba(15, 23, 42, 0.7)",
          },
        },
      }}
      PaperProps={{ sx: { zIndex: 14001, borderRadius: 2 } }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon="mdi:alert" size={24} color="#b45309" />
          <Typography variant="h6" fontWeight={600}>
            Leave fullscreen?
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            You pressed Escape or left fullscreen. Choose what to do next:
          </Typography>
        </Alert>
        <Typography variant="body2" color="text.secondary">
          <strong>Continue test</strong> keeps you in the assessment (or returns
          to fullscreen if your browser already left it).{" "}
          <strong>Submit assessment</strong> hands in all your answers now.
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
          In Firefox and Safari, Escape usually leaves fullscreen first (browser
          rule), then this dialog appears. In Chrome, Edge, Brave, and Opera it
          can appear without leaving fullscreen when the browser allows it.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1, px: 3, pb: 2 }}>
        <Button variant="contained" onClick={onCancel} fullWidth sx={{ py: 1.25 }}>
          Continue test
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onSubmit}
          fullWidth
          sx={{ py: 1.25 }}
        >
          Submit assessment
        </Button>
      </DialogActions>
    </Dialog>
  );
}
