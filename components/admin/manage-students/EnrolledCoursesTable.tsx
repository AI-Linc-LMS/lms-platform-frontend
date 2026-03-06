"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination,
} from "@mui/material";
import { PerPageSelect } from "@/components/common/PerPageSelect";
import { IconWrapper } from "@/components/common/IconWrapper";

interface Course {
  id: number;
  title?: string;
  description?: string;
  enrollment_date?: string | null;
  marks?: number;
  progress_percentage?: number;
  total_contents?: number;
  completed_contents?: number;
  last_activity?: string | null;
  activity_count?: number;
  category?: string;
  level?: string;
  progress?: number;
  status?: string;
  score?: number;
  certificate?: string;
  lessons_count?: number;
  hours?: number;
}

interface EnrolledCoursesTableProps {
  courses: Course[];
}

const getStatusColor = (status?: string) => {
  if (!status) return "#6b7280";
  switch (status.toLowerCase()) {
    case "completed":
      return "#10b981";
    case "ongoing":
      return "#f59e0b";
    case "not started":
      return "#6b7280";
    default:
      return "#6b7280";
  }
};

const getStatusBgColor = (status?: string) => {
  if (!status) return "#f3f4f6";
  switch (status.toLowerCase()) {
    case "completed":
      return "#d1fae5";
    case "ongoing":
      return "#fef3c7";
    case "not started":
      return "#f3f4f6";
    default:
      return "#f3f4f6";
  }
};

export function EnrolledCoursesTable({
  courses,
}: EnrolledCoursesTableProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const totalPages = Math.ceil(courses.length / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedCourses = courses.slice(startIndex, endIndex);

  const getProgress = (course: Course) => {
    if (typeof course.progress === "number") return course.progress;
    if (typeof course.progress_percentage === "number")
      return course.progress_percentage;
    if (
      typeof course.completed_contents === "number" &&
      typeof course.total_contents === "number" &&
      course.total_contents > 0
    ) {
      return Number(
        ((course.completed_contents / course.total_contents) * 100).toFixed(2)
      );
    }
    return 0;
  };

  const getDerivedStatus = (course: Course): string => {
    if (course.status) return course.status;
    const progress = getProgress(course);
    if (progress >= 100) return "Completed";
    if (progress > 0) return "Ongoing";
    return "Not Started";
  };

  const { t } = useTranslation("common");
  const getStatusLabel = (status: string) => {
    if (status === "Completed") return t("manageStudents.completed");
    if (status === "Ongoing") return t("manageStudents.ongoing");
    if (status === "Not Started") return t("manageStudents.notStarted");
    return status;
  };

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827" }}>
          {t("manageStudents.enrolledCourses")}
        </Typography>
        <Typography variant="body2" sx={{ color: "#6b7280" }}>
          {t("manageStudents.courseCount", { count: courses.length })}
        </Typography>
      </Box>

      {courses.length === 0 ? (
        <Box
          sx={{
            py: 6,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconWrapper icon="mdi:book-off-outline" size={48} color="#d1d5db" />
          <Typography variant="body1" sx={{ color: "#6b7280", fontWeight: 500 }}>
            {t("manageStudents.noEnrolledCourses")}
          </Typography>
          <Typography variant="caption" sx={{ color: "#9ca3af" }}>
            {t("manageStudents.noEnrolledCoursesDesc")}
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer
            sx={{
              overflowX: "auto",
              "&::-webkit-scrollbar": {
                height: 8,
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#f1f1f1",
                borderRadius: 4,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#c1c1c1",
                borderRadius: 4,
                "&:hover": {
                  backgroundColor: "#a8a8a8",
                },
              },
            }}
          >
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                  >
                    {t("manageStudents.course")}
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                  >
                    {t("manageStudents.progress")}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                  >
                    {t("manageStudents.status")}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                  >
                    {t("manageStudents.score")}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      display: { xs: "none", lg: "table-cell" },
                    }}
                  >
                    {t("manageStudents.certificate")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCourses.map((course) => (
                  <TableRow
                    key={course.id}
                    sx={{
                      "&:hover": { backgroundColor: "#f9fafb" },
                    }}
                  >
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <IconWrapper
                          icon="mdi:book-open-variant"
                          size={24}
                          color="#6366f1"
                        />
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 500, color: "#111827" }}
                          >
                            {course.title || "N/A"}
                          </Typography>
                          {course.lessons_count && course.hours ? (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#6b7280",
                                fontSize: "0.75rem",
                              }}
                            >
                              {t("manageStudents.lessonsHours", { count: course.lessons_count, hours: course.hours })}
                            </Typography>
                          ) : (
                            typeof course.completed_contents === "number" &&
                            typeof course.total_contents === "number" && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#6b7280",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {t("manageStudents.contentsCount", { completed: course.completed_contents, total: course.total_contents })}
                              </Typography>
                            )
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: "50%",
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: `conic-gradient(from 0deg, #6366f1 0deg ${
                              getProgress(course) * 3.6
                            }deg, #e5e7eb ${getProgress(course) * 3.6}deg 360deg)`,
                            "&::before": {
                              content: '""',
                              position: "absolute",
                              width: "80%",
                              height: "80%",
                              borderRadius: "50%",
                              backgroundColor: "white",
                            },
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 500,
                              color: "#111827",
                              fontSize: "0.6rem",
                              zIndex: 1,
                            }}
                          >
                            {getProgress(course)}%
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(getDerivedStatus(course))}
                        size="small"
                        sx={{
                          backgroundColor: getStatusBgColor(getDerivedStatus(course)),
                          color: getStatusColor(getDerivedStatus(course)),
                          fontWeight: 600,
                          fontSize: "0.75rem",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "#111827" }}
                      >
                        {course.score ?? course.marks ?? 0}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        display: { xs: "none", lg: "table-cell" },
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      }}
                    >
                      {course.certificate ? (
                        <Chip
                          label={course.certificate}
                          size="small"
                          sx={{
                            backgroundColor: "#eef2ff",
                            color: "#6366f1",
                            fontSize: "0.7rem",
                            maxWidth: 150,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                          {t("manageStudents.none")}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box
            sx={{
              mt: 3,
              pt: 2,
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#6b7280",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
              >
                {t("manageStudents.showingCourses", {
                  start: paginatedCourses.length === 0 ? 0 : startIndex + 1,
                  end: Math.min(endIndex, courses.length),
                  total: courses.length,
                })}
              </Typography>
              <PerPageSelect
                value={limit}
                onChange={(v) => {
                  setLimit(v);
                  setPage(1);
                }}
                options={[5, 10, 25, 50]}
                displayEmpty
                ariaLabel={t("manageStudents.coursesPerPage")}
                minWidth={120}
                SelectSx={{
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  "& .MuiSelect-select": { py: { xs: 0.5, sm: 1 }, px: { xs: 1, sm: 1.5 } },
                }}
              />
            </Box>
            {totalPages > 0 && (
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                size="small"
                showFirstButton
                showLastButton
                sx={{
                  "& .MuiPaginationItem-root": {
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  },
                }}
              />
            )}
          </Box>
        </>
      )}
    </Paper>
  );
}

