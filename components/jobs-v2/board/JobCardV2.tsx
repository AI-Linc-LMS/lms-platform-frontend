"use client";

import React, { memo, useCallback, useEffect, useState } from "react";
import NextLink from "next/link";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { useAdminMode } from "@/lib/contexts/AdminModeContext";
import { jobsV2Service, formatJobPassoutYear, type JobV2 } from "@/lib/services/jobs-v2.service";
import {
  descriptionPreview,
  formatEmploymentType,
  formatExperience,
  formatLocation,
  formatSalary,
  formatWorkMode,
  jobTypeBadge,
  postedLabel,
} from "@/lib/jobs-v2/format";
import { visibilityReasonLabel } from "@/lib/jobs-v2/eligibility";
import { jobSkillEntries, matchedSkills } from "@/lib/jobs-v2/relevance";
import {
  CompanyLogo,
  DeadlineChip,
  JCard,
  MetaChip,
  MetaRow,
  SignalChip,
  SkillChip,
  StatusPill,
  J,
  TYPE,
  focusRing,
  lineClamp,
  type MetaItem,
} from "@/components/jobs-v2/ui";

/* ==========================================================================
 * Shared board atoms.
 *
 * The card and the row are ONE tree's two presentations of the same job, so everything they
 * agree on lives here and is imported by `JobRowV2`. The deleted desktop/mobile fork is what
 * happens when that discipline is skipped: the desktop copy dropped `onFavoriteChange`, the two
 * empty states drifted apart, and four of the six tour ids only existed on one branch.
 * ======================================================================== */

/**
 * `SignalChip` and `DeadlineChip` now live in the kit (`ui/Chips.tsx`), because the rail card,
 * the detail pane, the hero bar and the similar-jobs list all render them and a board component
 * is the wrong place to import a chip from. They are re-exported here so no existing import
 * breaks.
 */
export { SignalChip, DeadlineChip } from "@/components/jobs-v2/ui";

/**
 * "Why this fits", stated honestly.
 *
 * The chip names the SKILLS on this job that are already on the learner's profile — not a
 * percentage. A match score computed from two unweighted string lists is a number the learner
 * cannot check and cannot act on; a named skill is both. When we do not know the learner's
 * skills (signed out, an empty profile, a failed profile fetch) the chip does not render at
 * all, because "0 matches" would read as a judgement of the learner rather than of our data.
 */
export function SkillMatchChip({ matched }: { matched: string[] }) {
  const { t } = useTranslation("common");
  if (matched.length === 0) return null;
  const shown = matched.slice(0, 3).join(", ");
  const extra = matched.length - Math.min(matched.length, 3);
  const full = t("jobsV2.board.matchFull", {
    count: matched.length,
    skills: matched.join(", "),
    defaultValue: "Skills you already have: {{skills}}",
  }) as string;
  return (
    <SignalChip
      icon="mdi:check-decagram-outline"
      fg={J.successFg}
      bg={J.successBg}
      bd={J.successBd}
      title={full}
    >
      {extra > 0
        ? (t("jobsV2.board.matchChipMore", {
            skills: shown,
            count: extra,
            defaultValue: "You have {{skills}} +{{count}}",
          }) as string)
        : (t("jobsV2.board.matchChip", {
            skills: shown,
            defaultValue: "You have {{skills}}",
          }) as string)}
    </SignalChip>
  );
}

/**
 * The signal row — **the complete, closed list** (spec 2.3), in this fixed order:
 * applied, internship, skills you have, eligibility, closing, closed, why you are seeing it.
 *
 * Nothing else may be added to it without a data source named in the backend contract. In
 * particular: no applicant count, no view count, no "trending", no "be an early applicant", no
 * "actively hiring", no company rating and **no match percentage**. We do not hold those facts,
 * and a fabricated signal is discovered the moment a student compares us with Naukri — and it is
 * discovered *about us*.
 *
 * **Every chip carries its own justification** in one sentence (Wellfound's discipline): a claim
 * and its basis, in the same tooltip.
 */
