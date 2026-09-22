"use client";

import { Dialog, useMediaQuery, useTheme, type DialogProps } from "@mui/material";
import { PHONE_FLOOR_RULES } from "@/components/admin/phoneFloor";

/* ==========================================================================
 * A drop-in for MUI's Dialog on the admin assessment / certificate / interview screens.
 *
 * On sm and up it IS the Dialog: the same component with the same props, nothing added, so a
 * desktop renders exactly what it rendered before.
 *
 * On a phone the same dialog comes up from the bottom as a sheet: full width, rounded top,
 * capped at 92% of the screen with its content scrolling, actions as full-width 48px buttons
 * above the home indicator, and the admin phone floor (44px controls, 12px captions) inside.
 * The markup inside - DialogTitle, DialogContent, DialogActions - is the caller's own, so every
 * action the desktop dialog offers is the same element on the phone. Dismissal still goes
 * through the caller's onClose. This component adds no guard of its own: a caller whose dialog
 * sends a request must refuse to close while it runs (onClose ignores it, Cancel is disabled).
 * ======================================================================== */

const SHEET_SX = {
  "& .MuiDialog-container": { alignItems: "flex-end" },
  "& .MuiDialog-paper": {
    m: 0,
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    maxHeight: "92vh",
    borderRadius: "20px 20px 0 0",
    pb: "env(safe-area-inset-bottom)",
    ...PHONE_FLOOR_RULES,
  },
  "& .MuiDialogTitle-root": { px: 2, pt: 2, fontSize: "1.05rem" },
  "& .MuiDialogContent-root": { px: 2 },
  "& .MuiDialogActions-root": {
    px: 2,
    py: 1.5,
    gap: 1,
    flexWrap: "wrap",
    borderTop: "1px solid var(--border-default, #eef2f7)",
    "& > :not(style) ~ :not(style)": { ml: 0 },
    "& > .MuiButton-root, & > .MuiLoadingButton-root, & > button": { flex: "1 1 0", minHeight: 48 },
  },
} as const;

export function SheetDialog({ sx, ...props }: DialogProps) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  if (!isPhone) return <Dialog sx={sx} {...props} />;
  const own = sx === undefined ? [] : Array.isArray(sx) ? sx : [sx];
  return <Dialog {...props} sx={[SHEET_SX, ...own]} data-phone-sheet="" />;
}
