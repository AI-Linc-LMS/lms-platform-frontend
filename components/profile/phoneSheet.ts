"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import { PHONE } from "@/components/common/mobile/phone";

/* ==========================================================================
 * The profile editors as bottom sheets on a phone.
 *
 * Each profile editor (experience, education, projects, headline, images, resume upload) is a
 * MUI Dialog with a large form inside and its own handlers. Swapping every one of those for
 * ResponsiveDialog would rebuild the desktop markup, and the desktop must stay identical. So the
 * Dialog stays as it is and this style is added to its root. It only takes effect under the
 * phone media query, where it pins the paper to the bottom edge at full width with rounded top
 * corners and lets it grow to 92% of the viewport. That is a sheet, and the desktop CSS is not
 * touched.
 *
 * The selectors go through the root (`& .MuiDialog-paper`), which beats the paper's own class.
 * Without that, the `{ xs: 0 }` radius and margin the editors already set on the paper would win.
 * ======================================================================== */

export const phoneSheetDialogSx = {
  [PHONE]: {
    "& .MuiDialog-container": { alignItems: "flex-end" },
    "& .MuiDialog-paper": {
      m: 0,
      width: "100%",
      maxWidth: "100%",
      maxHeight: "92dvh",
      borderRadius: "20px 20px 0 0",
      paddingBottom: "env(safe-area-inset-bottom)",
    },
  },
} as const;

/**
 * `onClose` for a profile editor. On a phone, a backdrop tap or a swipe does nothing while the
 * editor's request is running, so a half-sent save cannot be dismissed mid-flight. On a wider
 * screen the handler is returned unchanged, so desktop behaviour does not move.
 */
export function usePhoneSheetClose(onClose: () => void, busy: boolean): () => void {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  if (isPhone && busy) return noop;
  return onClose;
}

function noop() {}
