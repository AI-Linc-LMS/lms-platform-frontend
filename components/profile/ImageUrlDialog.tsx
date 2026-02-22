"use client";

import { useState, useEffect } from "react";
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
      setError("Please enter a valid URL");
      return;
    }
    setError("");
    try {
      setSaving(true);
      await onSave(url);
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
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
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
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
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          backgroundColor: "#f9fafb",
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
            backgroundColor: "rgba(10, 102, 194, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconWrapper icon="mdi:link-variant" size={20} color="#0a66c2" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#000000", fontSize: "1.25rem", mb: 0.25 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.8125rem" }}>
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
          borderTop: "1px solid rgba(0,0,0,0.08)",
          gap: 1,
          flexDirection: { xs: "column-reverse", sm: "row" },
          backgroundColor: "#ffffff",
        }}
      >
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "#666666",
            borderRadius: "24px",
            px: 3,
            py: 1,
            border: "1px solid rgba(0,0,0,0.12)",
            "&:hover": { backgroundColor: "#f3f2ef" },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: "#0a66c2",
            borderRadius: "24px",
            px: 3,
            py: 1,
            "&:hover": { backgroundColor: "#004182" },
          }}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
