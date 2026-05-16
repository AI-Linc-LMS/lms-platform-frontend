"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Tooltip,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import {
  isExternalJsonFeedJob,
  isExternalJsonJobSuppressedOnStudentBoard,
} from "@/lib/jobs/external-json-jobs-store";
import { EmptyJobsIllustration } from "@/components/jobs-v2/illustrations";
import { CompanyLogoAvatar } from "@/components/jobs-v2/CompanyLogoAvatar";
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Users } from "lucide-react";
import {
  ADMIN_JOB_STATUS_STYLES,
  ADMIN_JOB_STATUS_OPTIONS,
  ADMIN_JOBS_HEADER_LABEL_SX,
  formatAdminJobsDate,
  daysUntilAdminJobDeadline,
  type AdminJobsTab,
} from "./adminJobsGrid";

export type AdminJobsV2ListPanelProps = {
  loading: boolean;
  adminTab: AdminJobsTab;
  platformJobCount: number;
  jobs: JobV2[];
  paginatedJobs: JobV2[];
  page: number;
  pageSize: number;
  maxPage: number;
  showAdminJobDateColumns: boolean;
  gridTemplateColumns: string;
  selectedIds: Set<number>;
  pageSelectionState: {
    allOnPageSelected: boolean;
    indeterminateOnPage: boolean;
  };
  updating: boolean;
  onRowClick: (job: JobV2) => void;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onStatusChange: (job: JobV2, status: string) => void;
  onMenuOpen: (e: React.MouseEvent, job: JobV2) => void;
  footer: ReactNode;
  createdSortOrder: "desc" | "asc";
  onToggleCreatedSort: () => void;
};

