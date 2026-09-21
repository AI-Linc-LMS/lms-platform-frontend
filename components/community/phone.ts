/**
 * Styles that exist for a phone and nowhere else.
 *
 * A `{ xs: 44, sm: "auto" }` value is not phone-only: MUI emits the xs value unconditionally and
 * relies on the sm rule to undo it, and `"auto"` is not always what the desktop had (a small Chip
 * is 24px tall, a Tab has a 48px floor). Putting the rule under `theme.breakpoints.down("sm")`
 * means nothing at sm and up is touched, which is the contract for Community's mobile pass.
 *
 * This is the default theme's `breakpoints.down("sm")` query, spelled out so it can key a static
 * sx object; lib/theme.ts does not override the breakpoints.
 */
export const PHONE = "@media (max-width:599.95px)";

/** A 44px thumb target on a phone; the desktop keeps whatever size the control already had. */
export const TOUCH = { [PHONE]: { minWidth: 44, minHeight: 44 } } as const;
