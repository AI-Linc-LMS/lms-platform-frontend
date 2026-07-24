"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import {
  useClientInfo,
  useIsAdminScorecardEnabled,
} from "@/lib/contexts/ClientInfoContext";

/**
 * Feature gate for /admin/scorecard/* - page, skills, badges. Wrapping the
 * subtree at the layout level keeps every child page in sync without
 * repeating the redirect logic. When a super-admin disables the
 * "admin_scorecard" feature for the tenant, the admin routes redirect to
 * the admin dashboard. The backend AdminScorecardAPIView still enforces
 * role + auth - this layer just keeps the UI honest.
 */
export default function AdminScorecardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading } = useClientInfo();
  const enabled = useIsAdminScorecardEnabled();

  useEffect(() => {
    if (!loading && !enabled) {
      router.replace("/admin/dashboard");
    }
  }, [loading, enabled, router]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!enabled) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Scorecard isn&apos;t enabled for this tenant.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Redirecting to dashboard…
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
