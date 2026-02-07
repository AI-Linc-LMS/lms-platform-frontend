"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Paper,
  CircularProgress,
  Typography,
  Pagination,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { aiCourseBuilderService } from "@/lib/services/admin/ai-course-builder.service";
import type { CourseBuilderJobListItem } from "@/lib/services/admin/ai-course-builder.service";
import { AICourseBuilderHeader } from "@/components/admin/ai-course-builder/AICourseBuilderHeader";
import { AICourseBuilderActions } from "@/components/admin/ai-course-builder/AICourseBuilderActions";
import { AIJobCard } from "@/components/admin/ai-course-builder/AIJobCard";

const POLL_INTERVAL_MS = 5000;
const DEFAULT_ROWS_PER_PAGE = 10;

const STATUS_FILTER_LABELS: Record<string, string> = {
  outline_ready: "Outline ready",
  generating_outline: "Generating outline",
  generating_content: "Generating content",
  completed: "Completed",
  failed: "Failed",
  pending: "Pending",
  creating_structure: "Creating structure",
};

function statusFilterLabel(value: string): string {
  return STATUS_FILTER_LABELS[value] ?? value;
}

export default function AICourseBuilderPage() {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<CourseBuilderJobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [inputTypeFilter, setInputTypeFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const loadJobs = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const data = await aiCourseBuilderService.listJobs();
        setJobs(Array.isArray(data) ? data : []);
      } catch (error: unknown) {
        if (!silent) {
          showToast(
            error instanceof Error ? error.message : "Failed to load jobs",
            "error"
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const hasGeneratingJobs = useMemo(
    () =>
      jobs.some(
        (j) =>
          j.status === "generating_outline" || j.status === "generating_content"
      ),
    [jobs]
  );

  useEffect(() => {
    if (!hasGeneratingJobs) return;
    const id = setInterval(() => loadJobs(true), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasGeneratingJobs, loadJobs]);

  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return jobs;
    const query = searchQuery.toLowerCase();
    return jobs.filter(
      (job) =>
        (job.course_title ?? "").toLowerCase().includes(query) ||
        (job.input_type ?? "").toLowerCase().includes(query) ||
        (job.status ?? "").toLowerCase().includes(query)
    );
  }, [jobs, searchQuery]);

  const filteredByStatus = useMemo(() => {
    if (!statusFilter) return filteredBySearch;
    return filteredBySearch.filter((job) => job.status === statusFilter);
  }, [filteredBySearch, statusFilter]);

  const filteredJobs = useMemo(() => {
    if (!inputTypeFilter) return filteredByStatus;
    return filteredByStatus.filter((job) => job.input_type === inputTypeFilter);
  }, [filteredByStatus, inputTypeFilter]);

  const totalFiltered = filteredJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / rowsPerPage));
  const pageSafe = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages && totalPages >= 1) setPage(1);
  }, [totalPages, page]);

  const paginatedJobs = useMemo(
    () =>
      filteredJobs.slice(
        (pageSafe - 1) * rowsPerPage,
        pageSafe * rowsPerPage
      ),
    [filteredJobs, pageSafe, rowsPerPage]
  );

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleInputTypeFilterChange = (value: string) => {
    setInputTypeFilter(value);
    setPage(1);
  };

  const outlineReadyCount = jobs.filter((j) => j.status === "outline_ready").length;
  const generatingCount = jobs.filter(
    (j) => j.status === "generating_outline" || j.status === "generating_content"
  ).length;
  const completedCount = jobs.filter((j) => j.status === "completed").length;

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 400,
            }}
          >
            <CircularProgress />
          </Box>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <AICourseBuilderHeader />

        <Paper
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", lg: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "stretch", lg: "center" },
              mb: 4,
              gap: 3,
            }}
          >
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: "#111827",
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                  mb: 1,
                }}
              >
                Generation jobs
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280", mb: 2 }}>
                Here is a glimpse of your AI course generation progress.
              </Typography>
              {jobs.length > 0 && (
                <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: "#3b82f6",
                      }}
                    />
                    <Typography variant="body2" sx={{ color: "#6b7280" }}>
                      <Typography
                        component="span"
                        sx={{ fontWeight: 600, color: "#3b82f6" }}
                      >
                        {outlineReadyCount}
                      </Typography>{" "}
                      Outline ready
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: "#f59e0b",
                      }}
                    />
                    <Typography variant="body2" sx={{ color: "#6b7280" }}>
                      <Typography
                        component="span"
                        sx={{ fontWeight: 600, color: "#f59e0b" }}
                      >
                        {generatingCount}
                      </Typography>{" "}
                      In progress
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: "#10b981",
                      }}
                    />
                    <Typography variant="body2" sx={{ color: "#6b7280" }}>
                      <Typography
                        component="span"
                        sx={{ fontWeight: 600, color: "#10b981" }}
                      >
                        {completedCount}
                      </Typography>{" "}
                      Completed
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: "#6b7280",
                      }}
                    />
                    <Typography variant="body2" sx={{ color: "#6b7280" }}>
                      <Typography
                        component="span"
                        sx={{ fontWeight: 600, color: "#6b7280" }}
                      >
                        {jobs.length}
                      </Typography>{" "}
                      Total
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: { lg: "flex-end" } }}>
              {hasGeneratingJobs && (
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                  }}
                >
                  <CircularProgress size={14} sx={{ color: "#059669" }} />
                  <Typography variant="caption" sx={{ color: "#047857", fontWeight: 500 }}>
                    Live — updating every 5s
                  </Typography>
                </Box>
              )}
              <AICourseBuilderActions buttonsOnly />
            </Box>
          </Box>

          {/* Filter and search in one line */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 2,
              mb: 2,
            }}
          >
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                displayEmpty
                sx={{ bgcolor: "background.paper" }}
                renderValue={(v) => (v ? statusFilterLabel(v) : "All statuses")}
              >
                <MenuItem value="">All statuses</MenuItem>
                {Object.entries(STATUS_FILTER_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <AICourseBuilderActions
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
            />
            {(searchQuery || statusFilter || inputTypeFilter) && (
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                {filteredJobs.length} job(s) match
                {(searchQuery || statusFilter || inputTypeFilter) && " filters"}
              </Typography>
            )}
          </Box>

          {filteredJobs.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                No generation jobs yet
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280", mb: 3 }}>
                Get started by generating a course outline from a description or
                a structured plan.
              </Typography>
              <AICourseBuilderActions buttonsOnly />
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    lg: "repeat(3, 1fr)",
                  },
                  gap: 3,
                }}
              >
                {paginatedJobs.map((job) => (
                  <AIJobCard key={job.job_id} job={job} />
                ))}
              </Box>

              {/* Pagination */}
              <Box
                sx={{
                  mt: 3,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Showing {(pageSafe - 1) * rowsPerPage + 1}–
                  {Math.min(pageSafe * rowsPerPage, totalFiltered)} of{" "}
                  {totalFiltered} job(s)
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 56 }}>
                    <Select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      <MenuItem value={6}>6</MenuItem>
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={15}>15</MenuItem>
                      <MenuItem value={25}>25</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                    </Select>
                  </FormControl>
                  <Pagination
                    count={totalPages}
                    page={pageSafe}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </MainLayout>
  );
}
