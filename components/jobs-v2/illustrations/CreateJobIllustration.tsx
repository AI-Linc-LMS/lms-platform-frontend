"use client";

import { memo } from "react";
import {
  IllustrationRoot,
  PAPER,
  STROKE,
  type IllustrationProps,
} from "./IllustrationBase";

const CreateJobIllustrationComponent = ({
  width = 160,
  height = 130,
  tone = "muted",
  primaryColor,
  sx,
}: IllustrationProps) => (
  <IllustrationRoot
    viewBox="0 0 160 130"
    gradientId="jobsIllusCreate"
    width={width}
    height={height}
    tone={tone}
    primaryColor={primaryColor}
    sx={sx}
  >
    {/* The draft */}
    <rect
      x="30"
      y="18"
      width="82"
      height="96"
      rx="8"
      fill={PAPER}
      stroke="currentColor"
      strokeWidth={STROKE}
    />
    <line x1="44" y1="40" x2="98" y2="40" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity={0.55} />
    <line x1="44" y1="54" x2="86" y2="54" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity={0.4} />
    <line x1="44" y1="68" x2="92" y2="68" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity={0.3} />
    <line x1="44" y1="82" x2="72" y2="82" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity={0.25} />
    {/* The add affordance — the one accent */}
    <circle cx="116" cy="88" r="20" fill="url(#jobsIllusCreate)" />
    <line x1="116" y1="79" x2="116" y2="97" stroke={PAPER} strokeWidth={3} strokeLinecap="round" />
    <line x1="107" y1="88" x2="125" y2="88" stroke={PAPER} strokeWidth={3} strokeLinecap="round" />
  </IllustrationRoot>
);

export const CreateJobIllustration = memo(CreateJobIllustrationComponent);
