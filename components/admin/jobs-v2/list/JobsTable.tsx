"use client";

import { useMemo, type ReactNode } from "react";
import NextLink from "next/link";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  CompanyLogo,
  CountPill,
  J,
  JCard,
  JDataTable,
  StatusPill,
  StatusSelect,
  TYPE,
  focusRing,
  lineClamp,
  type Column,
  type JDataTableSelection,
  type JDataTableSort,
} from "@/components/jobs-v2/ui";
import { deadlineLabel, formatCount, formatDate } from "@/lib/jobs-v2/format";
import type { JobV2 } from "@/lib/services/jobs-v2.service";

const URGENCY_COLOR: Record<string, string> = {
  none: J.ink3,
  soon: J.warnFg,
  urgent: J.dangerFg,
  past: J.ink4,
};

export interface JobsTableProps {
  rows: JobV2[];
  loading: boolean;
  /** Dim-and-lock instead of blanking the table on a refetch. */
  refetching?: boolean;
  error?: string | null;
  onRetry: () => void;
  isFiltered: boolean;
  empty: ReactNode;
  emptyFiltered: ReactNode;
  selection: JDataTableSelection;
  sort: JDataTableSort;
  /** Ids whose single-row status write is in flight. Only THOSE rows show a spinner. */
  updatingIds: Set<number>;
  /** Per-row inline failure, shown under the row's status control. */
  rowErrors: Record<number, string>;
  onStatusChange: (job: JobV2, status: string) => void;
  onOpenMenu: (anchor: HTMLElement, job: JobV2) => void;
}

/**
 * The admin jobs table.
 *
 * What changed beyond the chrome:
 *   - **The Company column is deleted** — it duplicated the Job cell's own caption. The
 *     reclaimed width goes to Location, which had no column at all and was being truncated
 *     inside that caption.
 *   - Rows are real links (`getRowHref`), so they are keyboard reachable, middle-clickable and
 *     announced as links instead of being a `TableRow onClick` with `cursor: pointer`.
 *   - `Status` is visibly a control (`StatusSelect`) and `Visibility` is visibly not
 *     (`StatusPill`, Draft dashed). The five job statuses no longer sit two greens apart.
 *   - A single-row status write marks **only that row** busy; every other row stays usable.
 */
