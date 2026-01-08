import { useEffect, useState, useRef } from "react";
import { Course, coursesService } from "@/lib/services/courses.service";
import { Course as CourseCardCourse } from "@/components/course/interfaces";
import { useToast } from "@/components/common/Toast";

export const useDashboardData = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const [courses, setCourses] = useState<CourseCardCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const allCourses = await coursesService.getCourses();
      const enrolledCourses = allCourses?.filter(
        (course: Course) => course.is_enrolled
      ) as any[];

      setCourses(enrolledCourses);
      // Set first enrolled course as selected for leaderboard
      if (enrolledCourses.length > 0) {
        setSelectedCourseId(enrolledCourses[0].id);
      }
    } catch (error: any) {
      showToast("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    courses,
    selectedCourseId,
  };
};


