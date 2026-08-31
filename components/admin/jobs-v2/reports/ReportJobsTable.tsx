"use client";

import { useMemo, type ReactNode } from "react";
import NextLink from "next/link";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  CompanyLogo,
  CountPill,
  J,
  JCard,
  JDataTable,
  StatusPill,
  TYPE,
  focusRing,
  lineClamp,
  type Column,
  type JDataTableSort,
} from "@/components/jobs-v2/ui";
import { deadlineLabel, formatCount, formatDate } from "@/lib/jobs-v2/format";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import type { ApplicationsAggregate } from "./ReportFunnel";

export interface ReportRow {
  job: JobV2;
  /** `null` while this job's applications are still loading, or if the fetch failed. */
  stats: ApplicationsAggregate | null;
  /** The reason this row's numbers are missing, when they are. */
  statsError?: string;
}

export interface ReportJobsTableProps {
  rows: ReportRow[];
  loading: boolean;
  error?: string | null;
  onRetry: () => void;
  isFiltered: boolean;
  empty: ReactNode;
  emptyFiltered: ReactNode;
  sort: JDataTableSort;
  /** Highlights the job the funnel above is scoped to. */
  selectedJobId?: number | null;
  onSelectJob: (jobId: number | null) => void;
}

function pending(t: (k: string, d: string) => string) {
  return (
    <Typography component="span" sx={{ ...TYPE.mono, color: J.ink4 }}>
      {t("jobsV2.reports.counting", "counting…")}
    </Typography>
  );
}

/**
 * The per-job report table. It replaces the 320px scroller of twelve full-width `Button`s that
 * ended in the dead caption "+N more jobs" — twelve of however many jobs the institution has,
 * with no way to reach the rest.
 */
