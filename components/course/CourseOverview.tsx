"use client";

import { Box, Typography, Paper } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CourseDetail, Module } from "@/lib/services/courses.service";
import { ModuleAccordion } from "./ModuleAccordion";

interface CourseOverviewProps {
  course: CourseDetail;
  expandedModules: { [key: number]: boolean };
  onModuleToggle: (moduleId: number) => void;
  onNavigate: (submoduleId: number) => void;
}

export function CourseOverview({
  course,
  expandedModules,
  onModuleToggle,
  onNavigate,
}: CourseOverviewProps) {
  const getTotalStats = () => {
    if (!course?.modules) return { sections: 0, lectures: 0 };

    let totalLectures = 0;

    course.modules.forEach((module) => {
      module.submodules?.forEach((submodule) => {
        totalLectures +=
          submodule.video_count +
          submodule.quiz_count +
          submodule.article_count +
          submodule.coding_problem_count +
          submodule.assignment_count;
      });
    });

    return {
      sections: course.modules.length,
      lectures: totalLectures,
    };
  };

  const getSubmoduleContentCount = (submodule: any) => {
    return (
      submodule.video_count +
      submodule.quiz_count +
      submodule.article_count +
      submodule.coding_problem_count +
      submodule.assignment_count
    );
  };

  const stats = getTotalStats();

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        p: 3,
        background: "linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)",
      }}
    >
      {/* Course Overview Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper
            icon="mdi:book-open-page-variant"
            size={22}
            color="#ffffff"
          />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#1a1f2e", fontSize: "1.125rem" }}
          >
            Courses Overview
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#6b7280", fontSize: "0.75rem" }}
          >
            {stats.sections} sections • {stats.lectures} items
          </Typography>
        </Box>
      </Box>

      {/* Modules */}
      {course.modules && course.modules.length > 0 ? (
        <Box>
          {course.modules.map((module) => (
            <ModuleAccordion
              key={module.id}
              module={module}
              isExpanded={expandedModules[module.id] ?? false}
              onToggle={() => onModuleToggle(module.id)}
              courseId={course.course_id}
              onNavigate={onNavigate}
              getSubmoduleContentCount={getSubmoduleContentCount}
            />
          ))}
        </Box>
      ) : (
        <Typography variant="body2" sx={{ color: "#9ca3af" }}>
          No modules available
        </Typography>
      )}
    </Paper>
  );
}
