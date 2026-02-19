"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import {
  adminCourseBuilderService,
  CourseData,
} from "@/lib/services/admin/admin-course-builder.service";
import {
  CourseCard,
  Course,
} from "@/components/admin/course-builder/CourseCard";
import { CreateCourseModal } from "@/components/admin/course-builder/CreateCourseModal";
import { CourseBuilderHeader } from "@/components/admin/course-builder/CourseBuilderHeader";
import { CourseStatsSection } from "@/components/admin/course-builder/CourseStatsSection";
import { CourseSearchBar } from "@/components/admin/course-builder/CourseSearchBar";
import { CourseStatisticsCards } from "@/components/admin/course-builder/CourseStatisticsCards";
import { SearchResultsInfo } from "@/components/admin/course-builder/SearchResultsInfo";
import { EmptyState } from "@/components/admin/course-builder/EmptyState";

export default function CourseBuilderPage() {
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [courseToDuplicate, setCourseToDuplicate] = useState<Course | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await adminCourseBuilderService.getCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error: any) {
      showToast(error?.message || "Failed to load courses", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter courses based on search query
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;

    const query = searchQuery.toLowerCase();
    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.difficulty_level.toLowerCase().includes(query) ||
        course.subtitle?.toLowerCase().includes(query) ||
        course.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [courses, searchQuery]);

  const handleCreateCourse = async (formData: {
    name: string;
    level: string;
    description: string;
  }) => {
    try {
      setCreating(true);

      const courseData: CourseData = {
        title: formData.name.trim(),
        description: formData.description.trim(),
        slug: formData.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
        ...(formData.level && { difficulty_level: formData.level }),
      };

      await adminCourseBuilderService.createCourse(courseData);
      showToast("Course created successfully", "success");
      setIsModalOpen(false);
      loadCourses();
    } catch (error: any) {
      let errorMessage = error?.message || "Failed to create course";

      // Try to parse and format the error message
      try {
        if (errorMessage.includes("{")) {
          const errorJson = JSON.parse(
            errorMessage.substring(errorMessage.indexOf("{"))
          );
          errorMessage = Object.entries(errorJson)
            .map(
              ([field, errors]) =>
                `${field}: ${
                  Array.isArray(errors) ? errors.join(", ") : errors
                }`
            )
            .join("\n");
        }
      } catch {
        // Keep original error message if parsing fails
      }

      showToast(errorMessage, "error");
    } finally {
      setCreating(false);
    }
  };

  const handleEditCourse = (courseId: number) => {
    window.location.href = `/admin/course-builder/${courseId}/edit`;
  };

  const handleDuplicateClick = (course: Course) => {
    setCourseToDuplicate(course);
    setDuplicateDialogOpen(true);
  };

  const handleDuplicateDialogClose = () => {
    if (!duplicatingId) {
      setDuplicateDialogOpen(false);
      setCourseToDuplicate(null);
    }
  };

  const handleDuplicateConfirm = async () => {
    if (!courseToDuplicate) return;
    try {
      setDuplicatingId(courseToDuplicate.id);
      const duplicated = await adminCourseBuilderService.duplicateCourse(courseToDuplicate.id);
      const title = duplicated?.title ?? courseToDuplicate.title + " - copy";
      showToast(`Course duplicated successfully. New course: "${title}"`, "success");
      setDuplicateDialogOpen(false);
      setCourseToDuplicate(null);
      loadCourses();
    } catch (error: any) {
      showToast(error?.message ?? "Failed to duplicate course", "error");
    } finally {
      setDuplicatingId(null);
    }
  };

  const draftCount = courses.filter((course) => !course.published).length;
  const publishedCount = courses.filter((course) => course.published).length;

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
        <CourseBuilderHeader />

        <Paper
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          {/* Controls Section */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", lg: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "stretch", lg: "center" },
              mb: 4,
              gap: 3,
            }}
          >
            <CourseStatsSection
              draftCount={draftCount}
              publishedCount={publishedCount}
              totalCount={courses.length}
            />

            <CourseSearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onCreateClick={() => setIsModalOpen(true)}
            />
          </Box>

          {/* Statistics Cards */}
          {!searchQuery && courses.length > 0 && (
            <CourseStatisticsCards
              draftCount={draftCount}
              publishedCount={publishedCount}
              totalCount={courses.length}
            />
          )}

          {/* Search Results Info */}
          <SearchResultsInfo
            searchQuery={searchQuery}
            filteredCount={filteredCourses.length}
            totalCount={courses.length}
          />

          {/* Courses Grid */}
          {filteredCourses.length === 0 && searchQuery ? (
            <EmptyState
              type="no-results"
              onClearSearch={() => setSearchQuery("")}
            />
          ) : filteredCourses.length === 0 ? (
            <EmptyState
              type="no-courses"
              onCreateClick={() => setIsModalOpen(true)}
            />
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                },
                gap: 3,
              }}
            >
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEditClick={() => handleEditCourse(course.id)}
                  onDuplicate={() => handleDuplicateClick(course)}
                  onUpdate={loadCourses}
                />
              ))}
            </Box>
          )}
        </Paper>

        {/* Create Course Modal */}
        <CreateCourseModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateCourse}
          loading={creating}
          existingTitles={courses.map((c) => c.title)}
        />

        {/* Duplicate Course Dialog */}
        <Dialog
          open={duplicateDialogOpen}
          onClose={handleDuplicateDialogClose}
          aria-labelledby="duplicate-course-dialog-title"
          aria-describedby="duplicate-course-dialog-description"
          PaperProps={{
            sx: { borderRadius: 2, minWidth: 360 },
          }}
        >
          <DialogTitle id="duplicate-course-dialog-title" sx={{ fontWeight: 600 }}>
            Duplicate course?
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="duplicate-course-dialog-description">
              {courseToDuplicate ? (
                <>
                  Create a copy of &quot;{courseToDuplicate.title}&quot;? The new course will
                  include all modules and content.
                </>
              ) : null}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleDuplicateDialogClose}
              disabled={!!duplicatingId}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDuplicateConfirm}
              disabled={!!duplicatingId}
              variant="contained"
              sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
              autoFocus
              startIcon={
                duplicatingId ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
            >
              {duplicatingId ? "Duplicating…" : "Duplicate"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}
