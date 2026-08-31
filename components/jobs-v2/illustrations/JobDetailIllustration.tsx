"use client";

import { memo } from "react";
import {
  IllustrationRoot,
  PAPER,
  STROKE,
  type IllustrationProps,
} from "./IllustrationBase";

const JobDetailIllustrationComponent = ({
  width = 220,
  height = 180,
  tone = "muted",
  primaryColor,
  sx,
}: IllustrationProps) => (
  <IllustrationRoot
    viewBox="0 0 220 180"
    gradientId="jobsIllusDetail"
    width={width}
    height={height}
    tone={tone}
    primaryColor={primaryColor}
    sx={sx}
  >
    {/* The posting */}
    <rect
      x="26"
      y="26"
      width="168"
      height="132"
      rx="12"
      fill={PAPER}
      stroke="currentColor"
      strokeWidth={STROKE}
    />
    {/* Header rule — the one accent */}
    <rect x="42" y="46" width="86" height="8" rx="4" fill="url(#jobsIllusDetail)" />
    {/* Body */}
    <line x1="42" y1="74" x2="178" y2="74" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity={0.5} />
    <line x1="42" y1="90" x2="148" y2="90" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity={0.38} />
    <line x1="42" y1="106" x2="164" y2="106" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity={0.28} />
    <line x1="42" y1="122" x2="120" y2="122" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity={0.2} />
    {/* Requirement ticks: micro-rules, not discs */}
    <line x1="42" y1="140" x2="50" y2="140" stroke="url(#jobsIllusDetail)" strokeWidth={STROKE} strokeLinecap="round" />
    <line x1="58" y1="140" x2="112" y2="140" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity={0.28} />
  </IllustrationRoot>
);

export const JobDetailIllustration = memo(JobDetailIllustrationComponent);
