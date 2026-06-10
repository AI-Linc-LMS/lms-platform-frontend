"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { adminStudentService } from "@/lib/services/admin/admin-student.service";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";
import { useToast } from "@/components/common/Toast";

interface Course {
  id: number;
  title: string;
  description?: string;
  is_active?: boolean;
}

interface CourseManagementCardProps {
  studentId: number;
  enrolledCourseIds: number[];
  onEnrollmentChange: () => void;
}

const INDIGO = "#6366f1";

function errMessage(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { detail?: string } } })?.response?.data
      ?.detail || fallback
  );
}

export function CourseManagementCard({
  studentId,
  enrolledCourseIds,
  onEnrollmentChange,
}: CourseManagementCardProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const response = await adminCoursesService.getCourses({ page: 1, limit: 100 });
        // Normalize the various response shapes the courses API can return.
        let coursesData: Course[] = [];
        if (Array.isArray(response)) coursesData = response;
        else if (response?.results) coursesData = response.results;
        else if (response?.courses) coursesData = response.courses;
        else if (Array.isArray(response?.data)) coursesData = response.data;
        setCourses(coursesData);
      } catch (error: unknown) {
        showToast(errMessage(error, t("manageStudents.failedToLoadCourses")), "error");
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, [showToast, t]);

  const runAction = async (
    action: "enroll_course" | "unenroll_course" | "reset_progress",
    successKey: string,
    failKey: string
  ) => {
    if (!selectedCourseId || typeof selectedCourseId !== "number") return;
    try {
      setLoading(true);
      await adminStudentService.manageStudentAction(studentId, action, Number(selectedCourseId));
      showToast(t(successKey), "success");
      setSelectedCourseId("");
      onEnrollmentChange();
    } catch (error: unknown) {
      showToast(errMessage(error, t(failKey)), "error");
    } finally {
      setLoading(false);
    }
  };

  const isEnrolled =
    selectedCourseId !== "" && enrolledCourseIds.includes(Number(selectedCourseId));

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
        backgroundColor: "var(--card-bg)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: { xs: 2, md: 2.5 },
          py: 1.75,
          borderBottom: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: `color-mix(in srgb, ${INDIGO} 14%, transparent)`,
          }}
        >
          <IconWrapper icon="mdi:book-education-outline" size={19} color={INDIGO} />
        </Box>
        <Typography sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
          {t("manageStudents.courseManagement")}
        </Typography>
      </Box>

      <Box
        sx={{
          p: { xs: 2, md: 2.5 },
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1.5,
          alignItems: { xs: "stretch", sm: "flex-end" },
        }}
      >
        <FormControl fullWidth sx={{ minWidth: { xs: "100%", sm: 280 } }}>
          <InputLabel id="course-select-label">{t("manageStudents.selectCourse")}</InputLabel>
          <Select
            labelId="course-select-label"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value as number)}
            label={t("manageStudents.selectCourse")}
            disabled={loading || loadingCourses}
            sx={{ borderRadius: 2 }}
          >
            {loadingCourses && courses.length === 0 ? (
              <MenuItem disabled>
                <CircularProgress size={18} sx={{ mr: 1 }} />
                {t("manageStudents.loadingCourses")}
              </MenuItem>
            ) : (
              courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.title}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            disableElevation
            startIcon={<IconWrapper icon="mdi:plus-circle" size={18} />}
            onClick={() =>
              runAction("enroll_course", "manageStudents.studentEnrolledSuccess", "manageStudents.failedToEnroll")
            }
            disabled={!selectedCourseId || loading || isEnrolled}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#10b981",
              "&:hover": { bgcolor: "#0e9f70" },
            }}
          >
            {t("manageStudents.enroll")}
          </Button>

          <Button
            variant="contained"
            disableElevation
            startIcon={<IconWrapper icon="mdi:minus-circle" size={18} />}
            onClick={() =>
              runAction("unenroll_course", "manageStudents.studentUnenrolledSuccess", "manageStudents.failedToUnenroll")
            }
            disabled={!selectedCourseId || loading || !isEnrolled}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#f59e0b",
              "&:hover": { bgcolor: "#d98a09" },
            }}
          >
            {t("manageStudents.unenroll")}
          </Button>

          <Button
            variant="outlined"
            startIcon={<IconWrapper icon="mdi:refresh" size={18} />}
            onClick={() =>
              runAction("reset_progress", "manageStudents.progressResetSuccess", "manageStudents.failedToResetProgress")
            }
            disabled={!selectedCourseId || loading || !isEnrolled}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 700,
              borderColor: "#f59e0b",
              color: "#b45309",
              "&:hover": { borderColor: "#d98a09", bgcolor: "color-mix(in srgb, #f59e0b 10%, transparent)" },
            }}
          >
            {t("manageStudents.resetProgress")}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
