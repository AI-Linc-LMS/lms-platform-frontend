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
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { Loading } from "@/components/common/Loading";
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
      showToast("Failed to load courses", "error");
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
          showToast(
            "Payment verified! You have successfully enrolled.",
            "success"
          );
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
      showToast("Successfully enrolled in course", "success");
      loadCourses();
    } catch (error: any) {
      showToast("Failed to enroll in course", "error");
    } finally {
      setEnrollingCourseId(null);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Loading fullScreen />
      </MainLayout>
    );
  }

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
              Course List
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Explore and enroll in courses to enhance your skills
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
                  Total Courses
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
                  Enrolled
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
                  Available
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
            <Tab label={`All (${totalCount})`} value="all" />
            <Tab label={`Enrolled (${enrolledCount})`} value="enrolled" />
            <Tab label={`Available (${availableCount})`} value="available" />
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
              placeholder="Search courses..."
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
              Advanced Filters
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
              Clear All
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
                Category
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
                <MenuItem value="All">All Categories</MenuItem>
                <MenuItem value="Full Stack Development">
                  Full Stack Development
                </MenuItem>
                <MenuItem value="Front-End Development">
                  Front-End Development
                </MenuItem>
                <MenuItem value="Back-End Development">
                  Back-End Development
                </MenuItem>
                <MenuItem value="UI/UX Design">UI/UX Design</MenuItem>
                <MenuItem value="Data Science & Analytics">
                  Data Science & Analytics
                </MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Business">Business</MenuItem>
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
                Price
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
                <MenuItem value="All">All Prices</MenuItem>
                <MenuItem value="Free">Free</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
              </Select>
            </FormControl>

          </Box>
        </Paper>

        {/* Courses Grid */}
        {paginatedCourses.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              No courses found
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
              Showing result {(page - 1) * pageSize + 1}-
              {Math.min(page * pageSize, filteredCourses.length)} of{" "}
              {filteredCourses.length} Entries
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
                <Box
                  component="span"
                  sx={{ display: { xs: "none", sm: "inline" } }}
                >
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
