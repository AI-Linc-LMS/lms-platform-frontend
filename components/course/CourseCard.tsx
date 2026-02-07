"use client";

import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Button,
  Avatar,
  Tooltip,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { memo, useCallback, useMemo } from "react";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Course } from "./interfaces";

interface CourseCardProps {
  course: Course;
  onEnroll?: (courseId: number) => void;
  enrolling?: boolean;
}

export const CourseCard = memo(
  function CourseCard({ course, onEnroll, enrolling }: CourseCardProps) {
    const router = useRouter();
    const isEnrolled = course.is_enrolled;

    const handleClick = useCallback(() => {
      router.push(`/courses/${course.id}`);
    }, [router, course.id]);

    const handleEnroll = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onEnroll) {
          onEnroll(course.id);
        }
      },
      [onEnroll, course.id]
    );

    const totalLessons = useMemo(
      () =>
        (course.stats?.article?.total || 0) + (course.stats?.video?.total || 0),
      [course.stats]
    );

    return (
      <Card
        sx={{
          height: "100%",
          minHeight: 320,
          display: "flex",
          flexDirection: "column",
          border: "1px solid",
          borderColor: isEnrolled ? "rgba(16, 185, 129, 0.2)" : "#e5e7eb",
          borderRadius: 3,
          overflow: "hidden",
          transition: "all 0.3s ease",
          position: "relative",
          "&:hover": {
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
            borderColor: isEnrolled ? "rgba(16, 185, 129, 0.4)" : "#6366f1",
          },
        }}
      >
        {/* Status Badge */}
        {isEnrolled && (
          <Box
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              zIndex: 1,
            }}
          >
            <Chip
              icon={<IconWrapper icon="mdi:check-circle" size={14} />}
              label="Enrolled"
              size="small"
              sx={{
                backgroundColor: "#d1fae5",
                color: "#065f46",
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 22,
                "& .MuiChip-icon": {
                  color: "#065f46",
                },
              }}
            />
          </Box>
        )}

        {/* Header Section */}
        <Box
          sx={{
            background: isEnrolled
              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.05) 100%)"
              : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            p: 2,
            pb: 2.5,
            position: "relative",
            minHeight: 90,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: isEnrolled ? "#1f2937" : "#ffffff",
              fontWeight: 700,
              fontSize: "1rem",
              mb: 0.5,
              pr: isEnrolled ? 10 : 0,
              minHeight: 40,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.3,
            }}
          >
            {course.title}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: isEnrolled ? "#6b7280" : "rgba(255, 255, 255, 0.9)",
              fontSize: "0.8125rem",
              minHeight: 18,
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {course.subtitle || course.instructors?.[0]?.name || "\u00A0"}
          </Typography>
        </Box>

        <CardContent
          sx={{
            flexGrow: 1,
            p: 2,
            pt: 1.5,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Description - Always same height */}
          <Tooltip
            title={course.description || "No description available"}
            arrow
            placement="top"
            enterDelay={300}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#6b7280",
                fontSize: "0.8125rem",
                lineHeight: 1.5,
                mb: 2,
                minHeight: 38,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                cursor: "help",
              }}
            >
              {course.description || "\u00A0"}
            </Typography>
          </Tooltip>

          {/* Stats Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 1.5,
              mb: 2,
              minHeight: 60,
            }}
          >
            {/* Lessons or Progress */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                p: 1.25,
                backgroundColor: "#f3f4f6",
                borderRadius: 1.5,
              }}
            >
              <IconWrapper
                icon={isEnrolled ? "mdi:chart-box-outline" : "mdi:book-outline"}
                size={18}
                color="#6366f1"
              />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#9ca3af",
                    fontSize: "0.65rem",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                    lineHeight: 1.2,
                  }}
                >
                  {isEnrolled ? "Progress" : "Lessons"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#1f2937",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    lineHeight: 1.2,
                  }}
                >
                  {isEnrolled ? `${course.progress || 0}%` : totalLessons}
                </Typography>
              </Box>
            </Box>

            {/* Difficulty Level */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                p: 1.25,
                backgroundColor: "#f3f4f6",
                borderRadius: 1.5,
              }}
            >
              <IconWrapper icon="mdi:speedometer" size={18} color="#6366f1" />
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#9ca3af",
                    fontSize: "0.65rem",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                    lineHeight: 1.2,
                  }}
                >
                  Level
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#1f2937",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    lineHeight: 1.2,
                  }}
                >
                  {course.difficulty_level}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* CTA Button */}
          <Box sx={{ mt: "auto" }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={
                <IconWrapper
                  icon={
                    isEnrolled
                      ? "mdi:play-circle-outline"
                      : "mdi:plus-circle-outline"
                  }
                  size={18}
                />
              }
              onClick={isEnrolled ? handleClick : handleEnroll}
              disabled={
                !isEnrolled && (!course.enrollment_enabled || enrolling)
              }
              sx={{
                backgroundColor: isEnrolled ? "#10b981" : "#6366f1",
                color: "#ffffff",
                fontWeight: 600,
                py: 1,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "0.875rem",
                boxShadow: isEnrolled
                  ? "0 4px 14px 0 rgba(16, 185, 129, 0.39)"
                  : "0 4px 14px 0 rgba(99, 102, 241, 0.39)",
                "&:hover": {
                  backgroundColor: isEnrolled ? "#059669" : "#4f46e5",
                  boxShadow: isEnrolled
                    ? "0 6px 20px 0 rgba(16, 185, 129, 0.5)"
                    : "0 6px 20px 0 rgba(99, 102, 241, 0.5)",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.2s ease",
              }}
            >
              {enrolling
                ? "Enrolling..."
                : isEnrolled
                ? "Continue Learning"
                : course.is_free
                ? "Enroll Now"
                :parseFloat(course.price) > 0 ? `Enroll - ₹${course.price}` : "Enroll Now"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if course data or enrolling state changes
    return (
      prevProps.course.id === nextProps.course.id &&
      prevProps.course.is_enrolled === nextProps.course.is_enrolled &&
      prevProps.course.progress === nextProps.course.progress &&
      prevProps.enrolling === nextProps.enrolling
    );
  }
);
