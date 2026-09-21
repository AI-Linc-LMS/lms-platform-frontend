"use client";

import { useMediaQuery, useTheme } from "@mui/material";

/**
 * Recharts draws its axis labels as SVG text, so they cannot take a responsive `sx` value.
 * The scorecard authored them at 10-11px for a desktop card; on a phone that is below the 12px
 * floor the rest of the page now keeps. This returns a sizer that raises a tick to 12px on `xs`
 * and hands back the authored size everywhere else, so desktop charts are unchanged.
 */
export const CHART_TICK_PHONE_MIN = 12;

export function useChartTick(): (px: number) => number {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  return (px: number) => (isPhone ? Math.max(px, CHART_TICK_PHONE_MIN) : px);
}
