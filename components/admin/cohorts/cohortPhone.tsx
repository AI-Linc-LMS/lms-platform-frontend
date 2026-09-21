"use client";

import type { ReactNode } from "react";
import { Box, Button, useMediaQuery, useTheme } from "@mui/material";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ResponsiveDialog } from "@/components/common/mobile/ResponsiveDialog";
import { PHONE } from "@/components/common/mobile/phone";

/* ==========================================================================
 * Phone-only fixes for the Cohorts screens that reach into shared admin pieces.
 *
 * SegmentedTabs, ViewToggle, StatusChip and the page header's CTA are shared by every admin
 * module, and each module gets its own mobile pass. So the Cohorts pages do not edit them: they
 * wrap them, and every rule below lives under PHONE (max-width:599.95px). At 600px and up these
 * wrappers emit nothing, so the desktop pages render exactly as they did.
 * ======================================================================== */

/** 44px is the smallest target a thumb reliably hits (Apple HIG). */
export const TAP = 44;

/** Wrap a SegmentedTabs: 44px-tall tabs and a readable count badge on a phone. */
export const phoneTabsSx = {
  [PHONE]: {
    "& [role=tab]": { minHeight: TAP },
    // The count badge is 0.7rem (11.2px) - under the 12px floor.
    "& [role=tab] > .MuiBox-root": { fontSize: "0.75rem" },
  },
} as const;

/** Wrap a ViewToggle: its small IconButtons are 34px. */
export const phoneToggleSx = {
  [PHONE]: { "& .MuiIconButton-root": { width: TAP, height: TAP } },
} as const;

/** A header action (HeaderActionButton is a ButtonBase ~39px tall). `display: contents` keeps the
 *  wrapper out of the layout at every width. */
export function PhoneTapTarget({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: "contents", [PHONE]: { "& > .MuiButtonBase-root": { minHeight: TAP } } }}>
      {children}
    </Box>
  );
}

/** A full-height text button on a phone, untouched elsewhere. */
export const phoneButtonSx = { [PHONE]: { minHeight: TAP } } as const;

/** An icon button that is 44x44 on a phone, untouched elsewhere. */
export const phoneIconButtonSx = { [PHONE]: { minWidth: TAP, minHeight: TAP } } as const;

/** Is this a phone? Matches `theme.breakpoints.down("sm")`, the same query PHONE writes. */
export function useIsPhone(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down("sm"));
}

/**
 * The shared ConfirmDialog on a desktop, unchanged; a bottom sheet on a phone. On the sheet the
 * backdrop and buttons are inert while `busy`, so a second tap cannot fire the action twice or
 * dismiss the sheet mid-request.
 */
export function CohortConfirm({
  open,
  title,
  message,
  confirmText,
  cancelText = "Cancel",
  confirmColor = "primary",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  confirmColor?: "primary" | "error";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isPhone = useIsPhone();
  if (!isPhone) {
    return (
      <ConfirmDialog
        open={open}
        title={title}
        message={message}
        confirmText={confirmText}
        cancelText={cancelText}
        confirmColor={confirmColor}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
  }
  return (
    <ResponsiveDialog
      open={open}
      onClose={() => {
        if (!busy) onCancel();
      }}
      title={title}
      hideCloseButton={busy}
      data-testid="cohort-confirm-sheet"
      footer={
        <>
          <Button onClick={onCancel} disabled={busy} variant="outlined" sx={{ textTransform: "none", minHeight: TAP, borderRadius: 2 }}>
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={busy}
            variant="contained"
            color={confirmColor}
            sx={{ textTransform: "none", minHeight: TAP, borderRadius: 2, fontWeight: 600 }}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <Box sx={{ color: "var(--font-secondary)", lineHeight: 1.6, whiteSpace: "pre-line", fontSize: "0.95rem" }}>{message}</Box>
    </ResponsiveDialog>
  );
}
