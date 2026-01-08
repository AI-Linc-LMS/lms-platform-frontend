"use client";

import { Box, CircularProgress, Typography } from "@mui/material";

export const SignInLoader: React.FC = () => {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
        zIndex: 9999,
      }}
    >
      <CircularProgress size={48} sx={{ mb: 3 }} />
      <Typography variant="body1" color="text.secondary">
        Signing you in...
      </Typography>
    </Box>
  );
};