export function ReportJobsTable({
  rows,
  loading,
  error,
  onRetry,
  isFiltered,
  empty,
  emptyFiltered,
  sort,
  selectedJobId,
  onSelectJob,
}: ReportJobsTableProps) {
  const { t } = useTranslation("common");
  const tr = (key: string, fallback: string) => t(key, fallback) as string;

  const conversionOf = (stats: ApplicationsAggregate | null) => {
    if (!stats || stats.reached.applied === 0) return null;
    return Math.round((stats.reached.selected / stats.reached.applied) * 100);
  };

  const numberCell = (row: ReportRow, read: (s: ApplicationsAggregate) => number) =>
    row.stats ? (
      <Typography component="span" sx={TYPE.mono}>
        {formatCount(read(row.stats))}
      </Typography>
    ) : row.statsError ? (
      <Typography component="span" sx={{ ...TYPE.mono, color: J.warnFg }} title={row.statsError}>
        {tr("jobsV2.reports.unavailable", "n/a")}
      </Typography>
    ) : (
      pending(tr)
    );

  const jobCell = (row: ReportRow) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
      <CompanyLogo src={row.job.company_logo} name={row.job.company_name} size={36} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ ...TYPE.h4, ...lineClamp(2) }} title={row.job.job_title}>
          {row.job.job_title}
        </Typography>
        <Typography sx={{ ...TYPE.micro, ...lineClamp(1) }}>{row.job.company_name}</Typography>
      </Box>
    </Box>
  );

  const applicationsLink = (row: ReportRow) => (
    <Box
      component={NextLink}
      href={`/admin/jobs-v2/${row.job.id}/applications`}
      aria-label={
        t("jobsV2.admin.viewApplicants", "View {{n}} applicants for {{title}}", {
          n: formatCount(row.job.applications_count ?? 0),
          title: row.job.job_title,
        }) as string
      }
      sx={{ display: "inline-flex", textDecoration: "none", borderRadius: 999, ...focusRing }}
    >
      <CountPill value={row.job.applications_count ?? 0} tone="azure" />
    </Box>
  );

  const scopeButton = (row: ReportRow) => {
    const active = selectedJobId === row.job.id;
    return (
      <Box
        component="button"
        type="button"
        onClick={() => onSelectJob(active ? null : row.job.id)}
        aria-pressed={active}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          minHeight: 32,
          px: 1.25,
          borderRadius: 999,
          border: `1px solid ${active ? J.azureBorder : J.hairline}`,
          bgcolor: active ? J.azureSoft : J.surface,
          color: active ? J.azureDeep : J.ink2,
          font: "inherit",
          fontSize: "0.75rem",
          fontWeight: 700,
          whiteSpace: "nowrap",
          cursor: "pointer",
          "&:hover": { borderColor: J.azureBorder },
          ...focusRing,
        }}
      >
        {active
          ? tr("jobsV2.reports.scoped", "In the funnel")
          : tr("jobsV2.reports.scopeTo", "Show funnel")}
      </Box>
    );
  };

  const columns = useMemo<Column<ReportRow>[]>(
    () => [
      {
        key: "job",
        header: tr("jobsV2.admin.col.job", "Job"),
        sortable: true,
        width: 260,
        render: jobCell,
      },
      {
        key: "status",
        header: tr("jobsV2.admin.col.status", "Status"),
        sortable: true,
        render: (row) => <StatusPill kind="job" value={row.job.status ?? "active"} />,
      },
      {
        key: "applicants",
        header: tr("jobsV2.admin.col.applicants", "Applicants"),
        sortable: true,
        align: "center",
        render: applicationsLink,
      },
      {
        key: "shortlisted",
        header: tr("jobsV2.appStatus.shortlisted", "Shortlisted"),
        align: "center",
        hideBelow: "lg",
        render: (row) => numberCell(row, (s) => s.reached.shortlisted),
      },
      {
        key: "selected",
        header: tr("jobsV2.appStatus.selected", "Selected"),
        align: "center",
        render: (row) => numberCell(row, (s) => s.reached.selected),
      },
      {
        key: "conversion",
        header: tr("jobsV2.reports.col.conversion", "Conversion"),
        align: "center",
        headerHelp: tr(
          "jobsV2.reports.conversionHelp",
          "Selected as a share of everyone who actually submitted.",
        ),
        render: (row) => {
          const value = conversionOf(row.stats);
          if (!row.stats) return row.statsError ? numberCell(row, () => 0) : pending(tr);
          return (
            <Typography component="span" sx={TYPE.mono}>
              {value === null ? "—" : `${value}%`}
            </Typography>
          );
        },
      },
      {
        key: "closes",
        header: tr("jobsV2.admin.col.closes", "Closes"),
        sortable: true,
        hideBelow: "lg",
        render: (row) => {
          const deadline = deadlineLabel(row.job.application_deadline);
          return (
            <Typography component="span" sx={{ ...TYPE.mono, whiteSpace: "nowrap" }}>
              {deadline ? formatDate(row.job.application_deadline) : "—"}
            </Typography>
          );
        },
      },
      {
        key: "scope",
        header: tr("jobsV2.reports.col.funnel", "Funnel"),
        align: "end",
        width: 132,
        render: scopeButton,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, rows, selectedJobId, onSelectJob],
  );

  const mobileCard = (row: ReportRow) => (
    <JCard sx={{ p: 2 }}>
      {jobCell(row)}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5, alignItems: "center" }}>
        <StatusPill kind="job" value={row.job.status ?? "active"} />
        {applicationsLink(row)}
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1.5 }}>
        <Box>
          <Typography sx={{ ...TYPE.eyebrow, color: J.ink3 }}>
            {tr("jobsV2.appStatus.shortlisted", "Shortlisted")}
          </Typography>
          {numberCell(row, (s) => s.reached.shortlisted)}
        </Box>
        <Box>
          <Typography sx={{ ...TYPE.eyebrow, color: J.ink3 }}>
            {tr("jobsV2.appStatus.selected", "Selected")}
          </Typography>
          {numberCell(row, (s) => s.reached.selected)}
        </Box>
        <Box>
          <Typography sx={{ ...TYPE.eyebrow, color: J.ink3 }}>
            {tr("jobsV2.reports.col.conversion", "Conversion")}
          </Typography>
          <Typography component="span" sx={TYPE.mono}>
            {conversionOf(row.stats) === null ? "—" : `${conversionOf(row.stats)}%`}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ ...TYPE.eyebrow, color: J.ink3 }}>
            {tr("jobsV2.admin.col.closes", "Closes")}
          </Typography>
          <Typography component="span" sx={TYPE.mono}>
            {row.job.application_deadline ? formatDate(row.job.application_deadline) : "—"}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ mt: 1.5 }}>{scopeButton(row)}</Box>
    </JCard>
  );

  return (
    <JDataTable<ReportRow>
      columns={columns}
      rows={rows}
      getRowId={(row) => row.job.id}
      getRowLabel={(row) => row.job.job_title}
      sort={sort}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isFiltered={isFiltered}
      empty={empty}
      emptyFiltered={emptyFiltered}
      caption={tr("jobsV2.reports.tableCaption", "Applicant totals for every job")}
      mobile={mobileCard}
    />
  );
}
