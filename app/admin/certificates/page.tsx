"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, Chip, CircularProgress, Skeleton, Stack, Tab, Tabs, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { config } from "@/lib/config";
import { adminCertificatesService } from "@/lib/services/certificates.service";
import { TemplatesTab } from "@/components/admin/certificates/TemplatesTab";
import { TemplateEditorDialog } from "@/components/admin/certificates/TemplateEditorDialog";
import { PointsLadderTab } from "@/components/admin/certificates/PointsLadderTab";
import { AssignmentsTab } from "@/components/admin/certificates/AssignmentsTab";
import { IssuedTab } from "@/components/admin/certificates/IssuedTab";
import {
  EmptyState,
  StatTile,
  certificateAdminKeys,
  useCertificateIssuer,
} from "@/components/admin/certificates/shared";
import type { CertificateRuleScope } from "@/lib/certificates/types";

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
  const theme = useTheme();
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

  if (loadingClient) {
    return (
      <PageShell>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            minHeight: "50vh",
          }}
        >
          <CircularProgress size={36} thickness={4} />
          <Typography variant="body2" color="text.secondary">
            {t("certificatesUpload.loadingWorkspace", "Preparing your workspace…")}
          </Typography>
        </Box>
      </PageShell>
    );
  }

  if (!allowed) {
    return (
      <PageShell>
        <Box sx={{ maxWidth: 620, mx: "auto", px: 2, pt: 5 }}>
          <EmptyState
            icon="mdi:lock-outline"
            title={t("certificatesUpload.noAccessTitle", "Certificates unavailable")}
            body={t(
              "certificatesUpload.noAccessModule",
              "The certificates module is not enabled for your role or organization. An owner can turn it on from workspace settings.",
            )}
          />
        </Box>
      </PageShell>
    );
  }

  const overview = overviewQuery.data;
  const counts = overview?.counts;
  // `seeded` is what THIS request created, and it is zero on every call after
  // the first. It is the only way to tell "never configured" from "configured
  // and then emptied", and it turns an empty-looking hub into an explanation.
  const justSeeded = (overview?.seeded.templates ?? 0) + (overview?.seeded.tiers ?? 0) > 0;

  return (
    <PageShell>
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, md: 3 }, pb: 6 }}>
        <ModulePageHeader
          eyebrow="CONTENT"
          title="Certificates"
          description="Design the certificates your learners earn, set the points ladder that unlocks them, decide what each adaptive course and assessment awards, and see every credential that has been issued."
          accent="amber"
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

        {/* The four numbers that say whether the module is doing anything. */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          {overviewQuery.isLoading ? (
            [0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={74} sx={{ borderRadius: 3 }} />
            ))
          ) : (
            <>
              {/* The counters are nested under `counts`, and the nesting is
                  worth reading properly: `active_*` is what is actually in
                  circulation (an archived design is not a design an admin has),
                  `ruled_courses + ruled_assessments` is the question "criteria
                  set" is really asking - how many objects award something, not
                  how many rule ROWS exist - and `live` excludes revoked
                  credentials, which is what "issued" means to anyone reading it. */}
              <StatTile
                icon="mdi:palette-outline"
                tone={theme.palette.warning.main}
                label={t("certificatesUpload.statTemplates", "Designs")}
                value={counts ? counts.active_templates : "-"}
              />
              <StatTile
                icon="mdi:stairs-up"
                tone={theme.palette.info.main}
                label={t("certificatesUpload.statTiers", "Ladder rungs")}
                value={counts ? counts.active_tiers : "-"}
              />
              <StatTile
                icon="mdi:tune-variant"
                tone={theme.palette.secondary?.main ?? theme.palette.primary.main}
                label={t("certificatesUpload.statRules", "Criteria set")}
                value={counts ? counts.ruled_courses + counts.ruled_assessments : "-"}
              />
              <StatTile
                icon="mdi:account-star-outline"
                tone={theme.palette.success.main}
                label={t("certificatesUpload.statIssued", "Credentials issued")}
                value={
                  counts
                    ? counts.revoked > 0
                      ? t("certificatesUpload.statIssuedWithRevoked", "{{live}} ({{revoked}} revoked)", {
                          live: counts.live,
                          revoked: counts.revoked,
                        })
                      : counts.live
                    : "-"
                }
              />
            </>
          )}
        </Box>

        {justSeeded ? (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            {t(
              "certificatesUpload.seededNote",
              "We set up a starter library for you: {{templates}} design(s) and {{tiers}} ladder rung(s). Edit any of them, or start from a preset.",
              {
                templates: overview?.seeded.templates ?? 0,
                tiers: overview?.seeded.tiers ?? 0,
              },
            )}
          </Alert>
        ) : null}

        {/* The ladder and the most recent credentials are already in the
            overview payload and were being discarded. */}
        {overview && overview.recent_issued.length > 0 ? (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="overline"
              sx={{ fontWeight: 800, color: "text.secondary", display: "block", mb: 1 }}
            >
              {t("certificatesUpload.recentIssued", "Most recently issued")}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {overview.recent_issued.map((cert) => (
                <Chip
                  key={cert.id}
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 1.5, fontWeight: 600 }}
                  icon={<IconWrapper icon="mdi:certificate-outline" size={15} />}
                  label={`${cert.recipient_name} · ${cert.source?.label || cert.title}`}
                />
              ))}
            </Stack>
          </Box>
        ) : null}

        {overview && overview.ladder.length > 0 ? (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="overline"
              sx={{ fontWeight: 800, color: "text.secondary", display: "block", mb: 1 }}
            >
              {t("certificatesUpload.ladderSummary", "The points ladder")}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {overview.ladder.map((tier) => (
                <Chip
                  key={tier.id}
                  size="small"
                  variant={tier.is_active ? "filled" : "outlined"}
                  sx={{ borderRadius: 1.5, fontWeight: 700 }}
                  label={`${tier.short_name || tier.name} · ${tier.points_threshold}`}
                />
              ))}
            </Stack>
          </Box>
        ) : null}

        <Box
          sx={{
            borderBottom: "1px solid",
            borderColor: alpha(theme.palette.divider, 0.8),
            mb: 3,
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, next) => goToTab(next as TabKey)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 800,
                fontSize: "0.95rem",
                minHeight: 52,
                gap: 0.75,
              },
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: 3,
                bgcolor: theme.palette.warning.main,
              },
            }}
          >
            {TAB_ORDER.map((key) => (
              <Tab
                key={key}
                value={key}
                iconPosition="start"
                icon={<IconWrapper icon={TAB_ICONS[key]} size={20} />}
                label={t(`certificatesUpload.tab_${key}`, key)}
              />
            ))}
          </Tabs>
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
      </Box>
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
