/**
 * The phone breakpoint as a raw media query, for styles that must apply ONLY below `sm`.
 *
 * MUI's responsive shorthand (`{ xs: 44 }`) is mobile-first: an `xs` value with no `sm` applies at
 * every width, so "44px tall on a phone" written that way quietly makes the desktop button 44px
 * too. Nesting phone-only rules under this key leaves every wider screen exactly as it was, which
 * is the guarantee the Courses pages' mobile pass depends on.
 *
 * Matches `theme.breakpoints.down("sm")` for the default 600px `sm` breakpoint.
 */
export const PHONE = "@media (max-width:599.95px)";
