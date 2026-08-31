"use client";

import { useMemo, type ReactNode } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  CompanyLogo,
  J,
  JCard,
  JDataTable,
  R,
  SkillChip,
  StatusPill,
  TYPE,
  focusRing,
  lineClamp,
  relevanceColor,
  type Column,
  type JDataTableSelection,
} from "@/components/jobs-v2/ui";
import { normalizeScrapedState } from "@/lib/jobs-v2/status";
import { formatCount, relativeTime } from "@/lib/jobs-v2/format";
import type { ScrapedJob, ScrapedJobsTab } from "@/lib/services/admin/admin-scraped-jobs.service";

export const SOURCE_KINDS: Array<{ value: string; label: string }> = [
  { value: "greenhouse", label: "Greenhouse" },
  { value: "lever", label: "Lever" },
  { value: "smartrecruiters", label: "SmartRecruiters" },
  { value: "ashby", label: "Ashby" },
  { value: "workday", label: "Workday" },
  { value: "jsearch", label: "JSearch" },
  { value: "claude_page", label: "Claude Page" },
];

export const SOURCE_KIND_LABELS: Record<string, string> = Object.fromEntries(
  SOURCE_KINDS.map((s) => [s.value, s.label]),
);

/**
 * The decision a row is currently in, collapsed onto the four states the tabs present.
 * `normalizeScrapedState` is the single reader, so the table, the tab counts and the preview
 * sheet cannot disagree about what "ready" means.
 */
export function scrapedStateOf(row: ScrapedJob) {
  return normalizeScrapedState(row.decision?.decision ?? row.status) ?? "review";
}

export interface ScrapedTableProps {
  rows: ScrapedJob[];
  tab: ScrapedJobsTab;
  loading: boolean;
  refetching?: boolean;
  error?: string | null;
  onRetry: () => void;
  isFiltered: boolean;
  empty: ReactNode;
  emptyFiltered: ReactNode;
  /** Omitted on the three non-Review tabs, where bulk actions do not apply. */
  selection?: JDataTableSelection;
  onOpenMenu: (anchor: HTMLElement, row: ScrapedJob) => void;
  onPreview: (row: ScrapedJob) => void;
}

/** The relevance cell: a tabular percentage over a 4px bar tinted from the `--j-rel-*` ramp. */
function RelevanceCell({ row }: { row: ScrapedJob }) {
  const { t } = useTranslation("common");
  if (row.relevance == null) {
    return (
      <Tooltip
        arrow
        title={t("jobsV2.scraped.noScore", "This row has not been scored yet.") as string}
      >
        <Typography component="span" sx={{ ...TYPE.mono, color: J.ink4 }}>
          {"—"}
        </Typography>
      </Tooltip>
    );
  }
  const pct = Math.round(row.relevance * 100);
  const width = Math.round(Math.min(1, Math.max(0, row.relevance)) * 100);
  const colour = relevanceColor(row.relevance);
  return (
    // The tooltip ALWAYS has text: an empty `relevance_reason` used to make MUI render no
    // tooltip at all, leaving the score an unexplained number.
    <Tooltip
      arrow
      title={
        row.relevance_reason?.trim() ||
        (t("jobsV2.scraped.noReason", "No reason recorded by the scorer.") as string)
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 72 }}>
        <Typography sx={{ ...TYPE.mono, fontWeight: 700, color: colour }}>{pct}%</Typography>
        <Box
          role="meter"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("jobsV2.scraped.relevanceLabel", "Relevance {{pct}} percent", {
            pct,
          }) as string}
          sx={{ height: 4, borderRadius: R.pill, bgcolor: J.surface3, overflow: "hidden" }}
        >
          <Box sx={{ height: "100%", width: `${width}%`, bgcolor: colour }} />
        </Box>
      </Box>
    </Tooltip>
  );
}

