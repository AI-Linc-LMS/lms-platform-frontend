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
  deadlineLabel,
  formatExperience,
  formatSalary,
  postedLabel,
  type DeadlineUrgency,
} from "@/lib/jobs-v2/format";
import {
  CompanyLogo,
  JCard,
  MetaRow,
  SkillChip,
  StatusPill,
  J,
  R,
  TYPE,
  focusRing,
  lineClamp,
  rtlLabel,
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
 * A signal chip: eligibility and the deadline. Neither is a *status* in the kit's sense (there
 * is no `Tone` for "not eligible"), so `StatusPill` cannot render them — but every colour here
 * still comes from a `--j-*` token, so dark works and the accent budget holds.
 */
export function SignalChip({
  icon,
  children,
  fg,
  bg,
  bd,
  dashed,
  title,
  sx,
}: {
  icon: string;
  children: React.ReactNode;
  fg: string;
  bg: string;
  bd: string;
  dashed?: boolean;
  title?: string;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      component="span"
      title={title}
      sx={[
        {
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          minHeight: 24,
          px: 1,
          maxWidth: "100%",
          borderRadius: R.pill,
          border: `1px solid ${bd}`,
          borderStyle: dashed ? "dashed" : "solid",
          bgcolor: bg,
          ...TYPE.label,
          // TYPE.label carries the muted ink; the signal's own foreground has to win.
          color: fg,
          fontSize: "0.6875rem",
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
          ...rtlLabel,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <IconWrapper icon={icon} size={14} />
      <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
        {children}
      </Box>
    </Box>
  );
}

const URGENCY_TONE: Record<DeadlineUrgency, { fg: string; bg: string; bd: string }> = {
  urgent: { fg: J.dangerFg, bg: J.dangerBg, bd: J.dangerBd },
  soon: { fg: J.warnFg, bg: J.warnBg, bd: J.warnBd },
  past: { fg: J.ink3, bg: J.surface2, bd: J.hairline },
  none: { fg: J.ink3, bg: J.surface2, bd: J.hairline },
};

/** The closing date, tinted by urgency. Three days out no longer looks like three months out. */
export function DeadlineChip({ value }: { value?: string }) {
  const label = deadlineLabel(value);
  if (!label) return null;
  const tone = URGENCY_TONE[label.urgency];
  return (
    <SignalChip
      icon={label.urgency === "past" ? "mdi:calendar-remove-outline" : "mdi:calendar-clock"}
      fg={tone.fg}
      bg={tone.bg}
      bd={tone.bd}
      title={label.text}
    >
      {label.text}
    </SignalChip>
  );
}

/**
 * The signal row: has the learner applied, may they apply, and when does it close. A live
 * opening and one they already applied to used to be indistinguishable without two navigations
 * and a full-page interstitial.
 */
export function JobSignals({ job, sx }: { job: JobV2; sx?: SxProps<Theme> }) {
  const { t } = useTranslation("common");
  const notEligible = job.eligible_to_apply === false;
  const hasSignal = Boolean(job.has_applied) || notEligible || Boolean(job.application_deadline);
  if (!hasSignal) return null;

  return (
    <Box
      sx={[
        { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, minWidth: 0 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {job.has_applied && <StatusPill kind="application" value="applied" />}
      {notEligible && (
        <SignalChip
          icon="mdi:account-alert-outline"
          fg={J.warnFg}
          bg={J.warnBg}
          bd={J.warnBd}
          dashed
        >
          {t("jobsV2.notEligible", { defaultValue: "Not eligible to apply" })}
        </SignalChip>
      )}
      <DeadlineChip value={job.application_deadline} />
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
  if (job.location) {
    items.push({ key: "location", icon: "mdi:map-marker-outline", label: job.location, title: job.location });
  }
  if (job.job_type) {
    items.push({ key: "jobType", icon: "mdi:briefcase-outline", label: job.job_type, title: job.job_type });
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

/** Up to five skills, de-duplicated case-folded so the same skill never renders twice. */
export function jobSkillLabels(job: JobV2, max = 5): string[] {
  const raw = [...(job.mandatory_skills ?? []), ...(job.key_skills ?? []), ...(job.tags ?? [])];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of raw) {
    const label = String(value ?? "").trim();
    const token = label.toLowerCase();
    if (!label || seen.has(token)) continue;
    seen.add(token);
    out.push(label);
    if (out.length >= max) break;
  }
  return out;
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
  onFavoriteChange?: (jobId: number, favorited: boolean) => void;
  "data-tour-id"?: string;
}

const JobCardV2Component = ({ job, onFavoriteChange, ...rest }: JobCardV2Props) => {
  const { t } = useTranslation("common");
  const title = job.job_title || (t("jobsV2.board.untitledRole", { defaultValue: "Untitled role" }) as string);
  const skills = jobSkillLabels(job);

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
            href={`/jobs-v2/${job.id}`}
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

      <JobSignals job={job} />

      <MetaRow items={jobMetaItems(job)} max={4} />

      {job.job_description && (
        <Typography sx={{ ...TYPE.body, ...lineClamp(2) }} title={job.job_description}>
          {job.job_description}
        </Typography>
      )}

      {skills.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: "auto", pt: 0.25 }}>
          {skills.map((skill) => (
            <SkillChip key={skill}>{skill}</SkillChip>
          ))}
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
    prev.onFavoriteChange === next.onFavoriteChange
  );
});
JobCardV2.displayName = "JobCardV2";
