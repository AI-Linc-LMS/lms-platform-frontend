"use client";

import { Box } from "@mui/material";
import { ReactNode } from "react";

export type AuthLeftPanelVariant = "plain" | "glass";

interface AuthLeftPanelProps {
  variant: AuthLeftPanelVariant;
  children: ReactNode;
}

export function AuthLeftPanel({ variant, children }: AuthLeftPanelProps) {
  if (variant === "glass") {
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
            "linear-gradient(180deg, var(--background) 0%, color-mix(in srgb, var(--surface) 92%, var(--background)) 45%, color-mix(in srgb, var(--card-bg) 88%, var(--background)) 100%)",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 440,
            borderRadius: 2,
            px: { xs: 2.5, sm: 3.5 },
            py: { xs: 3, sm: 3.5 },
            backgroundColor:
              "color-mix(in srgb, var(--surface) 78%, var(--background))",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--border-default)",
            boxShadow:
              "0 4px 24px color-mix(in srgb, var(--font-primary) 10%, transparent)",
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
        backgroundColor: "var(--background)",
        overflow: "auto",
      }}
    >
      {children}
    </Box>
  );
}