export function JobSignals({
  job,
  learnerTokens,
  sx,
}: {
  job: JobV2;
  /** The learner's own skills, folded. Empty = we do not know, so no match chip is rendered. */
  learnerTokens?: ReadonlySet<string>;
  sx?: SxProps<Theme>;
}) {
  const { t } = useTranslation("common");
  // `eligible_to_apply` is optional on the list payload. A row that did not answer is UNKNOWN,
  // and neither chip renders — we never read silence as a verdict in either direction.
  const eligibility = typeof job.eligible_to_apply === "boolean" ? job.eligible_to_apply : null;
  const employment = formatEmploymentType(job.employment_type);
  const badge = jobTypeBadge(job);
  // Not twice. When `employment_type` already reads "Internship" the chip adds nothing.
  const internship =
    badge && employment?.toLowerCase() !== badge.toLowerCase() ? badge : null;
  const matched = learnerTokens ? matchedSkills(job, learnerTokens) : [];
  const closed = job.is_open === false;
  const why = visibilityReasonLabel(job.visibility_reason);

  const hasSignal =
    Boolean(job.has_applied) ||
    eligibility !== null ||
    Boolean(job.application_deadline) ||
    Boolean(internship) ||
    closed ||
    Boolean(why) ||
    matched.length > 0;
  if (!hasSignal) return null;

  return (
    <Box
      sx={[
        { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, minWidth: 0 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {job.has_applied && <StatusPill kind="application" value="applied" />}
      {/* `job_type` earns a chip only here, where it says something a learner acts on. The raw
          value ("job" on all but a handful of rows) is never rendered. */}
      {internship && (
        <SignalChip
          icon="mdi:school-outline"
          fg={J.azureDeep}
          bg={J.azureSoft}
          bd={J.azureBorder}
          title={
            t("jobsV2.board.internshipWhy", {
              defaultValue: "The employer posted this as an internship, not a full role.",
            }) as string
          }
        >
          {internship}
        </SignalChip>
      )}
      <SkillMatchChip matched={matched} />
      {eligibility === true && (
        <SignalChip
          icon="mdi:check-circle-outline"
          fg={J.successFg}
          bg={J.successBg}
          bd={J.successBd}
          title={
            t("jobsV2.board.eligibleWhy", {
              defaultValue: "Your course and college meet what this role is open to.",
            }) as string
          }
        >
          {t("jobsV2.eligible", { defaultValue: "Eligible" })}
        </SignalChip>
      )}
      {eligibility === false && (
        <SignalChip
          icon="mdi:account-alert-outline"
          fg={J.warnFg}
          bg={J.warnBg}
          bd={J.warnBd}
          dashed
          title={
            t("jobsV2.board.notEligibleWhy", {
              defaultValue:
                "This role is open to specific courses or colleges, and yours is not one of them.",
            }) as string
          }
        >
          {t("jobsV2.notEligible", { defaultValue: "Not eligible to apply" })}
        </SignalChip>
      )}
      {/* The employer's own stated deadline. This is our honest urgency; we never ship the
          other kind. */}
      <DeadlineChip value={job.application_deadline} />
      {/* A closed role is marked closed IN PLACE — never silently dropped, and never left with
          a live apply button behind an emailed link. */}
      {closed && (
        <SignalChip
          icon="mdi:lock-outline"
          fg={J.dangerFg}
          bg={J.dangerBg}
          bd={J.dangerBd}
          dashed
          title={
            t("jobsV2.board.closedWhy", {
              defaultValue: "The employer closed this role, or its deadline has passed.",
            }) as string
          }
        >
          {t("jobsV2.board.closed", { defaultValue: "Closed" })}
        </SignalChip>
      )}
      {/* "Why you see this" — every string is backed by the actual visibility rule, and the
          function returns null for anything we cannot state. */}
      {why && (
        <SignalChip
          icon="mdi:information-outline"
          fg={J.ink3}
          bg={J.surface2}
          bd={J.hairline}
          title={why}
        >
          {why}
        </SignalChip>
      )}
    </Box>
  );
}

/**
 * The canonical meta sequence — location, job type, experience, salary, posted — plus the
 * passout year the board has always shown. `MetaRow` re-orders the canonical five itself.
 *
 * `postedLabel` returns `null` for an undated row and the chip is omitted, rather than
 * fabricating "Recently" about a date the API never sent.
 */
export function jobMetaItems(job: JobV2): MetaItem[] {
  const items: MetaItem[] = [];
  // `formatLocation`, not a truthiness check: a whitespace-only value from a feed is absent,
  // and it would otherwise render as an icon beside an empty label — the empty slot this
  // module omits everywhere else.
  const location = formatLocation(job.location);
  if (location) {
    items.push({ key: "location", icon: "mdi:map-marker-outline", label: location, title: location });
  }
  // NOT `job_type`. That is the feed's own bucket and reads "job" on nearly every row, which
  // is a chip that costs a line of the card to tell a learner they are on the job board.
  // `employment_type` is the fact they act on, and it is omitted entirely when absent —
  // no empty slot, no dash. An internship shows as a badge in the signal row instead.
  // Work mode QUALIFIES the location — "Bengaluru · Hybrid" is one thought — so `MetaRow`'s
  // fixed order puts it directly after it. `formatWorkMode` returns null for anything outside
  // the three stated values: an unstated location is NOT evidence of on-site.
  const mode = formatWorkMode(job.work_mode);
  if (mode) {
    items.push({ key: "workMode", icon: "mdi:home-city-outline", label: mode, title: mode });
  }
  const employment = formatEmploymentType(job.employment_type);
  if (employment) {
    items.push({ key: "jobType", icon: "mdi:briefcase-outline", label: employment, title: employment });
  }
  const experience = formatExperience(job.years_of_experience);
  if (experience) {
    items.push({ key: "experience", icon: "mdi:chart-timeline-variant", label: experience, title: experience });
  }
  const salary = formatSalary(job.salary);
  if (salary) {
    items.push({ key: "salary", icon: "mdi:cash-multiple", label: salary, title: salary });
  }
  const posted = postedLabel(job.created_at);
  if (posted) {
    items.push({ key: "posted", icon: "mdi:clock-outline", label: posted, title: posted });
  }
  const passout = formatJobPassoutYear(job.applicable_passout_year);
  if (passout) {
    items.push({ key: "passout", icon: "mdi:school-outline", label: passout, title: passout });
  }
  return items;
}

/**
 * The rail's three facts, in the fixed order **location · work mode · experience**.
 *
 * It is not `jobMetaItems(job)` clamped to three: clamping would surrender the third slot to
 * employment type, and the experience range is the one fact that decides whether a fresher
 * clicks. Salary is deliberately absent — see `JobRailCard`.
 *
 * Each is omitted when absent. No dash, no "Not specified", no empty slot; if all three are
 * missing the row does not render at all.
 */
export function railMetaItems(job: JobV2): MetaItem[] {
  const items: MetaItem[] = [];
  // `formatLocation`, not a truthiness check: a whitespace-only value from a feed is absent,
  // and it would otherwise render as an icon beside an empty label — the empty slot this
  // module omits everywhere else.
  const location = formatLocation(job.location);
  if (location) {
    items.push({ key: "location", icon: "mdi:map-marker-outline", label: location, title: location });
  }
  const mode = formatWorkMode(job.work_mode);
  if (mode) {
    items.push({ key: "workMode", icon: "mdi:home-city-outline", label: mode, title: mode });
  }
  const experience = formatExperience(job.years_of_experience);
  if (experience) {
    items.push({ key: "experience", icon: "mdi:chart-timeline-variant", label: experience, title: experience });
  }
  return items;
}

/**
 * The skills a card shows, with the ones the learner already has hoisted to the front AND
 * marked. Hoisting alone was already shipped; the visual promotion is what makes a clamped row
 * of five readable at a glance — a matched chip renders `selected`, an unmatched one plain.
 *
 * `extra` is what the clamp hid, rendered as a plain `+N` so the row never implies the job has
 * exactly five skills.
 */
export function promotedSkills(
  job: JobV2,
  max: number,
  learnerTokens?: ReadonlySet<string>,
): { shown: Array<{ label: string; matched: boolean }>; extra: number } {
  const entries = jobSkillEntries(job);
  const tokens = learnerTokens ?? new Set<string>();
  const matched = entries.filter((entry) => tokens.has(entry.token));
  const rest = entries.filter((entry) => !tokens.has(entry.token));
  const ordered = [...matched, ...rest];
  return {
    shown: ordered
      .slice(0, max)
      .map((entry) => ({ label: entry.label, matched: tokens.has(entry.token) })),
    extra: Math.max(0, ordered.length - max),
  };
}

/* ==========================================================================
 * FavoriteButton — ONE favourite path, because there is one tree.
 * ======================================================================== */

export function FavoriteButton({
  job,
  onFavoriteChange,
  size = 18,
}: {
  job: JobV2;
  onFavoriteChange?: (jobId: number, favorited: boolean) => void;
  size?: number;
}) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const { isAdminMode } = useAdminMode();
  const [isFavorite, setIsFavorite] = useState(job.is_favourited ?? false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setIsFavorite(job.is_favourited ?? false);
  }, [job.is_favourited]);

  const handleFavorite = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      // The card is a stretched link; the heart must not navigate.
      event.preventDefault();
      event.stopPropagation();
      if (busy) return;
      setBusy(true);
      const nextState = !isFavorite;
      setIsFavorite(nextState);
      try {
        const res = await jobsV2Service.toggleFavorite(job.id);
        setIsFavorite(res.favorited);
        onFavoriteChange?.(job.id, res.favorited);
        if (res.message) showToast(res.message, "info");
      } catch (err) {
        // Optimistic toggle with rollback, preserved verbatim.
        setIsFavorite(!nextState);
        showToast(
          (err as Error)?.message ??
            (t("jobsV2.board.favoriteFailed", {
              defaultValue: "Failed to update favourite",
            }) as string),
          "error",
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, isFavorite, job.id, onFavoriteChange, showToast, t],
  );

  // Admin mode hides the favourite control — behaviour unchanged.
  if (isAdminMode) return null;

  const label = isFavorite
    ? (t("jobsV2.board.removeFavorite", { defaultValue: "Remove from saved" }) as string)
    : (t("jobsV2.board.addFavorite", { defaultValue: "Save this job" }) as string);

  return (
    <Tooltip title={label} arrow>
      <IconButton
        onClick={handleFavorite}
        aria-label={label}
        aria-pressed={isFavorite}
        disabled={busy}
        sx={{
          position: "relative",
          zIndex: 1,
          flexShrink: 0,
          width: 44,
          height: 44,
          color: isFavorite ? J.azure : J.ink3,
          "&:hover": { bgcolor: J.surface2, color: J.azure },
          "&.Mui-disabled": { color: J.ink4 },
          ...focusRing,
        }}
      >
        <IconWrapper icon={isFavorite ? "mdi:heart" : "mdi:heart-outline"} size={size} />
      </IconButton>
    </Tooltip>
  );
}

/**
 * The whole card is clickable, but the tab stop is the title link and the heart is a real
 * sibling button — a `<button>` inside an `<a>` is invalid HTML and is why the shipped card
 * needed a separate "View Details" button to be reachable at all.
 */
export const stretchedLink = {
  textDecoration: "none",
  color: "inherit",
  "&::after": { content: '""', position: "absolute", inset: 0, borderRadius: "inherit" },
  ...focusRing,
} as const;

/* ==========================================================================
 * JobCardV2
 * ======================================================================== */

export interface JobCardV2Props {
  job: JobV2;
  /**
   * The posting's href, already carrying the board query. Defaults to the bare route so a
   * caller that has no board state (an admin preview, a test) still links correctly — but the
   * board always passes the query, because the filter state riding on the detail URL is what
   * makes the rail come back correct and "Back to jobs" land on page 4 of the filtered search.
   */
  href?: string;
  onFavoriteChange?: (jobId: number, favorited: boolean) => void;
  /**
   * The learner's own skills, folded. Passed down rather than read from context so the card
   * stays a pure render of what it is given, and so the memo comparator below can see it.
   */
  learnerTokens?: ReadonlySet<string>;
  "data-tour-id"?: string;
}

const JobCardV2Component = ({ job, href, onFavoriteChange, learnerTokens, ...rest }: JobCardV2Props) => {
  const { t } = useTranslation("common");
  const title = job.job_title || (t("jobsV2.board.untitledRole", { defaultValue: "Untitled role" }) as string);
  // The skills the learner already has come first AND render as `selected`, so a chip row
  // clamped at five shows the reason this card is worth reading rather than the first five tags
  // the feed happened to send.
  const { shown: skills, extra: skillsExtra } = promotedSkills(job, 5, learnerTokens);
  /**
   * `role_summary` is the posting's own opening, kept apart from the blob instead of being
   * glued into it. `descriptionPreview` **stays** as the fallback for legacy rows: it is a
   * safety net over data we cannot re-ingest, and deleting it would regress every unenriched
   * row back to the employer's marketing paragraph.
   */
  const summary =
    job.role_summary?.trim() || descriptionPreview(job.job_description, job.company_name);

  return (
    <JCard
      {...rest}
      interactive
      sx={{
        position: "relative",
        // No `marginBottom` here: the LIST owns spacing, so cards no longer sit 48px apart
        // while rows in the same view sit 12px apart.
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        height: "100%",
      }}
    >
      <Box sx={{ display: "flex", gap: { xs: 1.5, md: 2 }, minWidth: 0 }}>
        <CompanyLogo src={job.company_logo} name={job.company_name} size={48} />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component={NextLink}
            href={href ?? `/jobs-v2/${job.id}`}
            title={title}
            sx={{ ...TYPE.h3, ...lineClamp(2), ...stretchedLink }}
          >
            {title}
          </Typography>
          <Typography
            title={job.company_name}
            sx={{
              ...TYPE.small,
              mt: 0.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {job.company_name}
          </Typography>
        </Box>

        <FavoriteButton job={job} onFavoriteChange={onFavoriteChange} />
      </Box>

      <JobSignals job={job} learnerTokens={learnerTokens} />

      {/* Five, not four: `workMode` joined the canonical order, and at four it would have
          pushed salary into the overflow popover on exactly the rows that state both. */}
      <MetaRow items={jobMetaItems(job)} max={5} />

      {summary && (
        <Typography sx={{ ...TYPE.body, ...lineClamp(2) }} title={summary}>
          {summary}
        </Typography>
      )}

      {skills.length > 0 && (
        <Box
          sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, mt: "auto", pt: 0.25 }}
        >
          {skills.map((skill) => (
            <SkillChip key={skill.label} selected={skill.matched}>
              {skill.label}
            </SkillChip>
          ))}
          {skillsExtra > 0 && (
            <MetaChip
              title={
                t("jobsV2.board.moreSkills", {
                  count: skillsExtra,
                  defaultValue: "{{count}} more skills on this role",
                }) as string
              }
            >
              +{skillsExtra}
            </MetaChip>
          )}
        </Box>
      )}
    </JCard>
  );
};

/**
 * The comparator widens to the fields the card now renders. It used to compare only `id`,
 * `is_favourited` and `applicable_passout_year`, so a job that had just been applied to kept
 * rendering as if it had not.
 */
export const JobCardV2 = memo(JobCardV2Component, (prev, next) => {
  const a = prev.job;
  const b = next.job;
  return (
    a.id === b.id &&
    a.is_favourited === b.is_favourited &&
    a.has_applied === b.has_applied &&
    a.eligible_to_apply === b.eligible_to_apply &&
    a.application_deadline === b.application_deadline &&
    a.applicable_passout_year === b.applicable_passout_year &&
    a.is_open === b.is_open &&
    a.visibility_reason === b.visibility_reason &&
    // The card now renders these three, so a row that gained them must re-render.
    a.role_summary === b.role_summary &&
    a.work_mode === b.work_mode &&
    (a.tech_stack?.length ?? 0) === (b.tech_stack?.length ?? 0) &&
    prev.href === next.href &&
    prev.learnerTokens === next.learnerTokens &&
    prev.onFavoriteChange === next.onFavoriteChange
  );
});
JobCardV2.displayName = "JobCardV2";