export function AdminJobsV2ListPanel({
  loading,
  adminTab,
  platformJobCount,
  jobs,
  paginatedJobs,
  page,
  pageSize,
  maxPage,
  showAdminJobDateColumns,
  gridTemplateColumns,
  selectedIds,
  pageSelectionState,
  updating,
  onRowClick,
  onToggleSelect,
  onToggleSelectAll,
  onStatusChange,
  onMenuOpen,
  footer,
  createdSortOrder,
  onToggleCreatedSort,
}: AdminJobsV2ListPanelProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "none",
        borderRadius: 3,
        overflow: "hidden",
        backgroundColor: "#fff",
        boxShadow: "0 2px 16px rgba(15, 23, 42, 0.06)",
        width: "100%",
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: {
          md: adminTab === "platform" && platformJobCount < 10 ? "auto" : "min(480px, calc(100vh - 220px))",
        },
      }}
    >
      {loading ? (
        <Box
          sx={{
            p: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            backgroundColor: "#fff",
          }}
        >
          <CircularProgress sx={{ color: "#6366f1" }} size={44} thickness={3} />
          <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>
            Loading jobs...
          </Typography>
        </Box>
      ) : jobs.length === 0 ? (
        <Box
          sx={{
            p: 8,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "#fff",
          }}
        >
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              backgroundColor: "rgba(99, 102, 241, 0.04)",
              display: "inline-flex",
            }}
          >
            <EmptyJobsIllustration width={120} height={100} />
          </Box>
          <Typography variant="h6" sx={{ mt: 3, fontWeight: 700, color: "#0f172a" }}>
            {adminTab === "available" ? "No available feed listings" : "No platform jobs yet"}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "#64748b", maxWidth: 360 }}>
            {adminTab === "available"
              ? "Either the JSON feed is empty, every listing already exists as a platform job, or nothing remains after deduplication by apply link."
              : "Create your first job to start receiving applications from students."}
          </Typography>
          {adminTab === "platform" && (
            <Button
              variant="contained"
              component={Link}
              href="/admin/jobs-v2/new"
              startIcon={<IconWrapper icon="mdi:plus" size={20} />}
              sx={{
                mt: 3,
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                backgroundColor: "#6366f1",
                "&:hover": { backgroundColor: "#4f46e5" },
              }}
            >
              Create Job
            </Button>
          )}
        </Box>
      ) : (
        <>
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              width: "100%",
              maxWidth: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              p: 2.5,
              WebkitOverflowScrolling: "touch",
            }}
          >
            {!(adminTab === "platform" && platformJobCount < 10) && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.75,
                  borderRadius: 3,
                  backgroundColor: "rgba(99, 102, 241, 0.06)",
                  border: "none",
                  boxShadow: "0 2px 12px rgba(15, 23, 42, 0.06)",
                }}
              >
                <Checkbox
                  checked={pageSelectionState.allOnPageSelected}
                  indeterminate={pageSelectionState.indeterminateOnPage}
                  onChange={onToggleSelectAll}
                  sx={{ color: "#64748b", "&.Mui-checked": { color: "#6366f1" } }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                  Select page
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  {jobs.length} jobs
                  {maxPage > 1 ? ` · Page ${page} / ${maxPage}` : ""}
                </Typography>
              </Box>
            )}
            <Box
              sx={{
                display: { xs: "none", md: "grid" },
                gridTemplateColumns: gridTemplateColumns,
                columnGap: adminTab === "available" && showAdminJobDateColumns ? 2 : 1.5,
                alignItems: "center",
                py: 1.25,
                px: 0,
                borderRadius: 3,
                bgcolor: "rgba(99, 102, 241, 0.06)",
              }}
            >
              <Box aria-hidden />
              <Box aria-hidden />
              <Typography component="div" sx={ADMIN_JOBS_HEADER_LABEL_SX}>
                Job title
              </Typography>
              <Typography component="div" sx={ADMIN_JOBS_HEADER_LABEL_SX}>
                Company
              </Typography>
              <Typography component="div" sx={ADMIN_JOBS_HEADER_LABEL_SX}>
                Location
              </Typography>
              {adminTab === "platform" && (
                <Typography component="div" sx={ADMIN_JOBS_HEADER_LABEL_SX}>
                  Status
                </Typography>
              )}
              <Typography component="div" sx={ADMIN_JOBS_HEADER_LABEL_SX}>
                {adminTab === "platform" ? "Visibility" : "Student feed"}
              </Typography>
              <Typography component="div" sx={ADMIN_JOBS_HEADER_LABEL_SX}>
                Applications
              </Typography>
              {showAdminJobDateColumns && (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.25,
                      minWidth: 0,
                    }}
                  >
                    <Typography component="div" sx={ADMIN_JOBS_HEADER_LABEL_SX}>
                      Created
                    </Typography>
                    <Tooltip
                      title={
                        createdSortOrder === "desc"
                          ? "Newest first — click for oldest first"
                          : "Oldest first — click for newest first"
                      }
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCreatedSort();
                        }}
                        aria-label={
                          createdSortOrder === "desc"
                            ? "Switch to oldest jobs first"
                            : "Switch to newest jobs first"
                        }
                        sx={{
                          p: 0.25,
                          color: "#6366f1",
                          "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.12)" },
                        }}
                      >
                        {createdSortOrder === "desc" ? (
                          <ArrowDownWideNarrow size={16} strokeWidth={2.25} />
                        ) : (
                          <ArrowUpWideNarrow size={16} strokeWidth={2.25} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography component="div" sx={ADMIN_JOBS_HEADER_LABEL_SX}>
                    Closes
                  </Typography>
                </>
              )}
              <Box aria-hidden />
            </Box>
            {paginatedJobs.map((job) => {
              const days = daysUntilAdminJobDeadline(job.application_deadline);
              const isUrgent = days !== null && days >= 0 && days <= 7;
              const visibilityChip =
                adminTab === "available" ? (
                  <Chip
                    label={
                      isExternalJsonJobSuppressedOnStudentBoard(job) ? "Unavailable" : "Available"
                    }
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 26,
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      borderColor: isExternalJsonJobSuppressedOnStudentBoard(job)
                        ? "rgba(220, 38, 38, 0.45)"
                        : "rgba(34, 197, 94, 0.5)",
                      color: isExternalJsonJobSuppressedOnStudentBoard(job) ? "#b91c1c" : "#16a34a",
                      backgroundColor: isExternalJsonJobSuppressedOnStudentBoard(job)
                        ? "rgba(220, 38, 38, 0.06)"
                        : "rgba(34, 197, 94, 0.08)",
                    }}
                  />
                ) : isExternalJsonFeedJob(job) ? (
                  <Chip
                    label="Student feed"
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 26,
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      borderColor: "rgba(14, 165, 233, 0.5)",
                      color: "#0284c7",
                      backgroundColor: "rgba(14, 165, 233, 0.08)",
                    }}
                  />
                ) : (
                  <Chip
                    label={job.is_published ? "Published" : "Draft"}
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 26,
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      borderColor: job.is_published ? "rgba(34, 197, 94, 0.5)" : "rgba(100, 116, 139, 0.5)",
                      color: job.is_published ? "#16a34a" : "#64748b",
                      backgroundColor: job.is_published ? "rgba(34, 197, 94, 0.08)" : "rgba(100, 116, 139, 0.08)",
                    }}
                  />
                );
              const applicationsCell = isExternalJsonFeedJob(job) ? (
                <Tooltip title="Applications are only tracked for platform jobs." arrow>
                  <Box
                    component="span"
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 1.5,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#94a3b8",
                      cursor: "default",
                    }}
                  >
                    <Users size={14} />—
                  </Box>
                </Tooltip>
              ) : (
                <Box
                  component={Link}
                  href={`/admin/jobs-v2/${job.id}/applications`}
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1.25,
                    py: 0.5,
                    borderRadius: 1.5,
                    backgroundColor: "rgba(99, 102, 241, 0.08)",
                    color: "#6366f1",
                    textDecoration: "none",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.15)" },
                  }}
                >
                  <Users size={14} />
                  {job.applications_count ?? 0}
                </Box>
              );
              return (
                <Paper
                  key={job.id}
                  elevation={0}
                  onClick={() => onRowClick(job)}
                  sx={{
                    p: 2.5,
                    cursor: "pointer",
                    border: "none",
                    borderRadius: 3,
                    transition: "all 0.2s ease",
                    backgroundColor: "#fff",
                    boxShadow: "0 2px 16px rgba(15, 23, 42, 0.07)",
                    "&:hover": {
                      backgroundColor: "rgba(99, 102, 241, 0.03)",
                      boxShadow: "0 8px 28px rgba(99, 102, 241, 0.14)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: { xs: "none", md: "grid" },
                      gridTemplateColumns: gridTemplateColumns,
                      columnGap: adminTab === "available" && showAdminJobDateColumns ? 2 : 1.5,
                      alignItems: "center",
                      rowGap: 0.5,
                    }}
                  >
                    <Checkbox
                      checked={selectedIds.has(job.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleSelect(job.id);
                      }}
                      sx={{ color: "#64748b", "&.Mui-checked": { color: "#6366f1" }, p: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <CompanyLogoAvatar
                      logoUrl={job.company_logo}
                      companyName={job.company_name}
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1.5,
                        fontSize: "1rem",
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ minWidth: 0, display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "#0f172a",
                          lineHeight: 1.35,
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {job.job_title}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#64748b",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        lineHeight: 1.35,
                      }}
                    >
                      {job.company_name?.trim() ? job.company_name : "—"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#64748b",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        lineHeight: 1.35,
                      }}
                    >
                      {job.location?.trim() ? job.location : "—"}
                    </Typography>
                    {adminTab === "platform" && (
                      <FormControl size="small" sx={{ minWidth: 0, maxWidth: "100%" }} onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={job.status ?? "active"}
                          onChange={(e) => onStatusChange(job, e.target.value)}
                          disabled={updating || isExternalJsonFeedJob(job)}
                          sx={{
                            fontSize: "0.75rem",
                            height: 28,
                            fontWeight: 600,
                            borderRadius: 1.5,
                            backgroundColor: (ADMIN_JOB_STATUS_STYLES[job.status ?? "active"] ?? ADMIN_JOB_STATUS_STYLES.active)
                              .bg,
                            color: (ADMIN_JOB_STATUS_STYLES[job.status ?? "active"] ?? ADMIN_JOB_STATUS_STYLES.active).color,
                            "& .MuiSelect-select": { py: 0.25 },
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
                            "&:hover": { opacity: 0.9 },
                          }}
                        >
                          {ADMIN_JOB_STATUS_OPTIONS.map((o) => (
                            <MenuItem key={o.value} value={o.value}>
                              {o.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    <Box sx={{ minWidth: 0 }} onClick={(e) => e.stopPropagation()}>
                      {visibilityChip}
                    </Box>
                    <Box sx={{ minWidth: 0 }} onClick={(e) => e.stopPropagation()}>
                      {applicationsCell}
                    </Box>
                    {showAdminJobDateColumns && (
                      <>
                        <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8rem" }}>
                          {formatAdminJobsDate(job.created_at)}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: job.application_deadline
                              ? isUrgent
                                ? "#d97706"
                                : "#64748b"
                              : "#94a3b8",
                            fontSize: "0.8rem",
                            fontWeight: job.application_deadline && isUrgent ? 600 : 400,
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {job.application_deadline ? (
                            <>
                              {formatAdminJobsDate(job.application_deadline)}
                              {isUrgent &&
                                days !== null &&
                                ` · ${days === 0 ? "Today" : days === 1 ? "1 day" : `${days} days`}`}
                            </>
                          ) : (
                            "—"
                          )}
                        </Typography>
                      </>
                    )}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMenuOpen(e, job);
                      }}
                      sx={{ color: "#94a3b8", flexShrink: 0, "&:hover": { color: "#64748b" } }}
                      aria-label="Actions"
                    >
                      <IconWrapper icon="mdi:dots-vertical" size={20} />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: { xs: "block", md: "none" } }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                      <Checkbox
                        checked={selectedIds.has(job.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          onToggleSelect(job.id);
                        }}
                        sx={{ color: "#64748b", "&.Mui-checked": { color: "#6366f1" }, p: 0, mt: 0.5 }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <CompanyLogoAvatar
                        logoUrl={job.company_logo}
                        companyName={job.company_name}
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1.5,
                          fontSize: "1rem",
                          flexShrink: 0,
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap", mb: 0.25 }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: "#0f172a",
                              lineHeight: 1.35,
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {job.job_title}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#64748b",
                            display: "block",
                            mb: 1.5,
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {job.company_name}
                          {job.location && ` • ${job.location}`}
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
                          {adminTab === "platform" && (
                            <FormControl size="small" sx={{ minWidth: 110 }} onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={job.status ?? "active"}
                                onChange={(e) => onStatusChange(job, e.target.value)}
                                disabled={updating || isExternalJsonFeedJob(job)}
                                sx={{
                                  fontSize: "0.75rem",
                                  height: 28,
                                  fontWeight: 600,
                                  borderRadius: 1.5,
                                  backgroundColor: (
                                    ADMIN_JOB_STATUS_STYLES[job.status ?? "active"] ?? ADMIN_JOB_STATUS_STYLES.active
                                  ).bg,
                                  color: (
                                    ADMIN_JOB_STATUS_STYLES[job.status ?? "active"] ?? ADMIN_JOB_STATUS_STYLES.active
                                  ).color,
                                  "& .MuiSelect-select": { py: 0.25 },
                                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
                                  "&:hover": { opacity: 0.9 },
                                }}
                              >
                                {ADMIN_JOB_STATUS_OPTIONS.map((o) => (
                                  <MenuItem key={o.value} value={o.value}>
                                    {o.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                          {visibilityChip}
                          {applicationsCell}
                        </Box>
                        {showAdminJobDateColumns && (
                          <Box sx={{ display: "flex", gap: 2, mt: 1.5, flexWrap: "wrap" }}>
                            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                              Created {formatAdminJobsDate(job.created_at)}
                            </Typography>
                            {job.application_deadline && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: isUrgent ? "#d97706" : "#94a3b8",
                                  fontWeight: isUrgent ? 600 : 400,
                                }}
                              >
                                Closes {formatAdminJobsDate(job.application_deadline)}
                                {isUrgent &&
                                  days !== null &&
                                  ` • ${days === 0 ? "Today" : days === 1 ? "1 day" : `${days} days`} left`}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMenuOpen(e, job);
                        }}
                        sx={{ color: "#94a3b8", flexShrink: 0, "&:hover": { color: "#64748b" } }}
                        aria-label="Actions"
                      >
                        <IconWrapper icon="mdi:dots-vertical" size={20} />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
          {footer}
        </>
      )}
    </Paper>
  );
}
