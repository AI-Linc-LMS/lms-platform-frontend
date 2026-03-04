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
  Checkbox,
  ListItemText,
} from "@mui/material";
import {
  coursesService,
  Course as ServiceCourse,
} from "@/lib/services/courses.service";
import { MainLayout } from "@/components/layout/MainLayout";
import { CourseCard } from "@/components/course/CourseCard";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { usePayment } from "@/hooks/usePayment";
import type { Course as CourseCardCourse } from "@/components/course/interfaces";
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
  const [filters, setFilters] = useState<{
    categories: string[];
    price: string;
  }>({
    categories: [],
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
    } catch {
      showToast(t("courses.failedToLoad"), "error");
    } finally {
      setLoading(false);
    }
  };

  const matchesCategory = (
    course: CourseCardCourse,
    selectedCategories: string[]
  ): boolean => {
    if (selectedCategories.length === 0) return true;
    const courseTags = (course.tags || []).map((t) =>
      t.trim().toLowerCase()
    );
    const selectedLower = selectedCategories.map((c) => c.trim().toLowerCase());
    return courseTags.some((tag) => selectedLower.includes(tag));
  };

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) =>
      (c.tags || []).forEach((tag) => {
        const t = tag.trim();
        if (t) set.add(t);
      })
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [courses]);

  const totalCount = courses.length;
  const enrolledCount = courses.filter((c) => c.is_enrolled).length;
  const availableCount = courses.filter((c) => !c.is_enrolled).length;

  const filteredCourses = useMemo(() => {
    let result = courses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filter === "enrolled") {
      result = result.filter((c) => c.is_enrolled);
    } else if (filter === "available") {
      result = result.filter((c) => !c.is_enrolled);
    }

    if (filters.categories.length > 0) {
      result = result.filter((course) =>
        matchesCategory(course, filters.categories)
      );
    }

    if (filters.price !== "All") {
      if (filters.price === "Free") {
        result = result.filter((course) => course.is_free);
      } else if (filters.price === "Paid") {
        result = result.filter((course) => !course.is_free);
      }
    }

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

  const handleCategoriesChange = (selected: string[]) => {
    setFilters((prev) => ({
      ...prev,
      categories: selected,
    }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      categories: [],
      price: "All",
    });
    setPage(1);
  };

  const handleEnroll = async (courseId: number) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    setEnrollingCourseId(courseId);

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

    try {
      await coursesService.enrollInCourse(courseId);
      showToast(t("courses.enrolledSuccess"), "success");
      loadCourses();
    } catch (err: any) {
      const data = err?.response?.data;
      const message =
        typeof data?.error === "string"
          ? data.error
          : typeof data?.detail === "string"
            ? data.detail
            : t("courses.failedToEnroll");
      showToast(message, "error");
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const totalPages = Math.ceil(filteredCourses.length / pageSize);

  return (
    <MainLayout>
      <Box sx={{ width: "100%", px: { xs: 1.5, sm: 2, md: 3 }, py: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              background: "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-indigo-dark) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:book" size={28} color="var(--font-light)" />
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
              border: "1px solid var(--border-default)",
              borderRadius: 2,
              backgroundColor: "var(--card-bg)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: "var(--surface-indigo-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper
                  icon="mdi:book-open-page-variant"
                  size={24}
                  color="var(--accent-indigo)"
                />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700} color="var(--font-primary-dark)">
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
              border: "1px solid var(--border-default)",
              borderRadius: 2,
              backgroundColor: "var(--card-bg)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: "var(--surface-green-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper
                  icon="mdi:check-circle"
                  size={24}
                  color="var(--course-cta)"
                />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700} color="var(--font-primary-dark)">
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
              border: "1px solid var(--border-default)",
              borderRadius: 2,
              backgroundColor: "var(--card-bg)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: "var(--surface-blue-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper icon="mdi:play-circle" size={24} color="var(--accent-blue-light)" />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700} color="var(--font-primary-dark)">
                  {availableCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("courses.allAvailable")}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        <Paper
          elevation={0}
          sx={{
            border: "1px solid var(--border-default)",
            borderRadius: 2,
            mb: 3,
            overflow: "hidden",
          }}
        >
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
            <Tab label={`${t("courses.all")} (${totalCount})`} value="all" />
            <Tab label={`${t("courses.enrolledTab")} (${enrolledCount})`} value="enrolled" />
            <Tab label={`${t("courses.availableTab")} (${availableCount})`} value="available" />
          </Tabs>

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
                    <IconWrapper icon="mdi:magnify" size={20} color="var(--font-secondary)" />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "var(--surface)",
                  borderRadius: 2,
                  "& fieldset": {
                    borderColor: "transparent",
                  },
                  "&:hover fieldset": {
                    borderColor: "var(--border-default)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "var(--accent-indigo)",
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
                  backgroundColor: "var(--surface)",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "transparent",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--border-default)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--accent-indigo)",
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

        <Paper
          elevation={0}
          sx={{
            border: "1px solid var(--border-default)",
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
            <Typography variant="subtitle2" fontWeight={600} color="var(--font-primary-dark)">
              {t("courses.advancedFilters")}
            </Typography>
            <Button
              size="small"
              onClick={handleClearFilters}
              sx={{
                textTransform: "none",
                color: "var(--accent-indigo)",
                fontWeight: 600,
                fontSize: "0.8125rem",
                "&:hover": {
                  backgroundColor: "var(--surface-indigo-light)",
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
            <FormControl fullWidth size="small">
              <Typography
                variant="caption"
                sx={{
                  mb: 0.5,
                  color: "var(--font-secondary)",
                  fontWeight: 500,
                  fontSize: "0.75rem",
                }}
              >
                {t("courses.category")}
              </Typography>
              <Select
                multiple
                value={filters.categories}
                onChange={(e) =>
                  handleCategoriesChange(
                    typeof e.target.value === "string"
                      ? e.target.value.split(",")
                      : e.target.value
                  )
                }
                renderValue={(selected) =>
                  selected.length === 0
                    ? t("courses.allCategories")
                    : selected.length <= 2
                      ? selected.join(", ")
                      : `${selected.length} ${t("courses.categoriesSelected")}`
                }
                displayEmpty
                sx={{
                  backgroundColor: "var(--surface)",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "transparent",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--border-default)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--accent-indigo)",
                  },
                }}
              >
                {categoryOptions.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    <Checkbox
                      checked={filters.categories.indexOf(opt) > -1}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <ListItemText primary={opt} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <Typography
                variant="caption"
                sx={{
                  mb: 0.5,
                  color: "var(--font-secondary)",
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
                  backgroundColor: "var(--surface)",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "transparent",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--border-default)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--accent-indigo)",
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
                  borderColor: "var(--border-light)",
                  color: "var(--font-muted)",
                  textTransform: "none",
                  minWidth: { xs: "auto", sm: "auto" },
                  px: { xs: 1, sm: 2 },
                  "& .MuiButton-startIcon": {
                    mr: { xs: 0, sm: 0.5 },
                  },
                  "&:hover": {
                    borderColor: "var(--font-tertiary)",
                    backgroundColor: "var(--surface)",
                  },
                  "&:disabled": {
                    borderColor: "var(--border-default)",
                    color: "var(--font-tertiary)",
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
                    color: "var(--font-muted)",
                    minWidth: { xs: "32px", sm: "36px" },
                    height: { xs: "32px", sm: "36px" },
                    fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                    "&.Mui-selected": {
                      backgroundColor: "var(--font-muted)",
                      color: "var(--card-bg)",
                      "&:hover": {
                        backgroundColor: "var(--font-primary-dark)",
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
                  borderColor: "var(--border-light)",
                  color: "var(--font-muted)",
                  textTransform: "none",
                  minWidth: { xs: "auto", sm: "auto" },
                  px: { xs: 1, sm: 2 },
                  "& .MuiButton-endIcon": {
                    ml: { xs: 0, sm: 0.5 },
                  },
                  "&:hover": {
                    borderColor: "var(--font-tertiary)",
                    backgroundColor: "var(--surface)",
                  },
                  "&:disabled": {
                    borderColor: "var(--border-default)",
                    color: "var(--font-tertiary)",
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