export function JobsTable({
  rows,
  loading,
  refetching,
  error,
  onRetry,
  isFiltered,
  empty,
  emptyFiltered,
  selection,
  sort,
  updatingIds,
  rowErrors,
  onStatusChange,
  onOpenMenu,
}: JobsTableProps) {
  const { t } = useTranslation("common");

  const jobCell = (job: JobV2) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
      <CompanyLogo src={job.company_logo} name={job.company_name} size={40} />
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
          <Typography component="span" sx={{ ...TYPE.h4, ...lineClamp(2) }} title={job.job_title}>
            {job.job_title}
          </Typography>
          {job.source === "scraped" && (
            <StatusPill
              kind="scraped"
              value="imported"
              size="sm"
              label={t("jobsV2.admin.scrapedTag", "Scraped") as string}
            />
          )}
        </Box>
        <Typography sx={{ ...TYPE.micro, ...lineClamp(1) }} title={job.company_name}>
          {job.company_name}
        </Typography>
      </Box>
    </Box>
  );

  const statusCell = (job: JobV2) => (
    <Box sx={{ minWidth: 132 }} onClick={(event) => event.stopPropagation()}>
      <StatusSelect
        kind="job"
        value={job.status ?? "active"}
        onChange={(value) => onStatusChange(job, value)}
        busy={updatingIds.has(job.id)}
        disabled={updatingIds.has(job.id)}
        dense
        error={rowErrors[job.id] ?? null}
        aria-label={t("jobsV2.admin.statusFor", "Status for {{title}}", {
          title: job.job_title,
        }) as string}
      />
    </Box>
  );

  const applicantsCell = (job: JobV2) => (
    <Box
      component={NextLink}
      href={`/admin/jobs-v2/${job.id}/applications`}
      onClick={(event) => event.stopPropagation()}
      aria-label={
        t("jobsV2.admin.viewApplicants", "View {{n}} applicants for {{title}}", {
          n: formatCount(job.applications_count ?? 0),
          title: job.job_title,
        }) as string
      }
      sx={{
        display: "inline-flex",
        textDecoration: "none",
        borderRadius: 999,
        ...focusRing,
      }}
    >
      <CountPill value={job.applications_count ?? 0} tone="azure" />
    </Box>
  );

  const closesCell = (job: JobV2) => {
    const deadline = deadlineLabel(job.application_deadline);
    if (!deadline) {
      return (
        <Typography sx={{ ...TYPE.micro, color: J.ink4 }} aria-label={t("jobsV2.admin.noDeadline", "No closing date") as string}>
          {"—"}
        </Typography>
      );
    }
    return (
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ ...TYPE.mono, whiteSpace: "nowrap" }}>
          {formatDate(job.application_deadline)}
        </Typography>
        <Typography
          sx={{
            ...TYPE.micro,
            color: URGENCY_COLOR[deadline.urgency] ?? J.ink3,
            fontWeight: deadline.urgency === "none" ? 500 : 700,
          }}
        >
          {deadline.text}
        </Typography>
      </Box>
    );
  };

  const coursesCell = (job: JobV2) => {
    const list = job.courses ?? [];
    if (list.length === 0) {
      return <Typography sx={{ ...TYPE.micro, color: J.ink4 }}>{"—"}</Typography>;
    }
    const full = list.map((c) => c.title).join(", ");
    return (
      <Tooltip title={full} arrow>
        <Typography sx={{ ...TYPE.small, ...lineClamp(1), maxWidth: 180 }}>
          {list.length <= 2 ? full : `${list[0].title} +${list.length - 1}`}
        </Typography>
      </Tooltip>
    );
  };

  const kebab = (job: JobV2) => (
    <IconButton
      size="small"
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        onOpenMenu(event.currentTarget, job);
      }}
      aria-label={t("jobsV2.admin.actionsFor", "Actions for {{title}}", {
        title: job.job_title,
      }) as string}
      aria-haspopup="menu"
      sx={{ color: J.ink3, "&:hover": { color: J.ink, bgcolor: J.surface2 }, ...focusRing }}
    >
      <IconWrapper icon="mdi:dots-vertical" size={20} />
    </IconButton>
  );

  const columns = useMemo<Column<JobV2>[]>(
    () => [
      {
        key: "job",
        header: t("jobsV2.admin.col.job", "Job") as string,
        sortable: true,
        width: 280,
        render: jobCell,
      },
      {
        key: "location",
        header: t("jobsV2.admin.col.location", "Location") as string,
        render: (job) => (
          <Typography sx={{ ...TYPE.small, ...lineClamp(1) }} title={job.location ?? undefined}>
            {job.location || "—"}
          </Typography>
        ),
      },
      {
        key: "status",
        header: t("jobsV2.admin.col.status", "Status") as string,
        sortable: true,
        render: statusCell,
      },
      {
        key: "visibility",
        header: t("jobsV2.admin.col.visibility", "Visibility") as string,
        hideBelow: "md",
        render: (job) => <StatusPill kind="visibility" value={Boolean(job.is_published)} />,
      },
      {
        key: "courses",
        header: t("jobsV2.admin.col.courses", "Courses") as string,
        hideBelow: "lg",
        render: coursesCell,
      },
      {
        key: "applicants",
        header: t("jobsV2.admin.col.applicants", "Applicants") as string,
        sortable: true,
        align: "center",
        render: applicantsCell,
      },
      {
        key: "created",
        header: t("jobsV2.admin.col.created", "Created") as string,
        sortable: true,
        hideBelow: "lg",
        render: (job) => (
          <Typography sx={{ ...TYPE.mono, whiteSpace: "nowrap" }}>
            {formatDate(job.created_at)}
          </Typography>
        ),
      },
      {
        key: "closes",
        header: t("jobsV2.admin.col.closes", "Closes") as string,
        sortable: true,
        render: closesCell,
      },
      {
        key: "actions",
        header: t("jobsV2.admin.col.actions", "Actions") as string,
        align: "end",
        width: 72,
        render: kebab,
      },
    ],
    // The cell renderers close over props that change every render; rebuilding the column
    // array with them is correct and cheap (nine entries).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, updatingIds, rowErrors, onStatusChange, onOpenMenu],
  );

  const mobileCard = (job: JobV2) => {
    const deadline = deadlineLabel(job.application_deadline);
    return (
      // NOT a link wrapper: the card carries a status control and a kebab, and interactive
      // content inside an <a> is invalid and unusable by keyboard. The title is the link.
      <JCard sx={{ p: 2, pr: 7 }}>
        <Box sx={{ display: "flex", gap: 1.5, minWidth: 0 }}>
          <CompanyLogo src={job.company_logo} name={job.company_name} size={44} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
              <Typography
                component={NextLink}
                href={`/admin/jobs-v2/${job.id}`}
                sx={{
                  ...TYPE.h4,
                  ...lineClamp(2),
                  textDecoration: "none",
                  "&:hover": { color: J.azure },
                  ...focusRing,
                }}
                title={job.job_title}
              >
                {job.job_title}
              </Typography>
              {job.source === "scraped" && (
                <StatusPill
                  kind="scraped"
                  value="imported"
                  size="sm"
                  label={t("jobsV2.admin.scrapedTag", "Scraped") as string}
                />
              )}
            </Box>
            <Typography sx={{ ...TYPE.micro }}>
              {[job.company_name, job.location].filter(Boolean).join(" · ")}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5, alignItems: "center" }}>
          <StatusPill kind="job" value={job.status ?? "active"} />
          <StatusPill kind="visibility" value={Boolean(job.is_published)} />
          {applicantsCell(job)}
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1.5 }}>
          <Typography sx={TYPE.micro}>
            {t("jobsV2.admin.createdOn", "Created {{date}}", {
              date: formatDate(job.created_at),
            })}
          </Typography>
          {deadline && (
            <Typography
              sx={{
                ...TYPE.micro,
                color: URGENCY_COLOR[deadline.urgency] ?? J.ink3,
                fontWeight: deadline.urgency === "none" ? 500 : 700,
              }}
            >
              {deadline.text}
            </Typography>
          )}
          {(job.courses ?? []).length > 0 && (
            <Typography sx={TYPE.micro}>
              {t("jobsV2.admin.courseCount", "{{n}} courses", {
                n: formatCount((job.courses ?? []).length),
              })}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1, mt: 1.5, alignItems: "center", flexWrap: "wrap" }}>
          <Box sx={{ minWidth: 150 }}>
            <StatusSelect
              kind="job"
              value={job.status ?? "active"}
              onChange={(value) => onStatusChange(job, value)}
              busy={updatingIds.has(job.id)}
              disabled={updatingIds.has(job.id)}
              error={rowErrors[job.id] ?? null}
              aria-label={t("jobsV2.admin.statusFor", "Status for {{title}}", {
                title: job.job_title,
              }) as string}
            />
          </Box>
          {kebab(job)}
        </Box>
      </JCard>
    );
  };

  return (
    <JDataTable<JobV2>
      data-tour-id="jobs-v2-list"
      columns={columns}
      rows={rows}
      getRowId={(job) => job.id}
      getRowHref={(job) => `/admin/jobs-v2/${job.id}`}
      getRowLabel={(job) => job.job_title}
      selection={selection}
      sort={sort}
      loading={loading}
      refetching={refetching}
      error={error}
      onRetry={onRetry}
      isFiltered={isFiltered}
      empty={empty}
      emptyFiltered={emptyFiltered}
      caption={t("jobsV2.admin.tableCaption", "Jobs posted by your institution") as string}
      mobile={mobileCard}
    />
  );
}
