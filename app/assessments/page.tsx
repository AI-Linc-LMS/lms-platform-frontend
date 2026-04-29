"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
  LinearProgress,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
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
  const { t } = useTranslation("common");
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
      showToast(t("assessments.failedToLoad"), "error");
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

  // Calculate counts based on status
  const totalCount = assessments.length;
  const psychometricCount = psychometricAssessments.length;
  const regularCount = regularAssessments.length;
  
  // Completed: status is "submitted" or "completed"
  // If status is undefined/null, fallback to is_attempted/has_attempted for backward compatibility
  const completedCount = assessments.filter(
    (a) => {
      if (a.status === "submitted" || a.status === "completed") return true;
      // Fallback for backward compatibility
      if (a.status === undefined || a.status === null) {
        return a.is_attempted || a.has_attempted;
      }
      return false;
    }
  ).length;
  
  // Available: status is "not_started" or "in_progress"
  // If status is undefined/null, fallback to !is_attempted && !has_attempted for backward compatibility
  const availableCount = assessments.filter(
    (a) => {
      if (a.status === "not_started" || a.status === "in_progress") return true;
      // Fallback for backward compatibility
      if (a.status === undefined || a.status === null) {
        return !a.is_attempted && !a.has_attempted;
      }
      return false;
    }
  ).length;
  
  const psychometricCompletedCount = psychometricAssessments.filter(
    (a) => {
      if (a.status === "submitted" || a.status === "completed") return true;
      if (a.status === undefined || a.status === null) {
        return a.is_attempted || a.has_attempted;
      }
      return false;
    }
  ).length;
  const regularCompletedCount = regularAssessments.filter(
    (a) => {
      if (a.status === "submitted" || a.status === "completed") return true;
      if (a.status === undefined || a.status === null) {
        return a.is_attempted || a.has_attempted;
      }
      return false;
    }
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

    // Apply filter based on status
    if (filter === "completed") {
      // Completed: status is "submitted" or "completed"
      // Fallback to is_attempted/has_attempted for backward compatibility
      result = result.filter((a) => {
        if (a.status === "submitted" || a.status === "completed") return true;
        // Fallback for backward compatibility
        if (a.status === undefined || a.status === null) {
          return a.is_attempted || a.has_attempted;
        }
        return false;
      });
    } else if (filter === "available") {
      // Available: status is "not_started" or "in_progress"
      // Fallback to !is_attempted && !has_attempted for backward compatibility
      result = result.filter((a) => {
        if (a.status === "not_started" || a.status === "in_progress") return true;
        // Fallback for backward compatibility
        if (a.status === undefined || a.status === null) {
          return !a.is_attempted && !a.has_attempted;
        }
        return false;
      });
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
              {t("assessments.title")}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, display: { xs: "none", sm: "block" } }}
            >
              {t("assessments.subtitle")}
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
              border: "1px solid var(--border-default)",
              borderRadius: 2,
              backgroundColor: "var(--card-bg)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 } }}>
              <Box
                sx={{
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  borderRadius: 2,
                  backgroundColor: "color-mix(in srgb, var(--accent-indigo) 16%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconWrapper
                  icon="mdi:clipboard-text"
                  size={24}
                  color="var(--accent-indigo)"
                />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography 
                  variant="h4" 
                  fontWeight={700} 
                  color="var(--font-primary)"
                  sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}
                >
                  {totalCount}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
                >
                  {t("assessments.totalAssessments")}
                </Typography>
              </Box>
            </Box>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              border: "1px solid var(--border-default)",
              borderRadius: 2,
              backgroundColor: "var(--card-bg)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 } }}>
              <Box
                sx={{
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  borderRadius: 2,
                  backgroundColor: "color-mix(in srgb, var(--accent-purple) 16%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconWrapper
                  icon="mdi:brain"
                  size={24}
                  color="var(--accent-purple)"
                />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography 
                  variant="h4" 
                  fontWeight={700} 
                  color="var(--font-primary)"
                  sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}
                >
                  {psychometricCount}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
                >
                  {t("assessments.psychometric")}
                </Typography>
              </Box>
            </Box>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              border: "1px solid var(--border-default)",
              borderRadius: 2,
              backgroundColor: "var(--card-bg)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 } }}>
              <Box
                sx={{
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  borderRadius: 2,
                  backgroundColor: "color-mix(in srgb, var(--accent-blue-light) 16%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconWrapper
                  icon="mdi:play-circle"
                  size={24}
                  color="var(--accent-blue-light)"
                />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography 
                  variant="h4" 
                  fontWeight={700} 
                  color="var(--font-primary)"
                  sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}
                >
                  {availableCount}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
                >
                  {t("assessments.available")}
                </Typography>
              </Box>
            </Box>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              border: "1px solid var(--border-default)",
              borderRadius: 2,
              backgroundColor: "var(--card-bg)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 } }}>
              <Box
                sx={{
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  borderRadius: 2,
                  backgroundColor: "color-mix(in srgb, var(--success-500) 16%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconWrapper
                  icon="mdi:check-circle"
                  size={24}
                  color="var(--success-500)"
                />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography 
                  variant="h4" 
                  fontWeight={700} 
                  color="var(--font-primary)"
                  sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}
                >
                  {completedCount}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
                >
                  {t("assessments.completed")}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Filters and Search */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid var(--border-default)",
            borderRadius: 2,
            mb: 3,
            overflow: "hidden",
            backgroundColor: "var(--card-bg)",
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
              borderBottom: "1px solid var(--border-default)",
              px: 2,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.9375rem",
                color: "var(--font-secondary)",
                "&.Mui-selected": {
                  color: "var(--accent-indigo)",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "var(--accent-indigo)",
                height: 3,
              },
            }}
          >
            <Tab
              label={`${t("assessments.all")} (${totalCount})`}
              value="all"
            />
            <Tab
              label={`${t("assessments.available")} (${availableCount})`}
              value="available"
            />
            <Tab
              label={`${t("assessments.completed")} (${completedCount})`}
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
              placeholder={t("assessments.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconWrapper icon="mdi:magnify" size={20} color="var(--font-secondary)" />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "var(--surface)",
                  color: "var(--font-primary)",
                  borderRadius: 2,
                  "& fieldset": {
                    borderColor: "var(--border-default)",
                  },
                  "&:hover fieldset": {
                    borderColor: "var(--border-default)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "var(--accent-indigo)",
                  },
                },
                "& .MuiInputBase-input::placeholder": {
                  color: "var(--font-secondary)",
                  opacity: 1,
                },
              }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                displayEmpty
                sx={{
                  backgroundColor: "var(--surface)",
                  color: "var(--font-primary)",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--border-default)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--border-default)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--accent-indigo)",
                  },
                  "& .MuiSelect-icon": {
                    color: "var(--font-secondary)",
                  },
                }}
              >
                <MenuItem value="recent">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t("courses.sortBy")}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {t("courses.mostRecent")}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="oldest">{t("courses.oldestFirst")}</MenuItem>
                <MenuItem value="title">{t("courses.titleAZ")}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* All Assessments Grid */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
            <LinearProgress sx={{ width: "80%", height: 2, borderRadius: 1 }} />
          </Box>
        ) : filteredAssessments.length > 0 ? (
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
              {searchQuery ? t("assessments.noAssessmentsFound") : t("assessments.noAssessmentsFound")}
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
                ? t("assessments.adjustSearchFilter")
                : t("assessments.checkBackLater")}
            </Typography>
          </Paper>
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
                textAlign: { xs: "center", sm: "start" },
              }}
            >
              {t("assessments.showingTotal", { count: filteredAssessments.length })}
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
                  {t("assessments.previous")}
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
