"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface FullscreenPolicyModalProps {
  open: boolean;
  onContinue: () => void;
}

/**
 * Renders inside the fullscreen element so it stays visible in browser fullscreen mode
 * (portaling only to document.body can be clipped when the fullscreen target is not body).
 */
export function FullscreenPolicyModal({
  open,
  onContinue,
}: FullscreenPolicyModalProps) {
  const container =
    typeof document !== "undefined"
      ? () => document.fullscreenElement ?? document.body
      : undefined;

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
          return;
        }
      }}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      container={container}
      slotProps={{
        backdrop: {
          sx: {
            zIndex: 14000,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
          },
        },
      }}
      PaperProps={{
        sx: {
          zIndex: 14001,
          borderRadius: 2,
        },
      }}
      sx={{ zIndex: 14000 }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconWrapper icon="mdi:fullscreen" size={28} color="#92400e" />
          <Typography variant="h6" fontWeight={700}>
            Fullscreen is required
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600} component="div">
            Stay in fullscreen for the whole assessment. This message is shown
            on top of your test — you are still in fullscreen and have not left
            the exam.
          </Typography>
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          If you leave fullscreen (for example with Esc or the browser exit
          control), you will be asked whether to submit your answers or return
          to fullscreen to continue.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={onContinue}
          sx={{ py: 1.25, fontWeight: 600, textTransform: "none" }}
        >
          I understand — continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
