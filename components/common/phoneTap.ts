import { PHONE } from "@/components/common/mobile/phone";

/* ==========================================================================
 * 44px touch targets for controls that were drawn small for a pointer, without moving anything.
 *
 * Each helper grows the control's box to 44px under the phone media query, and gives back the
 * growth with an equal negative margin, so the row it sits in keeps its height and the text
 * beside it does not shift. Wider screens get nothing from either helper.
 * ======================================================================== */

/**
 * A 44px square for a small inline "i" button beside a points, streak or momentum figure.
 * `size` is the icon width; 3.2px is the button's own `p: 0.2` padding on both sides.
 */
export function infoHitArea(size: number) {
  return {
    [PHONE]: {
      minWidth: 44,
      minHeight: 44,
      m: `calc((${size}px + 3.2px - 44px) / 2)`,
    },
  } as const;
}

/**
 * 44px tall for a short text button ("View all", "Back", "Full report"). `drawn` is the height
 * the button renders at on main, in px.
 */
export function tapHeight(drawn: number) {
  const give = (44 - drawn) / 2;
  return {
    [PHONE]: {
      minHeight: 44,
      marginBlock: give > 0 ? `-${give}px` : 0,
    },
  } as const;
}

/**
 * A 44px touch area for a small button whose drawn size must not change: a badge pinned to an
 * avatar, or a pencil inline with text. On a phone an invisible `::after` sticks out past the
 * button on every side until the target is 44px square. `drawn` is the button's square size in
 * px. Pass `relative` when the button is not already positioned, so the overlay has something
 * to anchor to.
 */
export function hitSlop(drawn: number, relative = false) {
  const out = Math.max(0, (44 - drawn) / 2);
  return {
    [PHONE]: {
      ...(relative ? { position: "relative" } : {}),
      "&::after": { content: '""', position: "absolute", inset: `-${out}px` },
    },
  } as const;
}
