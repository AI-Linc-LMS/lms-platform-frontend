"use client";

import { Box, Typography, Button, Paper } from "@mui/material";
import { CourseCard } from "@/components/course/CourseCard";
import { Course as CourseCardCourse } from "@/components/course/interfaces";
import { IconWrapper } from "@/components/common/IconWrapper";
import Link from "next/link";

interface MyCoursesSectionProps {
  courses: CourseCardCourse[];
}

export const MyCoursesSection = ({ courses }: MyCoursesSectionProps) => {
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
            color: "#111827",
          }}
        >
          My Courses
        </Typography>
      </Box>

      {hasCourses ? (
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
            backgroundColor: "#ffffff",
            border: "1px dashed #e5e7eb",
            borderRadius: 3,
            minHeight: 240,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <IconWrapper
              icon="mdi:book-open-page-variant-outline"
              size={32}
              color="#6366f1"
            />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#374151",
              mb: 1,
            }}
          >
            No courses chosen yet
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#6b7280",
              mb: 3,
              maxWidth: 300,
            }}
          >
            Explore our catalog and find the perfect course to start your
            learning journey.
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
              backgroundColor: "#6366f1",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
              "&:hover": {
                backgroundColor: "#4f46e5",
                boxShadow: "0 6px 16px rgba(99, 102, 241, 0.3)",
              },
            }}
          >
            Explore Courses
          </Button>
        </Paper>
      )}
    </Box>
  );
};
