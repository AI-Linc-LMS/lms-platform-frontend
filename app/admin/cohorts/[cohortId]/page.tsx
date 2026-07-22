"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { Box, ButtonBase, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import {
  adminCohortsService,
  type CohortDetail,
} from "@/lib/services/admin/admin-cohorts.service";
import { CohortRosterTab } from "@/components/admin/cohorts/CohortRosterTab";
import { CohortAssignmentsTab } from "@/components/admin/cohorts/CohortAssignmentsTab";
import { CohortScheduleTab } from "@/components/admin/cohorts/CohortScheduleTab";

type TabKey = "roster" | "assignments" | "schedule";

const TABS: Array<[TabKey, string, string]> = [
  ["roster", "Roster", "mdi:account-multiple"],
  ["assignments", "Assignments", "mdi:cube-outline"],
  ["schedule", "Schedule", "mdi:calendar-clock"],
];

const STATUS_COLOR: Record<string, string> = {
  draft: "#94a3b8",
  scheduled: "#6366f1",
  active: "#10b981",
  completed: "#0ea5e9",
  archived: "#a1a1aa",
};

export default function AdminCohortDetailPage() {
  const params = useParams();
  const cohortId = Number(params.cohortId);
  const { push } = useInstantNavigation();
  const { showToast } = useToast();
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
        <Typography sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>Loading…</Typography>
      </MainLayout>
    );
  }
  if (error || !cohort) {
    return (
      <MainLayout fullWidthContent>
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography sx={{ color: "#ef4444", fontWeight: 700 }}>{error || "Not found."}</Typography>
          <ButtonBase onClick={() => push("/admin/cohorts")} sx={{ mt: 2, fontWeight: 700, color: "#6366f1" }}>
            ← Back to cohorts
          </ButtonBase>
        </Box>
      </MainLayout>
    );
  }

  const color = STATUS_COLOR[cohort.status] ?? "#94a3b8";

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 5 } }}>
        {/* Header */}
        <ButtonBase
          onClick={() => push("/admin/cohorts")}
          sx={{ color: "text.secondary", fontWeight: 700, mb: 1.5, fontSize: "0.85rem" }}
        >
          <Icon icon="mdi:arrow-left" width={16} />&nbsp;Cohorts
        </ButtonBase>
        <Box
          sx={{
            borderRadius: 4,
            p: { xs: 2.5, md: 3 },
            mb: 3,
            background: "linear-gradient(135deg, color-mix(in srgb, #6366f1 12%, var(--card-bg)) 0%, var(--card-bg) 70%)",
            border: "1px solid var(--border-default)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.4rem", md: "1.7rem" } }}>{cohort.name}</Typography>
            <Box
              sx={{
                px: 1.25,
                py: 0.35,
                borderRadius: 999,
                fontSize: "0.72rem",
                fontWeight: 800,
                textTransform: "uppercase",
                color,
                bgcolor: `color-mix(in srgb, ${color} 15%, transparent)`,
              }}
            >
              {cohort.status}
            </Box>
            {cohort.code && (
              <Typography sx={{ fontFamily: "monospace", color: "text.secondary", fontSize: "0.85rem" }}>
                {cohort.code}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 1.5 }}>
            <HeaderStat icon="mdi:account-multiple" value={cohort.member_count} label="members" />
            <HeaderStat icon="mdi:cube-outline" value={cohort.artifact_count} label="assignments" />
            <HeaderStat
              icon="mdi:calendar-range"
              value={`${cohort.start_date || "—"} → ${cohort.end_date || "—"}`}
              label=""
            />
          </Box>
        </Box>

        {/* Tab pills */}
        <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
          {TABS.map(([key, label, icon]) => {
            const active = tab === key;
            return (
              <ButtonBase
                key={key}
                onClick={() => setTab(key)}
                sx={{
                  px: 2.25,
                  py: 1,
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.6,
                  color: active ? "white" : "text.secondary",
                  background: active
                    ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
                    : "var(--card-bg)",
                  border: active ? "none" : "1px solid var(--border-default)",
                }}
              >
                <Icon icon={icon} width={16} />
                {label}
              </ButtonBase>
            );
          })}
        </Box>

        {tab === "roster" && <CohortRosterTab cohortId={cohort.id} onChanged={() => void load()} />}
        {tab === "assignments" && (
          <CohortAssignmentsTab cohortId={cohort.id} artifacts={cohort.artifacts} onChanged={() => void load()} />
        )}
        {tab === "schedule" && <CohortScheduleTab cohort={cohort} onSaved={() => void load()} />}
      </Box>
    </MainLayout>
  );
}

function HeaderStat({ icon, value, label }: { icon: string; value: number | string; label: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <Icon icon={icon} width={18} style={{ color: "#a855f7" }} />
      <Typography component="span" sx={{ fontWeight: 800 }}>
        {value}
      </Typography>
      {label && (
        <Typography component="span" sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
          {label}
        </Typography>
      )}
    </Box>
  );
}
