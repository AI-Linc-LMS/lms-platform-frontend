"use client";

import { memo } from "react";
import {
  IllustrationRoot,
  PAPER,
  STROKE,
  type IllustrationProps,
} from "./IllustrationBase";

const ApplicationsIllustrationComponent = ({
  width = 140,
  height = 110,
  tone = "muted",
  primaryColor,
  sx,
}: IllustrationProps) => (
  <IllustrationRoot
    viewBox="0 0 140 110"
    gradientId="jobsIllusApplications"
    width={width}
    height={height}
    tone={tone}
    primaryColor={primaryColor}
    sx={sx}
  >
    {/* A stack of applications, back to front */}
    <rect x="20" y="30" width="52" height="66" rx="6" fill={PAPER} stroke="currentColor" strokeWidth={STROKE} opacity={0.45} />
    <rect x="27" y="24" width="52" height="66" rx="6" fill={PAPER} stroke="currentColor" strokeWidth={STROKE} opacity={0.7} />
    <rect x="34" y="18" width="52" height="66" rx="6" fill={PAPER} stroke="currentColor" strokeWidth={STROKE} />
    <line x1="44" y1="34" x2="76" y2="34" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity={0.55} />
    <line x1="44" y1="46" x2="68" y2="46" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity={0.35} />
    <line x1="44" y1="58" x2="72" y2="58" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity={0.25} />
    {/* The candidate — the one accent */}
    <circle cx="104" cy="44" r="22" fill={PAPER} stroke="currentColor" strokeWidth={STROKE} />
    <circle cx="104" cy="38" r="7" fill="url(#jobsIllusApplications)" />
    <path
      d="M93 58 a12 12 0 0 1 22 0"
      fill="none"
      stroke="url(#jobsIllusApplications)"
      strokeWidth={3}
      strokeLinecap="round"
    />
  </IllustrationRoot>
);

export const ApplicationsIllustration = memo(ApplicationsIllustrationComponent);
