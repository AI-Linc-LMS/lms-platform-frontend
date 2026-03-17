"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { adminJobsV2Service } from "@/lib/services/admin/admin-jobs-v2.service";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { config } from "@/lib/config";
import { JobDetailModal } from "@/components/admin/jobs-v2/JobDetailModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { CreateJobIllustration, EmptyJobsIllustration } from "@/components/jobs-v2/illustrations";

export default function AdminJobsV2Page() {
  const router = useRouter();
  const { showToast } = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [jobs, setJobs] = useState<JobV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailJob, setDetailJob] = useState<JobV2 | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; job: JobV2 } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<JobV2 | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminJobsV2Service.getJobs(config.clientId);
      setJobs(data.results ?? []);
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to load jobs", "error");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleRowClick = useCallback(
    async (job: JobV2) => {
      try {
        const fullJob = await adminJobsV2Service.getJob(job.id, config.clientId);
        setDetailJob(fullJob);
      } catch (err) {
        showToast((err as Error)?.message ?? "Failed to load job details", "error");
      }
    },
    [showToast]
  );

  const handleMenuOpen = (e: React.MouseEvent, job: JobV2) => {
    e.stopPropagation();
    setMenuAnchor({ el: e.currentTarget as HTMLElement, job });
  };

  const handleMenuClose = () => setMenuAnchor(null);

  const handleMenuEdit = () => {
    if (menuAnchor) {
      router.push(`/admin/jobs-v2/${menuAnchor.job.id}/edit`);
    }
    handleMenuClose();
  };

  const handleMenuApplications = () => {
    if (menuAnchor) {
      router.push(`/admin/jobs-v2/${menuAnchor.job.id}/applications`);
    }
    handleMenuClose();
  };

  const handleMenuDelete = () => {
    if (menuAnchor) setDeleteConfirm(menuAnchor.job);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      await adminJobsV2Service.deleteJob(deleteConfirm.id, config.clientId);
      showToast("Job deleted successfully", "success");
      setDeleteConfirm(null);
      setDetailJob(null);
      loadJobs();
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to delete job", "error");
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  const formatCourses = (job: JobV2) => {
    const list = job.courses ?? [];
    if (list.length === 0) return "—";
    if (list.length <= 2) return list.map((c) => c.title).join(", ");
    return `${list[0].title} +${list.length - 1} more`;
  };

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            mb: 2,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CreateJobIllustration width={48} height={40} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
                Jobs
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage job postings and applications
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              component={Link}
              href="/admin/jobs-v2/reports"
              sx={{ textTransform: "none" }}
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
                backgroundColor: "#6366f1",
                "&:hover": { backgroundColor: "#4f46e5" },
              }}
            >
              Create Job
            </Button>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <Box sx={{ p: 4, textAlign: "center" }}>Loading...</Box>
          ) : jobs.length === 0 ? (
            <Box
              sx={{
                p: 6,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <EmptyJobsIllustration width={140} height={110} />
              <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                No jobs yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Create your first job to get started
              </Typography>
            </Box>
          ) : isMobile ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                p: 2,
                maxHeight: { xs: "calc(100vh - 280px)", sm: 520 },
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {jobs.map((job) => (
                <Paper
                  key={job.id}
                  elevation={0}
                  onClick={() => void handleRowClick(job)}
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: "rgba(99, 102, 241, 0.3)",
                      backgroundColor: "rgba(99, 102, 241, 0.02)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <Avatar
                      src={job.company_logo}
                      alt={job.company_name}
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 1.5,
                        backgroundColor: "#6366f1",
                        color: "#fff",
                        fontSize: "0.875rem",
                        flexShrink: 0,
                      }}
                    >
                      {job.company_name?.[0]?.toUpperCase() || "C"}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
                        {job.job_title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                        {job.company_name}
                        {job.location && ` • ${job.location}`}
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
                        <Chip
                          label={job.job_type ?? "job"}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: "#6366f1",
                            color: "#6366f1",
                            fontWeight: 500,
                            height: 24,
                            fontSize: "0.75rem",
                          }}
                        />
                        <Chip
                          label={job.is_published ? "Published" : "Draft"}
                          size="small"
                          color={job.is_published ? "success" : "default"}
                          variant="outlined"
                          sx={{ height: 24, fontSize: "0.75rem" }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                          ♥ {job.favorites_count ?? 0}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, job);
                      }}
                      sx={{ color: "text.secondary", flexShrink: 0 }}
                      aria-label="Actions"
                    >
                      <IconWrapper icon="mdi:dots-vertical" size={20} />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 520 }}>
              <Table
                stickyHeader
                size="small"
                sx={{
                  "& .MuiTableCell-root": { py: 1.5 },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: "#fafafa", minWidth: 200 }}>
                      Job
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: "#fafafa" }}>Company</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: "#fafafa" }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: "#fafafa" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: "#fafafa" }}>Courses</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: "#fafafa", width: 90 }} align="center">
                      Favourites
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: "#fafafa" }}>Created</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: "#fafafa" }}>Deadline</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: "#fafafa", width: 180 }} align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow
                      key={job.id}
                      hover
                      onClick={() => void handleRowClick(job)}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { backgroundColor: "action.hover" },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            src={job.company_logo}
                            alt={job.company_name}
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 1,
                              backgroundColor: "#6366f1",
                              color: "#fff",
                              fontSize: "0.875rem",
                            }}
                          >
                            {job.company_name?.[0]?.toUpperCase() || "C"}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {job.job_title}
                            </Typography>
                            {job.location && (
                              <Typography variant="caption" color="text.secondary">
                                {job.location}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{job.company_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={job.job_type ?? "job"}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: "#6366f1",
                            color: "#6366f1",
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={job.is_published ? "Published" : "Draft"}
                          size="small"
                          color={job.is_published ? "success" : "default"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 180 }}>
                        <Tooltip title={(job.courses ?? []).map((c) => c.title).join(", ") || "—"} arrow>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 160,
                            }}
                          >
                            {formatCourses(job)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Students who favourited this job" arrow>
                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                            <Box component="span" sx={{ color: "#6366f1", fontSize: "0.875rem" }}>♥</Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {job.favorites_count ?? 0}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(job.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {job.application_deadline ? formatDate(job.application_deadline) : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Actions" arrow>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, job)}
                            sx={{ color: "text.secondary" }}
                            aria-label="Actions"
                          >
                            <IconWrapper icon="mdi:dots-vertical" size={20} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Menu
          anchorEl={menuAnchor?.el ?? null}
          open={!!menuAnchor}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { minWidth: 160 } } }}
        >
          <MenuItem onClick={handleMenuEdit}>
            <ListItemIcon>
              <IconWrapper icon="mdi:pencil" size={18} />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuApplications}>
            <ListItemIcon>
              <IconWrapper icon="mdi:account-group" size={18} />
            </ListItemIcon>
            <ListItemText>Applications</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuDelete} sx={{ color: "error.main" }}>
            <ListItemIcon>
              <IconWrapper icon="mdi:delete-outline" size={18} />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        <ConfirmDialog
          open={!!deleteConfirm}
          title="Delete Job"
          message={
            deleteConfirm
              ? `Are you sure you want to delete "${deleteConfirm.job_title}"? This action cannot be undone.`
              : ""
          }
          confirmText="Delete"
          cancelText="Cancel"
          confirmColor="error"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />

        <JobDetailModal
          open={!!detailJob}
          onClose={() => setDetailJob(null)}
          job={detailJob}
          onEdit={(job) => {
            setDetailJob(null);
            router.push(`/admin/jobs-v2/${job.id}/edit`);
          }}
          onDelete={(job) => {
            setDetailJob(null);
            setDeleteConfirm(job);
          }}
        />
      </Box>
    </MainLayout>
  );
}
