"use client";

import { Box } from "@mui/material";
import { ReactNode } from "react";
import type { AuthLayoutVariantId } from "@/lib/auth/auth-layout-variants";

interface AuthLeftPanelProps {
  variant: AuthLayoutVariantId;
  children: ReactNode;
}

export function AuthLeftPanel({ variant, children }: AuthLeftPanelProps) {
  if (variant === "client28") {
    return (
      <Box
        sx={{
          flex: { xs: 1, md: "0 0 50%" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 3, sm: 4, md: 6 },
          py: { xs: 4, md: 0 },
          overflow: "auto",
          background:
            "linear-gradient(180deg, #f8fffc 0%, #ecfdf5 35%, #f1f5f9 100%)",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 440,
            borderRadius: 2,
            px: { xs: 2.5, sm: 3.5 },
            py: { xs: 3, sm: 3.5 },
            backgroundColor: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(15, 23, 42, 0.06)",
            boxShadow: "0 4px 24px rgba(15, 23, 42, 0.06)",
          }}
        >
          {children}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: { xs: 1, md: "0 0 50%" },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 3, sm: 4, md: 6 },
        py: { xs: 4, md: 0 },
        backgroundColor: "background.default",
        overflow: "auto",
      }}
    >
      {children}
    </Box>
  );
}
