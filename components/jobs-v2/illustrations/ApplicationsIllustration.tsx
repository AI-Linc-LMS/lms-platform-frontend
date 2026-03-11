"use client";

import { Box } from "@mui/material";
import { memo } from "react";

interface ApplicationsIllustrationProps {
  width?: number;
  height?: number;
  primaryColor?: string;
}

const ApplicationsIllustrationComponent = ({
  width = 140,
  height = 110,
  primaryColor = "#6366f1",
}: ApplicationsIllustrationProps) => (
  <Box
    component="svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 140 110"
    width={width}
    height={height}
    sx={{ flexShrink: 0 }}
  >
    {/* Stacked documents */}
    <rect x="25" y="35" width="50" height="60" rx="2" fill={primaryColor} opacity={0.15} />
    <rect x="30" y="30" width="50" height="60" rx="2" fill={primaryColor} opacity={0.25} />
    <rect x="35" y="25" width="50" height="60" rx="2" fill="#fff" stroke={primaryColor} strokeWidth="2" />
    <rect x="45" y="38" width="30" height="4" rx="1" fill={primaryColor} opacity={0.5} />
    <rect x="45" y="48" width="25" height="4" rx="1" fill={primaryColor} opacity={0.35} />
    <rect x="45" y="58" width="28" height="4" rx="1" fill={primaryColor} opacity={0.3} />
    {/* User icon */}
    <circle cx="95" cy="45" r="18" fill={primaryColor} opacity={0.2} />
    <circle cx="95" cy="40" r="8" fill={primaryColor} />
    <path d="M85 65 Q95 75 105 65" fill="none" stroke={primaryColor} strokeWidth="3" strokeLinecap="round" />
  </Box>
);

export const ApplicationsIllustration = memo(ApplicationsIllustrationComponent);
