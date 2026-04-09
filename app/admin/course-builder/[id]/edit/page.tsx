"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Switch,
  FormControlLabel,
  Breadcrumbs,
  Link as MuiLink,
  Autocomplete,
  Chip,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminCourseBuilderService,
  CourseData,
} from "@/lib/services/admin/admin-course-builder.service";
import { useAuth } from "@/lib/auth/auth-context";
import { isCourseManagerRole } from "@/lib/auth/auth-utils";

export default function CourseEditPage() {
  const { showToast } = useToast();
  const { t } = useTranslation("common");
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const courseId = Number(params.id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty_level: "",
    slug: "",
    is_free: true,
    tags: [] as string[],
  });

  const loadCourse = async () => {
    try {
      setLoading(true);
      const data = await adminCourseBuilderService.viewCourseDetails(courseId);
      setCourse(data);
      setFormData({
        title: data.course_title || "",
        description: data.course_description || "",
        difficulty_level: data.difficulty_level || "",
        slug: data.slug || "",
        is_free: data.is_free ?? true,
        tags: Array.isArray(data.tags) ? data.tags : [],
      });
    } catch (error: any) {
      showToast(error?.message || "Failed to load course", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !courseId) return;
    if (isCourseManagerRole(user?.role)) {
      router.replace(`/admin/course-builder/${courseId}`);
    }
  }, [authLoading, user?.role, courseId, router]);

  useEffect(() => {
    if (authLoading || !courseId || isCourseManagerRole(user?.role)) return;
    void loadCourse();
  }, [authLoading, courseId, user?.role]);

  const goToViewPage = () => router.push(`/admin/course-builder/${courseId}`);

  const handleSave = async () => {
    try {
      setSaving(true);
      const effectiveSlug = formData.slug.trim() || formData.title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      const slugChanged = course && effectiveSlug !== (course.slug ?? "");
      const courseData: CourseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        is_free: formData.is_free,
        tags: formData.tags,
        ...(formData.difficulty_level && { difficulty_level: formData.difficulty_level }),
        ...(slugChanged && { slug: effectiveSlug }),
      };

      await adminCourseBuilderService.updateCourse(courseId, courseData);
      showToast("Course updated successfully", "success");
      goToViewPage();
    } catch (error: any) {
      showToast(error?.message || "Failed to update course", "error");
    } finally {
      setSaving(false);
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
          <MuiLink
            underline="hover"
            color="inherit"
            sx={{ cursor: "pointer", fontWeight: 500 }}
            onClick={goToViewPage}
          >
            {formData.title || "Course"}
          </MuiLink>
          <Typography color="text.primary" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
            Edit
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#111827",
              fontSize: { xs: "1.5rem", sm: "2rem" },
            }}
          >
            Edit Course
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.5 }}>
            Update course details, settings, and metadata
          </Typography>
        </Box>

        {/* Form */}
        <Paper
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Basic Info Section */}
            <Typography variant="subtitle2" sx={{ color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Basic Information
            </Typography>

            <TextField
              label="Course Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              fullWidth
              required
              inputProps={{ maxLength: 255 }}
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={5}
            />

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
              <TextField
                label="Slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                fullWidth
                helperText="URL-friendly identifier for the course"
              />

              <FormControl fullWidth>
                <InputLabel>Difficulty Level</InputLabel>
                <Select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                  label="Difficulty Level"
                >
                  <MenuItem value="Easy">Easy</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Settings Section */}
            <Typography variant="subtitle2" sx={{ color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", mt: 1 }}>
              Settings
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, alignItems: "start" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_free}
                    onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Free Course</Typography>
                    <Typography variant="caption" sx={{ color: "#6b7280" }}>
                      {formData.is_free ? "This course is free for all students" : "This is a paid course"}
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: "flex-start", ml: 0 }}
              />

              <Box />
            </Box>

            {/* Tags Section */}
            <Typography variant="subtitle2" sx={{ color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", mt: 1 }}>
              Tags
            </Typography>

            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={formData.tags}
              onChange={(_, newValue) => setFormData({ ...formData, tags: newValue })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags"
                  placeholder="Type and press Enter to add tags"
                  helperText="Tags help students discover this course"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={index}
                    label={option}
                    size="small"
                    sx={{
                      bgcolor: "#eef2ff",
                      color: "#6366f1",
                      "& .MuiChip-deleteIcon": { color: "#6366f1" },
                    }}
                  />
                ))
              }
            />

            {/* Actions */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", pt: 2, borderTop: "1px solid #e5e7eb" }}>
              <Button
                variant="outlined"
                onClick={goToViewPage}
                disabled={saving}
                sx={{ color: "#6b7280", borderColor: "#d1d5db" }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving || !formData.title.trim()}
                startIcon={
                  saving ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <IconWrapper icon="mdi:check" size={18} />
                  )
                }
                sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </MainLayout>
  );
}

