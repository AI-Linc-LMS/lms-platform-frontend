"use client";

import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { PHONE_FLOOR, PHONE_FLOOR_RULES } from "@/components/admin/phoneFloor";

/* ==========================================================================
 * The two slots of a ResponsiveDialog bottom sheet on the admin screens.
 *
 * A sheet is only ever rendered on a phone (sm+ renders the original Dialog), and it lives in a
 * portal outside the page root that carries PHONE_FLOOR. These wrappers give the sheet the same
 * floor: 12px captions and thumb-sized controls in the body, 48px actions in the footer.
 * ======================================================================== */

/** Sheet body: the page's phone floor, applied to content that is outside the page's DOM. */
export function PhoneSheetBody({ children }: { children: ReactNode }) {
  return <Box sx={{ ...PHONE_FLOOR_RULES, minWidth: 0 }}>{children}</Box>;
}

/**
 * Sheet footer: the caller's own action buttons, each a full-width 48px target. `display:
 * contents` keeps the buttons as direct flex items of the sheet's footer row.
 */
export function PhoneSheetActions({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: "contents",
        "& > *": { flex: 1 },
        "& .MuiButton-root": { minHeight: 48, textTransform: "none", fontWeight: 700 },
      }}
    >
      {children}
    </Box>
  );
}

/**
 * A page's phone floor as a wrapper, for a page whose root is a layout component (PageShell,
 * MainLayout) that this pass does not own. On sm+ it is a plain block div with no rules, which
 * lays out exactly like its absence inside the layout's block content box.
 */
export function PhoneFloor({ children }: { children: ReactNode }) {
  return <Box sx={PHONE_FLOOR}>{children}</Box>;
}
