import { PHONE } from "@/components/common/mobile/phone";

/* ==========================================================================
 * Phone-only styling for the admin live-sessions dialogs.
 *
 * Twelve dialogs here are plain MUI Dialogs with their own titles, bodies and action rows. On a
 * 390px phone each one landed as a centred card with 32px gutters, its own scrollbar and 36px
 * action buttons. Rather than rebuild every one of them, their ROOT takes this `sx`: on a phone
 * the paper becomes a full-width bottom sheet with 44px actions, and above `sm` the rule set is
 * empty, so a desktop renders the dialog exactly as it always has.
 *
 * It is written against the Dialog's own slots (`.MuiDialog-container`, `.MuiDialog-paper`), one
 * class deeper than the paper's own styles, so it wins over a dialog's PaperProps without
 * `!important`. Close behaviour is the dialog's own and is not touched: every dialog that
 * refused to close mid-request still refuses.
 * ======================================================================== */

export const phoneSheetSx = {
  [PHONE]: {
    "& .MuiDialog-container": { alignItems: "flex-end" },
    "& .MuiDialog-paper": {
      m: 0,
      width: "100%",
      maxWidth: "100%",
      // dvh: the keyboard must not push the actions off the sheet.
      maxHeight: "92dvh",
      borderRadius: "20px 20px 0 0",
      pb: "env(safe-area-inset-bottom)",
    },
    "& .MuiDialogTitle-root": { px: 2, pt: 2.5 },
    "& .MuiDialogContent-root": { px: 2 },
    "& .MuiDialogActions-root": { px: 2, py: 1.5, gap: 1, flexWrap: "wrap" },
    "& .MuiDialogActions-root .MuiButton-root": { minHeight: 44, flex: "1 1 auto" },
    "& .MuiDialogContent-root .MuiButton-root": { minHeight: 44 },
    "& .MuiDialogContent-root .MuiInputBase-root": { minHeight: 44 },
    "& .MuiDialogContent-root .MuiChip-root": { fontSize: "0.75rem" },
    "& .MuiIconButton-root": { minWidth: 44, minHeight: 44 },
  },
} as const;
