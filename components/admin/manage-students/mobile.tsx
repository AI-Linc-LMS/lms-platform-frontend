"use client";

import type { ReactNode } from "react";
import { Box, Button, CircularProgress, Typography, useMediaQuery, useTheme } from "@mui/material";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ResponsiveDialog } from "@/components/common/mobile/ResponsiveDialog";
import { PHONE } from "@/components/common/mobile/phone";

/* ==========================================================================
 * Manage Students on a phone: the pieces every screen in this module shares.
 *
 * Every rule here is phone-only. A width at or above `sm` gets exactly the markup and styles it
 * had before - the desktop is not a variant of the phone layout, it is the original, untouched.
 * ======================================================================== */

/** True below `sm` (600px). The same query ResponsiveDialog switches on. */
export function useIsPhone(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down("sm"));
}

/** A thumb-sized target on a phone; nothing at all on a wider screen. */
export const PHONE_TAP = { [PHONE]: { minHeight: 44 } } as const;

/** A `size="small"` field (40px) grown to a 48px input on a phone. */
export const PHONE_FIELD = { [PHONE]: { "& .MuiInputBase-root": { minHeight: 48 } } } as const;

/** A square thumb-sized icon button on a phone. */
export const PHONE_ICON_TAP = { [PHONE]: { width: 44, height: 44 } } as const;

/**
 * An InfoButton (a 20px icon button in a shared component) grown to 44px on a phone by its
 * wrapper, so the shared component itself is not touched.
 */
export const PHONE_INFO_TAP = {
  display: "inline-flex",
  [PHONE]: { "& .MuiIconButton-root": { width: 44, height: 44 } },
} as const;

export interface ResponsiveConfirmProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmColor?: "primary" | "error" | "warning" | "success";
  /** While true, the phone sheet cannot be dismissed and its buttons are disabled. */
  busy?: boolean;
}

/**
 * ConfirmDialog on a desktop - the same component, the same props, nothing added - and a bottom
 * sheet with full-width 48px actions on a phone.
 */
export function ResponsiveConfirm({ busy = false, ...props }: ResponsiveConfirmProps) {
  const isPhone = useIsPhone();
  if (!isPhone) return <ConfirmDialog {...props} />;
  const { open, title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel, confirmColor = "primary" } =
    props;
  return (
    <ResponsiveDialog
      open={open}
      onClose={busy ? () => undefined : onCancel}
      title={title}
      hideCloseButton={busy}
      footer={
        <>
          <Button
            onClick={onCancel}
            disabled={busy}
            variant="outlined"
            sx={{ minHeight: 48, textTransform: "none", borderRadius: 2, fontWeight: 600 }}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={busy}
            variant="contained"
            color={confirmColor}
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ minHeight: 48, textTransform: "none", borderRadius: 2, fontWeight: 700 }}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <Typography sx={{ color: "var(--font-secondary)", lineHeight: 1.6, whiteSpace: "pre-line", fontSize: "0.95rem" }}>
        {message}
      </Typography>
    </ResponsiveDialog>
  );
}

/** The phone sheet's action buttons: full width (the sheet's footer does that) and 48px tall. */
export const SHEET_BUTTON_SX = { minHeight: 48, textTransform: "none", borderRadius: 2, fontWeight: 700 } as const;

/** A labelled value on a phone card: "COMPLETION  [bar] 36%". */
export function CardStat({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <Box sx={{ display: "contents" }}>
      <Typography
        component="span"
        sx={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "var(--font-secondary)",
          textTransform: "uppercase",
          letterSpacing: 0.4,
          lineHeight: "20px",
        }}
      >
        {label}
      </Typography>
      <Box sx={{ minWidth: 0, fontSize: "0.875rem", color: "var(--font-primary)" }}>{children}</Box>
    </Box>
  );
}
