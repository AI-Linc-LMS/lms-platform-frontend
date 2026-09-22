import { PHONE } from "@/components/common/mobile/phone";

/* ==========================================================================
 * A phone floor for the dense admin screens (assessments, certificates, interviews).
 *
 * These screens were built for a desktop mouse: 28px icon buttons, 24px clickable chips, 34px
 * inputs and 11px captions. Rewriting every control would touch thousands of lines of desktop
 * markup. Instead, the page root carries one rule set that applies only below `sm` and raises
 * every MUI control inside it to a thumb-sized target and every caption to the 12px floor.
 *
 * Every rule sits inside the max-width:599.95px block, so no desktop browser ever sees them.
 * Descendant selectors (`.root .MuiIconButton-root`, two classes) outrank the control's own
 * single-class Emotion rule, so the floor wins on a phone without `!important`.
 * ======================================================================== */

/** 44px: Apple HIG / WCAG 2.5.5 minimum touch target. */
export const PHONE_TARGET = 44;

const floorRules = {
  "& .MuiIconButton-root": { minWidth: PHONE_TARGET, minHeight: PHONE_TARGET },
  "& .MuiButton-root": { minHeight: PHONE_TARGET },
  "& .MuiToggleButton-root": { minHeight: PHONE_TARGET },
  "& .MuiTab-root": { minHeight: PHONE_TARGET },
  "& .MuiChip-clickable, & .MuiChip-deletable": { minHeight: PHONE_TARGET, height: "auto" },
  "& .MuiChip-clickable .MuiChip-label, & .MuiChip-deletable .MuiChip-label": { whiteSpace: "normal" },
  "& .MuiChip-deleteIcon": { fontSize: 22 },
  "& .MuiInputBase-root:not(.MuiInputBase-multiline)": { minHeight: PHONE_TARGET },
  "& .MuiPaginationItem-root": { minWidth: PHONE_TARGET, height: PHONE_TARGET },
  "& .MuiCheckbox-root, & .MuiRadio-root": { minWidth: PHONE_TARGET, minHeight: PHONE_TARGET },
  "& .MuiSwitch-root": { minHeight: PHONE_TARGET, alignItems: "center" },
  "& .MuiMenuItem-root": { minHeight: PHONE_TARGET },
  "& .MuiListItemButton-root": { minHeight: PHONE_TARGET },
  "& .MuiAccordionSummary-root": { minHeight: PHONE_TARGET },
  "& .MuiTypography-caption, & .MuiTypography-overline": { fontSize: "0.75rem" },
  "& .MuiChip-label, & .MuiFormHelperText-root, & .MuiTablePagination-root *": { fontSize: "0.75rem" },
  "& .MuiInputLabel-shrink": { fontSize: "0.9rem" },
  "& .MuiBadge-badge": { fontSize: "0.75rem" },
} as const;

/** Spread into the page root (or a sheet/dialog paper) of an admin screen. Phone only. */
export const PHONE_FLOOR = { [PHONE]: floorRules } as const;

/** The raw rules, for an sx that already has its own `[PHONE]` block. */
export const PHONE_FLOOR_RULES = floorRules;

/**
 * An authored font size, raised to 12px on a phone only:
 *   sx={{ ...ptext(0.7), fontWeight: 700 }}
 * emits `font-size:0.7rem` at every width and `font-size:0.75rem` inside the phone block.
 */
export function ptext(rem: number) {
  return { fontSize: `${rem}rem`, [PHONE]: { fontSize: "0.75rem" } } as const;
}

/**
 * A table that becomes a stack of cards on a phone, with no second copy of its markup.
 *
 * Spread onto the TableContainer. Below `sm` the header row is hidden, each body row becomes a
 * bordered card and each cell a block; a cell with `data-label` gets that label as a caption
 * above its value, and the LAST cell (the row actions) becomes a right-aligned action bar under
 * a hairline. Every button, menu and link in the row is the same element as on desktop, so
 * every row action stays reachable. sm and up: no rule applies.
 */
export const PHONE_TABLE_CARD_RULES = {
  maxHeight: "none",
  overflow: "visible",
  border: "none",
  borderRadius: 0,
  backgroundColor: "transparent",
  boxShadow: "none",
  "& table, & tbody, & tbody tr, & tbody td": { display: "block", width: "100%" },
  "& table": { minWidth: 0 },
  "& thead": { display: "none" },
  // `:nth-of-type(n)` lifts this over a row's own zebra-stripe rule without `!important`.
  "& tbody tr, & tbody tr:nth-of-type(n)": {
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-card, 12px)",
    backgroundColor: "var(--card-bg)",
    marginBottom: "10px",
    padding: "12px 14px",
    boxSizing: "border-box",
  },
  "& tbody td": {
    border: "none",
    padding: "5px 0",
    minWidth: 0,
    maxWidth: "none",
    boxSizing: "border-box",
    textAlign: "start",
    overflowWrap: "anywhere",
  },
  "& tbody td[data-label]::before": {
    content: "attr(data-label)",
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--font-tertiary)",
    marginBottom: "2px",
  },
  '[dir="rtl"] & tbody td[data-label]::before': { letterSpacing: "normal", textTransform: "none" },
  "& tbody td:last-of-type:not(:first-of-type)": {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "8px",
    borderTop: "1px solid var(--border-default)",
    marginTop: "6px",
    paddingTop: "8px",
  },
  // The first cell is the card's title and the last its action bar: neither needs a caption.
  "& tbody td:first-of-type::before, & tbody td:last-of-type:not(:first-of-type)::before": {
    display: "none",
  },
  // A cell that is only empty padding on a phone (an empty action column, a spacer).
  "& tbody td:empty": { display: "none" },
} as const;

export const PHONE_TABLE_CARDS = { [PHONE]: PHONE_TABLE_CARD_RULES } as const;
