"use client";

import type { ReactNode } from "react";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { PHONE } from "@/components/common/mobile/phone";

/**
 * Phone pieces for the admin instructors page and its dialogs.
 *
 * Everything that changes size is written under `PHONE` (max-width 599.95px), never as an MUI
 * `xs` value, because `xs` is emitted inside `@media (min-width:0px)` and would reach the desktop.
 * The switch between a card list and the table, and between a sheet and a Dialog, is a
 * `useMediaQuery` on the theme's `sm` breakpoint so the desktop keeps its original markup.
 */

export const TAP = 44;

export function useIsPhone(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down("sm"));
}

/** A 48px, full-width action inside a bottom sheet's footer. */
export const SHEET_BUTTON_SX = {
  minHeight: 48,
  textTransform: "none",
  borderRadius: 2,
  fontWeight: 700,
} as const;

export const phoneButtonSx = { [PHONE]: { minHeight: TAP } } as const;
export const phoneIconButtonSx = { [PHONE]: { width: TAP, height: TAP } } as const;

/** A small field is 40px; on a phone its input is a 48px thumb target. */
export const PHONE_FIELD_SX = { [PHONE]: { "& .MuiInputBase-root": { minHeight: 48 } } } as const;

/** One labelled fact on an instructor card: "Phone  +91 …". */
export function CardFact({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, minWidth: 0 }}>
      <Typography
        component="span"
        sx={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--font-secondary)", flexShrink: 0, minWidth: 84 }}
      >
        {label}
      </Typography>
      <Box
        component="span"
        sx={{ fontSize: "0.875rem", color: "var(--font-primary)", minWidth: 0, overflowWrap: "anywhere" }}
      >
        {children}
      </Box>
    </Box>
  );
}
