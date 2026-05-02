"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Stack,
  Divider,
} from "@mui/material";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("common");
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
            backgroundColor: "color-mix(in srgb, var(--primary-900) 78%, transparent)",
            backdropFilter: "blur(4px)",
          },
        },
      }}
      PaperProps={{
        elevation: 0,
        sx: {
          zIndex: 14001,
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid color-mix(in srgb, var(--accent-indigo) 22%, var(--border-default))",
          boxShadow:
            "0 24px 64px color-mix(in srgb, var(--primary-900) 28%, transparent), 0 0 0 1px color-mix(in srgb, var(--font-light) 6%, transparent)",
          bgcolor: "var(--card-bg)",
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            px: 2.5,
            py: 2,
            background: `linear-gradient(
              125deg,
              color-mix(in srgb, var(--accent-indigo) 12%, var(--card-bg)) 0%,
              color-mix(in srgb, var(--warning-500) 8%, var(--card-bg)) 55%,
              color-mix(in srgb, var(--card-bg) 96%, var(--surface)) 100%
            )`,
            borderBottom: "1px solid color-mix(in srgb, var(--accent-indigo) 14%, var(--border-default))",
          }}
        >
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                bgcolor: "color-mix(in srgb, var(--warning-500) 16%, transparent)",
                border: "1px solid color-mix(in srgb, var(--warning-500) 35%, transparent)",
              }}
            >
              <IconWrapper
                icon="mdi:fullscreen-exit"
                size={28}
                color="color-mix(in srgb, var(--accent-orange) 85%, var(--font-dark))"
              />
            </Box>
            <Box sx={{ minWidth: 0, pt: 0.25 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.25, color: "var(--font-primary)" }}>
                {t("assessments.take.fullscreenExitTitle")}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.75, color: "var(--font-secondary)", lineHeight: 1.55 }}>
                {t("assessments.take.fullscreenExitSubtitle")}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
        <Box
          sx={{
            p: 1.75,
            borderRadius: 2,
            bgcolor: "color-mix(in srgb, var(--warning-500) 8%, var(--surface))",
            border: "1px solid color-mix(in srgb, var(--warning-500) 22%, var(--border-default))",
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <IconWrapper icon="mdi:information-outline" size={22} color="var(--accent-orange)" />
            <Typography variant="body2" sx={{ color: "var(--font-primary)", lineHeight: 1.6, fontWeight: 500 }}>
              {t("assessments.take.fullscreenExitHint")}
            </Typography>
          </Stack>
        </Box>
      </DialogContent>

      <Divider sx={{ borderColor: "var(--border-default)" }} />

      <DialogActions
        sx={{
          flexDirection: "column",
          alignItems: "stretch",
          gap: 1.25,
          px: 2.5,
          py: 2.5,
          pt: 2,
        }}
      >
        <Button
          variant="contained"
          onClick={onCancel}
          fullWidth
          size="large"
          startIcon={<IconWrapper icon="mdi:fullscreen" size={22} color="var(--font-light)" />}
          sx={{
            py: 1.35,
            px: 1.75,
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            justifyContent: "flex-start",
            textAlign: "left",
            alignItems: "flex-start",
            bgcolor: "var(--accent-indigo)",
            boxShadow: "0 4px 18px color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
            "& .MuiButton-startIcon": { mt: 0.35 },
            "&:hover": {
              bgcolor: "var(--accent-indigo-dark)",
              boxShadow: "0 6px 22px color-mix(in srgb, var(--accent-indigo) 42%, transparent)",
            },
          }}
        >
          <Stack alignItems="flex-start" sx={{ textAlign: "left", py: 0.15, flex: 1, minWidth: 0 }}>
            <Typography component="span" variant="body1" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
              {t("assessments.take.fullscreenExitContinueCta")}
            </Typography>
            <Typography component="span" variant="caption" sx={{ opacity: 0.92, fontWeight: 500, lineHeight: 1.35 }}>
              {t("assessments.take.fullscreenExitContinueDetail")}
            </Typography>
          </Stack>
        </Button>

        <Button
          variant="outlined"
          color="error"
          onClick={onSubmit}
          fullWidth
          size="large"
          startIcon={<IconWrapper icon="mdi:send-check" size={22} color="var(--error-500)" />}
          sx={{
            py: 1.35,
            px: 1.75,
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            justifyContent: "flex-start",
            textAlign: "left",
            alignItems: "flex-start",
            borderWidth: 2,
            borderColor: "color-mix(in srgb, var(--error-500) 45%, var(--border-default))",
            color: "var(--error-600)",
            bgcolor: "color-mix(in srgb, var(--error-500) 4%, transparent)",
            "& .MuiButton-startIcon": { mt: 0.35 },
            "&:hover": {
              borderWidth: 2,
              borderColor: "var(--error-500)",
              bgcolor: "color-mix(in srgb, var(--error-500) 8%, transparent)",
            },
          }}
        >
          <Stack alignItems="flex-start" sx={{ textAlign: "left", py: 0.15, flex: 1, minWidth: 0 }}>
            <Typography component="span" variant="body1" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
              {t("assessments.take.fullscreenExitSubmitCta")}
            </Typography>
            <Typography component="span" variant="caption" sx={{ opacity: 0.9, fontWeight: 500, lineHeight: 1.35 }}>
              {t("assessments.take.fullscreenExitSubmitDetail")}
            </Typography>
          </Stack>
        </Button>
      </DialogActions>
    </Dialog>
  );
}
