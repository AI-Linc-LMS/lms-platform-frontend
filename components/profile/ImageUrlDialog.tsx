"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface ImageUrlDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (url: string) => Promise<void>;
  title: string;
  subtitle?: string;
  currentImageUrl?: string;
  placeholder?: string;
}

function isValidUrl(s: string): boolean {
  const trimmed = s.trim();
  if (!trimmed) return false;
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

export function ImageUrlDialog({
  open,
  onClose,
  onSave,
  title,
  subtitle,
  currentImageUrl,
  placeholder = "https://example.com/your-image.jpg",
}: ImageUrlDialogProps) {
  const { t } = useTranslation("common");
  const [urlValue, setUrlValue] = useState(currentImageUrl || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setUrlValue(currentImageUrl || "");
      setError("");
    }
  }, [open, currentImageUrl]);

  const handleSave = async () => {
    const url = urlValue.trim();
    if (url && !isValidUrl(url)) {
      setError(t("profile.pleaseEnterValidUrl"));
      return;
    }
    setError("");
    try {
      setSaving(true);
      await onSave(url);
      onClose();
    } catch {
      setError(t("profile.failedToSaveTryAgain"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 2 },
          boxShadow: "0 8px 24px color-mix(in srgb, var(--font-primary) 16%, transparent)",
          m: { xs: 0, sm: 2 },
          maxHeight: { xs: "100vh", sm: "90vh" },
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1.5,
          px: { xs: 2.5, sm: 3 },
          pt: { xs: 2.5, sm: 3 },
          borderBottom: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
          backgroundColor: "var(--surface)",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconWrapper icon="mdi:link-variant" size={20} color="var(--accent-indigo)" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "var(--font-primary)", fontSize: "1.25rem", mb: 0.25 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontSize: "0.8125rem" }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 4.5, px: { xs: 2.5, sm: 3 }, pb: 2, overflow: "auto" }}>
        <TextField
          label="Image URL"
          value={urlValue}
          onChange={(e) => {
            setUrlValue(e.target.value);
            setError("");
          }}
          fullWidth
          placeholder={placeholder}
          error={!!error}
          helperText={error}
          autoComplete="off"
          InputLabelProps={{ shrink: true }}
          sx={{
            mt: 1.5,
            "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: "0.9375rem" },
            "& .MuiInputLabel-root": { fontSize: "0.9375rem" },
          }}
        />
      </DialogContent>
      <DialogActions
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2,
          borderTop: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
          gap: 1,
          flexDirection: { xs: "column-reverse", sm: "row" },
          backgroundColor: "var(--background)",
        }}
      >
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "var(--font-secondary)",
            borderRadius: "24px",
            px: 3,
            py: 1,
            border: "1px solid color-mix(in srgb, var(--font-primary) 14%, transparent)",
            "&:hover": { backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))" },
          }}
        >
          {t("profile.cancel")}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: "var(--accent-indigo)",
            borderRadius: "24px",
            px: 3,
            py: 1,
            "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
          }}
        >
          {saving ? t("profile.saving") : t("profile.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
