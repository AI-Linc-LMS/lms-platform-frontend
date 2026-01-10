"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Chip,
  Divider,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { adminCourseBuilderService } from "@/lib/services/admin/admin-course-builder.service";

export default function CourseViewPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const courseId = Number(params.id);
  const [loading, setLoading] = useState(true);
  const [courseDetails, setCourseDetails] = useState<any>(null);

  useEffect(() => {
    if (courseId) {
      loadCourseDetails();
    }
  }, [courseId]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      const data = await adminCourseBuilderService.viewCourseDetails(courseId);
      setCourseDetails(data);
    } catch (error: any) {
      showToast(error?.message || "Failed to load course details", "error");
    } finally {
      setLoading(false);
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
            Course not found
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Button
              startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
              onClick={() => router.push("/admin/course-builder")}
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
              {courseDetails.course_title || "Course Details"}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconWrapper icon="mdi:pencil" size={20} />}
            onClick={() =>
              router.push(`/admin/course-builder/${courseId}/edit`)
            }
            sx={{ bgcolor: "#6366f1" }}
          >
            Edit Course
          </Button>
        </Box>

        {/* Course Details */}
        <Paper
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Course Information
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ color: "#6b7280", mb: 0.5 }}>
                Description
              </Typography>
              <Typography variant="body1">
                {courseDetails.course_description || "No description available"}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>
                Modules
              </Typography>
              {courseDetails.modules && courseDetails.modules.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {courseDetails.modules.map((module: any, index: number) => (
                    <Paper
                      key={module.id || index}
                      sx={{ p: 2, bgcolor: "#f9fafb" }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        {module.title} (Week {module.weekno})
                      </Typography>
                      {module.submodules && module.submodules.length > 0 && (
                        <Box sx={{ ml: 2, mt: 1 }}>
                          {module.submodules.map(
                            (submodule: any, subIndex: number) => (
                              <Typography
                                key={submodule.id || subIndex}
                                variant="body2"
                                sx={{ color: "#6b7280" }}
                              >
                                • {submodule.title}
                              </Typography>
                            )
                          )}
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                  No modules added yet
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </MainLayout>
  );
}
