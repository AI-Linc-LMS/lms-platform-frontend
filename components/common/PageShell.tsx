"use client";

import { ReactNode } from "react";
import { Box } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";

/**
 * Consistent page shell for every module page (student + admin).
 *
 * Standardises the two things that drift across the app today: the content
 * width and the canvas. Renders inside MainLayout (fullWidthContent) so the
 * content spans the full main area — matching the Assessment Management page —
 * replacing the grab-bag of per-page maxWidths (720 / 960 / 1140 / 1400 / 1760)
 * and one-off mesh/gradient backgrounds. Pass `maxWidth` only for a page that
 * genuinely needs to be capped.
 */
export function PageShell({
  children,
  maxWidth = "none",
}: {
  children: ReactNode;
  /** Content cap; defaults to full width (like Assessment Management). */
  maxWidth?: number | string;
}) {
  return (
    <MainLayout fullWidthContent>
      <Box sx={{ width: "100%", maxWidth, mx: "auto" }}>{children}</Box>
    </MainLayout>
  );
}
