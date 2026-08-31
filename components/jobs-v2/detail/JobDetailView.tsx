"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { useProfileGate } from "@/lib/contexts/ProfileGateContext";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import {
  deadlineLabel,
  formatEmploymentType,
  formatExperience,
  formatLocation,
  formatSalary,
  formatWorkMode,
  jobTypeBadge,
  postedLabel,
} from "@/lib/jobs-v2/format";
import { learnerSkillTokens } from "@/lib/jobs-v2/relevance";
import { buildEligibility } from "@/lib/jobs-v2/eligibility";
import {
  J,
  R,
  TYPE,
  JCard,
  JButton,
  CompanyLogo,
  MetaRow,
  SectionHeader,
  StatusPill,
  EligibilityCard,
  EligibilityChecklist,
  usePaneScrollReset,
  type MetaItem,
} from "@/components/jobs-v2/ui";
import { ApplyCta } from "./ApplyCta";
import {
  AttachedJdCard,
  CompanyPanel,
  JobDetailsPanel,
  RequirementsList,
  SafetyNotice,
  hasRequirements,
} from "./JobDetailsPanel";
import { JobHeroBar } from "./JobHeroBar";
import { SimilarJobs } from "./SimilarJobs";
import { StructuredDescription } from "./StructuredDescription";
import type { ApplyState } from "./useApply";

/* ==========================================================================
 * The posting.
 *
 * It is the right-hand pane of `JobsSplitLayout` at `lg+` and a full-width page below it, and it
 * is ONE render tree at both — every layout difference is CSS. `useMediaQuery` returns `false` on
 * the server, which is what made the admin tables flash the desktop layout on a phone and what
 * let the shipped board's desktop branch drop `onFavoriteChange`; there is no second copy here
 * for a fix to miss.
 *
 *   below lg — the `ModulePageHeader` hero every sibling module wears, the breadcrumb, the
 *              `1fr / 340px` grid at `md+`, and the fixed bottom apply bar.
 *   lg+      — the sticky `JobHeroBar` carries identity and apply inside the pane's own
 *              scroller, and the 340px side rail folds into the flow: inside a 520-900px pane a
 *              340px rail would leave 200px of prose.
 * ======================================================================== */

export interface JobDetailViewProps {
  job: JobV2;
  apply: ApplyState;
  /** Where "View your application" points once the learner has applied. */
  appliedHref: string;
  /** Hidden in admin mode — behaviour unchanged. */
  showFavorite: boolean;
  favoriteBusy: boolean;
  onToggleFavorite: () => void;
  sx?: SxProps<Theme>;
}

