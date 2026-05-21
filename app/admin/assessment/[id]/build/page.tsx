"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";

/**
 * Canonical URL for "continue authoring" — redirects to the shared create flow with ?fromDraft=
 */
export default function AssessmentBuildRedirectPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const raw = params?.id;
    const id = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
    if (id && /^\d+$/.test(id)) {
      router.replace(`/admin/assessment/create?fromDraft=${id}`);
    } else {
      router.replace("/admin/assessment");
    }
  }, [params, router]);

  return (
    <MainLayout>
      <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
        <CircularProgress />
      </Box>
    </MainLayout>
  );
}
