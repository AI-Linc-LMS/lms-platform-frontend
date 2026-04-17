"use client";

import { Box, LinearProgress, Typography } from "@mui/material";
import { JobCardV2 } from "@/components/jobs-v2/JobCardV2";
import { JobListHeader } from "@/components/jobs/JobListHeader";
import { JobPagination } from "@/components/jobs/JobPagination";
import { EmptyJobsIllustration, JobSearchIllustration } from "@/components/jobs-v2/illustrations";
import { AppliedJobsSection } from "@/components/jobs-v2/AppliedJobsSection";
import type { JobV2 } from "@/lib/services/jobs-v2.service";

export type JobsV2BrowseJobListSectionProps = {
  variant: "desktop" | "mobile";
  activeTab: "browse" | "applied";
  loading: boolean;
  paginatedJobs: JobV2[];
  filteredTotal: number;
  pageSize: number;
  page: number;
  pageFromQuery: number;
  onPageChange: (e: unknown, value: number) => void;
  onPageSizeChange: (size: number) => void;
  onFavoriteChange: (jobId: number, favorited: boolean) => void;
  onBrowseJobs: () => void;
};

export function JobsV2BrowseJobListSection({
  variant,
  activeTab,
  loading,
  paginatedJobs,
  filteredTotal,
  pageSize,
  page,
  pageFromQuery,
  onPageChange,
  onPageSizeChange,
  onFavoriteChange,
  onBrowseJobs,
}: JobsV2BrowseJobListSectionProps) {
  const isMobile = variant === "mobile";

  if (activeTab === "applied") {
    return <AppliedJobsSection onBrowseJobs={onBrowseJobs} />;
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: isMobile ? 200 : 320,
          gap: 2,
        }}
      >
        <JobSearchIllustration width={isMobile ? 80 : 100} height={isMobile ? 64 : 80} primaryColor="#a5b4fc" />
        <Typography color="text.secondary">Loading jobs...</Typography>
        <LinearProgress sx={{ width: "60%", height: 4, borderRadius: 2 }} />
      </Box>
    );
  }

  if (paginatedJobs.length === 0 && activeTab === "browse") {
    return (
      <Box
        sx={{
          p: isMobile ? 5 : 6,
          textAlign: "center",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <EmptyJobsIllustration
          width={isMobile ? 140 : 160}
          height={isMobile ? 110 : 125}
          primaryColor="#94a3b8"
        />
        <Typography variant="h6" sx={{ mt: 2, fontWeight: 600, color: isMobile ? "#1e293b" : "#0f172a" }}>
          No jobs found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: isMobile ? undefined : 360 }}>
          {isMobile
            ? "Try adjusting your filters or search terms"
            : "Try adjusting your filters or search terms to find more opportunities"}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {isMobile ? (
        <JobListHeader
          totalCount={filteredTotal}
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
          <JobListHeader
            totalCount={filteredTotal}
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
          />
        </Box>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, ...(isMobile ? { mt: 2 } : {}) }}>
        {paginatedJobs.map((job) => (
          <JobCardV2 key={job.id} job={job} listPage={pageFromQuery} onFavoriteChange={onFavoriteChange} />
        ))}
      </Box>
      <Box sx={{ mt: 3, ...(isMobile ? { mb: 4 } : {}) }}>
        <JobPagination
          totalCount={filteredTotal}
          pageSize={pageSize}
          page={page}
          onPageChange={onPageChange}
        />
      </Box>
    </>
  );
}
