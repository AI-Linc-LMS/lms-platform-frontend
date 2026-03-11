"use client";

import { Box } from "@mui/material";
import { memo } from "react";

interface JobDetailIllustrationProps {
  width?: number;
  height?: number;
  primaryColor?: string;
}

const JobDetailIllustrationComponent = ({
  width = 220,
  height = 180,
  primaryColor = "#6366f1",
}: JobDetailIllustrationProps) => (
  <Box
    component="svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 220 180"
    width={width}
    height={height}
    sx={{ flexShrink: 0 }}
  >
    <defs>
      <linearGradient id="jobDetailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={primaryColor} stopOpacity={0.95} />
        <stop offset="100%" stopColor={primaryColor} stopOpacity={0.7} />
      </linearGradient>
      <linearGradient id="jobDetailSoft" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={primaryColor} stopOpacity={0.15} />
        <stop offset="100%" stopColor={primaryColor} stopOpacity={0.05} />
      </linearGradient>
    </defs>
    {/* Large document/card */}
    <rect x="25" y="30" width="170" height="130" rx="8" fill="#fff" stroke={primaryColor} strokeWidth="2" opacity={0.98} />
    <rect x="35" y="45" width="150" height="100" rx="4" fill="url(#jobDetailSoft)" />
    {/* Document header bar */}
    <rect x="35" y="45" width="150" height="12" rx="2" fill="url(#jobDetailGrad)" />
    {/* Content lines */}
    <rect x="45" y="70" width="130" height="5" rx="1" fill={primaryColor} opacity={0.4} />
    <rect x="45" y="82" width="100" height="5" rx="1" fill={primaryColor} opacity={0.3} />
    <rect x="45" y="94" width="115" height="5" rx="1" fill={primaryColor} opacity={0.25} />
    <rect x="45" y="106" width="90" height="5" rx="1" fill={primaryColor} opacity={0.2} />
    {/* Decorative elements - checkmarks / highlights */}
    <circle cx="55" cy="72" r="4" fill={primaryColor} opacity={0.5} />
    <circle cx="55" cy="84" r="4" fill={primaryColor} opacity={0.4} />
    <circle cx="55" cy="96" r="4" fill={primaryColor} opacity={0.35} />
    {/* Floating badge - pill shape */}
    <rect x="140" y="25" width="55" height="24" rx="12" fill="url(#jobDetailGrad)" />
  </Box>
);

export const JobDetailIllustration = memo(JobDetailIllustrationComponent);
