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
  LinearProgress,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  coursesService,
  Course as ServiceCourse,
} from "@/lib/services/courses.service";
import { Course as CourseCardCourse } from "@/components/course/interfaces";
import { useToast } from "@/components/common/Toast";
import { CourseCard } from "@/components/course/CourseCard";
import { IconWrapper } from "@/components/common/IconWrapper";
import { usePayment } from "@/hooks/usePayment";
import { PaymentType } from "@/lib/services/payment.service";

const ITEMS_PER_PAGE = 12;

type FilterType = "all" | "enrolled" | "available";
type SortType = "recent" | "oldest" | "title";

export default function CoursesPage() {
  const { t } = useTranslation("common");
  const [courses, setCourses] = useState<CourseCardCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("recent");
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(
    null
  );
  const [filters, setFilters] = useState({
    category: "All",
    price: "All",
  });
  const { showToast } = useToast();
  const hasLoadedRef = useRef(false);
  const { handlePayment, isProcessing } = usePayment();

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await coursesService.getCourses();
      // Map service Course to CourseCardCourse format
      const mappedCourses: CourseCardCourse[] = data.map(
        (course: ServiceCourse) => ({
          id: course.id,
          title: course.title,
          subtitle: course.subtitle,
          description: course.description,
          slug: course.slug || course.id.toString(),
          difficulty_level: course.difficulty_level || "Medium",
          language: course.language || "English",
          is_free: course.is_free ?? true,
          certificate_available: course.certificate_available ?? false,
          is_enrolled: course.is_enrolled || false,
          price: course.price || "0",
          enrollment_enabled: course.enrollment_enabled,
          tags: course.tags || [],
          rating: course.rating,
          rating_count: course.rating_count,
          instructors: course.instructors.map((instructor) => ({
            id: instructor.id,
            name: instructor.name,
            profile_pic_url: instructor.profile_pic_url,
          })),
          enrolled_students: course.enrolled_students,
          stats: {
            video: course.stats?.video || { total: 0 },
            quiz: course.stats?.quiz || { total: 0 },
            coding_problem: course.stats?.coding_problem || { total: 0 },
            article: course.stats?.article || { total: 0 },
            assignment: course.stats?.assignment || { total: 0 },
          },
        })
      );
      setCourses(mappedCourses);
    } catch (error: any) {
      showToast(t("courses.failedToLoad"), "error");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if course matches category based on tags
  const matchesCategory = (
    course: CourseCardCourse,
    category: string
  ): boolean => {
    if (category === "All") return true;

    // Map category names to tag keywords
    const categoryTagMap: Record<string, string[]> = {
      "Full Stack Development": [
        "fullstack",
        "full-stack",
        "mern",
        "mean",
        "stack",
      ],
      "Front-End Development": [
        "frontend",
        "front-end",
        "react",
        "vue",
        "angular",
        "javascript",
      ],
      "Back-End Development": [
        "backend",
        "back-end",
        "server",
        "api",
        "node",
        "python",
        "django",
      ],
      "UI/UX Design": ["ui", "ux", "design", "figma", "sketch"],
      "Data Science & Analytics": [
        "data",
        "science",
        "analytics",
        "machine learning",
        "ml",
        "ai",
      ],
      Marketing: ["marketing", "seo", "social", "digital"],
      Business: ["business", "management", "strategy", "finance"],
    };

    const courseTags = (course.tags || []).map((tag) => tag.toLowerCase());
    const keywords = categoryTagMap[category] || [];

    // Check if any tag matches any keyword for this category
    return keywords.some((keyword) =>
      courseTags.some((tag) => tag.includes(keyword.toLowerCase()))
    );
  };

  // Calculate counts
  const totalCount = courses.length;
  const enrolledCount = courses.filter((c) => c.is_enrolled).length;
  const availableCount = courses.filter((c) => !c.is_enrolled).length;

  // Filter and search logic
  const filteredCourses = useMemo(() => {
    let result = courses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply tab filter
    if (filter === "enrolled") {
      result = result.filter((c) => c.is_enrolled);
    } else if (filter === "available") {
      result = result.filter((c) => !c.is_enrolled);
    }

    // Apply category filter
    if (filters.category !== "All") {
      result = result.filter((course) =>
        matchesCategory(course, filters.category)
      );
    }

    // Apply price filter
    if (filters.price !== "All") {
      if (filters.price === "Free") {
        result = result.filter((course) => course.is_free);
      } else if (filters.price === "Paid") {
        result = result.filter((course) => !course.is_free);
      }
    }

    // Sort
    return result.sort((a, b) => {
      if (sortBy === "recent") {
        return b.id - a.id;
      } else if (sortBy === "oldest") {
        return a.id - b.id;
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [courses, searchTerm, filter, filters, sortBy]);

  // Pagination
  const paginatedCourses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCourses.slice(start, start + pageSize);
  }, [filteredCourses, page, pageSize]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      category: "All",
      price: "All",
    });
    setPage(1);
  };

  const handleEnroll = async (courseId: number) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    setEnrollingCourseId(courseId);

    // If course is not free, trigger payment
    if (!course.is_free && parseFloat(course.price) > 0) {
      await handlePayment({
        amount: course.price,
        currency: "INR", // Default to INR, can be made dynamic if needed
        typeId: courseId.toString(),
        paymentType: PaymentType.COURSE,
        description: `Access for ${course.title}`,
        onSuccess: (res) => {
          showToast(t("courses.paymentVerified"), "success");
          setEnrollingCourseId(null);
          loadCourses(); // Reload to update UI
        },
        onError: (err) => {
          showToast(
            err.message || "Payment failed. Please try again.",
            "error"
          );
          setEnrollingCourseId(null);
        },
        onDismiss: () => {
          setEnrollingCourseId(null);
        },
      });
      return;
    }

    // Standard free enrollment
    try {
      await coursesService.enrollInCourse(courseId);
      showToast(t("courses.enrolledSuccess"), "success");
      loadCourses();
    } catch (error: any) {
      showToast("Failed to enroll in course", "error");
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const totalPages = Math.ceil(filteredCourses.length / pageSize);

  return (
    <MainLayout>
      <Box sx={{ width: "100%", px: { xs: 1.5, sm: 2, md: 3 }, py: 3 }}>
        {/* Header with Icon */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:book" size={28} color="#ffffff" />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {t("courses.courseList")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("courses.exploreEnroll")}
            </Typography>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, 1fr)",
            },
            gap: 2,
            mb: 3,
            mt: 2,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: "1px solid #e5e7eb",
              borderRadius: 2,
              backgroundColor: "#ffffff",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: "#eef2ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper
                  icon="mdi:book-open-page-variant"
                  size={24}
                  color="#6366f1"
                />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700} color="#1f2937">
                  {totalCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("courses.totalCourses")}
                </Typography>
              </Box>
            </Box>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: "1px solid #e5e7eb",
              borderRadius: 2,
              backgroundColor: "#ffffff",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: "#d1fae5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper
                  icon="mdi:check-circle"
                  size={24}
                  color="#10b981"
                />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700} color="#1f2937">
                  {enrolledCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("courses.enrolled")}
                </Typography>
              </Box>
            </Box>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: "1px solid #e5e7eb",
              borderRadius: 2,
              backgroundColor: "#ffffff",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: "#dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper icon="mdi:play-circle" size={24} color="#3b82f6" />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700} color="#1f2937">
                  {availableCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("courses.allAvailable")}
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
            <Tab label={`${t("courses.all")} (${totalCount})`} value="all" />
            <Tab label={`${t("courses.enrolledTab")} (${enrolledCount})`} value="enrolled" />
            <Tab label={`${t("courses.availableTab")} (${availableCount})`} value="available" />
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
              placeholder={t("courses.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
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

        {/* Additional Filters */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #e5e7eb",
            borderRadius: 2,
            mb: 3,
            p: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} color="#1f2937">
              {t("courses.advancedFilters")}
            </Typography>
            <Button
              size="small"
              onClick={handleClearFilters}
              sx={{
                textTransform: "none",
                color: "#6366f1",
                fontWeight: 600,
                fontSize: "0.8125rem",
                "&:hover": {
                  backgroundColor: "rgba(99, 102, 241, 0.08)",
                },
              }}
            >
              {t("courses.clearAll")}
            </Button>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(5, 1fr)",
              },
              gap: 2,
            }}
          >
            {/* Category Filter */}
            <FormControl fullWidth size="small">
              <Typography
                variant="caption"
                sx={{
                  mb: 0.5,
                  color: "#6b7280",
                  fontWeight: 500,
                  fontSize: "0.75rem",
                }}
              >
                {t("courses.category")}
              </Typography>
              <Select
                value={filters.category || "All"}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                sx={{
                  backgroundColor: "#f9fafb",
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
                <MenuItem value="All">{t("courses.allCategories")}</MenuItem>
                <MenuItem value="Full Stack Development">
                  {t("courses.fullStack")}
                </MenuItem>
                <MenuItem value="Front-End Development">
                  {t("courses.frontEnd")}
                </MenuItem>
                <MenuItem value="Back-End Development">
                  {t("courses.backEnd")}
                </MenuItem>
                <MenuItem value="UI/UX Design">{t("courses.uiUx")}</MenuItem>
                <MenuItem value="Data Science & Analytics">
                  {t("courses.dataScience")}
                </MenuItem>
                <MenuItem value="Marketing">{t("courses.marketing")}</MenuItem>
                <MenuItem value="Business">{t("courses.business")}</MenuItem>
              </Select>
            </FormControl>

            {/* Price Filter */}
            <FormControl fullWidth size="small">
              <Typography
                variant="caption"
                sx={{
                  mb: 0.5,
                  color: "#6b7280",
                  fontWeight: 500,
                  fontSize: "0.75rem",
                }}
              >
                {t("courses.price")}
              </Typography>
              <Select
                value={filters.price || "All"}
                onChange={(e) => handleFilterChange("price", e.target.value)}
                sx={{
                  backgroundColor: "#f9fafb",
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
                <MenuItem value="All">{t("courses.allPrices")}</MenuItem>
                <MenuItem value="Free">{t("courses.free")}</MenuItem>
                <MenuItem value="Paid">{t("courses.paid")}</MenuItem>
              </Select>
            </FormControl>

          </Box>
        </Paper>

        {/* Courses Grid */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
            <LinearProgress sx={{ width: "80%", height: 2, borderRadius: 1 }} />
          </Box>
        ) : paginatedCourses.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              {t("courses.noCoursesFound")}
            </Typography>
          </Box>
        ) : (
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
            {paginatedCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEnroll={handleEnroll}
                enrolling={enrollingCourseId === course.id}
              />
            ))}
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
              {t("courses.showingResult", {
                from: (page - 1) * pageSize + 1,
                to: Math.min(page * pageSize, filteredCourses.length),
                total: filteredCourses.length,
              })}
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
                <Box
                  component="span"
                  sx={{ display: { xs: "none", sm: "inline" } }}
                >
                  {t("courses.previous")}
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
                <Box
                  component="span"
                  sx={{ display: { xs: "none", sm: "inline" } }}
                >
                  {t("courses.next")}
                </Box>
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </MainLayout>
  );
}
