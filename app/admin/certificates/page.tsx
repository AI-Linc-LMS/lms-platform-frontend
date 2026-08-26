"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Box, Skeleton, Stack } from "@mui/material";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import {
  AssessmentEmptyState,
  SegmentedTabs,
  StatStrip,
  type SegmentedTab,
  type StatItem,
} from "@/components/admin/assessment/shared";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { config } from "@/lib/config";
import { adminCertificatesService } from "@/lib/services/certificates.service";
import { TemplatesTab } from "@/components/admin/certificates/TemplatesTab";
import { TemplateEditorDialog } from "@/components/admin/certificates/TemplateEditorDialog";
import { PointsLadderTab } from "@/components/admin/certificates/PointsLadderTab";
import { AssignmentsTab } from "@/components/admin/certificates/AssignmentsTab";
import { IssuedTab } from "@/components/admin/certificates/IssuedTab";
import {
  Eyebrow,
  MetaPill,
  NoticeStrip,
  Surface,
  certificateAdminKeys,
  useCertificateIssuer,
} from "@/components/admin/certificates/shared";
import type {
  CertificatesOverviewCounts,
  CertificateRuleScope,
} from "@/lib/certificates/types";
import { CERT_ACCENT } from "@/lib/certificates/ui-tokens";

/**
 * The certificates module.
 *
 * This screen replaces a two-panel picker that listed LEGACY lms_core.Course
 * rows and did nothing but store an uploaded file against them. Two things were
 * wrong with it and both are fixed here. It pointed at the wrong course model,
 * so certificate configuration never reached the adaptive courses learners are
 * actually enrolled in; the Assignments tab lists adaptive courses. And it was
 * write-only: an admin uploaded a file and had no way to see what a learner
 * received, which design was in force, or who held one. Every tab here reads
 * back what it writes.
 *
 * Four tabs, in the order the work happens: design the artwork, define the
 * points ladder, decide what each course or assessment awards, then look at
 * what has actually been issued.
 */

type TabKey = "templates" | "ladder" | "assignments" | "issued";

const TAB_ORDER: TabKey[] = ["templates", "ladder", "assignments", "issued"];

const TAB_ICONS: Record<TabKey, string> = {
  templates: "mdi:palette-outline",
  ladder: "mdi:stairs-up",
  assignments: "mdi:tune-variant",
  issued: "mdi:account-star-outline",
};

/** What each tab holds, from the overview payload the hub already fetches, so a
 *  segment can carry its own count the way every other admin hub's does. */
const TAB_COUNT: Record<TabKey, (c: CertificatesOverviewCounts) => number> = {
  templates: (c) => c.active_templates,
  ladder: (c) => c.active_tiers,
  assignments: (c) => c.ruled_courses + c.ruled_assessments,
  issued: (c) => c.live,
};

/** The stat row's own footprint while the overview loads: four StatStrip-shaped
 *  cards, so the strip does not resize under the cursor when it arrives. */
function StatStripSkeleton() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
        gap: 1.5,
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <Box
          key={i}
          sx={{
            height: 72,
            borderRadius: "var(--radius-card)",
            bgcolor: "var(--card-bg)",
            border: "1px solid var(--border-default)",
            opacity: 0.6,
          }}
        />
      ))}
    </Box>
  );
}

/** The hub's own shape while the workspace resolves: hero, stat strip, tab
 *  track, card grid. */
function HubSkeleton() {
  return (
    <Box aria-busy="true">
      <Skeleton variant="rounded" height={168} sx={{ borderRadius: 4, mb: 3 }} />
      <StatStripSkeleton />
      <Skeleton variant="rounded" height={46} width={420} sx={{ borderRadius: 999, mt: 3, mb: 2, maxWidth: "100%" }} />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 2.5,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={280}
            sx={{ borderRadius: "var(--radius-card)" }}
          />
        ))}
      </Box>
    </Box>
  );
}

function parseTab(value: string | null): TabKey {
  return TAB_ORDER.includes((value ?? "") as TabKey) ? (value as TabKey) : "templates";
}

/**
 * The rule scope from the URL.
 *
 * The wire value is `adaptive_course` - `RULE_SCOPE_CHOICES`, a ChoiceField and
 * a DB CheckConstraint all say so, and `course` is 400'd outright. A legacy
 * `?scope=course` is mapped here at the boundary rather than tolerated
 * downstream, so old bookmarks and deep links keep working without a second
 * spelling leaking into the app.
 */
function parseScope(value: string | null): CertificateRuleScope | null {
  if (value === "assessment") return "assessment";
  if (value === "adaptive_course" || value === "course") return "adaptive_course";
  return null;
}

