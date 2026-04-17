"use client";

import { Suspense } from "react";
import Link from "next/link";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  InputAdornment,
  Select,
  TextField,
  CircularProgress,
  LinearProgress,
  Tabs,
  Tab,
  Tooltip,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  isExternalJsonFeedJob,
  isExternalJsonJobSuppressedOnStudentBoard,
} from "@/lib/jobs/external-json-jobs-store";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ArrowDownWideNarrow, ArrowUpWideNarrow, CheckSquare, X } from "lucide-react";
import { useAdminJobsV2ListState } from "@/hooks/useAdminJobsV2ListState";
import { AdminJobsV2ListPanel } from "@/components/admin/jobs-v2/AdminJobsV2ListPanel";
import {
  ADMIN_JOB_STATUS_STYLES,
  ADMIN_JOB_STATUS_OPTIONS,
} from "@/components/admin/jobs-v2/adminJobsGrid";

function AdminJobsV2PageInner() {
  const s = useAdminJobsV2ListState();

  return (
    <MainLayout fullWidthContent>
      <Box
        sx={{
          minHeight: "100%",
          background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
          px: { xs: 2, md: 3 },
          py: { xs: 1.5, md: 2 },
          maxWidth: "100%",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "flex-end" },
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
            pb: 2,
            borderBottom: "1px solid",
            borderColor: "rgba(0,0,0,0.06)",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, flexWrap: "wrap" }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1.5rem", sm: "1.75rem" },
                  letterSpacing: "-0.025em",
                  color: "#0f172a",
                  lineHeight: 1.2,
                }}
              >
                Jobs
              </Typography>
              {!s.loading && s.jobs.length > 0 && (
                <Chip
                  label={`${s.jobs.length} ${s.jobs.length === 1 ? "job" : "jobs"}`}
                  size="small"
                  sx={{
                    height: 24,
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    backgroundColor: "rgba(99, 102, 241, 0.1)",
                    color: "#6366f1",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                  }}
                />
              )}
            </Box>
            <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5, fontSize: "0.9375rem" }}>
              Manage job postings and applications
            </Typography>
            <Tabs
              value={s.adminTab}
              onChange={s.handleAdminTabChange}
              sx={{
                mt: 1.5,
                minHeight: 40,
                "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 40 },
              }}
            >
              <Tab label={`Platform jobs (${s.platformJobs.length})`} value="platform" />
              <Tab label={`Available jobs (${s.availableJobs.length})`} value="available" />
            </Tabs>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
            {s.adminTab === "platform" && (
              <FormControl
                size="small"
                sx={{
                  minWidth: 140,
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#fff",
                    borderRadius: 2,
                    fontSize: "0.875rem",
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(99, 102, 241, 0.5)" },
                  },
                }}
              >
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={s.statusFilter}
                  label="Filter by Status"
                  onChange={(e) => {
                    s.setStatusFilter(
                      e.target.value as "active" | "inactive" | "closed" | "completed" | "on_hold" | ""
                    );
                    s.setSelectedIds(new Set());
                    s.navigateToListPage(1, { replace: true });
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="on_hold">On Hold</MenuItem>
                </Select>
              </FormControl>
            )}
            {!s.showAdminJobDateColumns && s.jobs.length > 0 && (
              <Tooltip
                title={
                  s.createdSortOrder === "desc"
                    ? "Created: newest first — click for oldest first"
                    : "Created: oldest first — click for newest first"
                }
              >
                <IconButton
                  size="small"
                  onClick={s.toggleCreatedSortOrder}
                  aria-label={
                    s.createdSortOrder === "desc"
                      ? "Sort created date: switch to oldest first"
                      : "Sort created date: switch to newest first"
                  }
                  sx={{
                    border: "1px solid rgba(99, 102, 241, 0.35)",
                    borderRadius: 2,
                    backgroundColor: "#fff",
                    color: "#6366f1",
                    "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.08)" },
                  }}
                >
                  {s.createdSortOrder === "desc" ? (
                    <ArrowDownWideNarrow size={18} strokeWidth={2.25} />
                  ) : (
                    <ArrowUpWideNarrow size={18} strokeWidth={2.25} />
                  )}
                </IconButton>
              </Tooltip>
            )}
            {s.adminTab === "available" && (
              <>
                <TextField
                  size="small"
                  placeholder="Search jobs…"
                  value={s.availableSearchDraft}
                  onChange={(e) => s.setAvailableSearchDraft(e.target.value)}
                  sx={{
                    minWidth: { xs: "100%", sm: 220 },
                    flex: { xs: 1, sm: "none" },
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#fff",
                      borderRadius: 2,
                      fontSize: "0.875rem",
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(99, 102, 241, 0.5)" },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconWrapper icon="mdi:magnify" size={18} style={{ color: "#94a3b8" }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  select
                  id="admin-jobs-v2-student-feed-status"
                  size="small"
                  label="Student feed status"
                  value={s.studentFeedAllowFilter || "all"}
                  onChange={(e) => {
                    const v = e.target.value as "all" | "allowed" | "not_allowed";
                    s.handleStudentFeedAllowFilterChange(v === "all" ? "" : v);
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    minWidth: { xs: "100%", sm: 200 },
                    flex: { xs: 1, sm: "none" },
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#fff",
                      borderRadius: 2,
                      fontSize: "0.875rem",
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(99, 102, 241, 0.5)" },
                    },
                  }}
                >
                  <MenuItem value="all">All listings</MenuItem>
                  <MenuItem value="allowed">Available</MenuItem>
                  <MenuItem value="not_allowed">Unavailable</MenuItem>
                </TextField>
              </>
            )}
            <Button
              variant="outlined"
              component={Link}
              href="/admin/jobs-v2/reports"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                borderColor: "rgba(99, 102, 241, 0.4)",
                color: "#6366f1",
                "&:hover": { borderColor: "#6366f1", backgroundColor: "rgba(99, 102, 241, 0.06)" },
              }}
            >
              Reports
            </Button>
            <Button
              variant="contained"
              component={Link}
              href="/admin/jobs-v2/new"
              startIcon={<IconWrapper icon="mdi:plus" size={20} />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                backgroundColor: "#6366f1",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
                "&:hover": { backgroundColor: "#4f46e5", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)" },
              }}
            >
              Create Job
            </Button>
          </Box>
        </Box>

        {s.selectedIds.size > 0 && (
          <Paper
            elevation={0}
            sx={{
              mb: 2,
              p: 2,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
              border: "2px solid",
              borderColor: "rgba(99, 102, 241, 0.4)",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(99, 102, 241, 0.02) 100%)",
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.08)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  backgroundColor: "rgba(99, 102, 241, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckSquare size={20} style={{ color: "#6366f1" }} />
              </Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 700, color: "#0f172a" }}>
                  {s.selectedIds.size} job{s.selectedIds.size !== 1 ? "s" : ""} selected
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {s.adminTab === "platform"
                    ? "Change status and/or visibility for selected platform jobs."
                    : "Approve selected listings for the student job board (/jobs-v2). Feed jobs stay off the board until you allow them."}
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => {
                  s.setSelectedIds(new Set());
                  s.setBulkStatus("");
                  s.setBulkVisibility("");
                }}
                startIcon={<X size={16} />}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  color: "text.secondary",
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.04)", color: "text.primary" },
                }}
              >
                Clear
              </Button>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexWrap: "wrap",
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {s.adminTab === "platform" ? (
                <>
                  <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 160 }, flex: { xs: 1, sm: "none" } }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={s.bulkStatus}
                      label="Status"
                      onChange={(e) => s.setBulkStatus(e.target.value)}
                      sx={{
                        backgroundColor: "#fff",
                        borderRadius: 2,
                        fontWeight: 600,
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(99, 102, 241, 0.4)" },
                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#6366f1" },
                      }}
                    >
                      <MenuItem value="">—</MenuItem>
                      {ADMIN_JOB_STATUS_OPTIONS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: (ADMIN_JOB_STATUS_STYLES[o.value] ?? ADMIN_JOB_STATUS_STYLES.active).color,
                              }}
                            />
                            {o.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 140 }, flex: { xs: 1, sm: "none" } }}>
                    <InputLabel>Visibility</InputLabel>
                    <Select
                      value={s.bulkVisibility}
                      label="Visibility"
                      onChange={(e) => s.setBulkVisibility(e.target.value)}
                      sx={{
                        backgroundColor: "#fff",
                        borderRadius: 2,
                        fontWeight: 600,
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(99, 102, 241, 0.4)" },
                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#6366f1" },
                      }}
                    >
                      <MenuItem value="">—</MenuItem>
                      <MenuItem value="published">Published</MenuItem>
                      <MenuItem value="draft">Draft</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    onClick={s.handleBulkUpdate}
                    disabled={(!s.bulkStatus && !s.bulkVisibility) || s.updating}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      backgroundColor: "#6366f1",
                      px: 3,
                      py: 1.25,
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
                      "&:hover": { backgroundColor: "#4f46e5", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)" },
                      "&:disabled": { backgroundColor: "rgba(99, 102, 241, 0.5)" },
                    }}
                  >
                    {s.updating ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CircularProgress size={16} sx={{ color: "#fff" }} />
                        Updating...
                      </Box>
                    ) : (
                      "Apply to Selected"
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={() => s.handleBulkStudentFeedVisibility("hide")}
                    sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                  >
                    Remove from student board
                  </Button>
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => s.handleBulkStudentFeedVisibility("show")}
                    sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                  >
                    Allow on student board
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={s.handleHideAllAvailableFromStudentBoard}
                    sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                  >
                    Remove all from board ({s.availableJobs.length})
                  </Button>
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={s.handleShowAllAvailableOnStudentBoard}
                    sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                  >
                    Allow all on board ({s.availableJobs.length})
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 400, lineHeight: 1.4 }}>
                    Students only see platform jobs until you allow feed listings here. Per-row actions use the
                    selection; Remove all / Allow all applies to every Available job ({s.availableJobs.length} total).
                    Stored in this browser&apos;s localStorage.
                  </Typography>
                </>
              )}
            </Box>
          </Paper>
        )}

        <AdminJobsV2ListPanel
          loading={s.loading}
          adminTab={s.adminTab}
          platformJobCount={s.platformJobs.length}
          jobs={s.jobs}
          paginatedJobs={s.paginatedJobs}
          page={s.page}
          pageSize={s.pageSize}
          maxPage={s.maxPage}
          showAdminJobDateColumns={s.showAdminJobDateColumns}
          gridTemplateColumns={s.adminJobsGridTemplateColumns}
          selectedIds={s.selectedIds}
          pageSelectionState={s.pageSelectionState}
          updating={s.updating}
          onRowClick={s.handleRowClick}
          onToggleSelect={s.toggleSelect}
          onToggleSelectAll={s.toggleSelectAll}
          onStatusChange={s.handleStatusChange}
          onMenuOpen={s.handleMenuOpen}
          footer={s.adminJobsFooterEl}
          createdSortOrder={s.createdSortOrder}
          onToggleCreatedSort={s.toggleCreatedSortOrder}
        />

        <Menu
          anchorEl={s.menuAnchor?.el ?? null}
          open={!!s.menuAnchor}
          onClose={s.handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                minWidth: 180,
                borderRadius: 2,
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                mt: 1.5,
              },
            },
          }}
        >
          <MenuItem onClick={s.handleMenuEdit}>
            <ListItemIcon>
              <IconWrapper icon="mdi:pencil" size={18} />
            </ListItemIcon>
            <ListItemText
              primary={s.menuAnchor && isExternalJsonFeedJob(s.menuAnchor.job) ? "Import as platform job" : "Edit"}
              secondary={
                s.menuAnchor && isExternalJsonFeedJob(s.menuAnchor.job)
                  ? "Opens create form with fields filled"
                  : undefined
              }
              secondaryTypographyProps={{ variant: "caption", sx: { whiteSpace: "normal" } }}
            />
          </MenuItem>
          {s.menuAnchor &&
            isExternalJsonFeedJob(s.menuAnchor.job) && [
              <MenuItem
                key="hide-from-student-board"
                onClick={() => {
                  s.toggleOneStudentFeedVisibility(s.menuAnchor!.job, "hide");
                  s.handleMenuClose();
                }}
                disabled={isExternalJsonJobSuppressedOnStudentBoard(s.menuAnchor.job)}
              >
                <ListItemIcon>
                  <IconWrapper icon="mdi:eye-off-outline" size={18} />
                </ListItemIcon>
                <ListItemText
                  primary="Remove from student board"
                  secondary="Stops showing on /jobs-v2"
                  secondaryTypographyProps={{ variant: "caption" }}
                />
              </MenuItem>,
              <MenuItem
                key="show-on-student-board"
                onClick={() => {
                  s.toggleOneStudentFeedVisibility(s.menuAnchor!.job, "show");
                  s.handleMenuClose();
                }}
                disabled={!isExternalJsonJobSuppressedOnStudentBoard(s.menuAnchor.job)}
              >
                <ListItemIcon>
                  <IconWrapper icon="mdi:eye-outline" size={18} />
                </ListItemIcon>
                <ListItemText
                  primary="Allow on student board"
                  secondary="Shows on /jobs-v2 for students"
                  secondaryTypographyProps={{ variant: "caption" }}
                />
              </MenuItem>,
            ]}
          <MenuItem
            onClick={s.handleMenuApplications}
            disabled={!!s.menuAnchor && isExternalJsonFeedJob(s.menuAnchor.job)}
          >
            <ListItemIcon>
              <IconWrapper icon="mdi:account-group" size={18} />
            </ListItemIcon>
            <ListItemText>Applications</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={s.handleMenuDelete}
            disabled={!!s.menuAnchor && isExternalJsonFeedJob(s.menuAnchor.job)}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon>
              <IconWrapper icon="mdi:delete-outline" size={18} />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        <ConfirmDialog
          open={!!s.deleteConfirm}
          title="Delete Job"
          message={
            s.deleteConfirm
              ? `Are you sure you want to delete "${s.deleteConfirm.job_title}"? This action cannot be undone.`
              : ""
          }
          confirmText="Delete"
          cancelText="Cancel"
          confirmColor="error"
          onConfirm={s.handleDeleteConfirm}
          onCancel={() => s.setDeleteConfirm(null)}
        />
      </Box>
    </MainLayout>
  );
}

export default function AdminJobsV2Page() {
  return (
    <Suspense
      fallback={
        <MainLayout fullWidthContent>
          <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
            <LinearProgress sx={{ width: "50%", maxWidth: 400 }} />
          </Box>
        </MainLayout>
      }
    >
      <AdminJobsV2PageInner />
    </Suspense>
  );
}
