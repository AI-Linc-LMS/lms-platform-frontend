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
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Course } from "./interfaces";

interface CourseCardProps {
  course: Course;
  onEnroll?: (courseId: number) => void;
  enrolling?: boolean;
}

const DIFFICULTY_KEYS: Record<string, string> = {
  Easy: "courses.difficultyEasy",
  Medium: "courses.difficultyMedium",
  Hard: "courses.difficultyHard",
  Beginner: "courses.difficultyBeginner",
};

export const CourseCard = memo(
  function CourseCard({ course, onEnroll, enrolling }: CourseCardProps) {
    const { t } = useTranslation("common");
    const router = useRouter();
    const isEnrolled = course.is_enrolled;
    const difficultyKey = course.difficulty_level && DIFFICULTY_KEYS[course.difficulty_level];
    const difficultyLabel = difficultyKey ? t(difficultyKey) : t("courses.difficultyBeginner");

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

    const totalLessons = useMemo(() => {
      const s = course.stats;
      if (!s) return 0;
      return (
        (s.video?.total || 0) +
        (s.article?.total || 0) +
        (s.quiz?.total || 0) +
        (s.assignment?.total || 0) +
        (s.coding_problem?.total || 0) +
        (s.subjective_question?.total || 0)
      );
    }, [course.stats]);

    return (
      <Card
        sx={{
          height: "100%",
          minHeight: 320,
          display: "flex",
          flexDirection: "column",
          border: "1px solid",
          borderColor: isEnrolled
            ? "color-mix(in srgb, var(--success-500) 30%, transparent)"
            : "var(--border-default)",
          borderRadius: 3,
          overflow: "hidden",
          transition: "all 0.3s ease",
          position: "relative",
          "&:hover": {
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
            borderColor: isEnrolled
              ? "color-mix(in srgb, var(--success-500) 48%, transparent)"
              : "var(--accent-indigo)",
          },
        }}
      >
        {/* Status Badge */}
        {isEnrolled && (
          <Box
            sx={{
              position: "absolute",
              top: 10,
              insetInlineEnd: 10,
              zIndex: 1,
            }}
          >
            <Chip
              icon={<IconWrapper icon="mdi:check-circle" size={14} />}
              label={t("courses.enrolled")}
              size="small"
              sx={{
                backgroundColor: "color-mix(in srgb, var(--success-500) 22%, transparent)",
                color: "var(--success-500)",
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 22,
                "& .MuiChip-icon": {
                  color: "var(--success-500)",
                },
              }}
            />
          </Box>
        )}

        {/* Header Section */}
        <Box
          sx={{
            background: isEnrolled
              ? "linear-gradient(135deg, color-mix(in srgb, var(--success-500) 12%, transparent) 0%, color-mix(in srgb, var(--success-500) 8%, transparent) 100%)"
              : "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-indigo-dark) 100%)",
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
              color: isEnrolled ? "var(--font-primary)" : "#ffffff",
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
              color: isEnrolled ? "var(--font-secondary)" : "rgba(255, 255, 255, 0.9)",
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
            title={course.description || t("courses.noDescription")}
            arrow
            placement="top"
            enterDelay={300}
          >
            <Typography
              variant="body2"
              sx={{
                color: "var(--font-secondary)",
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
                backgroundColor: "var(--surface)",
                borderRadius: 1.5,
              }}
            >
              <IconWrapper
                icon={isEnrolled ? "mdi:chart-box-outline" : "mdi:book-outline"}
                size={18}
                color="var(--accent-indigo)"
              />
              <Box sx={{ flex: 1, minWidth: 0, textAlign: "start" }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--font-tertiary)",
                    fontSize: "0.65rem",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                    lineHeight: 1.2,
                  }}
                >
                  {isEnrolled ? t("courses.progress") : t("courses.lessons")}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--font-primary)",
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
                backgroundColor: "var(--surface)",
                borderRadius: 1.5,
              }}
            >
              <IconWrapper icon="mdi:speedometer" size={18} color="var(--accent-indigo)" />
              <Box sx={{ minWidth: 0, textAlign: "start" }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--font-tertiary)",
                    fontSize: "0.65rem",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                    lineHeight: 1.2,
                  }}
                >
                  {t("courses.level")}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--font-primary)",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    lineHeight: 1.2,
                    textAlign: "start",
                  }}
                >
                  {difficultyLabel}
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
                backgroundColor: isEnrolled ? "var(--success-500)" : "var(--accent-indigo)",
                color: "#ffffff",
                fontWeight: 600,
                py: 1,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "0.875rem",
                boxShadow: isEnrolled
                  ? "0 4px 14px 0 color-mix(in srgb, var(--success-500) 40%, transparent)"
                  : "0 4px 14px 0 color-mix(in srgb, var(--accent-indigo) 40%, transparent)",
                "&:hover": {
                  backgroundColor: isEnrolled
                    ? "color-mix(in srgb, var(--success-500) 86%, black)"
                    : "var(--accent-indigo-dark)",
                  boxShadow: isEnrolled
                    ? "0 6px 20px 0 color-mix(in srgb, var(--success-500) 52%, transparent)"
                    : "0 6px 20px 0 color-mix(in srgb, var(--accent-indigo) 52%, transparent)",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.2s ease",
              }}
            >
              {enrolling
                ? t("courses.enrolling")
                : isEnrolled
                ? t("courses.continueLearning")
                : course.is_free
                ? t("courses.enrollNow")
                : parseFloat(course.price) > 0 ? t("courses.enrollPrice", { price: course.price }) : t("courses.enrollNow")}
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    const contentTotal = (c: Course) =>
      (c.stats?.video?.total || 0) +
      (c.stats?.article?.total || 0) +
      (c.stats?.quiz?.total || 0) +
      (c.stats?.assignment?.total || 0) +
      (c.stats?.coding_problem?.total || 0) +
      (c.stats?.subjective_question?.total || 0);
    return (
      prevProps.course.id === nextProps.course.id &&
      prevProps.course.is_enrolled === nextProps.course.is_enrolled &&
      prevProps.course.progress === nextProps.course.progress &&
      prevProps.enrolling === nextProps.enrolling &&
      contentTotal(prevProps.course) === contentTotal(nextProps.course)
    );
  }
);
