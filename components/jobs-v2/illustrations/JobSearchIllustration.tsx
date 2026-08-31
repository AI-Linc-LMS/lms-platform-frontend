"use client";

import { memo } from "react";
import {
  IllustrationRoot,
  PAPER,
  STROKE,
  type IllustrationProps,
} from "./IllustrationBase";

const JobSearchIllustrationComponent = ({
  width = 200,
  height = 160,
  tone = "muted",
  primaryColor,
  sx,
}: IllustrationProps) => (
  <IllustrationRoot
    viewBox="0 0 200 160"
    gradientId="jobsIllusSearch"
    width={width}
    height={height}
    tone={tone}
    primaryColor={primaryColor}
    sx={sx}
  >
    {/* Briefcase body */}
    <rect
      x="46"
      y="52"
      width="90"
      height="62"
      rx="8"
      fill={PAPER}
      stroke="currentColor"
      strokeWidth={STROKE}
    />
    {/* Handle */}
    <path
      d="M78 52 V44 a6 6 0 0 1 6-6 h14 a6 6 0 0 1 6 6 v8"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
    />
    {/* Latch — the one accent */}
    <rect x="82" y="74" width="18" height="8" rx="4" fill="url(#jobsIllusSearch)" />
    {/* Listing lines */}
    <line x1="60" y1="94" x2="104" y2="94" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity={0.55} />
    <line x1="60" y1="104" x2="88" y2="104" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity={0.35} />
    {/* Magnifier */}
    <circle cx="140" cy="76" r="20" fill={PAPER} stroke="currentColor" strokeWidth={STROKE} />
    <line
      x1="154"
      y1="90"
      x2="168"
      y2="104"
      stroke="url(#jobsIllusSearch)"
      strokeWidth={4}
      strokeLinecap="round"
    />
  </IllustrationRoot>
);

export const JobSearchIllustration = memo(JobSearchIllustrationComponent);