export function JobDetailView({
  job,
  apply,
  appliedHref,
  showFavorite,
  favoriteBusy,
  onToggleFavorite,
  sx,
}: JobDetailViewProps) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * The learner's own skills, from the profile the gate provider ALREADY fetched for this page.
   * Empty whenever we do not know them, and then nothing is promoted and no chip claims a match —
   * a "0 matches" would read as a judgement of the learner rather than of our data.
   */
  const { skills: profileSkills } = useProfileGate();
  const learnerTokens = useMemo(() => learnerSkillTokens(profileSkills), [profileSkills]);

  /**
   * The verdict and its inputs. `summary.eligible` IS `eligible_to_apply` — the Apply button
   * keeps reading the boolean, and a gate the employer states but apply does not enforce can
   * never flip it. We hold none of the student's percentages client-side, so those rows read
   * "not on your profile" until §6.4's `eligibility` payload lands, which `buildEligibility`
   * then prefers automatically.
   */
  const eligibility = useMemo(() => buildEligibility(job), [job]);

  /**
   * "Back to jobs" returns you to page 4 of your filtered search rather than an unfiltered
   * page 1 — but only when there is somewhere to go back to. A deep link opened in a fresh tab
   * has no history entry, and `router.back()` would strand the learner on a blank tab.
   */
  const goBack = useCallback(() => {
    const idx =
      typeof window === "undefined" ? undefined : (window.history.state as { idx?: number } | null)?.idx;
    if (typeof idx === "number" && idx > 0) router.back();
    else router.push("/jobs-v2");
  }, [router]);

  /**
   * Prev/next through the result set the board handed us. The board writes `?ids=` when it
   * navigates; without it there is no set to walk and the controls do not render.
   */
  const siblings = useMemo(() => {
    const raw = searchParams?.get("ids");
    if (!raw) return null;
    const ids = raw
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    const index = ids.indexOf(job.id);
    if (index === -1) return null;
    // The WHOLE board query rides along, not just the sibling set: prev/next must land on the
    // same filtered search the rail is showing, or widening the window to `lg` would reveal an
    // unfiltered rail beside a posting the learner reached through a filter.
    const href = (id: number) => {
      const query = new URLSearchParams(searchParams?.toString() ?? "");
      query.set("ids", raw);
      return `/jobs-v2/${id}?${query.toString()}`;
    };
    return {
      index,
      total: ids.length,
      prev: index > 0 ? href(ids[index - 1]) : null,
      next: index < ids.length - 1 ? href(ids[index + 1]) : null,
    };
  }, [searchParams, job.id]);

  /**
   * The board's filter state, minus the sibling set, so a jump to a similar role still returns
   * to the search that found this one. `ids` is dropped deliberately: it describes THIS result
   * set, and carrying it onto a role that is not in it would make the prev/next counter lie.
   */
  const boardQuery = useMemo(() => {
    if (!searchParams) return "";
    const next = new URLSearchParams(searchParams.toString());
    next.delete("ids");
    return next.toString();
  }, [searchParams]);

  const internship = jobTypeBadge(job);
  const location = formatLocation(job.location);
  const experience = formatExperience(job.years_of_experience);
  const salary = formatSalary(job.salary);
  const posted = postedLabel(job.created_at);
  const deadline = deadlineLabel(job.application_deadline);
  const workMode = formatWorkMode(job.work_mode);

  const meta: MetaItem[] = [];
  if (location) meta.push({ key: "location", icon: "mdi:map-marker-outline", label: location, title: location });
  // An unstated work mode is NOT evidence of on-site. `formatWorkMode` returns null for anything
  // outside the three-value whitelist and the chip is omitted rather than inferred.
  if (workMode) meta.push({ key: "workMode", icon: "mdi:home-city-outline", label: workMode, title: workMode });
  // The same rule the board card follows: `employment_type` is the readable fact, and the raw
  // `job_type` ("job" on nearly every row) is never rendered. An internship says so as a pill
  // in the status row below instead.
  const employment = formatEmploymentType(job.employment_type);
  if (employment) meta.push({ key: "jobType", icon: "mdi:briefcase-outline", label: employment });
  if (experience) meta.push({ key: "experience", icon: "mdi:timer-sand", label: experience });
  if (salary) meta.push({ key: "salary", icon: "mdi:cash-multiple", label: salary });
  // `postedLabel` returns null for an undated row: the chip is OMITTED rather than fabricating
  // "Recently" about a date the API never sent.
  if (posted) meta.push({ key: "posted", icon: "mdi:calendar-outline", label: posted });
  if (deadline) meta.push({ key: "deadline", icon: "mdi:calendar-clock-outline", label: deadline.text });

  const deadlineTone =
    deadline?.urgency === "urgent" || deadline?.urgency === "past"
      ? { fg: J.dangerFg, bg: J.dangerBg, bd: J.dangerBd }
      : { fg: J.warnFg, bg: J.warnBg, bd: J.warnBd };

  /* ---- the pane's own behaviours -------------------------------------
     A new posting starts at its own beginning rather than at the previous one's scroll depth,
     and a screen reader is told which posting it is now reading. The RAIL's scroll position is
     deliberately untouched. Both are no-ops outside a `JobsSplitLayout`. */
  usePaneScrollReset(job.id);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    // Never on mount: stealing focus from wherever the reader already is, on first paint, is a
    // worse bug than the one this fixes. Below `lg` the bar is `display: none`, so this is a
    // no-op there and the browser's own page-navigation focus handling stands.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    titleRef.current?.focus();
  }, [job.id]);

  /* ==========================================================================
   * The apply block. One of the at-least-two placements every board uses.
   * ======================================================================== */
  const applyCard = (
    <JCard accent="azure" data-tour-id="jobs-apply-card">
      <Typography component="h2" sx={{ ...TYPE.h3, mb: 0.5 }}>
        {apply.mode === "applied"
          ? t("jobsV2.detail.applyCardApplied", { defaultValue: "You applied to this role" })
          : t("jobsV2.detail.applyCardTitle", { defaultValue: "Apply for this position" })}
      </Typography>
      <Typography sx={{ ...TYPE.small, mb: 1.75 }}>
        {apply.mode === "external"
          ? t("jobsV2.detail.applyCardExternal", {
              defaultValue: "This employer takes applications on their own site. We record it here for you.",
            })
          : apply.mode === "applied"
            ? t("jobsV2.detail.applyCardAppliedBody", { defaultValue: "Track its progress from your applications." })
            : t("jobsV2.detail.applyCardInternal", {
                defaultValue: "A short form: pick a resume, answer the employer's questions, review, send.",
              })}
      </Typography>

      {/* A deadline three days out no longer looks identical to one three months out. */}
      {deadline && deadline.urgency !== "none" && (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            mb: 1.5,
            px: 1,
            minHeight: 24,
            borderRadius: R.pill,
            border: `1px solid ${deadlineTone.bd}`,
            bgcolor: deadlineTone.bg,
            ...TYPE.label,
            // TYPE.label carries the muted ink; the urgency tint has to win.
            color: deadlineTone.fg,
            fontSize: "0.6875rem",
          }}
        >
          <IconWrapper icon="mdi:calendar-clock-outline" size={14} />
          {deadline.text}
        </Box>
      )}

      {/* The applied state is a StatusPill plus a secondary "View your application", not a green
          button wearing the disabled attribute. */}
      {apply.mode === "applied" && (
        <Box sx={{ mb: 1.5 }}>
          <StatusPill kind="application" value="applied" />
        </Box>
      )}

      <ApplyCta apply={apply} placement="panel" appliedHref={appliedHref} />

      {/*
        `applications_count` and `favorites_count` are on the payload and are NOT rendered here.
        They count applications recorded on OUR platform, not applications the employer received —
        for an external role the number is a count of students who clicked our button, which a
        reader inevitably reads as competition. Neither is ever shown to a student.
      */}
    </JCard>
  );

  /* ==========================================================================
   * The eligibility gate table, rendered below the requirement bullets.
   * ======================================================================== */
  const eligibilitySection =
    hasRequirements(job) || eligibility.checks.length > 0 ? (
      <Box component="section" aria-labelledby="jobs-eligibility" sx={{ mb: 3, minWidth: 0 }}>
        <SectionHeader
          icon="mdi:clipboard-check-outline"
          title={t("jobsV2.detail.eligibility", { defaultValue: "Eligibility" }) as string}
          description={
            t("jobsV2.detail.requirementsHint", {
              defaultValue: "What the employer checks before shortlisting",
            }) as string
          }
          id="jobs-eligibility"
        />
        <JCard>
          <RequirementsList job={job} />
          <EligibilityChecklist
            checks={eligibility.checks}
            sx={{ mt: hasRequirements(job) ? 2 : 0 }}
          />
        </JCard>
      </Box>
    ) : null;

  /* ==========================================================================
   * The sparse state: a posting with genuinely nothing on it.
   * ======================================================================== */
  const sparse = (
    <JCard dashed sx={{ textAlign: "center", py: 4, mb: 3 }}>
      <Typography sx={TYPE.h3}>
        {t("jobsV2.detail.sparseTitle", { defaultValue: "This posting has no description yet" })}
      </Typography>
      <Typography sx={{ ...TYPE.body, mt: 0.75, maxWidth: "46ch", mx: "auto" }}>
        {t("jobsV2.detail.sparseBody", {
          defaultValue:
            "The employer has not added the details for this role. Everything we do know is in the Role snapshot below.",
        })}
      </Typography>
    </JCard>
  );

  /* ==========================================================================
   * The posting body, identical in both variants.
   * ======================================================================== */
  const description = (
    <>
      {/* D5: the verdict sits ABOVE the JD. It is the first question every student asks, and
          none of the five boards answers it. Renders nothing when we cannot substantiate it. */}
      <EligibilityCard summary={eligibility} sx={{ mb: 3 }} data-tour-id="jobs-eligibility-card" />

      <StructuredDescription
        job={job}
        learnerTokens={learnerTokens}
        eligibility={eligibilitySection}
        sparse={sparse}
      />
    </>
  );

  const companySection = (
    <Box component="section" aria-labelledby="jobs-company" sx={{ mb: 3, minWidth: 0 }}>
      <SectionHeader
        icon="mdi:office-building-outline"
        title={
          t("jobsV2.detail.aboutCompany", {
            defaultValue: "About {{company}}",
            company: job.company_name,
          }) as string
        }
        id="jobs-company"
      />
      <CompanyPanel job={job} />
    </Box>
  );

  const hasCompanyPanel = Boolean(String(job.company_info ?? "").trim() || job.apply_link);

  const tail = (
    <>
      {hasCompanyPanel && companySection}
      {/* In Naukri's spirit, and doubling as an honest explanation of the hand-off. */}
      <SafetyNotice sx={{ mb: 3 }} />
      <SimilarJobs jobs={job.related_jobs} currentJobId={job.id} boardQuery={boardQuery} />
    </>
  );

  /* ==========================================================================
   * ONE tree. The layout differences are CSS, never `useMediaQuery`.
   *
   *   below lg — the platform hero, the breadcrumb, and the `1fr / 340px` grid at `md+` that
   *              killed the 900-1200px apply dead zone. Exactly what shipped.
   *   lg+      — the split's pane: the sticky `JobHeroBar` carries identity and apply, the 340px
   *              rail folds into the flow (inside a 520-900px pane it would leave 200px of
   *              prose), and the section order becomes the spec's pane order.
   *
   * The side group moves by `gridColumn` and `gridRow` alone, so there is ONE apply card, ONE
   * Role snapshot and ONE of every section at every breakpoint. The shipped board's desktop
   * branch dropped `onFavoriteChange` because it was a second copy; this cannot.
   * ======================================================================== */
  return (
    <Box sx={sx}>
      {/* ---- below lg: the hero every sibling module wears -------------- */}
      <Box sx={{ display: { xs: "block", lg: "none" } }}>
        <ModulePageHeader
          eyebrow={t("jobsV2.detail.eyebrow", { defaultValue: "Role" })}
          title={job.job_title}
          description={[job.company_name, location].filter(Boolean).join(" · ")}
          accent="azure"
          icon="mdi:briefcase-outline"
          action={
            <>
              {showFavorite && (
                <Tooltip
                  title={
                    job.is_favourited
                      ? t("jobsV2.detail.unsave", { defaultValue: "Remove from saved" })
                      : t("jobsV2.detail.save", { defaultValue: "Save this job" })
                  }
                  arrow
                >
                  <Box component="span" sx={{ display: "inline-flex" }}>
                    <HeaderActionButton
                      variant="ghost"
                      icon={job.is_favourited ? "mdi:heart" : "mdi:heart-outline"}
                      onClick={onToggleFavorite}
                      disabled={favoriteBusy}
                    >
                      {job.is_favourited
                        ? t("jobsV2.detail.saved", { defaultValue: "Saved" })
                        : t("jobsV2.detail.save", { defaultValue: "Save" })}
                    </HeaderActionButton>
                  </Box>
                </Tooltip>
              )}
              <ApplyCta apply={apply} placement="header" appliedHref={appliedHref} />
            </>
          }
        >
          {/* The identity row, on the hero rather than in a second header below it. */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 2 }}>
            <CompanyLogo src={job.company_logo} name={job.company_name} size={56} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ ...TYPE.h4, color: J.onDark }}>{job.company_name}</Typography>
              <MetaRow items={meta} onDark dense sx={{ mt: 0.75 }} />
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
              {/* A closed role is marked in place, whether the employer closed it or its
                  deadline simply passed. It is never left looking live behind an emailed link. */}
              {job.is_open === false ? (
                <StatusPill kind="job" value="closed" size="sm" />
              ) : (
                job.status && <StatusPill kind="job" value={job.status} size="sm" />
              )}
              {internship && (
                <StatusPill kind="job" value="__internship__" size="sm" label={internship} />
              )}
              {job.eligible_to_apply === false && (
                <StatusPill
                  kind="application"
                  value="__ineligible__"
                  size="sm"
                  label={t("jobsV2.notEligible")}
                />
              )}
            </Stack>
          </Stack>
        </ModulePageHeader>

        {/* ---- breadcrumb strip ---------------------------------------- */}
        <Box
          component="nav"
          aria-label={t("jobsV2.detail.breadcrumb", { defaultValue: "Breadcrumb" })}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
            mb: 2,
            minWidth: 0,
          }}
        >
          <JButton variant="quiet" size="sm" startIcon="mdi:arrow-left" onClick={goBack}>
            {t("jobsV2.backToJobs")}
          </JButton>
          <Box aria-hidden sx={{ color: J.ink4 }}>
            /
          </Box>
          <Typography
            sx={{
              ...TYPE.small,
              color: J.ink2,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={job.job_title}
          >
            {job.job_title}
          </Typography>

          {siblings && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, marginInlineStart: "auto" }}>
              <Typography sx={{ ...TYPE.micro, fontFeatureSettings: '"tnum" 1' }}>
                {t("jobsV2.detail.resultPosition", {
                  defaultValue: "{{index}} of {{total}}",
                  index: siblings.index + 1,
                  total: siblings.total,
                })}
              </Typography>
              <JButton
                variant="ghost"
                size="sm"
                href={siblings.prev ?? undefined}
                disabled={!siblings.prev}
                aria-label={t("jobsV2.detail.previousJob", { defaultValue: "Previous job" })}
                startIcon="mdi:chevron-left"
              >
                {t("jobsV2.detail.previous", { defaultValue: "Previous" })}
              </JButton>
              <JButton
                variant="ghost"
                size="sm"
                href={siblings.next ?? undefined}
                disabled={!siblings.next}
                aria-label={t("jobsV2.detail.nextJob", { defaultValue: "Next job" })}
                endIcon="mdi:chevron-right"
              >
                {t("jobsV2.detail.next", { defaultValue: "Next" })}
              </JButton>
            </Box>
          )}
        </Box>
      </Box>

      {/* ---- lg+: the sticky bar, inside the pane's own scroller -------- */}
      <JobHeroBar
        job={job}
        apply={apply}
        appliedHref={appliedHref}
        showFavorite={showFavorite}
        favoriteBusy={favoriteBusy}
        onToggleFavorite={onToggleFavorite}
        titleRef={titleRef}
        data-tour-id="jobs-hero-bar"
        // `block`, not `flex`: the bar is a column of one row plus an optional notice row.
        sx={{ display: { xs: "none", lg: "block" } }}
      />

      <Box
        sx={{
          // The pane paints to its own edges, so at lg+ the content owns its padding. Below lg
          // `MainLayout` already supplies the page padding and adding more would double it.
          px: { xs: 0, lg: 2.5 },
          pt: { xs: 0, lg: 2.5 },
          // Clearance for the fixed mobile apply bar. MainLayout already reserves the 72px the
          // bottom navigation occupies, so this only has to clear the bar itself. At `lg` the
          // pane is its own scroller, so the last section needs room rather than the pane's edge.
          pb: { xs: 10, md: 0, lg: 3 },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 340px", lg: "minmax(0, 1fr)" },
            columnGap: 3,
            alignItems: "start",
          }}
        >
          <Box sx={{ minWidth: 0, gridColumn: { md: "1", lg: "1" } }}>{description}</Box>

          {/* The side group. At `md` it is the sticky 340px rail spanning both content rows; at
              `lg` the same nodes fall into the flow between the JD and the company panel, which
              is the pane's section order. Nothing is rendered twice to achieve it. */}
          <Box
            sx={{
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mb: 3,
              gridColumn: { md: "2", lg: "1" },
              gridRow: { md: "1 / span 2", lg: "auto" },
              position: { md: "sticky", lg: "static" },
              top: { md: 88 },
            }}
          >
            {applyCard}
            <JobDetailsPanel job={job} includeJd={false} />
            {job.jd_file_url && <AttachedJdCard url={job.jd_file_url} />}
          </Box>

          <Box sx={{ minWidth: 0, gridColumn: { md: "1", lg: "1" } }}>{tail}</Box>
        </Box>
      </Box>

      {/* ---- the mobile apply bar --------------------------------------
          `position: fixed`, not `sticky`: MainLayout gives every ancestor `overflow: auto`,
          which makes them the sticky containing block, so a sticky bar very likely never pins
          at all. Fixed plus the safe-area inset is deterministic. From `md` up the sticky side
          rail carries the apply card, and from `lg` up the hero bar does. */}
      <Box
        sx={{
          display: { xs: "block", md: "none" },
          position: "fixed",
          insetInline: 0,
          // ABOVE the app's mobile bottom navigation (fixed, 72px, zIndex 1000). Sitting at
          // `bottom: 0` would put the apply button underneath it.
          bottom: "calc(72px + env(safe-area-inset-bottom))",
          zIndex: 5,
          px: 2,
          py: 1.5,
          bgcolor: J.surface,
          borderTop: `1px solid ${J.hairline}`,
          boxShadow: "var(--j-shadow-sticky)",
        }}
      >
        <ApplyCta apply={apply} placement="bar" appliedHref={appliedHref} />
      </Box>
    </Box>
  );
}
