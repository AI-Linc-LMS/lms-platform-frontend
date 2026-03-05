"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Box, Typography, Button } from "@mui/material";
import Link from "next/link";
import { JOB_PORTAL_ADMIN_ROLES } from "@/lib/job-portal-v2";

export function AdminJobPortalGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const canAccess =
    user && JOB_PORTAL_ADMIN_ROLES.includes(user.role as (typeof JOB_PORTAL_ADMIN_ROLES)[number]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canAccess) {
      router.replace("/job-portal");
    }
  }, [user, loading, canAccess, router]);

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">Loading...</Typography>
      </Box>
    );
  }

  if (!canAccess) {
    return (
      <Box sx={{ p: 3, maxWidth: 400, mx: "auto", textAlign: "center" }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Access denied
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          You do not have permission to access the Job Portal admin section.
        </Typography>
        <Button component={Link} href="/job-portal" variant="contained">
          Go to Job Portal
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
}
