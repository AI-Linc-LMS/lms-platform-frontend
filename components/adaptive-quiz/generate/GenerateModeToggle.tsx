"use client";

import { Box, ButtonBase } from "@mui/material";
import { Icon } from "@iconify/react";
import type { GenerateMode } from "./types";

const TABS: Array<{ key: GenerateMode; label: string; icon: string }> = [
  { key: "describe", label: "Describe", icon: "mdi:text-box-edit-outline" },
  { key: "csv", label: "Upload CSV", icon: "mdi:file-delimited-outline" },
];

/**
 * Segmented control that switches the Generate page between describing a course
 * in prose and uploading a curriculum CSV. The shared generation config below it
 * is untouched by the switch, so settings carry across modes.
 */
export function GenerateModeToggle({
  mode,
  onChange,
}: {
  mode: GenerateMode;
  onChange: (mode: GenerateMode) => void;
}) {
  return (
    <Box
      role="tablist"
      aria-label="Course creation method"
      sx={{
        display: "inline-flex",
        gap: 0.5,
        p: 0.5,
        borderRadius: 999,
        bgcolor: "color-mix(in srgb, var(--card-bg) 60%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default) 75%, transparent)",
        alignSelf: "flex-start",
      }}
    >
      {TABS.map((tab) => {
        const active = mode === tab.key;
        return (
          <ButtonBase
            key={tab.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            sx={{
              px: 2.25,
              py: 0.9,
              borderRadius: 999,
              fontWeight: 800,
              fontSize: "0.85rem",
              gap: 0.6,
              color: active ? "white" : "text.secondary",
              background: active
                ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
                : "transparent",
              transition: "color 120ms ease, background 120ms ease",
            }}
          >
            <Icon icon={tab.icon} width={17} />
            {tab.label}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
