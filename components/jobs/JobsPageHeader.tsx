'use client';

import { Box, Typography } from '@mui/material';
import { Briefcase } from 'lucide-react';
import { memo } from 'react';

interface JobsPageHeaderProps {
  size?: number;
  fontSize?: string;
}

const JobsPageHeaderComponent = ({
  size = 32,
  fontSize = '1.75rem',
}: JobsPageHeaderProps) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
      <Briefcase size={size} color="#6366f1" />
      <Typography variant="h4" sx={{ fontSize, fontWeight: 700 }}>
        Job Portal
      </Typography>
    </Box>
  );
};

export const JobsPageHeader = memo<JobsPageHeaderProps>(JobsPageHeaderComponent);
JobsPageHeader.displayName = "JobsPageHeader";

