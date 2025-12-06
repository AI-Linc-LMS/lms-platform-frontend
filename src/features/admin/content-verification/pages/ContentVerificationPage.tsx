import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Alert,
  Snackbar,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import {
  getContentTypeCount,
  getContents,
} from "../../../../services/admin/contentApis";
import ContentStatsCard from "../components/ContentStatsCard";
import ContentFilters from "../components/ContentFilters";
import ContentTable from "../components/ContentTable";
import {
  ContentListItem,
  ContentFilters as Filters,
  initialFilters,
  CONTENT_TYPE_CONFIG,
} from "../types";

const ContentVerificationPage = () => {
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch content type counts
  const { data: contentCounts } = useQuery({
    queryKey: ["contentTypeCounts", clientId],
    queryFn: () => getContentTypeCount(clientId),
  });

  // Fetch all contents
  const {
    data: contents = [],
    isLoading,
  } = useQuery({
    queryKey: ["contents", clientId],
    queryFn: () => getContents(clientId),
  });

  // Filter contents based on filters
  const filteredContents = useMemo(() => {
    return contents.filter((content) => {
      // Type filter
      if (filters.type !== "All" && content.type !== filters.type) {
        return false;
      }

      // Verification status filter
      if (filters.verificationStatus === "Verified" && !content.is_verified) {
        return false;
      }
      if (
        filters.verificationStatus === "Unverified" &&
        content.is_verified
      ) {
        return false;
      }

      // Search query filter
      if (
        filters.searchQuery &&
        !content.title
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [contents, filters]);

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewContent = (content: ContentListItem) => {
    navigate(`/admin/verify-content/${content.id}`);
  };

  const handleVerifyToggle = (content: ContentListItem) => {
    navigate(`/admin/verify-content/${content.id}`);
  };

  const handleStatsCardClick = (type: string) => {
    setFilters({ ...filters, type });
    setPage(0);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "var(--neutral-50)", p: 3 }}>
      <Box sx={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", color: "var(--font-primary)", mb: 1 }}
          >
            AI Judge - Content Verification
          </Typography>
          <Typography sx={{ color: "var(--font-secondary)" }}>
            Review and verify educational content across all types
          </Typography>
        </Box>

        {/* Stats Cards */}
        {contentCounts && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(6, 1fr)",
              },
              gap: 2,
              mb: 4,
            }}
          >
            <ContentStatsCard
              title="Quiz"
              count={contentCounts.Quiz}
              type="Quiz"
              color={CONTENT_TYPE_CONFIG.Quiz.color}
              onClick={() => handleStatsCardClick("Quiz")}
            />
            <ContentStatsCard
              title="Article"
              count={contentCounts.Article}
              type="Article"
              color={CONTENT_TYPE_CONFIG.Article.color}
              onClick={() => handleStatsCardClick("Article")}
            />
            <ContentStatsCard
              title="Assignment"
              count={contentCounts.Assignment}
              type="Assignment"
              color={CONTENT_TYPE_CONFIG.Assignment.color}
              onClick={() => handleStatsCardClick("Assignment")}
            />
            <ContentStatsCard
              title="Coding Problem"
              count={contentCounts.CodingProblem}
              type="CodingProblem"
              color={CONTENT_TYPE_CONFIG.CodingProblem.color}
              onClick={() => handleStatsCardClick("CodingProblem")}
            />
            <ContentStatsCard
              title="Dev Problem"
              count={contentCounts.DevCodingProblem}
              type="DevCodingProblem"
              color={CONTENT_TYPE_CONFIG.DevCodingProblem.color}
              onClick={() => handleStatsCardClick("DevCodingProblem")}
            />
            <ContentStatsCard
              title="Video Tutorial"
              count={contentCounts.VideoTutorial}
              type="VideoTutorial"
              color={CONTENT_TYPE_CONFIG.VideoTutorial.color}
              onClick={() => handleStatsCardClick("VideoTutorial")}
            />
          </Box>
        )}

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <ContentFilters filters={filters} onFilterChange={setFilters} />
        </Paper>

        {/* Content Table */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "var(--font-primary)",
              }}
            >
              Content List
            </Typography>
            <Typography
              sx={{
                fontSize: "0.875rem",
                color: "var(--font-secondary)",
              }}
            >
              {filteredContents.length} content
              {filteredContents.length !== 1 ? "s" : ""} found
            </Typography>
          </Box>
          <ContentTable
            contents={filteredContents}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onView={handleViewContent}
            onVerifyToggle={handleVerifyToggle}
            isLoading={isLoading}
          />
        </Paper>

        {/* Success Snackbar */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage("")}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => setSuccessMessage("")}
            severity="success"
            sx={{ width: "100%" }}
          >
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default ContentVerificationPage;