export function ScrapedTable({
  rows,
  tab,
  loading,
  refetching,
  error,
  onRetry,
  isFiltered,
  empty,
  emptyFiltered,
  selection,
  onOpenMenu,
  onPreview,
}: ScrapedTableProps) {
  const { t } = useTranslation("common");

  const jobCell = (row: ScrapedJob) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
      <CompanyLogo src={row.company_logo} name={row.company_name} size={40} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ ...TYPE.h4, ...lineClamp(2) }} title={row.job_title}>
          {row.job_title}
        </Typography>
        <Typography sx={{ ...TYPE.micro, ...lineClamp(1) }}>
          {[row.company_name, row.location].filter(Boolean).join(" · ")}
        </Typography>
      </Box>
    </Box>
  );

  const sourceCell = (row: ScrapedJob) => (
    <Tooltip arrow title={row.source_name || row.source_kind}>
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          px: 1,
          minHeight: 24,
          borderRadius: R.pill,
          border: `1px solid ${J.azureBorder}`,
          bgcolor: J.azureSoft,
          color: J.azureDeep,
          fontSize: "0.6875rem",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {SOURCE_KIND_LABELS[row.source_kind] ?? row.source_kind}
      </Box>
    </Tooltip>
  );

  const skillsCell = (row: ScrapedJob) => {
    const skills = row.key_skills ?? [];
    if (skills.length === 0) {
      return <Typography sx={{ ...TYPE.micro, color: J.ink4 }}>{"—"}</Typography>;
    }
    return (
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
        {skills.slice(0, 3).map((skill) => (
          <SkillChip key={skill}>{skill}</SkillChip>
        ))}
        {skills.length > 3 && (
          <Tooltip arrow title={skills.slice(3).join(", ")}>
            <Typography component="span" sx={{ ...TYPE.micro, fontWeight: 700 }}>
              +{formatCount(skills.length - 3)}
            </Typography>
          </Tooltip>
        )}
      </Box>
    );
  };

  const seenCell = (row: ScrapedJob) => (
    <Tooltip arrow title={row.last_seen_at ?? ""}>
      <Typography component="span" sx={TYPE.small}>
        {relativeTime(row.last_seen_at) ?? "—"}
      </Typography>
    </Tooltip>
  );

  const stateCell = (row: ScrapedJob) => (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      <StatusPill kind="scraped" value={scrapedStateOf(row)} />
      {row.decision?.decision === "imported" && row.decision.source_expired && (
        <Tooltip
          arrow
          title={
            t(
              "jobsV2.scraped.closedAtSourceHint",
              "The original posting has closed at the source.",
            ) as string
          }
        >
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              px: 1,
              minHeight: 24,
              borderRadius: R.pill,
              border: `1px solid ${J.warnBd}`,
              bgcolor: J.warnBg,
              color: J.warnFg,
              fontSize: "0.6875rem",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {t("jobsV2.scraped.closedAtSource", "Closed at source")}
          </Box>
        </Tooltip>
      )}
    </Box>
  );

  const actionsCell = (row: ScrapedJob) => (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.25 }}>
      <Tooltip arrow title={t("jobsV2.scraped.preview", "Preview") as string}>
        <IconButton
          size="small"
          onClick={() => onPreview(row)}
          aria-label={t("jobsV2.scraped.previewOf", "Preview {{title}}", {
            title: row.job_title,
          }) as string}
          sx={{ color: J.ink3, "&:hover": { color: J.azure, bgcolor: J.surface2 }, ...focusRing }}
        >
          <IconWrapper icon="mdi:file-eye-outline" size={19} />
        </IconButton>
      </Tooltip>
      <IconButton
        size="small"
        onClick={(event) => onOpenMenu(event.currentTarget, row)}
        aria-label={t("jobsV2.admin.actionsFor", "Actions for {{title}}", {
          title: row.job_title,
        }) as string}
        aria-haspopup="menu"
        sx={{ color: J.ink3, "&:hover": { color: J.ink, bgcolor: J.surface2 }, ...focusRing }}
      >
        <IconWrapper icon="mdi:dots-vertical" size={20} />
      </IconButton>
    </Box>
  );

  const columns = useMemo<Column<ScrapedJob>[]>(
    () => [
      {
        key: "job",
        header: t("jobsV2.admin.col.job", "Job") as string,
        width: 300,
        render: jobCell,
      },
      {
        key: "source",
        header: t("jobsV2.scraped.col.source", "Source") as string,
        render: sourceCell,
      },
      {
        key: "relevance",
        header: t("jobsV2.scraped.col.relevance", "Relevance") as string,
        headerHelp: t(
          "jobsV2.scraped.relevanceHelp",
          "How well the scorer thinks this posting matches your learners.",
        ) as string,
        render: (row) => <RelevanceCell row={row} />,
      },
      {
        key: "skills",
        header: t("jobsV2.scraped.col.skills", "Skills") as string,
        hideBelow: "lg",
        render: skillsCell,
      },
      {
        key: "seen",
        header: t("jobsV2.scraped.col.seen", "Seen") as string,
        hideBelow: "lg",
        render: seenCell,
      },
      {
        key: "state",
        header: t("jobsV2.admin.col.status", "Status") as string,
        align: "center",
        render: stateCell,
      },
      {
        key: "actions",
        header: t("jobsV2.admin.col.actions", "Actions") as string,
        align: "end",
        width: 104,
        render: actionsCell,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, onOpenMenu, onPreview],
  );

  /**
   * The mobile card list. This is the only admin list that had no card branch at all: a
   * seven-column table with ~940px of declared minimum widths was pushed into horizontal scroll
   * on a phone. The card carries every field the table does.
   */
  const mobileCard = (row: ScrapedJob) => (
    <JCard sx={{ p: 2, pr: selection ? 7 : 2 }}>
      {jobCell(row)}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5, alignItems: "center" }}>
        {stateCell(row)}
        {sourceCell(row)}
      </Box>
      <Box sx={{ display: "flex", gap: 2, mt: 1.5, alignItems: "flex-end", flexWrap: "wrap" }}>
        <Box sx={{ minWidth: 96 }}>
          <Typography sx={{ ...TYPE.eyebrow, color: J.ink3, mb: 0.5 }}>
            {t("jobsV2.scraped.col.relevance", "Relevance")}
          </Typography>
          <RelevanceCell row={row} />
        </Box>
        <Box>
          <Typography sx={{ ...TYPE.eyebrow, color: J.ink3, mb: 0.5 }}>
            {t("jobsV2.scraped.col.seen", "Seen")}
          </Typography>
          {seenCell(row)}
        </Box>
      </Box>
      <Box sx={{ mt: 1.5 }}>{skillsCell(row)}</Box>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          mt: 1.5,
          pt: 1.5,
          borderTop: `1px solid ${J.hairlineSoft}`,
          alignItems: "center",
        }}
      >
        {actionsCell(row)}
      </Box>
    </JCard>
  );

  return (
    <Box>
      {!selection && (
        // The checkbox column's absence is explained, not left to silence.
        <Typography sx={{ ...TYPE.small, mb: 1, color: J.ink3 }}>
          {t("jobsV2.scraped.noBulkHere", "Bulk actions apply to the review queue.")}
        </Typography>
      )}
      <JDataTable<ScrapedJob>
        data-tour-id="scraped-jobs-list"
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.job_title}
        selection={selection}
        loading={loading}
        refetching={refetching}
        error={error}
        onRetry={onRetry}
        isFiltered={isFiltered}
        empty={empty}
        emptyFiltered={emptyFiltered}
        caption={
          t("jobsV2.scraped.tableCaption", "Scraped jobs in the {{tab}} queue", {
            tab,
          }) as string
        }
        mobile={mobileCard}
      />
    </Box>
  );
}
