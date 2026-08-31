"use client";

import { useState, type ReactNode } from "react";
import { Box, Menu, MenuItem, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { JobApplicationV2 } from "@/lib/services/jobs-v2.service";
import { formatDate } from "@/lib/jobs-v2/format";
import {
  J,
  JAvatar,
  JButton,
  JCard,
  JDataTable,
  R,
  StatusPill,
  StatusSelect,
  TYPE,
  focusRing,
  type Column,
  type JDataTableSelection,
  type JDataTableSort,
} from "@/components/jobs-v2/ui";
import { PipelineRail } from "./PipelineRail";

export interface ApplicationsTableProps {
  rows: JobApplicationV2[];
  loading: boolean;
  refetching?: boolean;
  error: string | null;
  onRetry: () => void;
  isFiltered: boolean;
  empty: ReactNode;
  emptyFiltered: ReactNode;
  selection: JDataTableSelection;
  sort: JDataTableSort;
  /** Ids whose row control is mid-request. Every OTHER row stays enabled. */
  updatingIds: Set<number>;
  rowErrors: Record<number, string>;
  onOpen: (app: JobApplicationV2) => void;
  onOpenResume: (url: string) => void;
  onStatusChange: (app: JobApplicationV2, status: string) => void;
}

/**
 * The applicant table.
 *
 * Two columns are NEW and both were the recruiter's problem: `Stage`, because the entire
 * interview pipeline was invisible here, and `College`, because the mobile card carried more
 * information than the desktop table a recruiter actually screens on.
 *
 * The `#` column is DELETED: it was `idx + 1` over the sorted, filtered array, so it renumbered
 * on every sort and every search while looking like a stable applicant number.
 */
export function ApplicationsTable({
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
  onOpen,
  onOpenResume,
  onStatusChange,
}: ApplicationsTableProps) {
  const { t } = useTranslation("common");

  const candidateCell = (app: JobApplicationV2) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
      <JAvatar
        src={app.student_profile_pic_url ?? undefined}
        name={app.student_name || app.student_email}
        size={32}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={TYPE.h4} title={app.student_name || app.student_email}>
          {app.student_name || "—"}
        </Typography>
        <Typography sx={TYPE.mono} title={app.student_email}>
          {app.student_email}
        </Typography>
      </Box>
    </Box>
  );

  const statusCell = (app: JobApplicationV2) => (
    <Box sx={{ minWidth: 160 }}>
      <StatusSelect
        id={`app-status-${app.id}`}
        kind="application"
        dense
        value={app.status}
        onChange={(value) => onStatusChange(app, value)}
        busy={updatingIds.has(app.id)}
        error={rowErrors[app.id] ?? null}
      />
    </Box>
  );

  const columns: Column<JobApplicationV2>[] = [
    {
      key: "candidate",
      header: t("jobsV2.candidate.eyebrow", "Candidate"),
      sortable: true,
      render: candidateCell,
    },
    {
      key: "stage",
      header: t("jobsV2.candidate.pipeline", "Pipeline"),
      hideBelow: "lg",
      render: (app) => <PipelineRail app={app} />,
    },
    {
      key: "status",
      header: t("jobsV2.candidate.status", "Status"),
      sortable: true,
      width: 180,
      render: statusCell,
    },
    {
      key: "college",
      header: t("jobsV2.candidate.college", "College"),
      hideBelow: "lg",
      render: (app) => (
        <Typography sx={TYPE.body} title={app.student_college ?? undefined}>
          {app.student_college || "—"}
        </Typography>
      ),
    },
    {
      key: "applied_at",
      header: t("jobsV2.candidate.applied", "Applied"),
      sortable: true,
      width: 160,
      render: (app) => (
        <Typography sx={TYPE.mono}>{formatDate(app.applied_at, { withTime: true })}</Typography>
      ),
    },
    {
      key: "resume",
      header: t("jobsV2.candidate.resume", "Resume"),
      width: 120,
      render: (app) =>
        app.resume_url ? (
          <JButton
            variant="ghost"
            size="sm"
            startIcon="mdi:file-document-outline"
            onClick={() => onOpenResume(app.resume_url as string)}
          >
            {t("jobsV2.candidate.open", "Open")}
          </JButton>
        ) : (
          <Typography sx={TYPE.micro}>—</Typography>
        ),
    },
    {
      key: "actions",
      header: t("jobsV2.candidate.actions", "Actions"),
      align: "end",
      width: 72,
      render: (app) => (
        <RowMenu app={app} onOpen={onOpen} onOpenResume={onOpenResume} />
      ),
    },
  ];

  return (
    <JDataTable<JobApplicationV2>
      columns={columns}
      rows={rows}
      getRowId={(app) => app.id}
      getRowLabel={(app) => app.student_name || app.student_email}
      onRowClick={onOpen}
      selection={selection}
      sort={sort}
      loading={loading}
      refetching={refetching}
      error={error}
      onRetry={onRetry}
      isFiltered={isFiltered}
      empty={empty}
      emptyFiltered={emptyFiltered}
      caption={t("jobsV2.candidate.tableCaption", "Applicants for this job") as string}
      mobile={(app) => (
        // The card carries everything the table does — never less (spec 7.2).
        <JCard interactive onClick={() => onOpen(app)} sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
            {candidateCell(app)}
            <Box sx={{ ml: "auto" }}>
              <StatusPill kind="application" value={app.status} size="sm" />
            </Box>
          </Box>
          <Box sx={{ mt: 1.25, display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography sx={TYPE.micro}>
              {t("jobsV2.candidate.college", "College")}: {app.student_college || "—"}
            </Typography>
            <Typography sx={TYPE.micro}>
              {t("jobsV2.candidate.phone", "Phone")}: {app.student_phone || "—"}
            </Typography>
            <Typography sx={TYPE.micro}>
              {t("jobsV2.candidate.batch", "Batch / passout year")}:{" "}
              {app.student_yop ?? app.student_batch ?? "—"}
            </Typography>
            <Typography sx={TYPE.micro}>
              {t("jobsV2.candidate.degree", "Degree")}: {app.student_degree || "—"}
            </Typography>
            <Typography sx={TYPE.micro}>
              {t("jobsV2.candidate.location", "Location")}: {app.student_location || "—"}
            </Typography>
            <Typography sx={TYPE.micro}>
              {t("jobsV2.candidate.applied", "Applied")}:{" "}
              {formatDate(app.applied_at, { withTime: true })}
            </Typography>
          </Box>
          <Box sx={{ mt: 1.25 }}>
            <PipelineRail app={app} />
          </Box>
          <Box
            sx={{ mt: 1.25, display: "flex", gap: 1, flexWrap: "wrap" }}
            onClick={(event) => event.stopPropagation()}
          >
            {statusCell(app)}
            {app.resume_url && (
              <JButton
                variant="secondary"
                size="sm"
                startIcon="mdi:file-document-outline"
                onClick={() => onOpenResume(app.resume_url as string)}
              >
                {t("jobsV2.candidate.resume", "Resume")}
              </JButton>
            )}
            <JButton
              variant="secondary"
              size="sm"
              startIcon="mdi:account-box-outline"
              href={`/admin/profile/${app.student}`}
            >
              {t("jobsV2.candidate.viewProfile", "Profile")}
            </JButton>
          </Box>
        </JCard>
      )}
    />
  );
}

function RowMenu({
  app,
  onOpen,
  onOpenResume,
}: {
  app: JobApplicationV2;
  onOpen: (app: JobApplicationV2) => void;
  onOpenResume: (url: string) => void;
}) {
  const { t } = useTranslation("common");
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-label={t("jobsV2.candidate.rowActions", "Actions for {{name}}", {
          name: app.student_name || app.student_email,
        })}
        aria-haspopup="menu"
        onClick={(event: React.MouseEvent<HTMLElement>) => {
          event.stopPropagation();
          setAnchor(event.currentTarget);
        }}
        sx={{
          display: "grid",
          placeItems: "center",
          width: 40,
          height: 40,
          border: "none",
          p: 0,
          borderRadius: R.ctl,
          bgcolor: "transparent",
          color: J.ink3,
          cursor: "pointer",
          "&:hover": { bgcolor: J.surface3, color: J.ink },
          ...focusRing,
        }}
      >
        <IconWrapper icon="mdi:dots-vertical" size={18} />
      </Box>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        onClick={(event) => event.stopPropagation()}
        slotProps={{
          paper: {
            sx: {
              borderRadius: R.card,
              border: `1px solid ${J.hairline}`,
              bgcolor: J.surface,
              backgroundImage: "none",
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onOpen(app);
          }}
          sx={{ ...TYPE.body, color: J.ink, gap: 1 }}
        >
          <IconWrapper icon="mdi:account-details-outline" size={18} />
          {t("jobsV2.candidate.openCandidate", "Open this candidate")}
        </MenuItem>
        <MenuItem
          component="a"
          href={`/admin/profile/${app.student}`}
          onClick={() => setAnchor(null)}
          sx={{ ...TYPE.body, color: J.ink, gap: 1 }}
        >
          <IconWrapper icon="mdi:account-box-outline" size={18} />
          {t("jobsV2.candidate.viewProfile", "Profile")}
        </MenuItem>
        {app.resume_url && (
          <MenuItem
            onClick={() => {
              setAnchor(null);
              onOpenResume(app.resume_url as string);
            }}
            sx={{ ...TYPE.body, color: J.ink, gap: 1 }}
          >
            <IconWrapper icon="mdi:file-document-outline" size={18} />
            {t("jobsV2.candidate.resume", "Resume")}
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
