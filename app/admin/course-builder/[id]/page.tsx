"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  LinearProgress,
  Chip,
  Breadcrumbs,
  Link as MuiLink,
  Divider,
  Tooltip,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { adminCourseBuilderService } from "@/lib/services/admin/admin-course-builder.service";
import { ModuleList } from "@/components/admin/course-builder/ModuleList";
import { ConfirmDeleteDialog } from "@/components/admin/course-builder/ConfirmDeleteDialog";
import { useAuth } from "@/lib/auth/auth-context";
import { isCourseManagerRole } from "@/lib/auth/auth-utils";

export default function CourseViewPage() {
  const { showToast } = useToast();
  const { t } = useTranslation("common");
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const isCourseManager = isCourseManagerRole(user?.role);
  const courseId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourseDetails();
      loadModules();
    }
  }, [courseId]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      const data = await adminCourseBuilderService.viewCourseDetails(courseId);
      setCourseDetails(data);
    } catch (error: any) {
      showToast(error?.message || t("adminCourseBuilder.failedToLoadCourseDetails"), "error");
    } finally {
      setLoading(false);
    }
  };

  const loadModules = useCallback(async () => {
    try {
      setModulesLoading(true);
      const data = await adminCourseBuilderService.getCourseModules(courseId);
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setModules(list);
    } catch (error: any) {
      showToast(error?.message || t("adminCourseBuilder.failedToLoadModules"), "error");
    } finally {
      setModulesLoading(false);
    }
  }, [courseId, showToast, t]);

  const handleDeleteCourse = async () => {
    try {
      setDeletingCourse(true);
      await adminCourseBuilderService.deleteCourse(courseId);
      showToast(t("adminCourseBuilder.courseDeleted"), "success");
      router.push("/admin/course-builder");
    } catch (error: any) {
      showToast(error?.message || t("adminCourseBuilder.failedToDeleteCourse"), "error");
    } finally {
      setDeletingCourse(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleTogglePublish = async () => {
    try {
      setPublishing(true);
      if (courseDetails.published) {
        await adminCourseBuilderService.unpublishCourse(courseId);
        showToast(t("adminCourseBuilder.courseUnpublished"), "success");
      } else {
        await adminCourseBuilderService.publishCourse(courseId);
        showToast(t("adminCourseBuilder.coursePublished"), "success");
      }
      await loadCourseDetails();
    } catch (error: any) {
      showToast(error?.message || t("adminCourseBuilder.failedToUpdatePublishStatus"), "error");
    } finally {
      setPublishing(false);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "easy":
        return { bg: "#d1fae5", color: "#065f46" };
      case "medium":
        return { bg: "#fef3c7", color: "#92400e" };
      case "hard":
        return { bg: "#fee2e2", color: "#991b1b" };
      default:
        return { bg: "#f3f4f6", color: "#374151" };
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
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
        </Box>
      </MainLayout>
    );
  }

  if (!courseDetails) {
    return (
      <MainLayout>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" color="error">
            {t("adminCourseBuilder.courseNotFound")}
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  const diffColor = getDifficultyColor(courseDetails.difficulty_level);
  const isPublished = courseDetails.published;

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2, fontSize: "0.875rem" }}>
          <MuiLink
            underline="hover"
            color="inherit"
            sx={{ cursor: "pointer", fontWeight: 500 }}
            onClick={() => router.push("/admin/course-builder")}
          >
            {t("adminCourseBuilder.title")}
          </MuiLink>
          <Typography color="text.primary" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
            {courseDetails.course_title || t("adminCourseBuilder.courseDetails")}
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#111827",
                fontSize: { xs: "1.5rem", sm: "2rem" },
                mb: 1,
              }}
            >
              {courseDetails.course_title || t("adminCourseBuilder.courseDetails")}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              {courseDetails.difficulty_level && (
                <Chip
                  label={courseDetails.difficulty_level}
                  size="small"
                  sx={{ bgcolor: diffColor.bg, color: diffColor.color, fontWeight: 600, fontSize: "0.75rem" }}
                />
              )}
              <Chip
                label={isPublished ? t("adminCourseBuilder.published") : t("adminCourseBuilder.draft")}
                size="small"
                sx={{
                  bgcolor: isPublished ? "#d1fae5" : "#fee2e2",
                  color: isPublished ? "#065f46" : "#991b1b",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              />
              {courseDetails.is_free !== undefined && (
                <Chip
                  label={courseDetails.is_free ? t("adminCourseBuilder.free") : t("adminCourseBuilder.paid")}
                  size="small"
                  sx={{
                    bgcolor: courseDetails.is_free ? "#dbeafe" : "#fef3c7",
                    color: courseDetails.is_free ? "#1e40af" : "#92400e",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                  }}
                />
              )}
            </Box>
          </Box>
          {!isCourseManager ? (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Tooltip title={isPublished ? t("adminCourseBuilder.unpublishCourseTooltip") : t("adminCourseBuilder.publishCourseTooltip")}>
                <Button
                  variant="outlined"
                  onClick={handleTogglePublish}
                  disabled={publishing}
                  startIcon={
                    publishing ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <IconWrapper icon={isPublished ? "mdi:publish-off" : "mdi:publish"} size={18} />
                    )
                  }
                  sx={{
                    borderColor: isPublished ? "#d97706" : "#059669",
                    color: isPublished ? "#d97706" : "#059669",
                    "&:hover": {
                      borderColor: isPublished ? "#b45309" : "#047857",
                      bgcolor: isPublished ? "#fffbeb" : "#ecfdf5",
                    },
                  }}
                >
                  {isPublished ? t("adminCourseBuilder.unpublish") : t("adminCourseBuilder.publish")}
                </Button>
              </Tooltip>
              <Button
                variant="outlined"
                color="error"
                startIcon={<IconWrapper icon="mdi:delete" size={18} />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                {t("adminCourseBuilder.deleteCourse")}
              </Button>
              <Button
                variant="contained"
                startIcon={<IconWrapper icon="mdi:pencil" size={18} />}
                onClick={() => router.push(`/admin/course-builder/${courseId}/edit`)}
                sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
              >
                {t("adminCourseBuilder.editCourse")}
              </Button>
            </Box>
          ) : null}
        </Box>

        {/* Course Information Card */}
        <Paper
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t("adminCourseBuilder.courseInformation")}
          </Typography>

          {/* Description */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: "#6b7280", mb: 0.5, fontWeight: 500 }}>
              {t("adminCourseBuilder.description")}
            </Typography>
            <Typography variant="body1" sx={{ color: "#374151" }}>
              {courseDetails.course_description || t("adminCourseBuilder.noDescriptionAvailable")}
            </Typography>
          </Box>

          {/* Meta Row */}
          <Divider sx={{ my: 2 }} />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
              gap: 2,
            }}
          >
            {courseDetails.difficulty_level && (
              <Box>
                <Typography variant="caption" sx={{ color: "#9ca3af", fontWeight: 500 }}>
                  {t("adminCourseBuilder.difficulty")}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827", mt: 0.25 }}>
                  {courseDetails.difficulty_level}
                </Typography>
              </Box>
            )}
            {courseDetails.language && (
              <Box>
                <Typography variant="caption" sx={{ color: "#9ca3af", fontWeight: 500 }}>
                  {t("adminCourseBuilder.language")}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827", mt: 0.25 }}>
                  {courseDetails.language}
                </Typography>
              </Box>
            )}
            {courseDetails.enrolled_students_count !== undefined && (
              <Box>
                <Typography variant="caption" sx={{ color: "#9ca3af", fontWeight: 500 }}>
                  {t("adminCourseBuilder.enrolledStudents")}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827", mt: 0.25 }}>
                  {courseDetails.enrolled_students_count ?? courseDetails.enrolled_students?.total ?? 0}
                </Typography>
              </Box>
            )}
            {courseDetails.slug && (
              <Box>
                <Typography variant="caption" sx={{ color: "#9ca3af", fontWeight: 500 }}>
                  {t("adminCourseBuilder.slug")}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827", mt: 0.25, wordBreak: "break-all" }}>
                  {courseDetails.slug}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Tags */}
          {courseDetails.tags && courseDetails.tags.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="caption" sx={{ color: "#9ca3af", fontWeight: 500, mb: 1, display: "block" }}>
                  {t("adminCourseBuilder.tags")}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                  {(Array.isArray(courseDetails.tags) ? courseDetails.tags : []).map((tag: string, i: number) => (
                    <Chip
                      key={i}
                      label={tag}
                      size="small"
                      sx={{ bgcolor: "#eef2ff", color: "#6366f1", fontWeight: 500, fontSize: "0.75rem" }}
                    />
                  ))}
                </Box>
              </Box>
            </>
          )}
        </Paper>

        {/* Modules Section */}
        <Paper
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t("adminCourseBuilder.modules")}
            </Typography>
            <Chip
              label={t("adminCourseBuilder.moduleCount", { count: modules.length })}
              size="small"
              sx={{ bgcolor: "#f3f4f6", color: "#6b7280", fontWeight: 600, fontSize: "0.75rem" }}
            />
          </Box>
          {modulesLoading && modules.length === 0 ? (
            <LinearProgress sx={{ height: 2, borderRadius: 1 }} />
          ) : (
            <ModuleList
              courseId={courseId}
              modules={modules}
              onModulesChanged={loadModules}
              readOnly={isCourseManager}
            />
          )}
        </Paper>
      </Box>

      {/* Delete Course Confirmation */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        title={t("adminCourseBuilder.deleteCourseTitle")}
        message={t("adminCourseBuilder.deleteCourseMessage", { title: courseDetails.course_title })}
        onConfirm={handleDeleteCourse}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={deletingCourse}
      />
    </MainLayout>
  );
}
