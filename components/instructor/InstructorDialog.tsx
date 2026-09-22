"use client";

import type { ReactNode } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  useTheme,
  type SxProps,
  type Theme,
} from "@mui/material";
import { ResponsiveDialog } from "@/components/common/mobile/ResponsiveDialog";
import { PHONE_TARGET } from "./phoneSx";

/* ==========================================================================
 * The instructor portal's form dialogs: a bottom sheet on a phone, the original Dialog above.
 *
 * Every dialog on these screens was a centred MUI Dialog with title / content / actions. On a
 * 390px phone that lands mid-screen with its buttons under the keyboard. Below `sm` this renders
 * the same content as a ResponsiveDialog sheet with full-width 44px actions; from `sm` up it
 * renders exactly the Dialog markup each page had, with the same props, so a desktop is unchanged.
 *
 * `busy` is the request in flight: on a phone the sheet then cannot be swiped, tapped or closed
 * away. The desktop keeps whatever `onClose` the caller passes, as it always did.
 * ======================================================================== */

export interface InstructorDialogProps {
  open: boolean;
  /** Passed to the desktop Dialog verbatim (callers pass `undefined` while saving, as before). */
  onClose?: () => void;
  /** A request is running: the phone sheet cannot be dismissed. */
  busy?: boolean;
  title: ReactNode;
  titleSx?: SxProps<Theme>;
  actions: ReactNode;
  actionsSx?: SxProps<Theme>;
  maxWidth?: "xs" | "sm" | "md";
  children: ReactNode;
  "data-testid"?: string;
}

export function InstructorDialog({
  open,
  onClose,
  busy = false,
  title,
  titleSx,
  actions,
  actionsSx,
  maxWidth = "sm",
  children,
  ...rest
}: InstructorDialogProps) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));

  if (isPhone) {
    return (
      <ResponsiveDialog
        open={open}
        onClose={() => {
          if (!busy) onClose?.();
        }}
        title={title}
        hideCloseButton={busy}
        data-testid={rest["data-testid"] ? `${rest["data-testid"]}-sheet` : undefined}
        footer={
          // `display: contents` keeps the buttons as the footer's own flex items, so they share
          // its full width; the rule on them adds the 44px thumb height.
          <Box sx={{ display: "contents", "& > .MuiButton-root": { flex: 1, minHeight: PHONE_TARGET } }}>{actions}</Box>
        }
      >
        {children}
      </ResponsiveDialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={maxWidth}>
      <DialogTitle sx={titleSx}>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions sx={actionsSx}>{actions}</DialogActions>
    </Dialog>
  );
}
