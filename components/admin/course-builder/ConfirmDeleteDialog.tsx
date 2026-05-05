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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "var(--font-primary)" }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onCancel} disabled={loading} sx={{ color: "var(--font-secondary)" }}>
          {t("adminCourseBuilder.cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color="error"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            "&.Mui-disabled": {
              color: "var(--font-secondary)",
              backgroundColor:
                "color-mix(in srgb, var(--error-500) 24%, var(--surface) 76%)",
            },
          }}
        >
          {loading ? t("adminCourseBuilder.deleting") : t("adminCourseBuilder.delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