function parseId(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function AdminCertificatesPageInner() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clientInfo, loading: loadingClient } = useClientInfo();
  const issuer = useCertificateIssuer();
  const clientId = config.clientId;

  const [tab, setTab] = useState<TabKey>(() => parseTab(searchParams.get("tab")));
  // The header CTA opens its own editor rather than reaching into the Templates
  // tab. Poking a child's dialog open from a parent means an effect that calls
  // setState on every render of the child, and the create flow is identical
  // wherever it starts from: a new template, no preset preselected.
  const [createOpen, setCreateOpen] = useState(false);

  // The tab lives in the URL so the assessment hub can link straight to a
  // specific assessment's criteria, and so a bookmarked tab reopens where the
  // admin left it.
  const scope = parseScope(searchParams.get("scope"));
  const courseParam = parseId(searchParams.get("course"));
  const assessmentParam = parseId(searchParams.get("assessment"));

  const initialScope: CertificateRuleScope =
    scope === "assessment" || assessmentParam != null ? "assessment" : "adaptive_course";
  const initialObjectId = initialScope === "assessment" ? assessmentParam : courseParam;

  useEffect(() => {
    setTab(parseTab(searchParams.get("tab")));
  }, [searchParams]);

  const goToTab = useCallback(
    (next: TabKey) => {
      setTab(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", next);
      // replace, not push: flipping between tabs should not fill the back
      // button with four entries of the same page.
      router.replace(`/admin/certificates?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // "Award for a course or assessment" is a navigation, not a selection: the
  // Assignments tab's rule editor owns which design each criterion awards, and
  // handing it a pre-selected template from here would be a second writer of
  // that choice.
  const handleAssignTemplate = useCallback(() => goToTab("assignments"), [goToTab]);

  const overviewQuery = useQuery({
    queryKey: certificateAdminKeys.overview(clientId),
    queryFn: () => adminCertificatesService.overview(clientId),
    staleTime: 2 * 60 * 1000,
  });

  /**
   * Capability gate. `admin_certificates` is the flag the backend gates the
   * admin endpoints on. The relaxed fallback is deliberate and predates this
   * rewrite: a tenant whose client-info carries no admin_* features at all has
   * not been migrated to the capability list, and hiding the module from those
   * admins would take the feature away from everyone on an older tenant.
   */
  const enabledNames = useMemo(
    () => new Set(clientInfo?.features?.map((f) => f.name) ?? []),
    [clientInfo?.features],
  );
  const adminFeatures = useMemo(
    () => [...enabledNames].filter((name) => name.startsWith("admin_")),
    [enabledNames],
  );
  const allowed = adminFeatures.length === 0 || enabledNames.has("admin_certificates");

  // The waiting state is the page's own shape - hero, stat strip, tab track,
  // card grid - so nothing moves when the real thing arrives. A centred spinner
  // is a different layout that then jumps.
  if (loadingClient) {
    return (
      <PageShell>
        <HubSkeleton />
      </PageShell>
    );
  }

  if (!allowed) {
    return (
      <PageShell>
        <AssessmentEmptyState
          icon="mdi:lock-outline"
          title={t("certificatesUpload.noAccessTitle", "Certificates unavailable")}
          description={t(
            "certificatesUpload.noAccessModule",
            "The certificates module is not enabled for your role or organization. An owner can turn it on from workspace settings.",
          )}
        />
      </PageShell>
    );
  }

  const overview = overviewQuery.data;
  const counts = overview?.counts;
  // `seeded` is what THIS request created, and it is zero on every call after
  // the first. It is the only way to tell "never configured" from "configured
  // and then emptied", and it turns an empty-looking hub into an explanation.
  const justSeeded = (overview?.seeded.templates ?? 0) + (overview?.seeded.tiers ?? 0) > 0;

  // Plain consts, not useMemo: they sit after the capability gate's early
  // returns, where a hook would be a conditional hook.
  const stats: StatItem[] = [
    {
      label: t("certificatesUpload.statTemplates", "Designs"),
      value: counts ? counts.active_templates : "-",
      icon: "mdi:palette-outline",
      tone: "var(--ai-violet, #7c3aed)",
    },
    {
      label: t("certificatesUpload.statTiers", "Ladder rungs"),
      value: counts ? counts.active_tiers : "-",
      icon: "mdi:stairs-up",
      tone: "var(--accent-indigo, #6366f1)",
    },
    {
      label: t("certificatesUpload.statRules", "Criteria set"),
      value: counts ? counts.ruled_courses + counts.ruled_assessments : "-",
      icon: "mdi:tune-variant",
      tone: "var(--ai-pink, #ec4899)",
    },
    {
      // StatStrip's value slot is a 1.35rem mono NUMBER - every other hub in the
      // app passes a bare count. A "126 (2 revoked)" string wraps to two lines
      // and breaks the strip's baseline, so the revoked count rides in the
      // caption, which is where a qualifier belongs.
      label:
        counts && counts.revoked > 0
          ? t("certificatesUpload.statIssuedRevoked", "Credentials issued · {{revoked}} revoked", {
              revoked: counts.revoked,
            })
          : t("certificatesUpload.statIssued", "Credentials issued"),
      value: counts ? counts.live : "-",
      icon: "mdi:account-star-outline",
      tone: "var(--success-500, #5fa564)",
    },
  ];

  const tabItems: SegmentedTab<TabKey>[] = TAB_ORDER.map((key) => ({
    value: key,
    label: t(`certificatesUpload.tab_${key}`, key),
    icon: TAB_ICONS[key],
    count: counts ? TAB_COUNT[key](counts) : undefined,
  }));

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Content"
        title="Certificates"
        description="Design the certificates your learners earn, set the points ladder that unlocks them, decide what each adaptive course and assessment awards, and see every credential that has been issued."
        accent={CERT_ACCENT}
        icon="mdi:certificate"
        action={
          <HeaderActionButton
            icon="mdi:plus"
            onClick={() => {
              goToTab("templates");
              setCreateOpen(true);
            }}
          >
            {t("certificatesUpload.newTemplate", "New template")}
          </HeaderActionButton>
        }
      />

      {/* The four numbers that say whether the module is doing anything.
          `StatStrip` is what every other admin hub uses for exactly this row.

          The counters are nested under `counts`, and the nesting is worth
          reading properly: `active_*` is what is actually in circulation (an
          archived design is not a design an admin has), `ruled_courses +
          ruled_assessments` is the question "criteria set" is really asking -
          how many objects award something, not how many rule ROWS exist - and
          `live` excludes revoked credentials, which is what "issued" means to
          anyone reading it. */}
      <Box sx={{ mt: 3 }}>
        {overviewQuery.isLoading ? <StatStripSkeleton /> : <StatStrip items={stats} />}
      </Box>

      {justSeeded ? (
        <NoticeStrip icon="mdi:auto-fix" sx={{ mt: 2.5 }}>
          {t(
            "certificatesUpload.seededNote",
            "We set up a starter library for you: {{templates}} design(s) and {{tiers}} ladder rung(s). Edit any of them, or start from a preset.",
            {
              templates: overview?.seeded.templates ?? 0,
              tiers: overview?.seeded.tiers ?? 0,
            },
          )}
        </NoticeStrip>
      ) : null}

      {/* The ladder and the most recent credentials are already in the
          overview payload and were being discarded. */}
      {overview && (overview.recent_issued.length > 0 || overview.ladder.length > 0) ? (
        <Surface sx={{ mt: 3 }}>
          {overview.recent_issued.length > 0 ? (
            <Box>
              <Eyebrow sx={{ mb: 1 }}>
                {t("certificatesUpload.recentIssued", "Most recently issued")}
              </Eyebrow>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {overview.recent_issued.map((cert) => (
                  <MetaPill
                    key={cert.id}
                    icon="mdi:certificate-outline"
                    color="var(--ai-violet)"
                    label={`${cert.recipient_name} · ${cert.source?.label || cert.title}`}
                  />
                ))}
              </Stack>
            </Box>
          ) : null}

          {overview.recent_issued.length > 0 && overview.ladder.length > 0 ? (
            <Box sx={{ height: "1px", bgcolor: "var(--border-default)", my: 2 }} />
          ) : null}

          {overview.ladder.length > 0 ? (
            <Box>
              <Eyebrow sx={{ mb: 1 }}>
                {t("certificatesUpload.ladderSummary", "The points ladder")}
              </Eyebrow>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {overview.ladder.map((tier) => (
                  <MetaPill
                    key={tier.id}
                    icon="mdi:stairs-up"
                    color={tier.is_active ? "var(--ai-violet)" : "var(--font-secondary)"}
                    label={`${tier.short_name || tier.name} · ${tier.points_threshold}`}
                  />
                ))}
              </Stack>
            </Box>
          ) : null}
        </Surface>
      ) : null}

      {/* One rounded track with a filled active segment. Every other admin hub
          in the app switches sections this way; MUI's underline Tabs are used
          by none of them. */}
      <Box sx={{ mt: 3, mb: 2 }}>
        <SegmentedTabs<TabKey> tabs={tabItems} value={tab} onChange={goToTab} />
      </Box>


      {/* Each tab is mounted only while it is open. The template gallery
          renders a live certificate per card, and keeping all four mounted
          meant the issued table paid for that artwork on every keystroke. */}
      <Stack spacing={0}>
        {tab === "templates" ? (
          <TemplatesTab
            clientId={clientId}
            issuer={issuer}
            onAssignTemplate={handleAssignTemplate}
          />
        ) : null}
        {tab === "ladder" ? <PointsLadderTab clientId={clientId} issuer={issuer} /> : null}
        {tab === "assignments" ? (
          <AssignmentsTab
            clientId={clientId}
            issuer={issuer}
            initialScope={initialScope}
            initialObjectId={initialObjectId}
          />
        ) : null}
        {tab === "issued" ? <IssuedTab clientId={clientId} /> : null}
      </Stack>

      <TemplateEditorDialog
        open={createOpen}
        clientId={clientId}
        issuer={issuer}
        template={null}
        onClose={() => setCreateOpen(false)}
      />
    </PageShell>
  );
}

/**
 * `useSearchParams` opts a route into client-side rendering, and Next fails the
 * BUILD, not the typecheck, if it is not inside a Suspense boundary.
 */
export default function AdminCertificatesPage() {
  return (
    <Suspense fallback={null}>
      <AdminCertificatesPageInner />
    </Suspense>
  );
}
