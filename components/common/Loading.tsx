'use client';

import { Box } from '@mui/material';

interface LoadingProps {
  fullScreen?: boolean;
  size?: number;
}

export const Loading: React.FC<LoadingProps> = ({ fullScreen = false, size = 60 }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: fullScreen ? '100vh' : '200px',
        width: '100%',
        position: fullScreen ? 'fixed' : 'relative',
        top: fullScreen ? 0 : 'auto',
        left: fullScreen ? 0 : 'auto',
        right: fullScreen ? 0 : 'auto',
        bottom: fullScreen ? 0 : 'auto',
        zIndex: fullScreen ? 9999 : 'auto',
        backgroundColor: fullScreen ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
        '& .loader': {
          width: `${size}px`,
          aspectRatio: 1,
        },
      }}
    >
      <div className="loader" />
    </Box>
  );
};


