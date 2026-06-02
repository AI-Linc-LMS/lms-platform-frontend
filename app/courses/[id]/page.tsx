"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Box, Typography, Fab, Tooltip, CircularProgress } from "@mui/material";
import dynamic from "next/dynamic";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  coursesService,
  CourseDetail,
  CourseDashboard,
  LeaderboardEntry,
} from "@/lib/services/courses.service";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import Link from "next/link";
import { CourseBanner } from "@/components/course/CourseBanner";
import { CourseOverview } from "@/components/course/CourseOverview";
import { ProgressDashboard } from "@/components/course/ProgressDashboard";
import { CourseLeaderboard } from "@/components/course/CourseLeaderboard";
import { InstructorCard } from "@/components/course/InstructorCard";
// Lazy: CertificateButtons drags in jspdf + html-to-image (~500KB gz). Only
// needed when a course is certifiable, so defer it off the initial bundle.
const CertificateButtons = dynamic(
  () =>
    import("@/components/course/CertificateButtons").then((m) => ({
      default: m.CertificateButtons,
    })),
  { ssr: false }
);
import { usePayment } from "@/hooks/usePayment";
import { PaymentType } from "@/lib/services/payment.service";
import { useHideLeaderboardView, useIsCourseEnabled, useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { config } from "@/lib/config";
import { getUploadedFiles } from "@/lib/services/file-upload.service";

export default function CourseDetailPage() {
  const { t } = useTranslation("common");
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [dashboard, setDashboard] = useState<CourseDashboard | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUploadedCourseCertificate, setHasUploadedCourseCertificate] = useState(false);
  const [uploadedCourseCertificateUrl, setUploadedCourseCertificateUrl] = useState("");
  const [expandedModules, setExpandedModules] = useState<{
    [key: number]: boolean;
  }>({});
  const { showToast } = useToast();
  const { handlePayment, isProcessing } = usePayment();
  const hideLeaderboardView = useHideLeaderboardView();
  const isCourseEnabled = useIsCourseEnabled();

  useEffect(() => {
    if (!courseId) return;
    loadCourseDetail();
    loadDashboard();
    loadLeaderboard();
    loadCourseCertificateAvailability();
  }, [courseId]);

  const loadCourseCertificateAvailability = async () => {
    try {
      const clientId = Number(config.clientId);
      if (!Number.isFinite(clientId) || clientId <= 0 || !Number.isFinite(courseId) || courseId <= 0) {
        setHasUploadedCourseCertificate(false);
        setUploadedCourseCertificateUrl("");
        return;
      }

      const res = await getUploadedFiles(clientId, "certificate");
      const files = Array.isArray(res?.files) ? res.files?.filter((f) => f.module === "certificate") : [];
      const pathNeedle = `/certificate/${clientId}/course/${courseId}/`;
      const matched = files.find((f) => (f.url || "").toLowerCase().includes(pathNeedle));
      const hasMatch = Boolean(matched?.url);
      setHasUploadedCourseCertificate(hasMatch);
      setUploadedCourseCertificateUrl((matched?.url || "").trim());
    } catch {
      setHasUploadedCourseCertificate(false);
      setUploadedCourseCertificateUrl("");
    }
  };

  const loadCourseDetail = async () => {
    try {
      setLoading(true);
      const data = await coursesService.getCourseDetail(courseId);
      setCourse(data);
      // Initialize all modules as collapsed, then expand first one
      if (data.modules && data.modules.length > 0) {
        const initialExpanded: { [key: number]: boolean } = {};
        data.modules.forEach((module) => {
          initialExpanded[module.id] = false;
        });
        // Expand first module by default
        if (data.modules[0]) {
          initialExpanded[data.modules[0].id] = true;
        }
        setExpandedModules(initialExpanded);
      }
    } catch (error: any) {
      showToast(t("courses.failedToLoadDetails"), "error");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const data = await coursesService.getUserCourseDashboard(courseId);
      setDashboard(data);
    } catch (error) {
      // Silently fail if user is not enrolled
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await coursesService.getCourseLeaderboard(courseId);
      setLeaderboard(data || []);
    } catch (error) {
      setLeaderboard([]);
    }
  };

  const handleEnroll = async () => {
    if (!course) return;

    // Check if course is free or paid
    // Since CourseDetail might not have is_free/price, we can check a few things:
    // 1. If it's in the CourseDetail but not in interface, it will be in course as any
    const anyCourse = course as any;
    const isFree = anyCourse.is_free ?? true;
    const price = anyCourse.price || "0";

    if (!isFree && parseFloat(price) > 0) {
      await handlePayment({
        amount: price,
        currency: "INR",
        typeId: courseId.toString(),
        paymentType: PaymentType.COURSE,
        description: `Access for ${course.course_title}`,
        onSuccess: (res) => {
          showToast(
            t("courses.paymentVerified"),
            "success"
          );
          loadCourseDetail();
          loadDashboard();
        },
        onError: (err) => {
          showToast(
            err.message || "Payment failed. Please try again.",
            "error"
          );
        },
      });
      return;
    }

    try {
      await coursesService.enrollInCourse(courseId);
      showToast(t("courses.enrolledSuccess"), "success");
      loadCourseDetail();
      loadDashboard();
    } catch (error: any) {
      showToast(error.response?.data?.detail || t("courses.failedToEnroll"), "error");
    }
  };

  const handleToggleLike = async () => {
    if (!course) return;

    // Optimistic update
    const previousLiked = course.is_liked_by_current_user;
    const previousCount = course.liked_count || 0;

    setCourse((prevCourse) => {
      if (!prevCourse) return prevCourse;
      return {
        ...prevCourse,
        is_liked_by_current_user: !previousLiked,
        liked_count: previousLiked
          ? Math.max(0, previousCount - 1)
          : previousCount + 1,
      };
    });

    try {
      const response = await coursesService.toggleLike(courseId);
      // Update with actual response from API
      setCourse((prevCourse) => {
        if (!prevCourse) return prevCourse;
        // Use API response if valid, otherwise keep the optimistic update
        const newLikedCount =
          response.likes_count !== undefined && response.likes_count !== null
            ? response.likes_count
            : prevCourse.liked_count;

        return {
          ...prevCourse,
          is_liked_by_current_user: response.liked ?? !previousLiked,
          liked_count: newLikedCount,
        };
      });
    } catch (error: any) {
      // Revert on error
      setCourse((prevCourse) => {
        if (!prevCourse) return prevCourse;
        return {
          ...prevCourse,
          is_liked_by_current_user: previousLiked,
          liked_count: previousCount,
        };
      });
      showToast(t("courses.failedToToggleLike"), "error");
    }
  };

  const handleModuleToggle = (moduleId: number) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleNavigate = (submoduleId: number) => {
    router.push(`/courses/${courseId}/submodule/${submoduleId}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
          }}
        >
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <Box sx={{ p: 3 }}>
          <Typography>{t("courses.courseNotFound")}</Typography>
        </Box>
      </MainLayout>
    );
  }

  const instructor = course.instructors?.[0];

  return (
    <MainLayout>
      <Box sx={{ width: "100%" }}>
        {/* Breadcrumb */}
        <Box sx={{ px: { xs: 2, md: 4 }, pt: 3, pb: 2 }}>
          <Link
            href={isCourseEnabled ? "/courses" : "/dashboard"}
            style={{
              textDecoration: "none",
              color: "var(--font-secondary)",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <IconWrapper icon="mdi:chevron-left" size={24} />
            <Typography
              variant="body2"
              sx={{
                color: "var(--font-secondary)",
                "&:hover": { color: "var(--font-primary)" },
              }}
            >
              {isCourseEnabled ? `${t("courses.myCourses")} / ${course.course_title}` : t("common.dashboard")}
            </Typography>
          </Link>
        </Box>

        {/* Banner Section */}
        <CourseBanner
          course={course}
          dashboard={dashboard}
          instructor={instructor}
          onToggleLike={handleToggleLike}
          onEnroll={handleEnroll}
          isEnrolling={isProcessing}
        />

        {/* Main Content */}
        <Box
          sx={{
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 3, md: 4 },
            maxWidth: 1400,
            mx: "auto",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(0, 1fr) 380px",
              },
              gap: { xs: 3, md: 4 },
              width: "100%",
            }}
          >
            {/* Left Column - Course Overview */}
            <Box
              sx={{
                minWidth: 0,
                order: { xs: 2, md: 1 },
              }}
            >
              <CourseOverview
                course={course}
                expandedModules={expandedModules}
                onModuleToggle={handleModuleToggle}
                onNavigate={handleNavigate}
              />
            </Box>

            {/* Right Column - Progress Dashboard & Leaderboard */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                order: { xs: 1, md: 2 },
              }}
            >
                {/* Certificate Buttons - only when certificate available; actionable when completion > 80% */}

                <CertificateButtons
                  courseId={course.course_id}
                  courseTitle={course.course_title}
                  uploadedTemplateUrl={uploadedCourseCertificateUrl}
                  certificateAvailable={Boolean((course as any).is_certified) || hasUploadedCourseCertificate}
                  completionPercentage={course?.modules?.length === 0 ? 100 : dashboard?.total_progress ?? 0}
                  score={
                    dashboard
                      ? `${Math.round(dashboard.total_progress ?? 0)}%`
                      : "100%"
                  }
                  certificateUrl={`/courses/${course.course_id}`}
                />
              {/* Progress Dashboard & Leaderboard - hidden when no_leaderboard_view */}
              {!hideLeaderboardView && dashboard && (
                <ProgressDashboard dashboard={dashboard} />
              )}
              {!hideLeaderboardView && (
                <CourseLeaderboard leaderboard={leaderboard} />
              )}

              {/* Instructor Section */}
              {instructor && <InstructorCard instructor={instructor} />}
            </Box>
          </Box>
        </Box>
      </Box>
    </MainLayout>
  );
}
