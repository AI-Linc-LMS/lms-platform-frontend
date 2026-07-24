"use client";

import { Box, IconButton, Tooltip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export type ListView = "cards" | "list";

const OPTIONS: { mode: ListView; icon: string; label: string }[] = [
  { mode: "cards", icon: "mdi:view-grid-outline", label: "Card view" },
  { mode: "list", icon: "mdi:view-list-outline", label: "List view" },
];

/**
 * Card ↔ list view switcher, shared across every module list so the affordance
 * looks and behaves identically everywhere (extracted from the assessment-
 * management hub's inline toggle).
 */
export function ViewToggle({
  value,
  onChange,
}: {
  value: ListView;
  onChange: (v: ListView) => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        p: 0.5,
        borderRadius: 999,
        border: "1px solid var(--border-default)",
        bgcolor: "var(--surface)",
        flexShrink: 0,
      }}
    >
      {OPTIONS.map((v) => {
        const active = value === v.mode;
        return (
          <Tooltip key={v.mode} title={v.label}>
            <IconButton
              size="small"
              aria-label={v.label}
              onClick={() => onChange(v.mode)}
              sx={{
                borderRadius: 999,
                color: active ? "#fff" : "var(--font-tertiary)",
                bgcolor: active ? "var(--accent-indigo)" : "transparent",
                "&:hover": {
                  bgcolor: active ? "var(--accent-indigo-dark)" : "var(--hover-bg)",
                },
              }}
            >
              <IconWrapper icon={v.icon} size={18} />
            </IconButton>
          </Tooltip>
        );
      })}
    </Box>
  );
}
