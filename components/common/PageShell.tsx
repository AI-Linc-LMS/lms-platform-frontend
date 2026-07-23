"use client";

import { ReactNode } from "react";
import { Box } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";

/**
 * Consistent page shell for every module page (student + admin).
 *
 * Standardises the two things that drift across the app today: the content
 * width and the canvas. Renders inside MainLayout (which supplies the app
 * padding + canvas background) and caps + centres the content so every module
 * reads as one product — replacing the grab-bag of per-page maxWidths
 * (720 / 960 / 1140 / 1400 / 1760 / none) and one-off mesh/gradient backgrounds.
 */
export function PageShell({
  children,
  maxWidth = 1600,
}: {
  children: ReactNode;
  /** Content cap; keep the default unless a page genuinely needs to be wider/narrower. */
  maxWidth?: number | string;
}) {
  return (
    <MainLayout fullWidthContent>
      <Box sx={{ width: "100%", maxWidth, mx: "auto" }}>{children}</Box>
    </MainLayout>
  );
}
