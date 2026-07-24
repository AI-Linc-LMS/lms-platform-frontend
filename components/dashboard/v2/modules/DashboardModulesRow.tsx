"use client";

import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  useIsAssessmentEnabled,
  useIsJobsEnabled,
  useIsLiveSessionsEnabled,
} from "@/lib/contexts/ClientInfoContext";
import { UpcomingAssessmentsPanel } from "./UpcomingAssessmentsPanel";
import { LiveSessionsPanel } from "./LiveSessionsPanel";
import { JobOpeningsPanel } from "./JobOpeningsPanel";
// CommunityHighlightsPanel is intentionally not rendered for now (hidden per
// product request); the component is kept for an easy re-add.

/**
 * The tenant-gated "What's next for you" module widgets. Each renders ONLY when
 * its module is enabled for the tenant (strict feature check), fetches its own
 * data, and hides itself on error - so a slow/missing endpoint never blanks the
 * page. Rendered two ways:
 *   - DashboardModulesRail: stacked in the right sidebar (main dashboard) so the
 *     rail fills out and each panel sizes to its content (no empty grid gaps).
 *   - DashboardModulesRow: a full-width 2-up grid (the empty-adaptive dashboard,
 *     which has no sidebar).
 */
function useGatedPanels(): ReactNode[] {
  const assessment = useIsAssessmentEnabled();
  const live = useIsLiveSessionsEnabled();
  const jobs = useIsJobsEnabled();

  return [
    assessment && <UpcomingAssessmentsPanel key="assessment" />,
    live && <LiveSessionsPanel key="live" />,
    jobs && <JobOpeningsPanel key="jobs" />,
  ].filter(Boolean) as ReactNode[];
}

function SectionLabel() {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, mt: 0.5 }}>
      <Icon icon="mdi:compass-outline" width={17} color="#7c3aed" />
      <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>
        What&apos;s next for you
      </Typography>
    </Stack>
  );
}

/** Right-sidebar variant: a labelled, single-column stack of the enabled panels. */
export function DashboardModulesRail() {
  const panels = useGatedPanels();
  if (panels.length === 0) return null;
  return (
    <>
      <SectionLabel />
      {panels}
    </>
  );
}

/** Full-width variant (empty-adaptive dashboard, no sidebar): 2-up responsive grid. */
export function DashboardModulesRow() {
  const panels = useGatedPanels();
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
          alignItems: "start",
        }}
      >
        {panels}
      </Box>
    </Box>
  );
}
