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

interface FullscreenWarningDialogProps {
  open: boolean;
  onReEnterFullscreen: () => void;
}

export function FullscreenWarningDialog({
  open,
  onReEnterFullscreen,
}: FullscreenWarningDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          <IconWrapper icon="mdi:fullscreen" size={24} color="#374151" />
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
          Press <strong>F11</strong> or click the button below to continue.
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
            backgroundColor: "#374151",
            color: "#ffffff",
            py: 1.5,
            fontSize: "1rem",
            fontWeight: 600,
            "&:hover": {
              backgroundColor: "#1f2937",
            },
          }}
        >
          Enter Fullscreen Mode
        </Button>
      </DialogActions>
    </Dialog>
  );
}
