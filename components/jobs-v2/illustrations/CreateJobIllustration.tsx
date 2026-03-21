"use client";

import { Box } from "@mui/material";
import { memo } from "react";

interface CreateJobIllustrationProps {
  width?: number;
  height?: number;
  primaryColor?: string;
}

const CreateJobIllustrationComponent = ({
  width = 160,
  height = 130,
  primaryColor = "#6366f1",
}: CreateJobIllustrationProps) => (
  <Box
    component="svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 160 130"
    width={width}
    height={height}
    sx={{ flexShrink: 0 }}
  >
    {/* Document */}
    <rect x="35" y="20" width="90" height="95" rx="4" fill="#fff" stroke={primaryColor} strokeWidth="2" opacity={0.95} />
    {/* Lines on document */}
    <rect x="45" y="35" width="70" height="6" rx="2" fill={primaryColor} opacity={0.5} />
    <rect x="45" y="50" width="55" height="6" rx="2" fill={primaryColor} opacity={0.35} />
    <rect x="45" y="65" width="60" height="6" rx="2" fill={primaryColor} opacity={0.3} />
    {/* Plus button */}
    <circle cx="115" cy="55" r="18" fill={primaryColor} />
    <line x1="115" y1="48" x2="115" y2="62" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    <line x1="108" y1="55" x2="122" y2="55" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
  </Box>
);

export const CreateJobIllustration = memo(CreateJobIllustrationComponent);
