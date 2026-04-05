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
            You have exited fullscreen
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            Leaving fullscreen during a proctored assessment is not allowed.
            Choose what to do next:
          </Typography>
        </Alert>
        <Typography variant="body2" color="text.secondary">
          <strong>Continue test</strong> returns you to fullscreen and you carry
          on with the assessment. <strong>Submit assessment</strong> hands in
          all your answers now.
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
