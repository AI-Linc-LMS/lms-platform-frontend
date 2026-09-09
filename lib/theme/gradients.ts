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
