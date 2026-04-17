"use client";

import { Box, Typography, Tabs, Tab } from "@mui/material";
import { NaukriJobSearchBar } from "@/components/jobs/NaukriJobSearchBar";
import { JobFiltersSidebar } from "@/components/jobs/JobFiltersSidebar";
import { JobSearchIllustration } from "@/components/jobs-v2/illustrations";
import { JobsV2BrowseJobListSection } from "@/components/jobs-v2/JobsV2BrowseJobListSection";
import type { JobsV2BrowseLayoutProps } from "@/components/jobs-v2/jobsV2BrowseTypes";

export function JobsV2BrowseDesktop(props: JobsV2BrowseLayoutProps) {
  const {
    searchInput,
    locationInput,
    experienceInput,
    locationOptions,
    compatibleFilters,
    jobsForFilters,
    handleSearchInputChange,
    handleSearchClear,
    handleSearchClick,
    setLocationInput,
    setExperienceInput,
    navigateToListPage,
    handleFilterChange,
    handleClearAllFilters,
    activeTab,
    setActiveTab,
    loading,
    paginatedJobs,
    filteredJobsLength,
    pageSize,
    page,
    pageFromQuery,
    handlePageChange,
    handlePageSizeChange,
    handleFavoriteChange,
  } = props;

  return (
    <Box
      sx={{
        display: { xs: "none", lg: "flex" },
        flexDirection: "column",
        minHeight: "calc(100vh - 64px)",
        backgroundColor: "#f5f7fa",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          gap: { xs: 2, md: 4 },
          p: 3,
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)",
          borderBottom: "1px solid",
          borderColor: "divider",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(99, 102, 241, 0.06)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            width: { xs: "100%", md: 180 },
            height: { xs: 120, md: 140 },
            position: "relative",
            zIndex: 1,
          }}
        >
          <JobSearchIllustration width={160} height={128} primaryColor="#6366f1" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Find your next opportunity
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2.5 }}>
            Search jobs by role, company, or skills. Filter by location and work type.
          </Typography>
          <Box sx={{ maxWidth: 960, width: "100%" }}>
            <NaukriJobSearchBar
              searchQuery={searchInput}
              onSearchChange={handleSearchInputChange}
              onClear={handleSearchClear}
              location={locationInput}
              onLocationChange={(v) => {
                setLocationInput(v);
                navigateToListPage(1, { replace: true });
              }}
              experience={experienceInput}
              onExperienceChange={(v) => {
                setExperienceInput(v);
                navigateToListPage(1, { replace: true });
              }}
              locationOptions={locationOptions}
              onSearch={handleSearchClick}
            />
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flex: 1 }}>
        <Box
          sx={{
            width: 280,
            flexShrink: 0,
            p: 2.5,
            backgroundColor: "#fff",
            borderInlineEnd: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "#4338ca" }}>
            Refine results
          </Typography>
          <JobFiltersSidebar
            filters={compatibleFilters}
            jobs={jobsForFilters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAllFilters}
          />
        </Box>

        <Box sx={{ flex: 1, p: 3, backgroundColor: "#f8fafc", minWidth: 0 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v: "browse" | "applied") => setActiveTab(v)}
            sx={{
              mb: 2,
              "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
              "& .Mui-selected": { color: "#6366f1" },
              "& .MuiTabs-indicator": { backgroundColor: "#6366f1" },
            }}
          >
            <Tab label="Browse Jobs" value="browse" />
            <Tab label="Applied Jobs" value="applied" />
          </Tabs>
          <JobsV2BrowseJobListSection
            variant="desktop"
            activeTab={activeTab}
            loading={loading}
            paginatedJobs={paginatedJobs}
            filteredTotal={filteredJobsLength}
            pageSize={pageSize}
            page={page}
            pageFromQuery={pageFromQuery}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onFavoriteChange={handleFavoriteChange}
            onBrowseJobs={() => setActiveTab("browse")}
          />
        </Box>
      </Box>
    </Box>
  );
}
