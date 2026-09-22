import { PHONE } from "@/components/common/mobile/phone";

/* ==========================================================================
 * Phone-only sizing for the instructor portal.
 *
 * The instructor screens were sized for a laptop: labels at 0.56-0.72rem (9-11.5px), 24px
 * chips and 30px text buttons. Every rule here is emitted inside `PHONE` only, so a desktop
 * render is exactly what it was. MUI's `{ xs }` shorthand is NOT used for the same reason:
 * it lands in `@media (min-width:0px)` and applies at every width.
 * ======================================================================== */

/** 12px: nothing an instructor has to read goes below this on a phone. */
export const PHONE_FLOOR_REM = 0.75;

/** 44px: the smallest thumb target on a phone. */
export const PHONE_TARGET = 44;

/**
 * An authored rem size, floored to 12px on a phone only. Spread it where the literal was:
 *
 *   sx={{ ...pf(0.62), fontWeight: 800 }}
 *
 * A size already at or above the floor passes through with no phone rule at all.
 */
export function pf(rem: number): Record<string, unknown> {
  const base = { fontSize: `${rem}rem` };
  if (rem >= PHONE_FLOOR_REM) return base;
  return { ...base, [PHONE]: { fontSize: `${PHONE_FLOOR_REM}rem` } };
}

/** A button, row or pill that must be a 44px target on a phone. */
export const PHONE_TAP = { [PHONE]: { minHeight: PHONE_TARGET } } as const;

/** A MUI Chip used as a control: 44px tall on a phone, with room for a thumb. */
export const PHONE_CHIP = {
  [PHONE]: { height: PHONE_TARGET, borderRadius: 999, fontSize: "0.8125rem", "& .MuiChip-label": { px: 1.5 } },
} as const;

/** A square icon button grown to 44x44 on a phone. */
export const PHONE_ICON_BTN = { [PHONE]: { width: PHONE_TARGET, height: PHONE_TARGET } } as const;
