"use client";

import { useState, useEffect } from "react";
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
        error?.response?.data?.detail || "Failed to load courses",
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
      showToast("Student enrolled successfully", "success");
      setSelectedCourseId("");
      onEnrollmentChange();
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || "Failed to enroll student",
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
      showToast("Student unenrolled successfully", "success");
      setSelectedCourseId("");
      onEnrollmentChange();
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || "Failed to unenroll student",
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
      showToast("Student progress reset successfully", "success");
      setSelectedCourseId("");
      onEnrollmentChange();
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || "Failed to reset progress",
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
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
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
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            backgroundColor: "#eef2ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:book-education" size={24} color="#6366f1" />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827" }}>
          Course Management
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
          <InputLabel id="course-select-label">Select Course</InputLabel>
          <Select
            labelId="course-select-label"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value as number)}
            label="Select Course"
            disabled={loading || loadingCourses}
          >
            {loadingCourses && courses.length === 0 ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading courses...
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
              bgcolor: "#10b981",
              "&:hover": { bgcolor: "#059669" },
              minWidth: { xs: "100%", sm: 120 },
            }}
          >
            Enroll
          </Button>

          <Button
            variant="contained"
            startIcon={<IconWrapper icon="mdi:minus-circle" size={20} />}
            onClick={handleUnenroll}
            disabled={!selectedCourseId || loading || !isEnrolled}
            sx={{
              bgcolor: "#f59e0b",
              "&:hover": { bgcolor: "#d97706" },
              minWidth: { xs: "100%", sm: 120 },
            }}
          >
            Unenroll
          </Button>

          <Button
            variant="outlined"
            startIcon={<IconWrapper icon="mdi:refresh" size={20} />}
            onClick={handleResetProgress}
            disabled={!selectedCourseId || loading || !isEnrolled}
            sx={{
              borderColor: "#f59e0b",
              color: "#f59e0b",
              "&:hover": {
                borderColor: "#d97706",
                bgcolor: "#fef3c7",
              },
              minWidth: { xs: "100%", sm: 140 },
            }}
          >
            Reset Progress
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
