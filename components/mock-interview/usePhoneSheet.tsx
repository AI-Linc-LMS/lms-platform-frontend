"use client";

import { forwardRef, type ReactElement, type Ref } from "react";
import { Slide, useMediaQuery, useTheme, type SxProps, type Theme } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { PHONE } from "@/components/common/mobile/phone";

/* ==========================================================================
 * The interview dialogs, as bottom sheets on a phone.
 *
 * These dialogs sit on top of a live interview (the end-interview confirm, the fullscreen warning,
 * the MCQ and coding asks) or its report. A centred MUI Dialog on a 390px screen floats mid-screen
 * with 32px margins and its buttons wherever the content ends. On a phone the same Dialog is
 * pinned to the bottom edge, full width, with the actions under the thumb.
 *
 * It is the SAME Dialog element with its own title, content and actions - rewriting four dialogs
 * that each own interview state as a separate Drawer would be four chances to break a submit path.
 * On sm and up this returns no props at all, so the desktop Dialog is exactly the one on main.
 * ======================================================================== */

const SlideUp = forwardRef(function SlideUp(
  props: TransitionProps & { children: ReactElement },
  ref: Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const PHONE_SHEET_SX: SxProps<Theme> = {
  [PHONE]: {
    "& .MuiDialog-container": { alignItems: "flex-end" },
    "& .MuiDialog-paper": {
      m: 0,
      width: "100%",
      maxWidth: "100%",
      maxHeight: "88dvh",
      borderRadius: "20px 20px 0 0",
      pb: "env(safe-area-inset-bottom)",
    },
    // Full-width actions: a thumb reaches the bottom of the screen, not a button at the right edge.
    "& .MuiDialogActions-root": { flexWrap: "wrap", gap: 1 },
    "& .MuiDialogActions-root > *": { flex: "1 1 0", minHeight: 44, m: "0 !important" },
  },
};

/** Props to spread on a Dialog: a bottom sheet on a phone, nothing at all on sm and up. */
export function usePhoneSheet(): {
  isPhone: boolean;
  sheetProps: { TransitionComponent?: typeof SlideUp; sx?: SxProps<Theme> };
} {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  return {
    isPhone,
    sheetProps: isPhone ? { TransitionComponent: SlideUp, sx: PHONE_SHEET_SX } : {},
  };
}
