"use client";

import { useMemo, type RefObject } from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import {
  deadlineLabel,
  formatEmploymentType,
  formatSalary,
  formatWorkMode,
} from "@/lib/jobs-v2/format";
import {
  J,
  R,
  SHADOW,
  TYPE,
  MOTION,
  CompanyLogo,
  DeadlineChip,
  StatusPill,
  focusRing,
  usePaneScrolled,
} from "@/components/jobs-v2/ui";
import { ApplyCta, ApplyNotice } from "./ApplyCta";
import type { ApplyState } from "./useApply";

/* ==========================================================================
 * JobHeroBar — identity and apply, always reachable.
 *
 * Every one of the five boards we benchmarked puts the apply affordance in at least two places,
 * and for the same reason: a student who has read 900px of a posting should not have to scroll
 * back up to act on it. Ours are the hero bar, the `Role snapshot` apply block, and the fixed
 * mobile bar.
 *
 * **Sticky lives INSIDE the pane.** `MainLayout` gives ancestors `overflow: auto`, which makes
 * them the sticky containing block — that is why the mobile apply bar had to become `fixed`.
 * Inside the pane's own `overflow-y: auto` box, `position: sticky; top: 0` is reliable, because
 * that box IS the containing block. `usePaneScrolled` is a no-op outside a `JobsSplitLayout` and
 * falls back to the window's own scroll, so this component needs no breakpoint guard.
 *
 * The shadow arrives only once the pane has actually been scrolled: a permanently shadowed bar
 * reads as a modal header.
 * ======================================================================== */

export interface JobHeroBarProps {
  job: JobV2;
  apply: ApplyState;
  appliedHref: string;
  /** Hidden in admin mode — behaviour unchanged. */
  showFavorite: boolean;
  favoriteBusy: boolean;
  onToggleFavorite: () => void;
  /**
   * The pane moves focus here on every selection, so a screen reader is told which posting it is
   * now reading. The title is the pane's `h1` and carries `tabIndex={-1}` for exactly that.
   */
  titleRef?: RefObject<HTMLHeadingElement | null>;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

export function JobHeroBar({
  job,
  apply,
  appliedHref,
  showFavorite,
  favoriteBusy,
  onToggleFavorite,
  titleRef,
  sx,
  ...rest
}: JobHeroBarProps) {
  const { t } = useTranslation("common");
  const scrolled = usePaneScrolled();
  const deadline = deadlineLabel(job.application_deadline);

  /**
   * The identity line, in the module's fixed meta order. Every part is omitted when we do not
   * hold it — no dash, no "Not specified", no empty slot. An unstated work mode is NOT evidence
   * of on-site, so `formatWorkMode` returning `null` simply drops the segment.
   */
  const identity = useMemo(() => {
    const parts = [
      job.company_name,
      job.location,
      formatWorkMode(job.work_mode),
      formatEmploymentType(job.employment_type),
      formatSalary(job.salary),
    ];
    return parts.filter((part) => Boolean(part && String(part).trim())).join(" · ");
  }, [job.company_name, job.location, job.work_mode, job.employment_type, job.salary]);

  const saveLabel = job.is_favourited
    ? (t("jobsV2.detail.saved", { defaultValue: "Saved" }) as string)
    : (t("jobsV2.detail.save", { defaultValue: "Save" }) as string);

  return (
    <Box
      {...rest}
      component="header"
      sx={[
        {
          position: "sticky",
          top: 0,
          zIndex: 3,
          px: { xs: 2, md: 2.5 },
          py: 1.5,
          bgcolor: J.surface,
          borderBottom: `1px solid ${J.hairline}`,
          // Only once scrolled. A permanently shadowed bar reads as a modal header.
          boxShadow: scrolled ? SHADOW.sticky : "none",
          transition: `box-shadow ${MOTION.surface}ms ${MOTION.ease}`,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        sx={{
          minHeight: 52,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: { xs: "wrap", sm: "nowrap" },
        }}
      >
      <CompanyLogo src={job.company_logo} name={job.company_name} size={40} />

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          component="h1"
          ref={titleRef}
          tabIndex={-1}
          sx={{
            ...TYPE.h3,
            outline: "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={job.job_title}
        >
          {job.job_title}
        </Typography>
        {identity && (
          <Typography
            sx={{
              ...TYPE.small,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={identity}
          >
            {identity}
          </Typography>
        )}
      </Box>

      {/* Employer-stated urgency, and the only kind we ship. Promoted into the bar only when the
          closing date is actually near — a deadline three months out earns no chip here. */}
      {deadline && (deadline.urgency === "soon" || deadline.urgency === "urgent") && (
        <Box sx={{ display: { xs: "none", md: "inline-flex" }, flexShrink: 0 }}>
          <DeadlineChip value={job.application_deadline} />
        </Box>
      )}

      {/* A role whose deadline has passed, or whose status is closed, is marked in place. It is
          never silently dropped, and never left with a live Apply button behind an emailed link. */}
      {job.is_open === false && (
        <Box sx={{ flexShrink: 0 }}>
          <StatusPill kind="job" value="closed" size="sm" />
        </Box>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
        {showFavorite && (
          <Tooltip
            title={
              job.is_favourited
                ? (t("jobsV2.detail.unsave", { defaultValue: "Remove from saved" }) as string)
                : (t("jobsV2.detail.save", { defaultValue: "Save this job" }) as string)
            }
            arrow
          >
            <Box
              component="button"
              type="button"
              onClick={onToggleFavorite}
              disabled={favoriteBusy}
              aria-pressed={Boolean(job.is_favourited)}
              aria-label={saveLabel}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                minHeight: 44,
                minWidth: 44,
                justifyContent: "center",
                px: 1,
                borderRadius: R.ctl,
                border: "none",
                bgcolor: "transparent",
                cursor: favoriteBusy ? "default" : "pointer",
                fontFamily: "inherit",
                ...TYPE.micro,
                // TYPE.micro carries the muted ink; the saved state's own colour has to win.
                color: job.is_favourited ? J.azure : J.ink3,
                transition: `color ${MOTION.micro}ms ${MOTION.ease}, background-color ${MOTION.micro}ms ${MOTION.ease}`,
                "&:hover": { bgcolor: J.surface2 },
                "&:disabled": { opacity: 0.5 },
                ...focusRing,
              }}
            >
              <IconWrapper icon={job.is_favourited ? "mdi:heart" : "mdi:heart-outline"} size={20} />
              <Box component="span" sx={{ display: { xs: "none", lg: "inline" } }}>
                {saveLabel}
              </Box>
            </Box>
          </Tooltip>
        )}

        {/* One component, one `useApply(job)` hook, in all three placements. */}
        <ApplyCta apply={apply} placement="heroBar" appliedHref={appliedHref} />
      </Box>
      </Box>

      {/* A blocked popup, or a record left at Applying, gets its own row rather than being
          squeezed into the bar — and it is never reported by a toast alone, because a toast that
          has already faded is not a report. */}
      {apply.noticeText && <ApplyNotice apply={apply} sx={{ mt: 0 }} />}
    </Box>
  );
}
