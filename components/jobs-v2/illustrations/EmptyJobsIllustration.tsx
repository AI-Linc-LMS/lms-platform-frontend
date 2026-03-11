"use client";

import { Box } from "@mui/material";
import { memo } from "react";

interface EmptyJobsIllustrationProps {
  width?: number;
  height?: number;
  primaryColor?: string;
}

const EmptyJobsIllustrationComponent = ({
  width = 180,
  height = 140,
  primaryColor = "#9ca3af",
}: EmptyJobsIllustrationProps) => (
  <Box
    component="svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 180 140"
    width={width}
    height={height}
    sx={{ flexShrink: 0 }}
  >
    {/* Empty folder/briefcase outline */}
    <path
      d="M40 45 L40 115 Q40 125 50 125 L130 125 Q140 125 140 115 L140 55 Q140 45 130 45 L90 45 L75 30 L50 30 Q40 30 40 45 Z"
      fill="none"
      stroke={primaryColor}
      strokeWidth="3"
      strokeLinejoin="round"
      opacity={0.6}
    />
    <path d="M75 30 L75 45 L90 45" fill="none" stroke={primaryColor} strokeWidth="3" strokeLinejoin="round" opacity={0.6} />
    {/* Search icon in center */}
    <circle cx="90" cy="85" r="22" fill="none" stroke={primaryColor} strokeWidth="2.5" opacity={0.5} />
    <line x1="100" y1="95" x2="110" y2="105" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" opacity={0.5} />
    {/* Small floating elements */}
    <circle cx="55" cy="70" r="4" fill={primaryColor} opacity={0.3} />
    <circle cx="125" cy="95" r="3" fill={primaryColor} opacity={0.25} />
  </Box>
);

export const EmptyJobsIllustration = memo(EmptyJobsIllustrationComponent);
