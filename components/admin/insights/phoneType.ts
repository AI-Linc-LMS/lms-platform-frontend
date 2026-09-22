import { PHONE } from "@/components/common/mobile/phone";

/**
 * Phone-only floors for the admin insights surfaces.
 *
 * The dashboard deck was sized for a wide monitor: labels at 0.56-0.72rem (9-11.5px) and
 * recharts ticks at 11px. On a phone those are texture, not type. Every value here is emitted
 * inside `PHONE` only, so a desktop render is byte-for-byte what it was - unlike MUI's `xs`
 * shorthand, which lands in `@media (min-width:0px)` and applies at every width.
 */

/** 12px: nothing an admin has to read goes below this on a phone. */
export const PHONE_FLOOR_REM = 0.75;

/** 44px: the minimum thumb target on a phone. */
export const PHONE_TARGET = 44;

/**
 * An authored rem size, floored to 12px on a phone only.
 *
 *   sx={{ ...phoneFont(0.62), fontWeight: 800 }}
 *
 * Spread it where the literal `fontSize` was. Values already at or above the floor pass
 * through untouched, with no phone rule at all.
 */
export function phoneFont(rem: number): Record<string, unknown> {
  const base = { fontSize: `${rem}rem` };
  if (rem >= PHONE_FLOOR_REM) return base;
  return { ...base, [PHONE]: { fontSize: `${PHONE_FLOOR_REM}rem` } };
}

/**
 * Grows a small inline control's touch area to 44x44 on a phone without moving anything:
 * the pseudo-element is absolutely positioned, so layout is untouched at every width.
 */
export const PHONE_HIT_AREA = {
  [PHONE]: {
    position: "relative",
    "&::after": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: "50%",
      width: PHONE_TARGET,
      height: PHONE_TARGET,
      transform: "translate(-50%, -50%)",
    },
  },
} as const;

/**
 * Chart text inside a Panel on a phone: recharts writes its tick size as an SVG attribute,
 * which a CSS `font-size` overrides. One rule on the panel reaches every axis and legend in
 * it without threading a phone flag through each chart's props.
 */
export const PHONE_CHART_TEXT = {
  [PHONE]: {
    "& .recharts-cartesian-axis-tick-value, & .recharts-cartesian-axis-tick-value tspan": {
      fontSize: "12px",
    },
    "& .recharts-legend-item-text": { fontSize: "12px" },
  },
} as const;
