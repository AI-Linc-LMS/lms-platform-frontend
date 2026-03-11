"use client";

import { Box } from "@mui/material";
import { memo } from "react";

interface ReportsIllustrationProps {
  width?: number;
  height?: number;
  primaryColor?: string;
}

const ReportsIllustrationComponent = ({
  width = 140,
  height = 110,
  primaryColor = "#6366f1",
}: ReportsIllustrationProps) => (
  <Box
    component="svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 140 110"
    width={width}
    height={height}
    sx={{ flexShrink: 0 }}
  >
    {/* Chart bars */}
    <rect x="30" y="60" width="18" height="35" rx="2" fill={primaryColor} opacity={0.6} />
    <rect x="55" y="45" width="18" height="50" rx="2" fill={primaryColor} opacity={0.8} />
    <rect x="80" y="35" width="18" height="60" rx="2" fill={primaryColor} />
    <rect x="105" y="50" width="18" height="45" rx="2" fill={primaryColor} opacity={0.7} />
    {/* Document/CSV icon */}
    <rect x="70" y="5" width="45" height="25" rx="2" fill="#fff" stroke={primaryColor} strokeWidth="2" />
    <line x1="75" y1="12" x2="105" y2="12" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="75" y1="17" x2="100" y2="17" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="75" y1="22" x2="95" y2="22" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round" />
  </Box>
);

export const ReportsIllustration = memo(ReportsIllustrationComponent);
