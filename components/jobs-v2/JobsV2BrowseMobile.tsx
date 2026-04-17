"use client";

import { Box, Typography, Tabs, Tab } from "@mui/material";
import { NaukriJobSearchBar } from "@/components/jobs/NaukriJobSearchBar";
import { MobileJobFilters } from "@/components/jobs/MobileJobFilters";
import { JobSearchIllustration } from "@/components/jobs-v2/illustrations";
import { JobsV2BrowseJobListSection } from "@/components/jobs-v2/JobsV2BrowseJobListSection";
import type { JobsV2BrowseLayoutProps } from "@/components/jobs-v2/jobsV2BrowseTypes";

export function JobsV2BrowseMobile(props: JobsV2BrowseLayoutProps) {
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
        display: { xs: "flex", lg: "none" },
        flexDirection: "column",
        minHeight: "calc(100vh - 64px)",
        overflow: "hidden",
        backgroundColor: "#f8fafc",
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          p: 2,
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)",
          borderBottom: "1px solid",
          borderColor: "divider",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <JobSearchIllustration width={48} height={38} primaryColor="#6366f1" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a" }}>
              Jobs
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Find opportunities
            </Typography>
          </Box>
        </Box>
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
          size="small"
        />
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: { xs: 2, sm: 3 },
          pb: { xs: 6, sm: 4 },
          backgroundColor: "#f5f7fa",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Box sx={{ mb: 2 }}>
          <MobileJobFilters
            searchQuery={searchInput}
            filters={compatibleFilters}
            jobs={jobsForFilters}
            onSearchChange={handleSearchInputChange}
            onFilterChange={handleFilterChange}
            onSearchClear={handleSearchClear}
            hideSearch
          />
        </Box>

        <Tabs
          value={activeTab}
          onChange={(_, v: "browse" | "applied") => setActiveTab(v)}
          sx={{
            mb: 2,
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 40 },
            "& .Mui-selected": { color: "#6366f1" },
            "& .MuiTabs-indicator": { backgroundColor: "#6366f1" },
          }}
        >
          <Tab label="Browse Jobs" value="browse" />
          <Tab label="Applied Jobs" value="applied" />
        </Tabs>

        <JobsV2BrowseJobListSection
          variant="mobile"
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
  );
}
