"use client";

import { Box, Typography, IconButton, Button, CircularProgress } from "@mui/material";
import { CourseDetail, CourseDashboard } from "@/lib/services/courses.service";
import { IconWrapper } from "@/components/common/IconWrapper";

interface CourseBannerProps {
  course: CourseDetail;
  dashboard: CourseDashboard | null;
  instructor: CourseDetail["instructors"][0] | undefined;
  onToggleLike: () => void;
  onEnroll?: () => void;
  isEnrolling?: boolean;
}

export function CourseBanner({
  course,
  dashboard,
  instructor,
  onToggleLike,
  onEnroll,
  isEnrolling,
}: CourseBannerProps) {
  const updatedDate = course.updated_at
    ? new Date(course.updated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

  return (
    <Box
      sx={{
        position: "relative",
        background:
          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 4, sm: 5, md: 6 },
        mx: { xs: 2, sm: 3, md: 4 },
        mt: { xs: 2, md: 0 },
        mb: { xs: 3, md: 4 },
        borderRadius: { xs: 2, md: 3 },
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(102, 126, 234, 0.3)",
      }}
    >
      {/* Decorative background overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.08) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{ position: "relative", zIndex: 1, maxWidth: 1200, mx: "auto" }}
      >
        {/* Instructor */}
        {instructor && (
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#ffffff",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              {instructor.name}
            </Typography>
            <IconWrapper
              icon="mdi:check-circle-outline"
              size={24}
              color="#fbbf24"
            />
          </Box>
        )}

        {/* Course Title */}
        <Typography
          variant="h3"
          sx={{
            color: "#ffffff",
            fontWeight: 700,
            fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2.5rem" },
            mb: { xs: 1.5, md: 2 },
            lineHeight: 1.2,
          }}
        >
          {course.course_title}
        </Typography>

        {/* Course Description */}
        <Typography
          variant="body1"
          sx={{
            color: "rgba(255, 255, 255, 0.9)",
            fontSize: { xs: "0.875rem", sm: "0.9375rem", md: "1rem" },
            mb: { xs: 3, md: 4 },
            maxWidth: { xs: "100%", md: 800 },
            lineHeight: 1.6,
          }}
        >
          {course.course_description}
        </Typography>

        {/* Course Details */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: { xs: 2, sm: 3 },
            mb: { xs: 3, md: 4 },
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper
              icon="mdi:calendar-clock"
              size={24}
              color="#ffffff"
            />
            <Typography
              variant="body2"
              sx={{
                color: "#ffffff",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              Updated: {updatedDate}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper
              icon="mdi:account-group"
              size={24}
              color="#ffffff"
            />
            <Typography
              variant="body2"
              sx={{
                color: "#ffffff",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              {course.enrolled_students} Enrolled
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper
              icon={
                course.is_certified
                  ? "mdi:certificate"
                  : "mdi:certificate-outline"
              }
              size={24}
              color="#ffffff"
            />
            <Typography
              variant="body2"
              sx={{
                color: "#ffffff",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              {course.is_certified ? "Certified" : "No Certificate"}
            </Typography>
          </Box>
          {/* Like Button */}
          <Box sx={{ ml: "auto" }}>
            <IconButton
              onClick={onToggleLike}
              sx={{
                color: course.is_liked_by_current_user
                  ? "#ef4444"
                  : "#ffffff",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              <IconWrapper
                icon={
                  course.is_liked_by_current_user
                    ? "mdi:heart"
                    : "mdi:heart-outline"
                }
                size={32}
              />
            </IconButton>
            <Typography
              variant="body2"
              sx={{
                color: "#ffffff",
                fontSize: "0.75rem",
                textAlign: "center",
                mt: 0.5,
                minHeight: "1rem",
              }}
            >
              {course.liked_count ?? 0}
            </Typography>
          </Box>
        </Box>

        {/* Progress Bar - Show if enrolled */}
        {dashboard &&
          dashboard.completion_percentage !== undefined &&
          dashboard.completion_percentage !== null && (
            <Box sx={{ mb: 3, maxWidth: { xs: "100%", md: 600 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "#ffffff",
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                >
                  Your Progress
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#ffffff",
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    fontWeight: 600,
                  }}
                >
                  {(dashboard.completion_percentage ?? 0).toFixed(0)}%
                </Typography>
              </Box>
              <Box
                sx={{
                  width: "100%",
                  height: { xs: 6, sm: 8 },
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${dashboard.completion_percentage ?? 0}%`,
                    height: "100%",
                    background:
                      "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)",
                    borderRadius: 4,
                    transition: "width 0.3s ease",
                  }}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  gap: { xs: 2, sm: 3 },
                  mt: 1.5,
                  flexWrap: "wrap",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                  }}
                >
                  {dashboard.completed_modules ?? 0}/
                  {dashboard.total_modules ?? 0} Modules
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                  }}
                >
                  {dashboard.completed_contents ?? 0}/
                  {dashboard.total_contents ?? 0} Contents
                </Typography>
              </Box>
            </Box>
          )}
      </Box>
    </Box>
  );
}

