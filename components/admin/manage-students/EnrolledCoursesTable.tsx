"use client";

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
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useState } from "react";

interface Course {
  id: number;
  title?: string;
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
          Enrolled Courses
        </Typography>
        <Typography variant="body2" sx={{ color: "#6b7280" }}>
          {courses.length} course{courses.length !== 1 ? "s" : ""}
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
            No enrolled courses
          </Typography>
          <Typography variant="caption" sx={{ color: "#9ca3af" }}>
            This student hasn't enrolled in any courses yet
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
                    Course
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      display: { xs: "none", md: "table-cell" },
                    }}
                  >
                    Category
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                  >
                    Progress
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                  >
                    Score
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      display: { xs: "none", lg: "table-cell" },
                    }}
                  >
                    Certificate
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
                          {course.lessons_count && course.hours && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#6b7280",
                                fontSize: "0.75rem",
                              }}
                            >
                              {course.lessons_count} lessons • {course.hours}h
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{
                        display: { xs: "none", md: "table-cell" },
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      }}
                    >
                      <Typography variant="body2" sx={{ color: "#374151" }}>
                        {course.category || ""} {course.level || ""}
                      </Typography>
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
                              (course.progress || 0) * 3.6
                            }deg, #e5e7eb ${
                              (course.progress || 0) * 3.6
                            }deg 360deg)`,
                            "&::before": {
                              content: '""',
                              position: "absolute",
                              width: "70%",
                              height: "70%",
                              borderRadius: "50%",
                              backgroundColor: "white",
                            },
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 600,
                              color: "#111827",
                              fontSize: "0.7rem",
                              zIndex: 1,
                            }}
                          >
                            {course.progress || 0}%
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={course.status || "N/A"}
                        size="small"
                        sx={{
                          backgroundColor: getStatusBgColor(course.status),
                          color: getStatusColor(course.status),
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
                        {course.score || 0}/100
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
                          None
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
                Showing {paginatedCourses.length === 0 ? 0 : startIndex + 1} to{" "}
                {Math.min(endIndex, courses.length)} of {courses.length} course
                {courses.length !== 1 ? "s" : ""}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  displayEmpty
                  inputProps={{ "aria-label": "Courses per page" }}
                  sx={{
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    "& .MuiSelect-select": {
                      py: { xs: 0.5, sm: 1 },
                      px: { xs: 1, sm: 1.5 },
                    },
                  }}
                >
                  <MenuItem value={5}>5 per page</MenuItem>
                  <MenuItem value={10}>10 per page</MenuItem>
                  <MenuItem value={25}>25 per page</MenuItem>
                  <MenuItem value={50}>50 per page</MenuItem>
                </Select>
              </FormControl>
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

