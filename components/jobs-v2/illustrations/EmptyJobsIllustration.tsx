"use client";

import { memo } from "react";
import {
  IllustrationRoot,
  PAPER,
  STROKE,
  type IllustrationProps,
} from "./IllustrationBase";

const EmptyJobsIllustrationComponent = ({
  width = 180,
  height = 140,
  tone = "muted",
  primaryColor,
  sx,
}: IllustrationProps) => (
  <IllustrationRoot
    viewBox="0 0 180 140"
    gradientId="jobsIllusEmpty"
    width={width}
    height={height}
    tone={tone}
    primaryColor={primaryColor}
    sx={sx}
  >
    {/* An open, empty folder */}
    <path
      d="M34 46 L34 112 a8 8 0 0 0 8 8 L138 120 a8 8 0 0 0 8 -8 L146 58 a8 8 0 0 0 -8 -8 L88 50 L74 34 L42 34 a8 8 0 0 0 -8 8 Z"
      fill={PAPER}
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinejoin="round"
    />
    <path
      d="M34 66 L146 66"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      opacity={0.35}
    />
    {/* Nothing inside: three dots on the accent, not a second drawing */}
    <circle cx="76" cy="92" r="4" fill="url(#jobsIllusEmpty)" opacity={0.9} />
    <circle cx="90" cy="92" r="4" fill="url(#jobsIllusEmpty)" opacity={0.6} />
    <circle cx="104" cy="92" r="4" fill="url(#jobsIllusEmpty)" opacity={0.35} />
  </IllustrationRoot>
);

export const EmptyJobsIllustration = memo(EmptyJobsIllustrationComponent);
