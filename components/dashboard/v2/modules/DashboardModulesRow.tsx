"use client";

import { Box, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  useIsAssessmentEnabled,
  useIsCommunityEnabled,
  useIsJobsEnabled,
  useIsLiveSessionsEnabled,
} from "@/lib/contexts/ClientInfoContext";
import { UpcomingAssessmentsPanel } from "./UpcomingAssessmentsPanel";
import { LiveSessionsPanel } from "./LiveSessionsPanel";
import { JobOpeningsPanel } from "./JobOpeningsPanel";
import { CommunityHighlightsPanel } from "./CommunityHighlightsPanel";

/**
 * A full-width "What's next for you" row of tenant-gated module widgets shown
 * below the main dashboard grid. Each widget renders ONLY when its module is
 * enabled for the tenant (strict feature check), fetches its own data, and
 * hides itself on error - so a slow/missing endpoint never blanks the page.
 */
export function DashboardModulesRow() {
  const assessment = useIsAssessmentEnabled();
  const live = useIsLiveSessionsEnabled();
  const jobs = useIsJobsEnabled();
  const community = useIsCommunityEnabled();

  const panels = [
    assessment && <UpcomingAssessmentsPanel key="assessment" />,
    live && <LiveSessionsPanel key="live" />,
    jobs && <JobOpeningsPanel key="jobs" />,
    community && <CommunityHighlightsPanel key="community" />,
  ].filter(Boolean);

  if (panels.length === 0) return null;

  return (
    <Box sx={{ mt: 2.5 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Icon icon="mdi:compass-outline" width={18} color="#7c3aed" />
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>
          What&apos;s next for you
        </Typography>
      </Stack>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))" },
          gap: 2,
          alignItems: "stretch",
        }}
      >
        {panels}
      </Box>
    </Box>
  );
}
