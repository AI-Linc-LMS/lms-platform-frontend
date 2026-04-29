"use client";

import { Box, Typography, Button, Paper, LinearProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import { CourseCard } from "@/components/course/CourseCard";
import { Course as CourseCardCourse } from "@/components/course/interfaces";
import { IconWrapper } from "@/components/common/IconWrapper";
import Link from "next/link";

interface MyCoursesSectionProps {
  courses: CourseCardCourse[];
  loading?: boolean;
}

export const MyCoursesSection = ({ courses, loading }: MyCoursesSectionProps) => {
  const { t } = useTranslation("common");
  const hasCourses = courses && courses.length > 0;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "var(--font-primary)",
          }}
        >
          {t("dashboard.myCourses")}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
          <LinearProgress sx={{ width: "80%", height: 2, borderRadius: 1 }} />
        </Box>
      ) : hasCourses ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(auto-fill, minmax(300px, 1fr))",
            },
            gap: 3,
          }}
        >
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </Box>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            backgroundColor: "var(--card-bg)",
            border: "1px dashed var(--border-default)",
            borderRadius: 3,
            minHeight: 240,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: "color-mix(in srgb, var(--accent-indigo) 14%, transparent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <IconWrapper
              icon="mdi:book-open-page-variant-outline"
              size={32}
              color="var(--accent-indigo)"
            />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--font-primary)",
              mb: 1,
            }}
          >
            {t("dashboard.noCoursesChosen")}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "var(--font-secondary)",
              mb: 3,
              maxWidth: 300,
            }}
          >
            {t("dashboard.exploreCatalog")}
          </Typography>
          <Button
            component={Link}
            href="/courses"
            variant="contained"
            startIcon={<IconWrapper icon="mdi:compass-outline" size={20} />}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 4,
              py: 1,
              backgroundColor: "var(--accent-indigo)",
              boxShadow: "0 4px 12px color-mix(in srgb, var(--accent-indigo) 28%, transparent)",
              "&:hover": {
                backgroundColor: "var(--accent-indigo-dark)",
                boxShadow: "0 6px 16px color-mix(in srgb, var(--accent-indigo) 36%, transparent)",
              },
            }}
          >
            {t("dashboard.exploreCourses")}
          </Button>
        </Paper>
      )}
    </Box>
  );
};
