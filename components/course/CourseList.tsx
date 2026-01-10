"use client";

import { Box, Typography } from "@mui/material";
import { memo } from "react";
import { Course } from "./interfaces";
import { CourseCard } from "./CourseCard";

interface CourseListProps {
  courses: Course[];
  onEnroll?: () => void;
}

export const CourseList = memo<CourseListProps>(function CourseList({
  courses,
  onEnroll,
}) {
  if (courses.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No courses available
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
        },
        gap: 3,
      }}
    >
      {courses.map((course) => (
        <Box key={course.id}>
          <CourseCard course={course} />
        </Box>
      ))}
    </Box>
  );
});
