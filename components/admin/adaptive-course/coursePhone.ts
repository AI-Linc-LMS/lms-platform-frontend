import { PHONE } from "@/components/common/mobile/phone";

/* ==========================================================================
 * Phone-only rules for the adaptive course builder and adaptive quiz admin.
 *
 * These screens were authored for a desktop: 26px trash icons, 36px pills, 10px eyebrow labels,
 * and centred Dialogs that land mid-screen with their buttons out of thumb reach. Every rule here
 * lives under PHONE (max-width:599.95px), so 600px and up render exactly the CSS they had.
 *
 * Shared admin pieces (SegmentedTabs, ViewToggle, PriceTag, AiPromptField) are not edited: the
 * course pages reach into them from a wrapper, which keeps other modules' screens untouched.
 * ======================================================================== */

/** 44px: the smallest target a thumb reliably hits (Apple HIG). */
export const TAP = 44;

/** 12px at the default root. Nothing an admin has to read goes below this on a phone. */
export const PHONE_TEXT = "0.75rem";

/** Raise a label to the 12px floor on a phone; wider screens keep what was authored. */
export const phoneTextFloor = { [PHONE]: { fontSize: PHONE_TEXT } } as const;

/** A 44px-tall text button on a phone. */
export const phoneTapSx = { [PHONE]: { minHeight: TAP } } as const;

/** A 44x44 icon button on a phone. */
export const phoneIconTapSx = { [PHONE]: { minWidth: TAP, minHeight: TAP } } as const;

/**
 * Put on an MUI `Dialog`'s `sx` (its root). On a phone the dialog becomes a bottom sheet: it rises
 * from the bottom edge, spans the width, rounds only its top corners, and its actions are
 * full-width 44px buttons. The markup is the same Dialog at every width, and at 600px and up none
 * of these rules match, so the desktop dialog is unchanged.
 */
export const phoneSheetDialogSx = {
  [PHONE]: {
    "& .MuiDialog-container": { alignItems: "flex-end" },
    "& .MuiDialog-paper": {
      m: 0,
      width: "100%",
      maxWidth: "100%",
      maxHeight: "92dvh",
      borderRadius: "20px 20px 0 0",
      pb: "env(safe-area-inset-bottom)",
    },
    "& .MuiDialogTitle-root": { px: 2 },
    "& .MuiDialogContent-root": { px: 2 },
    "& .MuiDialogActions-root": { px: 2, gap: 1, flexWrap: "wrap" },
    "& .MuiDialogActions-root > .MuiButtonBase-root": { minHeight: TAP, flex: "1 1 0", ml: 0 },
  },
} as const;
