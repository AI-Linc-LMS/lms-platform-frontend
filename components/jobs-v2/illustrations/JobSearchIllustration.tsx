"use client";

import { Box } from "@mui/material";
import { memo } from "react";

interface JobSearchIllustrationProps {
  width?: number;
  height?: number;
  primaryColor?: string;
}

const JobSearchIllustrationComponent = ({
  width = 200,
  height = 160,
  primaryColor = "var(--accent-indigo)",
}: JobSearchIllustrationProps) => (
  <Box
    component="svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200 160"
    width={width}
    height={height}
    sx={{ flexShrink: 0 }}
  >
    <defs>
      <linearGradient id="jobSearchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={primaryColor} stopOpacity={0.9} />
        <stop offset="100%" stopColor={primaryColor} stopOpacity={0.6} />
      </linearGradient>
    </defs>
    {/* Briefcase */}
    <rect x="60" y="50" width="80" height="55" rx="4" fill="url(#jobSearchGrad)" />
    <rect x="65" y="55" width="70" height="45" rx="2" fill="var(--font-light)" opacity={0.9} />
    <rect x="90" y="45" width="20" height="15" rx="2" fill={primaryColor} />
    {/* Search magnifier */}
    <circle cx="130" cy="75" r="18" fill="none" stroke={primaryColor} strokeWidth="4" />
    <line x1="142" y1="87" x2="155" y2="100" stroke={primaryColor} strokeWidth="4" strokeLinecap="round" />
    {/* Document lines */}
    <rect x="75" y="68" width="35" height="4" rx="1" fill={primaryColor} opacity={0.4} />
    <rect x="75" y="78" width="25" height="4" rx="1" fill={primaryColor} opacity={0.3} />
    <rect x="75" y="88" width="30" height="4" rx="1" fill={primaryColor} opacity={0.25} />
  </Box>
);

export const JobSearchIllustration = memo(JobSearchIllustrationComponent);
