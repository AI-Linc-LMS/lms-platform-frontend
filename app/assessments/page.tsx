"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Pagination,
  Button,
  Paper,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  Chip,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { Loading } from "@/components/common/Loading";
import {
  assessmentService,
  Assessment,
} from "@/lib/services/assessment.service";
import { useToast } from "@/components/common/Toast";
import { AssessmentsGrid } from "@/components/assessment/AssessmentsGrid";
import { IconWrapper } from "@/components/common/IconWrapper";
import { isPsychometricAssessment } from "@/lib/utils/psychometric-utils";

const ITEMS_PER_PAGE = 12;

type FilterType = "all" | "available" | "completed";
type SortType = "recent" | "oldest" | "title";

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("recent");
  const { showToast } = useToast();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const data = await assessmentService.getActiveAssessments();
      setAssessments(data);
    } catch (error: any) {
      showToast("Failed to load assessments", "error");
    } finally {
      setLoading(false);
    }
  };

  // Separate psychometric and regular assessments
  const psychometricAssessments = assessments.filter((a) =>
    isPsychometricAssessment(a)
  );
  const regularAssessments = assessments.filter(
    (a) => !isPsychometricAssessment(a)
  );

  // Calculate counts
  const totalCount = assessments.length;
  const psychometricCount = psychometricAssessments.length;
  const regularCount = regularAssessments.length;
  const completedCount = assessments.filter(
    (a) => a.is_attempted || a.has_attempted
  ).length;
  const availableCount = assessments.filter(
    (a) => !a.is_attempted && !a.has_attempted
  ).length;
  const psychometricCompletedCount = psychometricAssessments.filter(
    (a) => a.is_attempted || a.has_attempted
  ).length;
  const regularCompletedCount = regularAssessments.filter(
    (a) => a.is_attempted || a.has_attempted
  ).length;

  // Combine all assessments (psychometric + regular)
  const allAssessments = useMemo(() => {
    return [...psychometricAssessments, ...regularAssessments];
  }, [psychometricAssessments, regularAssessments]);

  // Filter and search logic for all assessments
  const filteredAssessments = useMemo(() => {
    let result = allAssessments.filter(
      (assessment) =>
        assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply filter
    if (filter === "completed") {
      result = result.filter((a) => a.is_attempted || a.has_attempted);
    } else if (filter === "available") {
      result = result.filter((a) => !a.is_attempted && !a.has_attempted);
    }

    // Sort
    return result.sort((a, b) => {
      if (sortBy === "recent") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else if (sortBy === "oldest") {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [allAssessments, searchQuery, filter, sortBy]);

  // Pagination for all assessments
  const paginatedAssessments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAssessments.slice(start, start + pageSize);
  }, [filteredAssessments, page, pageSize]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <MainLayout>
        <Loading fullScreen />
      </MainLayout>
    );
  }

  const totalPages = Math.ceil(filteredAssessments.length / pageSize);

  return (
    <MainLayout>
      <Box sx={{ width: "100%", maxWidth: "100%", overflow: "visible" }}>
        {/* Header with Icon */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 }, mb: 1, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
          <Box
            sx={{
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              borderRadius: 2,
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconWrapper icon="mdi:clipboard-text" size={28} color="#ffffff" />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography 
              variant="h4" 
              fontWeight={700}
              sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}
            >
              Assessments
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, display: { xs: "none", sm: "block" } }}
            >
              Test your knowledge and track your progress
            </Typography>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: { xs: 1.5, sm: 2 },
            mb: { xs: 2, sm: 3 },
            mt: { xs: 1.5, sm: 2 },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              border: "1px solid #e5e7eb",
              borderRadius: 2,
              backgroundColor: "#ffffff",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 } }}>
              <Box
                sx={{
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  borderRadius: 2,
                  backgroundColor: "#eef2ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconWrapper
                  icon="mdi:clipboard-text"
                  size={24}
                  color="#6366f1"
                />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography 
                  variant="h4" 
                  fontWeight={700} 
                  color="#1f2937"
                  sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}
                >
                  {totalCount}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
                >
                  Total Assessments
                </Typography>
              </Box>
            </Box>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              border: "1px solid #e5e7eb",
              borderRadius: 2,
              backgroundColor: "#ffffff",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 } }}>
              <Box
                sx={{
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  borderRadius: 2,
                  backgroundColor: "#f3e8ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconWrapper
                  icon="mdi:brain"
                  size={24}
                  color="#7c3aed"
                />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography 
                  variant="h4" 
                  fontWeight={700} 
                  color="#1f2937"
                  sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}
                >
                  {psychometricCount}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
                >
                  Psychometric
                </Typography>
              </Box>
            </Box>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              border: "1px solid #e5e7eb",
              borderRadius: 2,
              backgroundColor: "#ffffff",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 } }}>
              <Box
                sx={{
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  borderRadius: 2,
                  backgroundColor: "#dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconWrapper
                  icon="mdi:play-circle"
                  size={24}
                  color="#3b82f6"
                />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography 
                  variant="h4" 
                  fontWeight={700} 
                  color="#1f2937"
                  sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}
                >
                  {availableCount}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
                >
                  Available
                </Typography>
              </Box>
            </Box>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              border: "1px solid #e5e7eb",
              borderRadius: 2,
              backgroundColor: "#ffffff",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 } }}>
              <Box
                sx={{
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  borderRadius: 2,
                  backgroundColor: "#d1fae5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconWrapper
                  icon="mdi:check-circle"
                  size={24}
                  color="#10b981"
                />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography 
                  variant="h4" 
                  fontWeight={700} 
                  color="#1f2937"
                  sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}
                >
                  {completedCount}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
                >
                  Completed
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Filters and Search */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #e5e7eb",
            borderRadius: 2,
            mb: 3,
            overflow: "hidden",
          }}
        >
          {/* Tabs */}
          <Tabs
            value={filter}
            onChange={(_, newValue) => {
              setFilter(newValue);
              setPage(1);
            }}
            sx={{
              borderBottom: "1px solid #e5e7eb",
              px: 2,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.9375rem",
                color: "#6b7280",
                "&.Mui-selected": {
                  color: "#6366f1",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#6366f1",
                height: 3,
              },
            }}
          >
            <Tab
              label={`All (${totalCount})`}
              value="all"
            />
            <Tab
              label={`Available (${availableCount})`}
              value="available"
            />
            <Tab
              label={`Completed (${completedCount})`}
              value="completed"
            />
          </Tabs>

          {/* Search and Sort */}
          <Box
            sx={{
              p: 2,
              display: "flex",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
            }}
          >
            <TextField
              fullWidth
              placeholder="Search assessments..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconWrapper icon="mdi:magnify" size={20} color="#6b7280" />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#f9fafb",
                  borderRadius: 2,
                  "& fieldset": {
                    borderColor: "transparent",
                  },
                  "&:hover fieldset": {
                    borderColor: "#e5e7eb",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#6366f1",
                  },
                },
              }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                displayEmpty
                sx={{
                  backgroundColor: "#f9fafb",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "transparent",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e5e7eb",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#6366f1",
                  },
                }}
              >
                <MenuItem value="recent">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Sort By:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      Most Recent
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="title">Title (A-Z)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* All Assessments Grid */}
        {filteredAssessments.length > 0 ? (
          <AssessmentsGrid
            assessments={paginatedAssessments}
            searchQuery={searchQuery}
          />
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: "center",
              border: "1px dashed #e5e7eb",
              borderRadius: 3,
              backgroundColor: "#ffffff",
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
              }}
            >
              <IconWrapper
                icon={
                  searchQuery
                    ? "mdi:file-search-outline"
                    : "mdi:clipboard-text-outline"
                }
                size={40}
                color="#6366f1"
              />
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: "#374151",
                fontWeight: 600,
                mb: 1,
              }}
            >
              {searchQuery ? "No assessments found" : "No assessments available"}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#6b7280",
                maxWidth: 400,
                mx: "auto",
              }}
            >
              {searchQuery
                ? "Try adjusting your search or filter criteria"
                : "Check back later for new assessments"}
            </Typography>
          </Paper>
        )}

        {/* Empty State */}
        {regularCount === 0 && psychometricCount === 0 && (
          <Box sx={{ width: "100%" }}>
            <AssessmentsGrid
              assessments={[]}
            searchQuery={searchQuery}
          />
        </Box>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: { xs: "center", sm: "space-between" },
              alignItems: "center",
              mt: 4,
              px: 2,
              gap: { xs: 2, sm: 0 },
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                textAlign: { xs: "center", sm: "left" },
              }}
            >
              Showing {filteredAssessments.length} total assessment{filteredAssessments.length !== 1 ? "s" : ""}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Button
                variant="outlined"
                size="small"
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
                startIcon={<IconWrapper icon="mdi:chevron-left" size={16} />}
                sx={{
                  borderColor: "#d1d5db",
                  color: "#374151",
                  textTransform: "none",
                  minWidth: { xs: "auto", sm: "auto" },
                  px: { xs: 1, sm: 2 },
                  "& .MuiButton-startIcon": {
                    mr: { xs: 0, sm: 0.5 },
                  },
                  "&:hover": {
                    borderColor: "#9ca3af",
                    backgroundColor: "#f9fafb",
                  },
                  "&:disabled": {
                    borderColor: "#e5e7eb",
                    color: "#9ca3af",
                  },
                }}
              >
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                  Previous
                </Box>
              </Button>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => handlePageChange(value)}
                siblingCount={0}
                boundaryCount={1}
                size="small"
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: "#374151",
                    minWidth: { xs: "32px", sm: "36px" },
                    height: { xs: "32px", sm: "36px" },
                    fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                    "&.Mui-selected": {
                      backgroundColor: "#374151",
                      color: "#ffffff",
                      "&:hover": {
                        backgroundColor: "#1f2937",
                      },
                    },
                  },
                }}
              />
              <Button
                variant="outlined"
                size="small"
                disabled={page === totalPages}
                onClick={() => handlePageChange(page + 1)}
                endIcon={<IconWrapper icon="mdi:chevron-right" size={16} />}
                sx={{
                  borderColor: "#d1d5db",
                  color: "#374151",
                  textTransform: "none",
                  minWidth: { xs: "auto", sm: "auto" },
                  px: { xs: 1, sm: 2 },
                  "& .MuiButton-endIcon": {
                    ml: { xs: 0, sm: 0.5 },
                  },
                  "&:hover": {
                    borderColor: "#9ca3af",
                    backgroundColor: "#f9fafb",
                  },
                  "&:disabled": {
                    borderColor: "#e5e7eb",
                    color: "#9ca3af",
                  },
                }}
              >
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                  Next
                </Box>
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </MainLayout>
  );
}
