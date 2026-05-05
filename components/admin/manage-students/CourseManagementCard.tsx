"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Paper,
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
  const [page, setPage] = useState(1);
  const [limit] = useState(100);
  const [hasMore, setHasMore] = useState(true);

  // Load courses with pagination
  const loadCourses = async (pageNum: number = 1) => {
    try {
      setLoadingCourses(true);
      const response = await adminCoursesService.getCourses({
        page: pageNum,
        limit,
      });

      // Handle different response structures
      let coursesData: Course[] = [];
      if (Array.isArray(response)) {
        coursesData = response;
        setHasMore(coursesData.length === limit);
      } else if (response?.results) {
        coursesData = response.results;
        setHasMore(!!response.next);
      } else if (response?.courses) {
        coursesData = response.courses;
        setHasMore(coursesData.length === limit);
      } else if (response?.data) {
        coursesData = Array.isArray(response.data) ? response.data : [];
        setHasMore(coursesData.length === limit);
      } else {
        coursesData = [];
        setHasMore(false);
      }

      if (pageNum === 1) {
        setCourses(coursesData);
      } else {
        setCourses((prev) => [...prev, ...coursesData]);
      }
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || t("manageStudents.failedToLoadCourses"),
        "error"
      );
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    loadCourses(1);
  }, []);

  const handleEnroll = async () => {
    if (!selectedCourseId || typeof selectedCourseId !== "number") return;

    try {
      setLoading(true);
      await adminStudentService.manageStudentAction(
        studentId,
        "enroll_course",
        Number(selectedCourseId)
      );
      showToast(t("manageStudents.studentEnrolledSuccess"), "success");
      setSelectedCourseId("");
      onEnrollmentChange();
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || t("manageStudents.failedToEnroll"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!selectedCourseId || typeof selectedCourseId !== "number") return;

    try {
      setLoading(true);
      await adminStudentService.manageStudentAction(
        studentId,
        "unenroll_course",
        Number(selectedCourseId)
      );
      showToast(t("manageStudents.studentUnenrolledSuccess"), "success");
      setSelectedCourseId("");
      onEnrollmentChange();
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || t("manageStudents.failedToUnenroll"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetProgress = async () => {
    if (!selectedCourseId || typeof selectedCourseId !== "number") return;

    try {
      setLoading(true);
      await adminStudentService.manageStudentAction(
        studentId,
        "reset_progress",
        Number(selectedCourseId)
      );
      showToast(t("manageStudents.progressResetSuccess"), "success");
      setSelectedCourseId("");
      onEnrollmentChange();
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || t("manageStudents.failedToResetProgress"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const isEnrolled =
    selectedCourseId !== "" &&
    enrolledCourseIds.includes(Number(selectedCourseId));

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
        boxShadow:
          "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
        mb: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 3,
          pb: 2,
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            backgroundColor:
              "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:book-education" size={24} color="var(--accent-indigo)" />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
          {t("manageStudents.courseManagement")}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          alignItems: { xs: "stretch", sm: "flex-end" },
        }}
      >
        <FormControl fullWidth sx={{ minWidth: { xs: "100%", sm: 300 } }}>
          <InputLabel id="course-select-label">{t("manageStudents.selectCourse")}</InputLabel>
          <Select
            labelId="course-select-label"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value as number)}
            label={t("manageStudents.selectCourse")}
            disabled={loading || loadingCourses}
          >
            {loadingCourses && courses.length === 0 ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
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

        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            flex: { xs: "1 1 100%", sm: "0 0 auto" },
          }}
        >
          <Button
            variant="contained"
            startIcon={<IconWrapper icon="mdi:plus-circle" size={20} />}
            onClick={handleEnroll}
            disabled={!selectedCourseId || loading || isEnrolled}
            sx={{
              bgcolor: "var(--success-500)",
              color: "var(--font-light)",
              "&:hover": { bgcolor: "color-mix(in srgb, var(--success-500) 85%, black 15%)" },
              minWidth: { xs: "100%", sm: 120 },
            }}
          >
            {t("manageStudents.enroll")}
          </Button>

          <Button
            variant="contained"
            startIcon={<IconWrapper icon="mdi:minus-circle" size={20} />}
            onClick={handleUnenroll}
            disabled={!selectedCourseId || loading || !isEnrolled}
            sx={{
              bgcolor: "var(--warning-500)",
              color: "var(--font-light)",
              "&:hover": { bgcolor: "color-mix(in srgb, var(--warning-500) 85%, black 15%)" },
              minWidth: { xs: "100%", sm: 120 },
            }}
          >
            {t("manageStudents.unenroll")}
          </Button>

          <Button
            variant="outlined"
            startIcon={<IconWrapper icon="mdi:refresh" size={20} />}
            onClick={handleResetProgress}
            disabled={!selectedCourseId || loading || !isEnrolled}
            sx={{
              borderColor: "var(--warning-500)",
              color: "var(--warning-500)",
              "&:hover": {
                borderColor: "color-mix(in srgb, var(--warning-500) 80%, black 20%)",
                bgcolor: "color-mix(in srgb, var(--warning-500) 16%, var(--surface) 84%)",
              },
              minWidth: { xs: "100%", sm: 140 },
            }}
          >
            {t("manageStudents.resetProgress")}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
