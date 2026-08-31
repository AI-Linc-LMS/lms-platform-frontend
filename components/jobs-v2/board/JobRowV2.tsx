"use client";

import { memo } from "react";
import NextLink from "next/link";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import {
  CompanyLogo,
  MetaRow,
  J,
  MOTION,
  TYPE,
  lineClamp,
} from "@/components/jobs-v2/ui";
import {
  FavoriteButton,
  JobSignals,
  jobMetaItems,
  stretchedLink,
} from "./JobCardV2";

/**
 * The compact row.
 *
 * It was 90 lines inside `app/jobs-v2/page.tsx` with a hardcoded `#06b6d4` hover border and a
 * `#06b6d4` avatar fill, so switching from cards to rows changed the module's colour. It is now
 * the same data, the same accent and the same favourite path as the card — the only difference
 * is the shape.
 *
 * Rows carry no radius and no shadow of their own: the list wraps them in a `JPanel` and they
 * divide with one continuous hairline, which is why `Stack spacing={0}` is correct here and
 * `spacing={1.5}` is correct for cards.
 */

export interface JobRowV2Props {
  job: JobV2;
  onFavoriteChange?: (jobId: number, favorited: boolean) => void;
  /** The last row drops its divider so no rule sits on the panel's own edge. */
  last?: boolean;
  "data-tour-id"?: string;
}

const JobRowV2Component = ({ job, onFavoriteChange, last, ...rest }: JobRowV2Props) => {
  const { t } = useTranslation("common");
  const title =
    job.job_title || (t("jobsV2.board.untitledRole", { defaultValue: "Untitled role" }) as string);

  return (
    <Box
      {...rest}
      sx={{
        position: "relative",
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        gap: { xs: 1.5, md: 2 },
        px: { xs: 2, md: 2.5 },
        py: 2,
        minWidth: 0,
        borderBottom: last ? "none" : `1px solid ${J.hairlineSoft}`,
        // The border moves and the surface goes one rung up. Nothing lifts, blurs or blooms.
        transition: `background-color ${MOTION.micro}ms ${MOTION.ease}`,
        "&:hover": { bgcolor: J.surface2 },
        "&:focus-within": { bgcolor: J.surface2 },
      }}
    >
      <CompanyLogo src={job.company_logo} name={job.company_name} size={40} />

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          gap: { xs: 1, md: 2 },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component={NextLink}
            href={`/jobs-v2/${job.id}`}
            title={title}
            sx={{ ...TYPE.h4, ...lineClamp(1), ...stretchedLink }}
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
          <MetaRow items={jobMetaItems(job)} max={3} dense sx={{ mt: 0.75 }} />
        </Box>

        <JobSignals job={job} sx={{ flexShrink: 0 }} />
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
        <FavoriteButton job={job} onFavoriteChange={onFavoriteChange} size={17} />
        <Box
          aria-hidden
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            color: J.ink4,
            '[dir="rtl"] &': { transform: "scaleX(-1)" },
          }}
        >
          <IconWrapper icon="mdi:chevron-right" size={18} />
        </Box>
      </Box>
    </Box>
  );
};

export const JobRowV2 = memo(JobRowV2Component, (prev, next) => {
  const a = prev.job;
  const b = next.job;
  return (
    a.id === b.id &&
    a.is_favourited === b.is_favourited &&
    a.has_applied === b.has_applied &&
    a.eligible_to_apply === b.eligible_to_apply &&
    a.application_deadline === b.application_deadline &&
    a.applicable_passout_year === b.applicable_passout_year &&
    prev.last === next.last &&
    prev.onFavoriteChange === next.onFavoriteChange
  );
});
JobRowV2.displayName = "JobRowV2";
