"use client";

import React, { memo, useCallback } from "react";
import NextLink from "next/link";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { postedLabel } from "@/lib/jobs-v2/format";
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
  railMetaItems,
  stretchedLink,
} from "./JobCardV2";

/**
 * The rail card — Naukri's density minus its noise.
 *
 * It is a **navigation target for the pane**, which is exactly LinkedIn's reason for a thin
 * card, so it carries no description snippet, no skill chip row and no Apply button. What it
 * does keep is the experience range, promoted into the meta line, because that is the fact that
 * decides whether a fresher clicks.
 *
 * **Salary is not on it.** Most of our rows have no salary at all (`salary` is a free-text
 * `CharField` that enrichment fills only when the posting states one), and a chip that is
 * present on one card in five is a column of ragged holes rather than a fact you can scan. The
 * detail page's `Role snapshot` is where a missing salary earns a labelled "Not disclosed"; on a
 * card, a missing field is simply omitted — no dash, no placeholder, no empty slot.
 *
 * Three things it must get exactly right, because the rest of the split depends on them:
 *
 * 1. **The title is a real `<Link>`** carrying the whole board query. Middle-click, cmd-click
 *    and "open in new tab" all work, and an emailed link lands on the same posting. The left
 *    click is intercepted into `router.push` only when it is an unmodified primary click.
 * 2. **`data-rail-id` on the root**, which is how `useRailKeys` moves the cursor with `j`/`k`.
 *    The root is `tabIndex={-1}`: a focus target, never a tab stop. The title stays the only
 *    tab stop, and the heart is its sibling `<button>`.
 * 3. **`aria-current`** on the selected card, so a screen reader is told which posting the pane
 *    is showing rather than inferring it from a tint.
 */

export interface JobRailCardProps {
  job: JobV2;
  selected?: boolean;
  /** `"compact"` drops the signal strip — the similar-jobs list, where the strip is noise. */
  density?: "rail" | "compact";
  /** The posting's href, already carrying the board query. */
  href: string;
  /** Intercepts an unmodified left click into `router.push`, so the pane swaps without a nav. */
  onSelect?: (id: number) => void;
  learnerTokens?: ReadonlySet<string>;
  onFavoriteChange?: (jobId: number, favorited: boolean) => void;
  "data-tour-id"?: string;
}

const JobRailCardComponent = ({
  job,
  selected = false,
  density = "rail",
  href,
  onSelect,
  learnerTokens,
  onFavoriteChange,
  ...rest
}: JobRailCardProps) => {
  const { t } = useTranslation("common");
  const title =
    job.job_title || (t("jobsV2.board.untitledRole", { defaultValue: "Untitled role" }) as string);
  const meta = railMetaItems(job);
  // `postedLabel` returns null for an undated row, and we never fabricate "Recently".
  const posted = postedLabel(job.created_at);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!onSelect) return;
      // Everything a browser means by "open this somewhere else" is left to the browser.
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      event.preventDefault();
      onSelect(job.id);
    },
    [onSelect, job.id],
  );

  return (
    <Box
      {...rest}
      data-rail-id={job.id}
      // A focus target for j/k, never a tab stop — the title is the tab stop.
      tabIndex={-1}
      aria-current={selected ? "true" : undefined}
      sx={{
        position: "relative",
        display: "flex",
        gap: 1.5,
        px: 1.75,
        py: 1.75,
        minWidth: 0,
        borderBottom: `1px solid ${J.hairlineSoft}`,
        // The selected card owns a 3px inline-start rule as well as the tint, so selection
        // survives a greyscale print and colour-blindness.
        borderInlineStart: `3px solid ${selected ? J.azure : "transparent"}`,
        bgcolor: selected ? J.azureSoft : "transparent",
        transition: `background-color ${MOTION.micro}ms ${MOTION.ease}`,
        "&:hover": { bgcolor: selected ? J.azureSoft : J.surface2 },
        "&:focus-within": { bgcolor: selected ? J.azureSoft : J.surface2 },
        "&:focus-visible": { outline: "none" },
      }}
    >
      {/* Never a broken glyph and never a blank box: the fallback is the initial letter on the
          brand badge gradient. */}
      <CompanyLogo src={job.company_logo} name={job.company_name} size={40} />

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.75 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, minWidth: 0 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              component={NextLink}
              href={href}
              onClick={handleClick}
              title={title}
              sx={{ ...TYPE.h4, ...lineClamp(2), ...stretchedLink }}
            >
              {title}
            </Typography>
            {/* No company name means the LINE is dropped, not filled with "Unknown company". */}
            {job.company_name && (
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
            )}
          </Box>
          <FavoriteButton job={job} onFavoriteChange={onFavoriteChange} size={17} />
        </Box>

        {/* location · work mode · experience. All three absent means no row at all. */}
        {meta.length > 0 && <MetaRow items={meta} max={3} dense />}

        {density === "rail" && <JobSignals job={job} learnerTokens={learnerTokens} />}

        {posted && <Typography sx={TYPE.micro}>{posted}</Typography>}
      </Box>
    </Box>
  );
};

/**
 * The comparator names every field the card renders that can change under it. `selected` is in
 * it because selection is what a rail of twenty cards re-renders for on every keystroke.
 */
export const JobRailCard = memo(JobRailCardComponent, (prev, next) => {
  const a = prev.job;
  const b = next.job;
  return (
    a.id === b.id &&
    a.is_favourited === b.is_favourited &&
    a.has_applied === b.has_applied &&
    a.eligible_to_apply === b.eligible_to_apply &&
    a.application_deadline === b.application_deadline &&
    a.is_open === b.is_open &&
    a.visibility_reason === b.visibility_reason &&
    a.work_mode === b.work_mode &&
    prev.selected === next.selected &&
    prev.density === next.density &&
    prev.href === next.href &&
    prev.learnerTokens === next.learnerTokens &&
    prev.onSelect === next.onSelect &&
    prev.onFavoriteChange === next.onFavoriteChange
  );
});
JobRailCard.displayName = "JobRailCard";
