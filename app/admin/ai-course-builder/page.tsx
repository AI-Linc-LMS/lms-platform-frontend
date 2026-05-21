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
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { aiCourseBuilderService } from "@/lib/services/admin/ai-course-builder.service";
import type { CourseBuilderJobListItem } from "@/lib/services/admin/ai-course-builder.service";
import { AICourseBuilderHeader } from "@/components/admin/ai-course-builder/AICourseBuilderHeader";
import { AICourseBuilderActions } from "@/components/admin/ai-course-builder/AICourseBuilderActions";
import { AIJobCard } from "@/components/admin/ai-course-builder/AIJobCard";
import {
  AIJobStatsSection,
  type AIJobFilter,
} from "@/components/admin/ai-course-builder/AIJobStatsSection";

const POLL_INTERVAL_MS = 10000;
const DEFAULT_ROWS_PER_PAGE = 10;

const STATUS_FILTER_KEYS: Record<string, string> = {
  outline_ready: "outlineReady",
  generating_outline: "generatingOutline",
  generating_content: "generatingContent",
  completed: "completed",
  failed: "failed",
  pending: "pending",
  creating_structure: "creatingStructure",
};

export default function AICourseBuilderPage() {
  const { showToast } = useToast();
  const { t } = useTranslation("common");

  function statusFilterLabel(value: string): string {
    const key = STATUS_FILTER_KEYS[value];
    return key ? t(`adminAICourseBuilder.${key}`) : value;
  }
  const [jobs, setJobs] = useState<CourseBuilderJobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [inputTypeFilter, setInputTypeFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<AIJobFilter>("all");
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
            error instanceof Error ? error.message : t("adminAICourseBuilder.failedToLoadJobs"),
            "error"
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [showToast, t]
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
    switch (activeFilter) {
      case "outline_ready":
        return filteredBySearch.filter((job) => job.status === "outline_ready");
      case "in_progress":
        return filteredBySearch.filter(
          (job) => job.status === "generating_outline" || job.status === "generating_content"
        );
      case "completed":
        return filteredBySearch.filter((job) => job.status === "completed");
      case "failed":
        return filteredBySearch.filter((job) => job.status === "failed");
      case "all":
      default:
        return filteredBySearch;
    }
  }, [filteredBySearch, activeFilter]);

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
  const failedCount = jobs.filter((j) => j.status === "failed").length;

  const handleActiveFilterChange = (filter: AIJobFilter) => {
    setActiveFilter(filter);
    setPage(1);
  };

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
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--card-bg)",
            boxShadow:
              "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
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
            <AIJobStatsSection
              outlineReadyCount={outlineReadyCount}
              inProgressCount={generatingCount}
              completedCount={completedCount}
              failedCount={failedCount}
              totalCount={jobs.length}
              activeFilter={activeFilter}
              onFilterChange={handleActiveFilterChange}
            />

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
                    bgcolor:
                      "color-mix(in srgb, var(--success-500) 12%, var(--surface) 88%)",
                    border:
                      "1px solid color-mix(in srgb, var(--success-500) 35%, var(--border-default) 65%)",
                  }}
                >
                  <CircularProgress size={14} sx={{ color: "var(--success-500)" }} />
                  <Typography variant="caption" sx={{ color: "var(--success-500)", fontWeight: 500 }}>
                    {t("adminAICourseBuilder.liveUpdating")}
                  </Typography>
                </Box>
              )}
              <AICourseBuilderActions buttonsOnly />
            </Box>
          </Box>

          {/* Search and info in one line */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 2,
              mb: 2,
            }}
          >
            <AICourseBuilderActions
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
            />
            {(searchQuery || activeFilter !== "all" || inputTypeFilter) && (
              <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                {t("adminAICourseBuilder.jobsMatch", { count: filteredJobs.length })}
                {(searchQuery || activeFilter !== "all" || inputTypeFilter) && ` ${t("adminAICourseBuilder.filters")}`}
              </Typography>
            )}
          </Box>

          {filteredJobs.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                {searchQuery || activeFilter !== "all" || inputTypeFilter
                  ? t("adminAICourseBuilder.noMatchingJobs")
                  : t("adminAICourseBuilder.noGenerationJobsYet")}
              </Typography>
              <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 3 }}>
                {searchQuery || activeFilter !== "all" || inputTypeFilter
                  ? t("adminAICourseBuilder.tryDifferentFilter")
                  : t("adminAICourseBuilder.getStartedDescription")}
              </Typography>
              {(searchQuery || activeFilter !== "all" || inputTypeFilter) && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    component="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveFilter("all");
                      setInputTypeFilter("");
                      setPage(1);
                    }}
                    sx={{
                      color: "var(--accent-indigo)",
                      cursor: "pointer",
                      textDecoration: "underline",
                      border: "none",
                      background: "none",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  >
                    {t("adminAICourseBuilder.clearAllFilters")}
                  </Typography>
                </Box>
              )}
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
                <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                  {t("adminAICourseBuilder.showingJobs", {
                    start: (pageSafe - 1) * rowsPerPage + 1,
                    end: Math.min(pageSafe * rowsPerPage, totalFiltered),
                    total: totalFiltered,
                  })}
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
