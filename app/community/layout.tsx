"use client";

import { Box, CircularProgress, Container, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { COMMUNITY_FEATURE, useClientFeature } from "@/lib/hooks/useClientFeature";

/**
 * Gate for every `/community/*` route.
 *
 * The sidebar and bottom nav already hide Community when the tenant doesn't have the feature, but
 * hiding a link is not a gate — the URL still worked. A tenant that has deliberately switched
 * student discussion off needs the route itself closed, including deep links into a thread.
 *
 * A layout is the right place because it covers every nested route at once; adding the check to each
 * page would leave the next new page unguarded by default.
 */
export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  const { enabled, loading } = useClientFeature(COMMUNITY_FEATURE);

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
          <CircularProgress size={28} />
        </Box>
      </MainLayout>
    );
  }

  if (!enabled) {
    return (
      <MainLayout>
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Box sx={{ p: 4, borderRadius: 3, textAlign: "center",
            border: "1px dashed var(--border-default)", bgcolor: "var(--card-bg)" }}>
            <Icon icon="mdi:forum-outline" width={34} style={{ color: "var(--font-tertiary)" }} />
            <Typography sx={{ mt: 1.5, fontWeight: 800, fontSize: "1.05rem" }}>
              Community isn&apos;t available
            </Typography>
            <Typography sx={{ mt: 0.5, color: "var(--font-secondary)", fontSize: "0.9rem" }}>
              Your organization has discussions switched off. Reach out to your instructor or admin if
              you need help with a session.
            </Typography>
          </Box>
        </Container>
      </MainLayout>
    );
  }

  return <>{children}</>;
}
