"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { Box, Button, Paper, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import {
  AssessmentSectionHero,
  AssessmentBreadcrumb,
  SegmentedTabs,
  type SegmentedTab,
  StatusChip,
  type ChipTone,
} from "@/components/admin/assessment/shared";
import {
  adminCohortsService,
  type CohortDetail,
  type CohortStatus,
} from "@/lib/services/admin/admin-cohorts.service";
import { CohortRosterTab } from "@/components/admin/cohorts/CohortRosterTab";
import { CohortAssignmentsTab } from "@/components/admin/cohorts/CohortAssignmentsTab";
import { CohortScheduleTab } from "@/components/admin/cohorts/CohortScheduleTab";
import { CohortDetailsTab } from "@/components/admin/cohorts/CohortDetailsTab";

type TabKey = "roster" | "assignments" | "schedule" | "details";

const TABS: SegmentedTab<TabKey>[] = [
  { value: "roster", label: "Roster", icon: "mdi:account-multiple" },
  { value: "assignments", label: "Assignments", icon: "mdi:cube-outline" },
  { value: "schedule", label: "Schedule", icon: "mdi:calendar-clock" },
  { value: "details", label: "Details", icon: "mdi:card-text-outline" },
];

const STATUS_TONE: Record<CohortStatus, ChipTone> = {
  draft: "warning",
  scheduled: "info",
  active: "success",
  completed: "info",
  archived: "neutral",
};

export default function AdminCohortDetailPage() {
  const params = useParams();
  const cohortId = Number(params.cohortId);
  const { push } = useInstantNavigation();
  const { showToast: _showToast } = useToast();
  const [cohort, setCohort] = useState<CohortDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("roster");

  const load = useCallback(async () => {
    try {
      setCohort(await adminCohortsService.getCohort(cohortId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load this cohort.");
    } finally {
      setLoading(false);
    }
  }, [cohortId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <MainLayout fullWidthContent>
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: "var(--canvas)", minHeight: "100%" }}>
          <Typography sx={{ textAlign: "center", py: 8, color: "var(--font-tertiary)" }}>Loading…</Typography>
        </Box>
      </MainLayout>
    );
  }
  if (error || !cohort) {
    return (
      <MainLayout fullWidthContent>
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: "var(--canvas)", minHeight: "100%", textAlign: "center" }}>
          <Typography sx={{ color: "var(--error-500, #ea4335)", fontWeight: 700, py: 6 }}>{error || "Not found."}</Typography>
          <Button onClick={() => push("/admin/cohorts")} sx={{ textTransform: "none" }}>
            ← Back to cohorts
          </Button>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: "var(--canvas)", minHeight: "100%" }}>
        <AssessmentBreadcrumb
          segments={[
            { label: "Admin", href: "/admin/dashboard" },
            { label: "Cohorts", href: "/admin/cohorts" },
            { label: cohort.name },
          ]}
        />
        <Button
          onClick={() => push("/admin/cohorts")}
          startIcon={<Icon icon="mdi:arrow-left" width={16} />}
          sx={{ textTransform: "none", color: "var(--font-secondary)", mb: 1, mt: 0.5 }}
        >
          Back to Cohorts
        </Button>

        <AssessmentSectionHero
          chapter={`COHORT · #${cohort.id}`}
          title={cohort.name}
          subtitle={
            [cohort.code, cohort.start_date && `${cohort.start_date} → ${cohort.end_date || "—"}`]
              .filter(Boolean)
              .join("  ·  ") || undefined
          }
          accent="violet"
          icon="mdi:account-group-outline"
          rightSlot={
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <StatusChip label={cohort.status} tone={STATUS_TONE[cohort.status]} />
              <StatusChip label={`${cohort.member_count} members`} tone="neutral" icon="mdi:account-multiple" />
              <StatusChip label={`${cohort.artifact_count} assignments`} tone="ai" icon="mdi:cube-outline" />
            </Box>
          }
        />

        <Box sx={{ mt: 3, mb: 2.5 }}>
          <SegmentedTabs<TabKey> tabs={TABS} value={tab} onChange={setTab} />
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: "16px",
            bgcolor: "transparent",
            ...(tab === "details" || tab === "schedule" ? {} : { p: 0 }),
          }}
        >
          {tab === "roster" && (
            <CohortRosterTab cohortId={cohort.id} cohortName={cohort.name} onChanged={() => void load()} />
          )}
          {tab === "assignments" && (
            <CohortAssignmentsTab cohortId={cohort.id} artifacts={cohort.artifacts} onChanged={() => void load()} />
          )}
          {tab === "schedule" && <CohortScheduleTab cohort={cohort} onSaved={() => void load()} />}
          {tab === "details" && <CohortDetailsTab cohort={cohort} onSaved={() => void load()} />}
        </Paper>
      </Box>
    </MainLayout>
  );
}
