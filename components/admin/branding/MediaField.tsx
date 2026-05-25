"use client";

import { useId, useRef } from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

type AspectVariant = "square" | "landscape";

interface MediaFieldProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  /** Optional file upload handler — when provided, the upload pill is shown. */
  onUpload?: (file: File) => Promise<void> | void;
  uploading?: boolean;
  accept?: string;
  uploadLabel?: string;
  helperText?: string;
  /** Preview thumbnail shape. `square` = 56×56 (favicon, app icon), `landscape` = 96×64 (hero, logo). */
  aspect?: AspectVariant;
  /** Optional sample brand-name text rendered next to the logo in the preview tile. */
  brandText?: string;
}

const ASPECT_DIMS: Record<AspectVariant, { width: number; height: number }> = {
  square: { width: 64, height: 64 },
  landscape: { width: 108, height: 64 },
};

export function MediaField({
  label,
  hint,
  value,
  onChange,
  onUpload,
  uploading,
  accept = "image/png,image/jpeg,image/webp,image/svg+xml,image/gif",
  uploadLabel = "Upload",
  helperText,
  aspect = "landscape",
  brandText,
}: MediaFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmed = value.trim();
  const dims = ASPECT_DIMS[aspect];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onUpload) return;
    void onUpload(file);
  };

  return (
    <Box
      sx={{
        position: "relative",
        p: 1.5,
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
        transition: "border-color 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          borderColor:
            "color-mix(in srgb, var(--primary-500) 35%, var(--border-default) 65%)",
          boxShadow:
            "0 4px 12px color-mix(in srgb, var(--primary-500) 8%, transparent)",
        },
      }}
    >
      <Stack direction="row" spacing={1.75} alignItems="stretch">
        {/* Thumbnail preview tile */}
        <Box
          sx={{
            width: dims.width,
            height: dims.height,
            flexShrink: 0,
            borderRadius: 1.5,
            border: trimmed ? "1px solid var(--border-default)" : "1px dashed var(--border-default)",
            backgroundColor: "color-mix(in srgb, var(--font-primary) 4%, var(--surface) 96%)",
            backgroundImage: trimmed ? `url("${trimmed}")` : undefined,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--font-tertiary)",
            position: "relative",
            overflow: "hidden",
          }}
          aria-label={`${label} preview`}
        >
          {!trimmed ? (
            <IconWrapper icon="mdi:image-outline" size={aspect === "square" ? 26 : 28} />
          ) : null}
          {brandText && trimmed ? (
            <Box
              sx={{
                position: "absolute",
                bottom: 2,
                right: 4,
                fontSize: "0.55rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "var(--font-secondary)",
                opacity: 0.7,
                pointerEvents: "none",
              }}
            >
              {brandText}
            </Box>
          ) : null}
        </Box>

        <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{ color: "var(--font-primary)", lineHeight: 1.2 }}
            >
              {label}
            </Typography>
            {trimmed ? (
              <Tooltip title="Clear" arrow placement="top">
                <IconButton
                  size="small"
                  onClick={() => onChange("")}
                  sx={{
                    width: 22,
                    height: 22,
                    color: "var(--font-tertiary)",
                    "&:hover": { color: "var(--error-500)" },
                  }}
                  aria-label={`Clear ${label}`}
                >
                  <IconWrapper icon="mdi:close-circle-outline" size={16} />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
          {hint ? (
            <Typography
              variant="caption"
              sx={{ color: "var(--font-secondary)", lineHeight: 1.4 }}
            >
              {hint}
            </Typography>
          ) : null}

          <TextField
            size="small"
            fullWidth
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…"
            helperText={helperText}
            inputProps={{
              spellCheck: false,
              "aria-label": `${label} URL`,
              style: {
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "0.82rem",
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.25,
                backgroundColor: "var(--surface)",
              },
            }}
          />

          {onUpload ? (
            <Box>
              <Button
                variant="outlined"
                component="label"
                htmlFor={inputId}
                size="small"
                disabled={uploading}
                startIcon={
                  uploading ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <IconWrapper icon="mdi:cloud-upload-outline" size={16} />
                  )
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "var(--border-default)",
                  color: "var(--font-primary)",
                  backgroundColor: "var(--card-bg)",
                  "&:hover": {
                    borderColor: "var(--primary-500)",
                    backgroundColor:
                      "color-mix(in srgb, var(--primary-500) 8%, var(--card-bg) 92%)",
                  },
                }}
              >
                {uploading ? "Uploading…" : uploadLabel}
                <input
                  id={inputId}
                  ref={inputRef}
                  type="file"
                  hidden
                  accept={accept}
                  onChange={handleFile}
                />
              </Button>
            </Box>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  );
}
