"use client";

import { Box } from "@mui/material";
import { ReactNode } from "react";

export type AuthLeftPanelVariant = "plain" | "glass";

interface AuthLeftPanelProps {
  variant: AuthLeftPanelVariant;
  children: ReactNode;
}

export function AuthLeftPanel({ variant, children }: AuthLeftPanelProps) {
  // A brand-accented card the form sits in. The thin top gradient gives the auth pages a consistent
  // identity; the layered shadow reads as depth without heaviness. Theme-aware via CSS vars.
  const cardSx = {
    position: "relative" as const,
    width: "100%",
    maxWidth: 440,
    borderRadius: "20px",
    px: { xs: 2.75, sm: 4 },
    py: { xs: 3.25, sm: 4 },
    // NOTE: intentionally NO `overflow: hidden`. The card wraps the Google Sign-In button, which is a
    // cross-origin GSI <iframe>; a clipping + rounded ancestor breaks that iframe's click hit-testing
    // (the button renders but stops receiving clicks). The accent strip below rounds its own top
    // corners so it still tucks into the card's radius without needing to clip the card.
    border: "1px solid var(--border-default)",
    boxShadow:
      "0 1px 2px color-mix(in srgb, var(--font-primary) 6%, transparent), 0 24px 48px -28px color-mix(in srgb, var(--font-primary) 30%, transparent)",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      borderRadius: "20px 20px 0 0",
      background: "linear-gradient(90deg, var(--primary-500) 0%, var(--accent-pink) 100%)",
    },
  } as const;

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
            ...cardSx,
            backgroundColor: "color-mix(in srgb, var(--surface) 82%, var(--background))",
            backdropFilter: "blur(12px)",
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
        px: { xs: 2.5, sm: 4, md: 6 },
        py: { xs: 4, md: 0 },
        overflow: "auto",
        // A soft, brand-tinted ground so the white card reads as elevated rather than floating on flat white.
        background:
          "radial-gradient(120% 120% at 0% 0%, color-mix(in srgb, var(--primary-500) 7%, var(--background)) 0%, var(--background) 55%)",
      }}
    >
      <Box sx={{ ...cardSx, backgroundColor: "var(--card-bg)" }}>{children}</Box>
    </Box>
  );
}
