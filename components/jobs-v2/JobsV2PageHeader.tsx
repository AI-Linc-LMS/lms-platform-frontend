"use client";

import { Box, Typography } from "@mui/material";
import { JobSearchIllustration } from "@/components/jobs-v2/illustrations";
import { memo } from "react";

interface JobsV2PageHeaderProps {
  size?: number;
  fontSize?: string;
  showIllustration?: boolean;
}

const JobsV2PageHeaderComponent = ({
  size = 32,
  fontSize = "1.75rem",
  showIllustration = true,
}: JobsV2PageHeaderProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 1.5, sm: 2 },
        mb: 2.5,
        flexWrap: "wrap",
      }}
    >
      {showIllustration && (
        <JobSearchIllustration width={56} height={45} primaryColor="var(--accent-indigo)" />
      )}
      <Box>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", sm: fontSize || "1.75rem" }, fontWeight: 700 }}>
          Jobs
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Find opportunities that match your skills
        </Typography>
      </Box>
    </Box>
  );
};

export const JobsV2PageHeader = memo<JobsV2PageHeaderProps>(JobsV2PageHeaderComponent);
JobsV2PageHeader.displayName = "JobsV2PageHeader";
