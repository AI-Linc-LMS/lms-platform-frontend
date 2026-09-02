"use client";

import { useMemo } from "react";
import NextLink from "next/link";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { visibilityReasonLabel } from "@/lib/jobs-v2/eligibility";
import {
  formatEmploymentType,
  formatExperience,
  formatLocation,
  formatWorkMode,
} from "@/lib/jobs-v2/format";
import {
  J,
  R,
  TYPE,
  MOTION,
  JPanel,
  SectionHeader,
  CompanyLogo,
  MetaRow,
  DeadlineChip,
  focusRing,
  lineClamp,
  type MetaItem,
} from "@/components/jobs-v2/ui";

/* ==========================================================================
 * SimilarJobs — "Other roles you can apply to".
 *
 * **Not** "Jobs you might be interested in". Our set is already visibility-filtered to this
 * student, so the stronger claim is the true one, and `related_jobs` is drawn from the same
 * `visible_job_ids(client, profile)` set — it can never surface a role the student cannot open.
 *
 * Every row carries the reason it is visible ("Open to your cohort"), backed by the actual rule
 * in `jobs_v2/visibility.py`. `visibilityReasonLabel` returns `null` for `"open"` and for any
 * value we have no sentence for, so the line is omitted rather than invented.
 *
 * **Renders nothing when the list is empty.** Never a padded row, never a placeholder, and never
 * a "you might also like" block filled from a different query to avoid an empty section.
 *
 * `related_jobs` is a REDUCED payload shape — nine fields, no skills, no description — so this
 * renders a compact row from the same kit atoms the rail card uses rather than taking a `JobV2`
 * it would have to fabricate. See `docs/jobs-v2-redesign-notes.md`.
 * ======================================================================== */

export type RelatedJob = NonNullable<JobV2["related_jobs"]>[number];

/** The stretched-link recipe: the whole row is the hit area, the title is the only tab stop. */
const stretchedLink = {
  textDecoration: "none",
  color: "inherit",
  "&::after": { content: '""', position: "absolute", inset: 0, borderRadius: "inherit" },
} as const;

function SimilarRow({
  job,
  href,
  last,
}: {
  job: RelatedJob;
  href: string;
  last: boolean;
}) {
  const { t } = useTranslation("common");

  const title =
    String(job.job_title ?? "").trim() ||
    (t("jobsV2.board.untitledRole", { defaultValue: "Untitled role" }) as string);
  const company = String(job.company_name ?? "").trim();
  const location = formatLocation(job.location);
  const mode = formatWorkMode(job.work_mode);
  const employment = formatEmploymentType(job.employment_type);
  const experience = formatExperience(job.years_of_experience);
  const why = visibilityReasonLabel(job.visibility_reason);

  // Each chip is OMITTED when the fact is missing — no dash, no empty slot. If all of them are
  // missing the row does not render at all.
  const meta: MetaItem[] = [];
  if (location) meta.push({ key: "location", icon: "mdi:map-marker-outline", label: location, title: location });
  if (mode) meta.push({ key: "workMode", icon: "mdi:home-city-outline", label: mode, title: mode });
  if (employment) meta.push({ key: "jobType", icon: "mdi:briefcase-outline", label: employment, title: employment });
  if (experience)
    meta.push({ key: "experience", icon: "mdi:chart-timeline-variant", label: experience, title: experience });

  return (
    <Box
      component="li"
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        p: { xs: 1.75, md: 2 },
        borderBottom: last ? "none" : `1px solid ${J.hairlineSoft}`,
        transition: `background-color ${MOTION.micro}ms ${MOTION.ease}`,
        "&:hover": { bgcolor: J.surface2 },
        "&:focus-within": { bgcolor: J.surface2 },
      }}
    >
      <CompanyLogo src={job.company_logo} name={company || title} size={40} />

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          component={NextLink}
          href={href}
          title={title}
          sx={{ ...TYPE.h4, ...lineClamp(2), display: "block", ...stretchedLink, ...focusRing }}
        >
          {title}
        </Typography>

        {/* Dropped entirely when absent — never "Unknown company". */}
        {company && (
          <Typography
            sx={{
              ...TYPE.small,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={company}
          >
            {company}
          </Typography>
        )}

        {meta.length > 0 && <MetaRow items={meta} dense max={3} sx={{ mt: 0.5 }} />}

        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, mt: 0.75 }}>
          <DeadlineChip value={job.application_deadline} />
          {/* A badge carries its own justification, in the same sentence. */}
          {why && (
            <Box
              component="span"
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, ...TYPE.micro }}
              title={why}
            >
              <Box aria-hidden sx={{ display: "inline-flex", color: J.ink4 }}>
                <IconWrapper icon="mdi:eye-outline" size={14} />
              </Box>
              {why}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export interface SimilarJobsProps {
  /** `related_jobs` from the detail payload. Absent on every row until §6.4 lands. */
  jobs?: RelatedJob[] | null;
  /** The job being read, excluded defensively even though the backend already excludes it. */
  currentJobId: number;
  /** The board's own filter state, so "Back to jobs" from the next role still lands correctly. */
  boardQuery?: string;
  /** Up to four. Spec 3.6. */
  max?: number;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

export function SimilarJobs({
  jobs,
  currentJobId,
  boardQuery,
  max = 4,
  sx,
  ...rest
}: SimilarJobsProps) {
  const { t } = useTranslation("common");

  const rows = useMemo(() => {
    const seen = new Set<number>([currentJobId]);
    const out: RelatedJob[] = [];
    for (const job of jobs ?? []) {
      const id = Number(job?.id);
      if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue;
      seen.add(id);
      out.push(job);
      if (out.length >= max) break;
    }
    return out;
  }, [jobs, currentJobId, max]);

  // Nothing to say, so nothing is said.
  if (rows.length === 0) return null;

  const suffix = boardQuery ? `?${boardQuery}` : "";

  return (
    <Box component="section" aria-labelledby="jobs-similar" sx={sx} {...rest}>
      <SectionHeader
        icon="mdi:briefcase-search-outline"
        title={
          t("jobsV2.detail.similarTitle", {
            defaultValue: "Other roles you can apply to",
          }) as string
        }
        id="jobs-similar"
      />
      <JPanel>
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, borderRadius: R.card }}>
          {rows.map((job, index) => (
            <SimilarRow
              key={job.id}
              job={job}
              href={`/jobs-v2/${job.id}${suffix}`}
              last={index === rows.length - 1}
            />
          ))}
        </Box>
      </JPanel>
    </Box>
  );
}
