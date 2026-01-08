'use client';

import { Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { memo, useCallback } from 'react';

interface JobListHeaderProps {
  totalCount: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

const JobListHeaderComponent = ({
  totalCount,
  pageSize,
  onPageSizeChange,
}: JobListHeaderProps) => {
  const handlePageSizeChange = useCallback((e: any) => {
    onPageSizeChange(Number(e.target.value) || 10);
  }, [onPageSizeChange]);
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 0.5,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        {totalCount || 0} {totalCount === 1 ? 'job' : 'jobs'} found
      </Typography>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Per Page</InputLabel>
        <Select
          value={pageSize || 10}
          label="Per Page"
          onChange={handlePageSizeChange}
          sx={{
            borderRadius: 1.5,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'divider',
            },
          }}
        >
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={20}>20</MenuItem>
          <MenuItem value={50}>50</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export const JobListHeader = memo<JobListHeaderProps>(JobListHeaderComponent, (prevProps, nextProps) => {
  return (
    prevProps.totalCount === nextProps.totalCount &&
    prevProps.pageSize === nextProps.pageSize
  );
});
JobListHeader.displayName = "JobListHeader";

