'use client';

import { Box, Typography, Pagination } from '@mui/material';
import { memo, useMemo } from 'react';

interface JobPaginationProps {
  totalCount: number;
  pageSize: number;
  page: number;
  onPageChange: (event: React.ChangeEvent<unknown>, value: number) => void;
}

const JobPaginationComponent = ({
  totalCount,
  pageSize,
  page,
  onPageChange,
}: JobPaginationProps) => {
  const { totalPages, startItem, endItem, shouldShow } = useMemo(() => {
    const shouldShow = totalCount > pageSize;
    if (!shouldShow) {
      return { totalPages: 0, startItem: 0, endItem: 0, shouldShow: false };
    }
    
    const totalPages = Math.ceil(totalCount / pageSize);
    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, totalCount || 0);
    
    return { totalPages, startItem, endItem, shouldShow: true };
  }, [totalCount, pageSize, page]);

  if (!shouldShow) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 2,
        mt: 3,
        mb: 2,
      }}
    >
      <Pagination
        count={totalPages}
        page={page}
        onChange={onPageChange}
        color="primary"
        size="small"
        showFirstButton
        showLastButton
        siblingCount={0}
        sx={{
          '& .MuiPaginationItem-root': {
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            '&.Mui-selected': {
              backgroundColor: '#6366f1',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#4f46e5',
              },
            },
          },
        }}
      />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontSize: '0.75rem' }}
      >
        Showing {startItem} - {endItem} of {totalCount || 0} jobs
      </Typography>
    </Box>
  );
};

export const JobPagination = memo<JobPaginationProps>(JobPaginationComponent, (prevProps, nextProps) => {
  return (
    prevProps.totalCount === nextProps.totalCount &&
    prevProps.pageSize === nextProps.pageSize &&
    prevProps.page === nextProps.page
  );
});
JobPagination.displayName = "JobPagination";

