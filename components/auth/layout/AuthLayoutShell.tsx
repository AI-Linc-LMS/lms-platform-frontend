"use client";

import { Box } from "@mui/material";
import { ReactNode } from "react";
import { AUTH } from "./authTokens";

interface AuthLayoutShellProps {
  left: ReactNode;
  right: ReactNode;
  /** Compact dark brand bar shown only below md, where `right` is not rendered. */
  mobileBrand?: ReactNode;
}

/**
 * Two panels on desktop, stacked on mobile.
 *
 * The split favours the form (52/48) rather than 50/50 so the form column reads as the
 * subject of the page instead of one of two equal halves.
 *
 * This used to be `height: 100vh; maxHeight: 100vh; overflow: hidden`, which caused two
 * bugs at once: the brand panel was unreachable on phones (it is display:none below md, and
 * the shell could not scroll to reveal anything anyway), and `100vh` is larger than the
 * visible viewport on iOS Safari while the address bar is showing, so the bottom of a tall
 * form was cut off with no way to scroll to it. `min-height: 100dvh` plus normal document
 * flow fixes both.
 */
export function AuthLayoutShell({ left, right, mobileBrand }: AuthLayoutShellProps) {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        backgroundColor: AUTH.canvas,
      }}
    >
      {mobileBrand ? (
        <Box sx={{ display: { xs: "block", md: "none" } }}>{mobileBrand}</Box>
      ) : null}
      {left}
      {right}
    </Box>
  );
}
