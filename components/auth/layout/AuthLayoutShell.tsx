"use client";

import { Box } from "@mui/material";
import { ReactNode } from "react";

interface AuthLayoutShellProps {
  left: ReactNode;
  right: ReactNode;
}

export function AuthLayoutShell({ left, right }: AuthLayoutShellProps) {
  return (
    <Box
      sx={{
        height: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      {left}
      {right}
    </Box>
  );
}
