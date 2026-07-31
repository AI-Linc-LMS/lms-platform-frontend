"use client";

import { Box } from "@mui/material";
import { ReactNode } from "react";
import { AUTH } from "./authTokens";

export type AuthLeftPanelVariant = "plain" | "glass";

interface AuthLeftPanelProps {
  /** Kept for call-site compatibility. Both variants now render the same borderless column. */
  variant?: AuthLeftPanelVariant;
  /** Small tenant logo, top-left. Present on every breakpoint. */
  brandMark?: ReactNode;
  children: ReactNode;
}

/**
 * The form column.
 *
 * Deliberately has no card. The previous version wrapped the form in a bordered, shadowed,
 * 20px-radius card with a 4px colored gradient strip across the top: three decorations doing
 * the job that hierarchy and whitespace should do, and the colored top strip in particular is
 * one of the most recognisable generated-design tells. Separation now comes from the canvas
 * to surface lightness shift and spacing alone.
 *
 * INVARIANT: no `overflow: hidden` anywhere on this subtree. The column contains the
 * cross-origin Google Sign-In iframe, and a clipping + rounded ancestor breaks its click
 * hit-testing: the button renders and silently stops receiving clicks.
 */
export function AuthLeftPanel({ brandMark, children }: AuthLeftPanelProps) {
  return (
    <Box
      component="main"
      sx={{
        flex: { xs: "1 1 auto", md: "0 0 52%" },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        // Optically above true center: a form pinned to dead center reads as slightly low.
        justifyContent: { xs: "flex-start", md: "center" },
        px: { xs: 3, sm: 5, md: 8 },
        py: { xs: 4, md: 6 },
        backgroundColor: AUTH.canvas,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {brandMark ? <Box sx={{ mb: 4 }}>{brandMark}</Box> : null}
        {children}
      </Box>
    </Box>
  );
}
