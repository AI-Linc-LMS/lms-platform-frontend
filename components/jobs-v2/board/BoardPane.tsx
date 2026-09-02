"use client";

import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { JobSearchIllustration } from "@/components/jobs-v2/illustrations";
import { formatCount } from "@/lib/jobs-v2/format";
import {
  HairlineStrip,
  HairlineStripSkeleton,
  JCard,
  TYPE,
  type StripItem,
} from "@/components/jobs-v2/ui";

/**
 * What fills the pane before a selection.
 *
 * **Not a job.** `/jobs-v2` at `lg+` shows this, never `jobs[0]`: auto-select fabricates a
 * choice the student did not make, quietly promotes whichever employer sorts first (we shipped
 * six consecutive GitLab cards once), and either churns browser history or desyncs the URL from
 * what the pane is showing. It costs one click and buys a board URL that stays a board URL.
 *
 * The three numbers on the strip are **the student's own**, and they are the only three we can
 * state: how many roles are open to them, how many of those they are eligible for, how many they
 * have saved. Not a marketing total, not an applicant count, not a match percentage. Each cell
 * that can act is a filter toggle, which is how the old "5 tiles plus 6 chips" duplication
 * collapses into one row.
 */
export interface BoardPaneProps {
  /** How many roles this student can see with the filters they have set. Never a global total. */
  visibleCount: number;
  /** How many of those they are eligible for. `undefined` when the payload cannot say. */
  eligibleCount?: number;
  savedCount: number;
  eligibleActive?: boolean;
  savedActive?: boolean;
  onToggleEligible?: () => void;
  onToggleSaved?: () => void;
  /**
   * Rendered instead of the prompt when the result set is empty — the same `EmptyState` the
   * list renders, once, in the pane. The rail shows the reset action.
   */
  emptyState?: ReactNode;
  /**
   * The copy is static; only the three numbers are loading. So the card stays put and the strip
   * alone shimmers, rather than the pane flashing "0 open to you" and then correcting itself.
   */
  loading?: boolean;
}

export function BoardPane({
  visibleCount,
  eligibleCount,
  savedCount,
  eligibleActive,
  savedActive,
  onToggleEligible,
  onToggleSaved,
  emptyState,
  loading,
}: BoardPaneProps) {
  const { t } = useTranslation("common");

  if (emptyState) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: { xs: 2.5, lg: 4 } }}>
        <Box sx={{ width: "100%", maxWidth: 560 }}>{emptyState}</Box>
      </Box>
    );
  }

  const items: StripItem[] = [
    {
      key: "visible",
      label: t("jobsV2.board.pane.openToYou", { defaultValue: "Open to you" }) as string,
      value: formatCount(visibleCount),
    },
  ];
  // Omitted entirely when we were not told about eligibility — a zero here would read as a
  // judgement of the student rather than of our payload.
  if (eligibleCount !== undefined) {
    items.push({
      key: "eligible",
      label: t("jobsV2.board.pane.eligible", { defaultValue: "You're eligible for" }) as string,
      value: formatCount(eligibleCount),
      onClick: eligibleCount > 0 || eligibleActive ? onToggleEligible : undefined,
      active: eligibleActive,
    });
  }
  items.push({
    key: "saved",
    label: t("jobsV2.board.pane.saved", { defaultValue: "Saved" }) as string,
    value: formatCount(savedCount),
    onClick: savedCount > 0 || savedActive ? onToggleSaved : undefined,
    active: savedActive,
  });

  return (
    <Box sx={{ display: "flex", justifyContent: "center", p: { xs: 2.5, lg: 4 } }}>
      <JCard sx={{ width: "100%", maxWidth: 560, textAlign: "center" }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <JobSearchIllustration tone="muted" width={160} height={120} />
        </Box>

        <Typography component="h2" sx={{ ...TYPE.h2, mb: 1 }}>
          {t("jobsV2.board.pane.title", { defaultValue: "Pick a role to read the full posting" })}
        </Typography>
        <Typography sx={{ ...TYPE.body, mb: 2.5 }}>
          {t("jobsV2.board.pane.body", {
            defaultValue:
              "Everything the employer stated, plus a check of it against your profile.",
          })}
        </Typography>

        {loading ? (
          <HairlineStripSkeleton columns={items.length} />
        ) : (
          <HairlineStrip
            items={items}
            ariaLabel={
              t("jobsV2.board.pane.stripLabel", { defaultValue: "Your job board totals" }) as string
            }
            sx={{ textAlign: "start" }}
          />
        )}

        <Typography sx={{ ...TYPE.micro, mt: 2 }}>
          {t("jobsV2.board.pane.keys", { defaultValue: "↑ ↓ to move, Enter to open" })}
        </Typography>
      </JCard>
    </Box>
  );
}
