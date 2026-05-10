"use client";

import { Chip, Box } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface PinLockBadgesProps {
  pinned?: boolean;
  locked?: boolean;
  size?: "small" | "medium";
}

export function PinLockBadges({ pinned, locked, size = "small" }: PinLockBadgesProps) {
  if (!pinned && !locked) return null;

  const chipSx = (kind: "pin" | "lock") => ({
    height: size === "small" ? 22 : 26,
    fontSize: size === "small" ? "0.65rem" : "0.75rem",
    fontWeight: 700,
    backgroundColor:
      kind === "pin" ? "var(--surface-indigo-light)" : "var(--warning-100)",
    color: kind === "pin" ? "var(--accent-indigo)" : "var(--warning-500)",
    border: `1px solid ${
      kind === "pin"
        ? "color-mix(in srgb, var(--accent-indigo) 28%, transparent)"
        : "color-mix(in srgb, var(--warning-500) 28%, transparent)"
    }`,
    "& .MuiChip-icon": {
      ml: "6px",
      mr: "-2px",
    },
  });

  return (
    <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
      {pinned && (
        <Chip
          icon={<IconWrapper icon="mdi:pin" size={14} color="var(--accent-indigo)" />}
          label="Pinned"
          size="small"
          sx={chipSx("pin")}
        />
      )}
      {locked && (
        <Chip
          icon={<IconWrapper icon="mdi:lock" size={14} color="var(--warning-500)" />}
          label="Locked"
          size="small"
          sx={chipSx("lock")}
        />
      )}
    </Box>
  );
}
