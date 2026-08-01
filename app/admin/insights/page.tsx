"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Tab, Tabs, Typography } from "@mui/material";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useAuth } from "@/lib/auth/auth-context";
import { isClientOrgAdminRole } from "@/lib/auth/role-utils";
import {
  adminInsightsService,
  type AtRiskRow,
  type EngagementPayload,
  type LearningPayload,
  type PeoplePayload,
  type PulsePayload,
  type RangeKey,
} from "@/lib/services/admin/admin-insights.service";
import { InsightsFilterBar } from "@/components/admin/insights/InsightsFilterBar";
import { PulseSection } from "@/components/admin/insights/PulseSection";
import { EngagementSection } from "@/components/admin/insights/EngagementSection";
import { LearningSection } from "@/components/admin/insights/LearningSection";
import { PeopleSection } from "@/components/admin/insights/PeopleSection";

/**
 * The admin insights dashboard.
 *
 * Two structural decisions worth stating, because both were the opposite before:
 *
 * **One range for everything.** The filter bar governs every section. Per-section ranges let two
 * panels on one screen describe different periods, and any comparison an admin draws between
 * them is then wrong without anything on the page looking wrong.
 *
 * **One request per section, fetched lazily.** Each tab loads when it is first opened and is then
 * kept, so switching back is instant and an admin who only ever looks at Pulse never pays for the
 * other three. The previous dashboard fired a request per widget on load, and every one of them
 * re-ran the same tenant-wide student scan.
 *
 * Access is org-admin only, matching the server: these endpoints aggregate every student on the
 * tenant and the at-risk list names people who are falling behind, so instructors and course
 * managers are excluded on both sides.
 */

type TabKey = "pulse" | "engagement" | "learning" | "people";

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: "pulse", label: "Pulse", icon: "mdi:pulse" },
  { key: "engagement", label: "Engagement", icon: "mdi:chart-timeline-variant" },
  { key: "learning", label: "Learning", icon: "mdi:school-outline" },
  { key: "people", label: "People", icon: "mdi:account-multiple-outline" },
];

export default function AdminInsightsPage() {
  const { user } = useAuth();
  const isOrgAdmin = isClientOrgAdminRole(user?.role);

  const [range, setRange] = useState<RangeKey>("30d");
  const [tab, setTab] = useState<TabKey>("pulse");
  const [error, setError] = useState<string | null>(null);

  const [pulse, setPulse] = useState<PulsePayload | null>(null);
  const [atRisk, setAtRisk] = useState<{ results: AtRiskRow[]; rules: Record<string, string> } | null>(null);
  const [engagement, setEngagement] = useState<EngagementPayload | null>(null);
  const [learning, setLearning] = useState<LearningPayload | null>(null);
  const [people, setPeople] = useState<PeoplePayload | null>(null);

  // Loading is derived, not stored. A section is loading exactly when it has no payload and
  // nothing has failed — which is already true the instant a range change clears it, so there is
  // no window where a stale panel is shown under a new label while a flag catches up.
  const pulseLoading = pulse === null && error === null;
  const sectionLoading = (payload: unknown) => payload === null && error === null;

  // Changing the range invalidates every section, not just the visible one. Done here rather than
  // in an effect because it is a response to an event, not a synchronisation with anything.
  const handleRangeChange = useCallback((next: RangeKey) => {
    setRange(next);
    setPulse(null);
    setAtRisk(null);
    setEngagement(null);
    setLearning(null);
    setPeople(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!isOrgAdmin) return;
    let cancelled = false;
    Promise.all([
      adminInsightsService.getPulse(range),
      // The at-risk list is a separate endpoint so one slow or failing query cannot take the
      // tiles down with it; an empty list degrades better than an empty page.
      adminInsightsService.getAtRisk(10).catch(() => ({ results: [], rules: {} })),
    ])
      .then(([p, r]) => {
        if (cancelled) return;
        setPulse(p);
        setAtRisk(r);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the dashboard. Try again in a moment.");
      });
    return () => {
      cancelled = true;
    };
  }, [range, isOrgAdmin]);

  // Lazy per-tab fetch. Each section is requested the first time it is shown for a given range
  // and then kept, so returning to it is instant and an admin who only reads Pulse never pays
  // for the other three.
  useEffect(() => {
    if (!isOrgAdmin || tab === "pulse") return;
    const already =
      (tab === "engagement" && engagement) ||
      (tab === "learning" && learning) ||
      (tab === "people" && people);
    if (already) return;

    let cancelled = false;
    const request =
      tab === "engagement"
        ? adminInsightsService.getEngagement(range)
        : tab === "learning"
          ? adminInsightsService.getLearning(range)
          : adminInsightsService.getPeople(range);

    request
      .then((payload) => {
        if (cancelled) return;
        if (tab === "engagement") setEngagement(payload as EngagementPayload);
        else if (tab === "learning") setLearning(payload as LearningPayload);
        else setPeople(payload as PeoplePayload);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this section. Try another period or refresh.");
      });

    return () => {
      cancelled = true;
    };
  }, [tab, range, isOrgAdmin, engagement, learning, people]);

  if (!isOrgAdmin) {
    return (
      <PageShell>
        <Box sx={{ p: 4, textAlign: "center" }}>
          <IconWrapper icon="mdi:lock" size={48} color="var(--font-tertiary)" />
          <Typography variant="h6" sx={{ mt: 2, fontWeight: 700 }}>
            Admin access required
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
            This dashboard covers every student on the tenant, so it is limited to admins.
          </Typography>
        </Box>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <ModulePageHeader
          eyebrow="Analytics"
          title="Insights"
          description="How your students are doing, what they are working on, and who needs help."
          accent="indigo"
          icon="mdi:chart-box-outline"
        />

        <InsightsFilterBar
          value={range}
          onChange={handleRangeChange}
          grain={pulse?.range.grain}
          disabled={pulseLoading}
          computedAt={pulse?.freshness.computed_at}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Tabs
          value={tab}
          onChange={(_, v: TabKey) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 2.5,
            minHeight: 44,
            "& .MuiTab-root": {
              fontWeight: 700,
              textTransform: "none",
              minHeight: 44,
              color: "var(--font-secondary)",
            },
            "& .Mui-selected": { color: "var(--font-primary) !important" },
            "& .MuiTabs-indicator": {
              background: "linear-gradient(135deg,#6366f1 0%,#a855f7 60%,#ec4899 100%)",
              height: 3,
            },
          }}
        >
          {TABS.map((t) => (
            <Tab
              key={t.key}
              value={t.key}
              label={t.label}
              icon={<IconWrapper icon={t.icon} size={17} />}
              iconPosition="start"
            />
          ))}
        </Tabs>

        {tab === "pulse" && (
          <PulseSection data={pulse} atRisk={atRisk} loading={pulseLoading} />
        )}
        {tab === "engagement" && (
          <EngagementSection data={engagement} loading={sectionLoading(engagement)} />
        )}
        {tab === "learning" && <LearningSection data={learning} loading={sectionLoading(learning)} />}
        {tab === "people" && <PeopleSection data={people} loading={sectionLoading(people)} />}
      </Box>
    </PageShell>
  );
}
