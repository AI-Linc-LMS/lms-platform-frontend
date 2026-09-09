/**
 * The two gradients that define a module page: its hero banner and its primary CTA.
 *
 * Both were written as literals in every surface that drew one, so a tenant with its own
 * palette still got a violet banner and a purple/pink button on the dashboard, on every module
 * header, and on the empty-state buttons underneath them.
 *
 * The fallbacks are the exact literals they replace, and `FIXED_MIDNIGHT_HYPER` carries the
 * same values, so a tenant that has not opted into a custom palette renders unchanged. Only a
 * tenant that set its own palette moves.
 */

/** The dark hero banner behind a module title. */
export const MODULE_HERO_BG =
  "radial-gradient(120% 130% at 8% 115%, var(--module-hero-glow, rgba(124,58,237,0.22)) 0%," +
  " rgba(15,10,40,0) 62%)," +
  " linear-gradient(150deg, var(--module-hero-from, #241653) 0%," +
  " var(--module-hero-mid, #181040) 55%, var(--module-hero-to, #100a2c) 100%)";

/** The primary call-to-action: "Browse courses", "Finish your profile", "New post". */
export const MODULE_CTA_BG =
  "linear-gradient(135deg, var(--module-cta-from, #a855f7) 0%," +
  " var(--module-cta-to, #ec4899) 100%)";

/** Softer variant for a CTA sitting on a light card rather than the dark hero. */
export const MODULE_CTA_BG_HOVER =
  "linear-gradient(135deg, var(--module-cta-to, #ec4899) 0%," +
  " var(--module-cta-from, #a855f7) 100%)";

/**
 * The violet glow under the hero banner. Separate from the gradient itself because a shadow
 * is the one part that still read purple after the banner turned navy: a `0 24px 60px` drop
 * in `rgba(76,29,149,.7)` is wide enough to be its own block of colour on a light canvas.
 */
export const MODULE_HERO_SHADOW =
  "0 24px 60px -30px var(--module-hero-shadow, rgba(76,29,149,0.7))";

/** The matching glow under the CTA pill. */
export const MODULE_CTA_SHADOW =
  "0 14px 34px -12px var(--module-cta-shadow, rgba(192,38,211,0.7))";

/**
 * Square icon tiles: the small rounded badges in front of a panel row. Indigo to violet,
 * a different ramp from the CTA, so it gets its own pair rather than borrowing one.
 */
export const MODULE_TILE_BG =
  "linear-gradient(135deg, var(--module-tile-from, #6366f1)," +
  " var(--module-tile-to, #a855f7))";

/**
 * The profile hero. Same idea as MODULE_HERO_BG but a distinct geometry and a lighter top
 * stop, so it carries its own variables: pointing it at `--module-hero-*` would have shifted
 * every existing tenant's profile banner from #271a5c to #241653, which is not what a
 * branding change for one client should do.
 */
export const PROFILE_HERO_BG =
  "radial-gradient(110% 130% at 12% 112%, var(--profile-hero-glow, rgba(192,38,211,0.45)) 0%," +
  " var(--profile-hero-glow-2, rgba(124,58,237,0.30)) 30%, rgba(15,10,40,0) 60%), " +
  "linear-gradient(150deg, var(--profile-hero-from, #271a5c) 0%," +
  " var(--profile-hero-mid, #181040) 55%, var(--profile-hero-to, #100a2c) 100%)";

/* ---------------------------------------------------------------------------------------
 * Sign-in surface.
 *
 * authTokens.ts states the rule these follow: "signing in should look like the product you
 * land in". That was written when the product was violet for everyone. Now that a tenant can
 * repaint the product, the login page has to move with it or it breaks its own rule.
 *
 * The panel composed its colours by appending a hex alpha pair to a token -- `${AUTH.violet}59`.
 * A `var()` cannot carry that suffix: `var(--auth-accent, #7c3aed)59` is invalid CSS and drops
 * the whole gradient. So the translucent stops are pre-composed here as rgba variables, with
 * the alphas converted exactly: 0x59 = 89/255 = 0.349, 0x33 = 0.2, 0x4d = 0.302, 0xd9 = 0.851,
 * 0xf2 = 0.949.
 * ------------------------------------------------------------------------------------- */

/** The full-height hero panel beside the sign-in form. */
export const AUTH_HERO_BG =
  "radial-gradient(120% 120% at 8% 108%, var(--auth-glow, rgba(124,58,237,0.349)) 0%," +
  " var(--auth-glow-deep, rgba(91,33,182,0.2)) 38%, transparent 68%)," +
  " linear-gradient(160deg, var(--auth-night-2, #1e1040) 0%, var(--auth-night, #140b2b) 62%)";

/** The short panel used on narrow viewports. */
export const AUTH_HERO_BG_COMPACT =
  "radial-gradient(120% 200% at 4% 120%, var(--auth-glow-soft, rgba(124,58,237,0.302)) 0%," +
  " transparent 62%)," +
  " linear-gradient(160deg, var(--auth-night-2, #1e1040) 0%, var(--auth-night, #140b2b) 70%)";

/** Scrim over a tenant's own hero image, so white text stays legible on any artwork. */
export const AUTH_HERO_SCRIM =
  "linear-gradient(160deg, var(--auth-scrim, rgba(30,16,64,0.851)) 0%," +
  " var(--auth-scrim-2, rgba(20,11,43,0.949)) 70%)";

/**
 * The two soft washes over the sign-in panel: a bloom top-right and a second low-left. They are
 * `aria-hidden` decoration, which is exactly why they were missed -- nothing named them, they
 * carried raw rgba literals, and on a navy panel they read as a purple bruise across the middle.
 * Found by rendering the deployed page and scanning every element in the panel for a colour in
 * the violet family, rather than by reading the file again.
 */
export const AUTH_HERO_WASH =
  "radial-gradient(60% 44% at 82% 16%, var(--auth-wash, rgba(168,85,247,0.24)) 0%, transparent 70%)," +
  " radial-gradient(52% 40% at 6% 62%, var(--auth-wash-2, rgba(236,72,153,0.15)) 0%, transparent 72%)";

/** The glow behind the brand mark on the sign-in panel. */
export const AUTH_BRAND_GLOW =
  "linear-gradient(135deg, var(--auth-brand-from, #f97316) 0%, var(--auth-brand-to, #ec4899) 100%)";
