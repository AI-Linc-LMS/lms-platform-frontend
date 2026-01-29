"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Avatar,
  AvatarGroup,
  TextField,
  Rating,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { adminCourseBuilderService, CourseData } from "@/lib/services/admin/admin-course-builder.service";

export interface Course {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  difficulty_level: string;
  language: string;
  price: string;
  is_free: boolean;
  published: boolean;
  rating?: number;
  tags?: string[];
  enrolled_students: {
    total: number;
    students_profile_pic: string[];
  };
  stats: {
    video: { total: number };
    article: { total: number };
    quiz: { total: number };
    assignment: { total: number };
    coding_problem: { total: number };
  };
  thumbnail: string | null;
}

interface CourseCardProps {
  course: Course;
  onEditClick: () => void;
  onUpdate?: () => void;
}

export function CourseCard({ course, onEditClick, onUpdate }: CourseCardProps) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [editData, setEditData] = useState({
    title: course.title,
    description: course.description,
    tags: course.tags || [],
    rating: course.rating || 0,
  });

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
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

  const difficultyColor = getDifficultyColor(course.difficulty_level);

  const totalContent =
    (course.stats?.video?.total || 0) +
    (course.stats?.article?.total || 0) +
    (course.stats?.quiz?.total || 0) +
    (course.stats?.assignment?.total || 0) +
    (course.stats?.coding_problem?.total || 0);

  const handleSave = async () => {
    try {
      setSaving(true);
      const courseData: CourseData = {
        title: editData.title.trim(),
        description: editData.description.trim(),
        slug: course.title
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
        rating: editData.rating,
        tags: editData.tags, // Send as array
      };

      await adminCourseBuilderService.updateCourse(course.id, courseData);
      showToast("Course updated successfully", "success");
      setEditing(false);
      onUpdate?.();
    } catch (error: any) {
      showToast(error?.message || "Failed to update course", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      title: course.title,
      description: course.description,
      tags: course.tags || [],
      rating: course.rating || 0,
    });
    setEditing(false);
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      await adminCourseBuilderService.publishCourse(course.id);
      showToast("Course published successfully", "success");
      onUpdate?.();
    } catch (error: any) {
      showToast(error?.message || "Failed to publish course", "error");
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      setPublishing(true);
      await adminCourseBuilderService.unpublishCourse(course.id);
      showToast("Course unpublished successfully", "success");
      onUpdate?.();
    } catch (error: any) {
      showToast(error?.message || "Failed to unpublish course", "error");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Paper
      sx={{
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        overflow: "hidden",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: editing ? "0 1px 3px rgba(0,0,0,0.1)" : "0 4px 12px rgba(0,0,0,0.15)",
          transform: editing ? "none" : "translateY(-2px)",
        },
        maxWidth: 500,
        border: editing ? "2px solid #6366f1" : "none",
      }}
    >
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {editing ? (
              <TextField
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                fullWidth
                size="small"
                sx={{ mb: 1 }}
                inputProps={{ maxLength: 255 }}
              />
            ) : (
              <>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: "#111827",
                    fontSize: { xs: "1rem", sm: "1.125rem" },
                    mb: 0.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {course.title}
                </Typography>
                {course.subtitle && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#6b7280",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {course.subtitle}
                  </Typography>
                )}
              </>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, ml: 1 }}>
            {editing ? (
              <>
                <IconButton
                  size="small"
                  onClick={handleSave}
                  disabled={saving}
                  sx={{
                    color: "#10b981",
                    "&:hover": { bgcolor: "#d1fae5" },
                  }}
                >
                  {saving ? (
                    <CircularProgress size={16} />
                  ) : (
                    <IconWrapper icon="mdi:check" size={18} />
                  )}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleCancel}
                  disabled={saving}
                  sx={{
                    color: "#ef4444",
                    "&:hover": { bgcolor: "#fee2e2" },
                  }}
                >
                  <IconWrapper icon="mdi:close" size={18} />
                </IconButton>
              </>
            ) : (
              <>
                <IconButton
                  size="small"
                  onClick={() => setEditing(true)}
                  sx={{
                    color: "#6366f1",
                    "&:hover": { bgcolor: "#eef2ff" },
                  }}
                >
                  <IconWrapper icon="mdi:pencil" size={18} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={onEditClick}
                  sx={{
                    color: "#6b7280",
                    "&:hover": { bgcolor: "#f3f4f6" },
                  }}
                  title="Full Edit"
                >
                  <IconWrapper icon="mdi:open-in-new" size={18} />
                </IconButton>
                {!course.published ? (
                  <IconButton
                    size="small"
                    onClick={handlePublish}
                    disabled={publishing}
                    sx={{
                      color: "#059669",
                      "&:hover": { bgcolor: "#d1fae5" },
                    }}
                    title="Publish course"
                  >
                    {publishing ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <IconWrapper icon="mdi:publish" size={18} />
                    )}
                  </IconButton>
                ) : (
                  <IconButton
                    size="small"
                    onClick={handleUnpublish}
                    disabled={publishing}
                    sx={{
                      color: "#b45309",
                      "&:hover": { bgcolor: "#fef3c7" },
                    }}
                    title="Unpublish course"
                  >
                    {publishing ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <IconWrapper icon="mdi:publish-off" size={18} />
                    )}
                  </IconButton>
                )}
              </>
            )}
          </Box>
        </Box>

        {/* Description */}
        {editing ? (
          <TextField
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            fullWidth
            multiline
            rows={3}
            size="small"
            sx={{ mb: 2 }}
          />
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: "#6b7280",
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              mb: 2,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: { xs: "2.5rem", sm: "3rem" },
            }}
          >
            {course.description || "No description available"}
          </Typography>
        )}

        {/* Rating */}
        {editing ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: "#6b7280", mb: 0.5, display: "block" }}>
              Rating
            </Typography>
            <Rating
              value={editData.rating}
              onChange={(_, newValue) => {
                setEditData({ ...editData, rating: newValue || 0 });
              }}
              precision={0.5}
              max={5}
            />
          </Box>
        ) : (
          course.rating !== undefined && (
            <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <Rating value={course.rating} readOnly precision={0.5} size="small" />
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                {course.rating.toFixed(1)}
              </Typography>
            </Box>
          )
        )}

        {/* Tags */}
        {editing ? (
          <Box sx={{ mb: 2 }}>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={editData.tags}
              onChange={(_, newValue) => {
                setEditData({ ...editData, tags: newValue });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags"
                  size="small"
                  placeholder="Add tags"
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
                      "& .MuiChip-deleteIcon": {
                        color: "#6366f1",
                      },
                    }}
                  />
                ))
              }
            />
          </Box>
        ) : (
          course.tags && course.tags.length > 0 && (
            <Box sx={{ mb: 2, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              {course.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  sx={{
                    bgcolor: "#eef2ff",
                    color: "#6366f1",
                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                    height: { xs: 20, sm: 24 },
                  }}
                />
              ))}
            </Box>
          )
        )}

        {/* Stats Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 1,
            mb: 2,
          }}
        >
          {[
            { icon: "mdi:video", label: course.stats?.video?.total || 0, name: "Video" },
            { icon: "mdi:file-document", label: course.stats?.article?.total || 0, name: "Article" },
            { icon: "mdi:help-circle", label: course.stats?.quiz?.total || 0, name: "Quiz" },
            { icon: "mdi:assignment", label: course.stats?.assignment?.total || 0, name: "Assignment" },
            { icon: "mdi:code-tags", label: course.stats?.coding_problem?.total || 0, name: "Coding" },
            { icon: "mdi:file-multiple", label: totalContent, name: "Total" },
          ].map((stat, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: 1,
                borderRadius: 1,
                bgcolor: "#f9fafb",
                transition: "all 0.2s",
                "&:hover": { bgcolor: "#f3f4f6" },
              }}
            >
              <IconWrapper
                icon={stat.icon}
                size={20}
                color="#6366f1"
                style={{ marginBottom: 4 }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: "#111827",
                  fontSize: { xs: "0.7rem", sm: "0.75rem" },
                }}
              >
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Enrolled Students */}
        {course.enrolled_students?.total > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                mb: 0.5,
                display: "block",
              }}
            >
              Enrolled Students
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AvatarGroup max={4} sx={{ "& .MuiAvatar-root": { width: 24, height: 24, fontSize: "0.7rem" } }}>
                {course.enrolled_students.students_profile_pic?.slice(0, 4).map((pic: string, idx: number) => (
                  <Avatar key={idx} src={pic} alt={`Student ${idx + 1}`} />
                ))}
              </AvatarGroup>
              <Typography
                variant="caption"
                sx={{
                  color: "#6b7280",
                  fontSize: { xs: "0.7rem", sm: "0.75rem" },
                }}
              >
                {course.enrolled_students.total} enrolled
              </Typography>
            </Box>
          </Box>
        )}

        {/* Footer */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pt: 2,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={course.difficulty_level}
              size="small"
              sx={{
                bgcolor: difficultyColor.bg,
                color: difficultyColor.color,
                fontWeight: 600,
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                height: { xs: 20, sm: 24 },
              }}
            />
            <Chip
              label={course.published ? "Published" : "Draft"}
              size="small"
              sx={{
                bgcolor: course.published ? "#d1fae5" : "#fee2e2",
                color: course.published ? "#065f46" : "#991b1b",
                fontWeight: 600,
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                height: { xs: 20, sm: 24 },
              }}
            />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
