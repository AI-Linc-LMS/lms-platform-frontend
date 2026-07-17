"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";

/**
 * Retired route (redesign): the AI Assessment Composer now lives inline on the
 * assessments hub. Old bookmarks/links land here and are forwarded.
 */
export default function ComposeRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/assessment");
  }, [router]);
  return (
    <MainLayout fullWidthContent>
      <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}>
        <CircularProgress sx={{ color: "var(--ai-violet)" }} />
      </Box>
    </MainLayout>
  );
}
