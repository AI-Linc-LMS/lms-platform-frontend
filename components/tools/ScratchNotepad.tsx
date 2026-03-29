"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Box, Chip, TextField, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

export interface ScratchNotepadProps {
  /** Full sessionStorage key for this scratch pad (e.g. `scratch-notepad:course-123`). */
  sessionStorageKey: string;
  /** Shown above the field. Defaults depend on `restrictClipboard`. */
  hint?: string;
  /** When true, blocks copy/paste/cut and context menu (e.g. proctored assessment). Default false. */
  restrictClipboard?: boolean;
  /** Overrides default placeholder from i18n `tools.notepadPlaceholder`. */
  placeholder?: string;
}

function blockClipboard(e: React.ClipboardEvent) {
  e.preventDefault();
}

function blockKeys(e: React.KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    const k = e.key.toLowerCase();
    if (k === "v" || k === "c" || k === "x") {
      e.preventDefault();
    }
  }
}

function blockContextMenu(e: React.MouseEvent) {
  e.preventDefault();
}

export function ScratchNotepad({
  sessionStorageKey,
  hint,
  restrictClipboard = false,
  placeholder,
}: ScratchNotepadProps) {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const [value, setValue] = useState("");
  const hydrated = useRef(false);

  const resolvedHint =
    hint ??
    (restrictClipboard ? t("tools.scratchHint") : t("tools.notepadSubtitle"));
  const resolvedPlaceholder = placeholder ?? t("tools.notepadPlaceholder");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = sessionStorage.getItem(sessionStorageKey);
      if (saved != null) setValue(saved);
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, [sessionStorageKey]);

  useEffect(() => {
    if (!hydrated.current || typeof window === "undefined") return;
    try {
      sessionStorage.setItem(sessionStorageKey, value);
    } catch {
      /* ignore */
    }
  }, [sessionStorageKey, value]);

  const padBg =
    theme.palette.mode === "dark"
      ? alpha(theme.palette.common.black, 0.25)
      : alpha(theme.palette.warning.main, 0.04);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        flex: 1,
        minHeight: 0,
        height: "100%",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        {restrictClipboard && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Chip
              size="small"
              icon={<IconWrapper icon="mdi:lock-outline" size={16} color="currentColor" />}
              label={t("tools.clipboardLocked")}
              sx={{
                height: 26,
                fontSize: "0.7rem",
                bgcolor: alpha(theme.palette.warning.main, 0.12),
                color: "warning.dark",
                border: "1px solid",
                borderColor: alpha(theme.palette.warning.main, 0.35),
                "& .MuiChip-icon": { color: "warning.dark" },
              }}
            />
          </Box>
        )}
        {resolvedHint ? (
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
            {resolvedHint}
          </Typography>
        ) : null}
      </Box>
      <TextField
        multiline
        fullWidth
        value={value}
        onChange={(e) => setValue(e.target.value)}
        variant="outlined"
        onPaste={restrictClipboard ? blockClipboard : undefined}
        onCopy={restrictClipboard ? blockClipboard : undefined}
        onCut={restrictClipboard ? blockClipboard : undefined}
        onKeyDown={restrictClipboard ? blockKeys : undefined}
        onContextMenu={restrictClipboard ? blockContextMenu : undefined}
        placeholder={resolvedPlaceholder}
        sx={{
          flex: 1,
          minHeight: 0,
          alignSelf: "stretch",
          overflow: "visible",
          "& .MuiInputBase-root": {
            alignItems: "flex-start",
            height: "auto",
            minHeight: 0,
            userSelect: "text",
            WebkitUserSelect: "text",
            borderRadius: 2,
            bgcolor: padBg,
            border: "1px solid",
            borderColor: alpha(theme.palette.divider, 0.9),
            overflow: "visible",
            transition: theme.transitions.create(["border-color", "box-shadow"], {
              duration: theme.transitions.duration.shorter,
            }),
            "&:hover": {
              borderColor: alpha(theme.palette.success.main, 0.45),
            },
            "&.Mui-focused": {
              borderColor: "success.main",
              boxShadow: `0 0 0 3px ${alpha(theme.palette.success.main, 0.2)}`,
            },
          },
          "& .MuiOutlinedInput-notchedOutline": {
            border: "none",
          },
          "& textarea": {
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "0.875rem",
            lineHeight: 1.55,
            minHeight: { xs: 180, sm: 220 },
            maxHeight: "min(48vh, 360px)",
            py: 1.5,
            px: 1.25,
            resize: "vertical" as const,
            overflow: "auto",
            boxSizing: "border-box",
          },
        }}
      />
    </Box>
  );
}
