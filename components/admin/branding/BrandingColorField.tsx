"use client";

import { useId, useRef } from "react";
import {
  Box,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { IconWrapper } from "@/components/common/IconWrapper";

interface BrandingColorFieldProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  fallbackHex?: string;
  /** Short friendly line under the label (plain language). */
  hint?: string;
  helperText?: string;
}

const DEFAULT_PICKER_FALLBACK = "#0f172a";

function pickerSafeHex(raw?: string, fallback?: string): string {
  const safeRaw = typeof raw === "string" ? raw : "";
  const safeFallback =
    typeof fallback === "string" && fallback.trim().length > 0
      ? fallback
      : DEFAULT_PICKER_FALLBACK;
  const t = (safeRaw || safeFallback).trim();
  if (/^#[0-9a-fA-F]{6}$/.test(t)) return t;
  if (/^#[0-9a-fA-F]{3}$/.test(t)) return t;
  return safeFallback.startsWith("#") && safeFallback.length >= 4
    ? safeFallback.slice(0, 7)
    : DEFAULT_PICKER_FALLBACK;
}

function isValidHex(raw: string): boolean {
  return /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(raw.trim());
}

export function BrandingColorField({
  label,
  value,
  onChange,
  fallbackHex,
  hint,
  helperText,
}: BrandingColorFieldProps) {
  const colorInputId = useId();
  const colorInputRef = useRef<HTMLInputElement>(null);
  const pickerVal = pickerSafeHex(value, fallbackHex);
  const trimmedValue = (value ?? "").trim();
  const validValue = trimmedValue ? isValidHex(trimmedValue) : true;
  const diverges =
    Boolean(fallbackHex && trimmedValue) &&
    fallbackHex!.toLowerCase() !== trimmedValue.toLowerCase();

  return (
    <Box
      sx={{
        position: "relative",
        p: 1.25,
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
        transition: "border-color 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          borderColor: "color-mix(in srgb, var(--primary-500) 35%, var(--border-default) 65%)",
          boxShadow:
            "0 4px 12px color-mix(in srgb, var(--primary-500) 8%, transparent)",
        },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        {/* Swatch button — opens the native picker and shows a soft halo of the current color */}
        <Box
          component="label"
          htmlFor={colorInputId}
          sx={{
            position: "relative",
            width: 48,
            height: 48,
            flexShrink: 0,
            borderRadius: 1.5,
            cursor: "pointer",
            backgroundColor: pickerVal,
            border: "1px solid var(--border-default)",
            boxShadow: `0 0 0 4px ${alpha(pickerVal, 0.18)}`,
            transition: "transform 120ms ease, box-shadow 200ms ease",
            "&:hover": {
              transform: "scale(1.04)",
              boxShadow: `0 0 0 5px ${alpha(pickerVal, 0.28)}`,
            },
            "&:focus-within": {
              outline: "2px solid var(--primary-500)",
              outlineOffset: 2,
            },
          }}
        >
          <input
            id={colorInputId}
            ref={colorInputRef}
            type="color"
            value={pickerVal}
            onChange={(e) => onChange(e.target.value)}
            aria-label={label}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: "pointer",
              border: "none",
              background: "transparent",
            }}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{ color: "var(--font-primary)", lineHeight: 1.2 }}
            >
              {label}
            </Typography>
            {diverges ? (
              <Tooltip title="Reset to preset value" arrow placement="top">
                <IconButton
                  size="small"
                  onClick={() => fallbackHex && onChange(fallbackHex)}
                  sx={{
                    width: 22,
                    height: 22,
                    color: "var(--font-tertiary)",
                    "&:hover": { color: "var(--primary-500)" },
                  }}
                >
                  <IconWrapper icon="mdi:restore" size={16} />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
          {hint ? (
            <Typography
              variant="caption"
              sx={{
                color: "var(--font-secondary)",
                display: "block",
                lineHeight: 1.4,
                mt: 0.25,
                mb: 0.75,
              }}
            >
              {hint}
            </Typography>
          ) : null}
          <TextField
            size="small"
            fullWidth
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={fallbackHex}
            helperText={
              !validValue
                ? "Use a #RRGGBB hex value."
                : helperText
            }
            error={!validValue}
            inputProps={{
              spellCheck: false,
              "aria-label": `${label} hex code`,
              style: {
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "0.82rem",
                textTransform: "uppercase",
              },
            }}
            InputProps={{
              endAdornment: validValue && trimmedValue ? (
                <InputAdornment position="end">
                  <IconWrapper
                    icon="mdi:check-circle"
                    size={16}
                    color="var(--success-500, #5fa564)"
                  />
                </InputAdornment>
              ) : undefined,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.25,
                backgroundColor: "var(--surface)",
              },
            }}
          />
        </Box>
      </Stack>
    </Box>
  );
}
