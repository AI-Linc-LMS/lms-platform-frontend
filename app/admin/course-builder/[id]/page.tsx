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
        return {
          bg: "color-mix(in srgb, var(--success-500) 16%, var(--surface) 84%)",
          color: "var(--success-500)",
        };
      case "medium":
        return {
          bg: "color-mix(in srgb, var(--warning-500) 16%, var(--surface) 84%)",
          color: "var(--warning-500)",
        };
      case "hard":
        return {
          bg: "color-mix(in srgb, var(--error-500) 16%, var(--surface) 84%)",
          color: "var(--error-500)",
        };
      default:
        return { bg: "var(--surface)", color: "var(--font-secondary)" };
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
                color: "var(--font-primary)",
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
                  bgcolor: isPublished
                    ? "color-mix(in srgb, var(--success-500) 16%, var(--surface) 84%)"
                    : "color-mix(in srgb, var(--error-500) 16%, var(--surface) 84%)",
                  color: isPublished ? "var(--success-500)" : "var(--error-500)",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              />
              {courseDetails.is_free !== undefined && (
                <Chip
                  label={courseDetails.is_free ? t("adminCourseBuilder.free") : t("adminCourseBuilder.paid")}
                  size="small"
                  sx={{
                    bgcolor: courseDetails.is_free
                      ? "color-mix(in srgb, var(--accent-indigo) 16%, var(--surface) 84%)"
                      : "color-mix(in srgb, var(--warning-500) 16%, var(--surface) 84%)",
                    color: courseDetails.is_free
                      ? "var(--accent-indigo)"
                      : "var(--warning-500)",
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
                    borderColor: isPublished ? "var(--warning-500)" : "var(--success-500)",
                    color: isPublished ? "var(--warning-500)" : "var(--success-500)",
                    "&:hover": {
                      borderColor: isPublished
                        ? "color-mix(in srgb, var(--warning-500) 75%, black 25%)"
                        : "color-mix(in srgb, var(--success-500) 75%, black 25%)",
                      bgcolor: isPublished
                        ? "color-mix(in srgb, var(--warning-500) 12%, var(--surface) 88%)"
                        : "color-mix(in srgb, var(--success-500) 12%, var(--surface) 88%)",
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
                sx={{
                  bgcolor: "var(--accent-indigo)",
                  color: "var(--font-light)",
                  "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
                }}
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
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--card-bg)",
            boxShadow:
              "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t("adminCourseBuilder.courseInformation")}
          </Typography>

          {/* Description */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 0.5, fontWeight: 500 }}>
              {t("adminCourseBuilder.description")}
            </Typography>
            <Typography variant="body1" sx={{ color: "var(--font-primary)" }}>
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
                <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontWeight: 500 }}>
                  {t("adminCourseBuilder.difficulty")}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--font-primary)", mt: 0.25 }}>
                  {courseDetails.difficulty_level}
                </Typography>
              </Box>
            )}
            {courseDetails.language && (
              <Box>
                <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontWeight: 500 }}>
                  {t("adminCourseBuilder.language")}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--font-primary)", mt: 0.25 }}>
                  {courseDetails.language}
                </Typography>
              </Box>
            )}
            {courseDetails.enrolled_students_count !== undefined && (
              <Box>
                <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontWeight: 500 }}>
                  {t("adminCourseBuilder.enrolledStudents")}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--font-primary)", mt: 0.25 }}>
                  {courseDetails.enrolled_students_count ?? courseDetails.enrolled_students?.total ?? 0}
                </Typography>
              </Box>
            )}
            {courseDetails.slug && (
              <Box>
                <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontWeight: 500 }}>
                  {t("adminCourseBuilder.slug")}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--font-primary)", mt: 0.25, wordBreak: "break-all" }}>
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
                <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontWeight: 500, mb: 1, display: "block" }}>
                  {t("adminCourseBuilder.tags")}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                  {(Array.isArray(courseDetails.tags) ? courseDetails.tags : []).map((tag: string, i: number) => (
                    <Chip
                      key={i}
                      label={tag}
                      size="small"
                      sx={{
                        bgcolor:
                          "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
                        color: "var(--accent-indigo)",
                        fontWeight: 500,
                        fontSize: "0.75rem",
                      }}
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
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--card-bg)",
            boxShadow:
              "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t("adminCourseBuilder.modules")}
            </Typography>
            <Chip
              label={t("adminCourseBuilder.moduleCount", { count: modules.length })}
              size="small"
              sx={{
                bgcolor: "var(--surface)",
                color: "var(--font-secondary)",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
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
