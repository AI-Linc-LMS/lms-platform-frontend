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
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminCourseBuilderService,
  CourseData,
} from "@/lib/services/admin/admin-course-builder.service";

export default function CourseEditPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const courseId = Number(params.id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty_level: "",
    slug: "",
  });

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

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
      });
    } catch (error: any) {
      showToast(error?.message || "Failed to load course", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const courseData: CourseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        slug: formData.slug.trim() || formData.title
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
        ...(formData.difficulty_level && { difficulty_level: formData.difficulty_level }),
      };

      await adminCourseBuilderService.updateCourse(courseId, courseData);
      showToast("Course updated successfully", "success");
      router.push(`/admin/course-builder/${courseId}`);
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
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
            onClick={() => router.back()}
            sx={{ mb: 2 }}
          >
            Back
          </Button>
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
              rows={6}
            />

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

            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", pt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => router.back()}
                disabled={saving}
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
                sx={{ bgcolor: "#6366f1" }}
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

