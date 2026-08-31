"use client";

import { memo } from "react";
import {
  IllustrationRoot,
  PAPER,
  STROKE,
  type IllustrationProps,
} from "./IllustrationBase";

const ReportsIllustrationComponent = ({
  width = 140,
  height = 110,
  tone = "muted",
  primaryColor,
  sx,
}: IllustrationProps) => (
  <IllustrationRoot
    viewBox="0 0 140 110"
    gradientId="jobsIllusReports"
    width={width}
    height={height}
    tone={tone}
    primaryColor={primaryColor}
    sx={sx}
  >
    {/* Baseline */}
    <line x1="24" y1="96" x2="120" y2="96" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity={0.5} />
    {/* Funnel bars, tallest carrying the accent */}
    <rect x="30" y="64" width="18" height="32" rx="4" fill={PAPER} stroke="currentColor" strokeWidth={STROKE} />
    <rect x="55" y="50" width="18" height="46" rx="4" fill={PAPER} stroke="currentColor" strokeWidth={STROKE} />
    <rect x="80" y="34" width="18" height="62" rx="4" fill="url(#jobsIllusReports)" />
    <rect x="105" y="58" width="14" height="38" rx="4" fill={PAPER} stroke="currentColor" strokeWidth={STROKE} />
    {/* The export sheet */}
    <rect x="66" y="8" width="50" height="26" rx="6" fill={PAPER} stroke="currentColor" strokeWidth={STROKE} />
    <line x1="74" y1="17" x2="106" y2="17" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity={0.5} />
    <line x1="74" y1="25" x2="96" y2="25" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity={0.3} />
  </IllustrationRoot>
);

export const ReportsIllustration = memo(ReportsIllustrationComponent);
