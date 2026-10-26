"use client";

import { useState, useEffect } from "react";
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
import { canPressFullscreenHotkey } from "@/lib/fullscreen/fullscreenSupport";

interface FullscreenWarningDialogProps {
  open: boolean;
  onReEnterFullscreen: () => void;
  /**
   * Whether to mention the F11 key. Defaults to asking the device. The caller may override it in
   * a test; nothing about access depends on it.
   */
  mentionHotkey?: boolean;
}

/**
 * Shown only on a device that CAN enter fullscreen - the take page gates it on
 * `fullscreenSupported`, because the one button here is the only way out of it. A phone that has
 * no Fullscreen API must never see this dialog; it gets a plain banner instead.
 */
export function FullscreenWarningDialog({
  open,
  onReEnterFullscreen,
  mentionHotkey,
}: FullscreenWarningDialogProps) {
  const [mounted, setMounted] = useState(false);
  // "Press F11" was printed next to the button on every device, including the iPhone screenshot in
  // the bug report. A phone has no F11, so the line is noise at best and, beside a button that was
  // doing nothing, it read as the learner's own mistake.
  const [showHotkey, setShowHotkey] = useState(false);

  useEffect(() => {
    setMounted(true);
    setShowHotkey(
      mentionHotkey !== undefined ? mentionHotkey : canPressFullscreenHotkey()
    );
  }, [mentionHotkey]);

  if (!mounted) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon="mdi:fullscreen" size={24} color="var(--font-muted)" />
          <Typography variant="h6" fontWeight={600}>
            Fullscreen Mode Required
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            This assessment must be taken in fullscreen mode
          </Typography>
          <Typography variant="body2">
            Please click the button below to enter fullscreen. You must stay in fullscreen mode until you submit your assessment.
          </Typography>
        </Alert>
        <Typography variant="body2" paragraph>
          {showHotkey ? (
            <>
              Press <strong>F11</strong> or use the button below to continue.
            </>
          ) : (
            <>Use the button below to continue.</>
          )}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onReEnterFullscreen}
          variant="contained"
          size="large"
          fullWidth
          startIcon={<IconWrapper icon="mdi:fullscreen" />}
          sx={{
            backgroundColor: "var(--font-muted)",
            color: "var(--font-light)",
            py: 1.5,
            fontSize: "1rem",
            fontWeight: 600,
            "&:hover": {
              backgroundColor: "var(--font-primary-dark)",
            },
          }}
        >
          Enter Fullscreen Mode
        </Button>
      </DialogActions>
    </Dialog>
  );
}
