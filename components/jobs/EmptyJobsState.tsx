'use client';

import { Paper, Typography } from '@mui/material';
import { Briefcase } from 'lucide-react';
import { memo } from 'react';

const EmptyJobsStateComponent = () => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 6,
        textAlign: 'center',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Briefcase size={48} style={{ color: '#9ca3af', margin: '0 auto 16px' }} />
      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
        No jobs found
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Try adjusting your filters or search terms
      </Typography>
    </Paper>
  );
};

const MemoizedEmptyJobsState = memo(EmptyJobsStateComponent);
MemoizedEmptyJobsState.displayName = "EmptyJobsState";

export { MemoizedEmptyJobsState as EmptyJobsState };

