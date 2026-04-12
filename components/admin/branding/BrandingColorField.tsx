"use client";

import { useState } from "react";
import {
  Box,
  Collapse,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface BrandingColorFieldProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  fallbackHex: string;
  /** Short friendly line under the label (plain language). */
  hint?: string;
  helperText?: string;
}

function pickerSafeHex(raw: string, fallback: string): string {
  const t = (raw || fallback).trim();
  if (t.startsWith("#") && /^#[0-9a-fA-F]{6}$/.test(t)) return t;
  if (t.startsWith("#") && /^#[0-9a-fA-F]{3}$/.test(t)) return t;
  return fallback.startsWith("#") && fallback.length >= 4
    ? fallback.slice(0, 7)
    : "#0f172a";
}

export function BrandingColorField({
  label,
  value,
  onChange,
  fallbackHex,
  hint,
  helperText,
}: BrandingColorFieldProps) {
  const { t } = useTranslation("common");
  const [showCode, setShowCode] = useState(false);
  const pickerVal = pickerSafeHex(value, fallbackHex);

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: hint ? 0.25 : 0.75 }}>
        {label}
      </Typography>
      {hint ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.45 }}>
          {hint}
        </Typography>
      ) : null}
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <TextField
          type="color"
          value={pickerVal}
          onChange={(e) => onChange(e.target.value)}
          size="small"
          inputProps={{ "aria-label": label }}
          sx={{
            width: 56,
            minWidth: 56,
            flexShrink: 0,
            "& input": {
              height: 44,
              p: 0.5,
              cursor: "pointer",
              borderRadius: 1,
            },
          }}
        />
        <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            {t("branding.colorPickerHint")}
          </Typography>
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={() => setShowCode((o) => !o)}
            sx={{
              cursor: "pointer",
              textAlign: "left",
              fontWeight: 600,
              border: "none",
              background: "none",
              p: 0,
              font: "inherit",
            }}
          >
            {showCode ? t("branding.hideColorCode") : t("branding.showColorCode")}
          </Link>
          <Collapse in={showCode}>
            <TextField
              size="small"
              fullWidth
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={fallbackHex}
              helperText={helperText}
              inputProps={{ spellCheck: false }}
              sx={{ mt: 1 }}
              label={t("branding.colorCodeLabel")}
            />
          </Collapse>
        </Box>
      </Stack>
    </Box>
  );
}
