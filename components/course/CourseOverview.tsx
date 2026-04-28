"use client";

import { Box, Typography, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("common");
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
          submodule.assignment_count +
          (submodule.subjective_question_count ?? 0);
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
      submodule.assignment_count +
      (submodule.subjective_question_count ?? 0)
    );
  };

  const stats = getTotalStats();

  // Group modules by weekno
  const modulesByWeek = course.modules?.reduce((acc, module) => {
    const week = module.weekno || 0;
    if (!acc[week]) acc[week] = [];
    acc[week].push(module);
    return acc;
  }, {} as Record<number, Module[]>) || {};

  // Sort weeks numerically
  const sortedWeeks = Object.keys(modulesByWeek)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid var(--border-default)",
        borderRadius: 2,
        p: 3,
        background:
          "linear-gradient(to bottom, var(--card-bg) 0%, var(--surface) 100%)",
      }}
    >
      {/* Course Overview Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background:
              "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-purple) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper
            icon="mdi:book-open-page-variant"
            size={22}
            color="var(--font-light)"
          />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "var(--font-primary)",
              fontSize: "1.125rem",
            }}
          >
            {t("courses.coursesOverview")}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "var(--font-secondary)", fontSize: "0.75rem" }}
          >
            {stats.sections} {t("courses.sections")} • {stats.lectures} {t("courses.items")}
          </Typography>
        </Box>
      </Box>

      {/* Modules grouped by week */}
      {course.modules && course.modules.length > 0 ? (
        <Box>
          {sortedWeeks.map((week) => {
            const weekModules = modulesByWeek[week];
            return (
              <Box key={week} sx={{ mb: week < sortedWeeks[sortedWeeks.length - 1] ? 3 : 0 }}>
                {/* Week Header */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2,
                    pb: 1,
                    borderBottom: "2px solid var(--border-default)",
                  }}
                >
                  <IconWrapper
                    icon="mdi:calendar-week"
                    size={20}
                    color="var(--accent-indigo)"
                  />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: "var(--font-primary)",
                      fontSize: "0.875rem",
                    }}
                  >
                    Week {week}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--font-tertiary)",
                      fontSize: "0.75rem",
                      ml: 0.5,
                    }}
                  >
                    ({weekModules.length} {weekModules.length === 1 ? "module" : "modules"})
                  </Typography>
                </Box>

                {/* Modules for this week */}
                <Box>
                  {weekModules.map((module,index) => {
                    // Get previous week's modules for locking logic
                    const previousWeek = week - 1;
                    const previousWeekModules = modulesByWeek[previousWeek] || [];
                    
                    return (
                      <ModuleAccordion
                        key={module.id}
                        module={module}
                        moduleIndex={index}
                        modules={weekModules}
                        currentWeek={week}
                        previousWeekModules={previousWeekModules}
                        isExpanded={expandedModules[module.id] ?? false}
                        onToggle={() => onModuleToggle(module.id)}
                        courseId={course.course_id}
                        contentLockEnabled={course.content_lock_enabled}
                        lockThresholdValue={course.lock_threshold_value ?? 80}
                        onNavigate={onNavigate}
                        getSubmoduleContentCount={getSubmoduleContentCount}
                      />
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Typography variant="body2" sx={{ color: "var(--font-tertiary)" }}>
          {t("courses.noModulesAvailable")}
        </Typography>
      )}
    </Paper>
  );
}
