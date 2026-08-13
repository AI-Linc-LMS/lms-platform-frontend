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
 * page. Always stacked in the right sidebar.
 *
 * There used to be a second, full-width 2-up variant for the separate "no courses
 * yet" dashboard. That dashboard is gone — a learner with no courses now gets the
 * ordinary layout — and on a tenant with one of these modules enabled the 2-up grid
 * rendered a single card beside a visibly empty column anyway.
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

