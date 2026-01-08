"use client";

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Button,
  Rating,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { Course } from "./interfaces";
import { IconWrapper } from "@/components/common/IconWrapper";
import Link from "next/link";

interface CourseTableProps {
  courses: Course[];
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEnroll?: (courseId: number) => void;
  enrollingCourseId?: number | null;
}

export const CourseTable: React.FC<CourseTableProps> = ({
  courses,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onEnroll,
  enrollingCourseId,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleEnrollClick = (e: React.MouseEvent, courseId: number) => {
    e.stopPropagation();
    if (onEnroll) {
      onEnroll(courseId);
    }
  };

  const getStatusColor = (isEnrolled: boolean) => {
    return isEnrolled ? "success" : "secondary";
  };

  const getStatusLabel = (isEnrolled: boolean) => {
    return isEnrolled ? "Active" : "Yet to Enroll";
  };

  const getStatusChipSx = (isEnrolled: boolean) => {
    if (isEnrolled) {
      return {
        backgroundColor: "#d1fae5",
        color: "#065f46",
        fontSize: "0.75rem",
        height: 24,
        fontWeight: 500,
      };
    } else {
      return {
        backgroundColor: "#e9d5ff",
        color: "#6b21a8",
        fontSize: "0.75rem",
        height: 24,
        fontWeight: 500,
      };
    }
  };

  const getDifficultyStyles = (level: string) => {
    const l = level?.toLowerCase();
    switch (l) {
      case "easy":
        return {
          backgroundColor: "#e0f2fe",
          color: "#0369a1",
        };
      case "medium":
        return {
          backgroundColor: "#fef3c7",
          color: "#92400e",
        };
      case "hard":
        return {
          backgroundColor: "#fee2e2",
          color: "#991b1b",
        };
      default:
        return {
          backgroundColor: "#f3f4f6",
          color: "#4b5563",
        };
    }
  };

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalCount);

  // Mobile Card View
  if (isMobile) {
    return (
      <Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {courses.map((course) => {
            const tags = course.tags || [];
            const description =
              course.description || "No description available";
            const truncatedDescription =
              description.length > 80
                ? `${description.substring(0, 80)}...`
                : description;

            return (
              <Card
                key={course.id}
                sx={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 2,
                  boxShadow: "none",
                  "&:hover": {
                    boxShadow: 2,
                  },
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  {/* Course Title */}
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: "#1a1f2e",
                      mb: 1.5,
                      fontSize: "1rem",
                    }}
                  >
                    {course.title}
                  </Typography>

                  {/* Categories */}
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.5,
                      mb: 1.5,
                    }}
                  >
                    {tags.length > 0 ? (
                      tags.slice(0, 3).map((tag, idx) => (
                        <Chip
                          key={idx}
                          label={tag}
                          size="small"
                          sx={{
                            backgroundColor: "#e0e7ff",
                            color: "#6366f1",
                            fontSize: "0.75rem",
                            height: 24,
                            fontWeight: 500,
                            textTransform: "capitalize",
                          }}
                        />
                      ))
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#9ca3af",
                          fontSize: "0.75rem",
                          fontStyle: "italic",
                        }}
                      >
                        No tags
                      </Typography>
                    )}
                  </Box>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#6b7280",
                      fontSize: "0.875rem",
                      mb: 1.5,
                      lineHeight: 1.5,
                    }}
                  >
                    {truncatedDescription}
                  </Typography>

                  {/* Meta Info Row */}
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1,
                      mb: 1.5,
                      alignItems: "center",
                    }}
                  >
                    {/* Difficulty */}
                    <Chip
                      label={course.difficulty_level || "Beginner"}
                      size="small"
                      sx={{
                        ...getDifficultyStyles(course.difficulty_level),
                        fontSize: "0.7rem",
                        height: 22,
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    />

                    {/* Certification */}
                    <Chip
                      label={
                        course.certificate_available
                          ? "Certificate"
                          : "No Certificate"
                      }
                      size="small"
                      sx={{
                        backgroundColor: course.certificate_available
                          ? "#d1fae5"
                          : "#fee2e2",
                        color: course.certificate_available
                          ? "#065f46"
                          : "#991b1b",
                        fontSize: "0.7rem",
                        height: 22,
                        fontWeight: 500,
                      }}
                    />

                    {/* Status */}
                    <Chip
                      label={getStatusLabel(course.is_enrolled)}
                      size="small"
                      sx={getStatusChipSx(course.is_enrolled)}
                    />

                    {/* Rating */}
                    {course.rating !== undefined && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Rating
                          value={course.rating}
                          precision={0.1}
                          readOnly
                          size="small"
                          sx={{
                            "& .MuiRating-iconFilled": {
                              color: "#fbbf24",
                            },
                            fontSize: "0.875rem",
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ color: "#6b7280", fontSize: "0.7rem" }}
                        >
                          ({course.rating_count || 0})
                        </Typography>
                      </Box>
                    )}

                    {/* Price */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#6b7280",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                      }}
                    >
                      {course.is_free || parseFloat(course.price || "0") === 0
                        ? "Free"
                        : `₹${parseFloat(course.price).toFixed(2)}`}
                    </Typography>
                  </Box>

                  {/* Action Button */}
                  <Box sx={{ mt: 1.5 }}>
                    {course.is_enrolled ? (
                      <Link
                        href={`/courses/${course.id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <Button
                          variant="contained"
                          fullWidth
                          sx={{
                            backgroundColor: "#6366f1",
                            color: "#ffffff",
                            textTransform: "none",
                            fontSize: "0.875rem",
                            py: 1,
                            borderRadius: 1.5,
                            "&:hover": {
                              backgroundColor: "#4f46e5",
                            },
                          }}
                        >
                          Continue
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={(e) => handleEnrollClick(e, course.id)}
                        disabled={
                          (enrollingCourseId !== undefined &&
                            enrollingCourseId !== null) ||
                          course.enrollment_enabled === false
                        }
                        sx={{
                          backgroundColor: "#6366f1",
                          color: "#ffffff",
                          textTransform: "none",
                          fontSize: "0.875rem",
                          py: 1,
                          borderRadius: 1.5,
                          "&:hover": {
                            backgroundColor: "#4f46e5",
                          },
                        }}
                      >
                        {enrollingCourseId === course.id ? (
                          <CircularProgress size={20} sx={{ color: "white" }} />
                        ) : (
                          "Enroll"
                        )}
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Pagination */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mt: 3,
            alignItems: "center",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#6b7280", fontSize: "0.875rem", textAlign: "center" }}
          >
            Showing result {startIndex}-{endIndex} of {totalCount} Entries
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              width: "100%",
              justifyContent: "center",
            }}
          >
            <Button
              variant="outlined"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
              startIcon={<IconWrapper icon="mdi:chevron-left" size={18} />}
              sx={{
                borderColor: "#e5e7eb",
                color: "#6b7280",
                textTransform: "none",
                px: 2,
                flex: 1,
                maxWidth: 150,
                "&:disabled": { opacity: 0.5 },
                "&:hover": {
                  borderColor: "#d1d5db",
                  backgroundColor: "#f9fafb",
                },
              }}
            >
              Previous
            </Button>
            <Button
              variant="outlined"
              disabled={endIndex >= totalCount}
              onClick={() => onPageChange(page + 1)}
              endIcon={<IconWrapper icon="mdi:chevron-right" size={18} />}
              sx={{
                borderColor: "#e5e7eb",
                color: "#6b7280",
                textTransform: "none",
                px: 2,
                flex: 1,
                maxWidth: 150,
                "&:disabled": { opacity: 0.5 },
                "&:hover": {
                  borderColor: "#d1d5db",
                  backgroundColor: "#f9fafb",
                },
              }}
            >
              Next
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  // Desktop Table View
  return (
    <Box>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid #e5e7eb" }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f9fafb" }}>
              <TableCell sx={{ fontWeight: 600, color: "#1a1f2e" }}>
                Course
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#1a1f2e" }}>
                Difficulty
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#1a1f2e" }}>
                Categories
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#1a1f2e" }}>
                Description
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#1a1f2e" }}>
                Certification
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#1a1f2e" }}>
                Status
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#1a1f2e" }}>
                Rating
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#1a1f2e" }}>
                Price
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#1a1f2e", width: 120 }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course, index) => {
              const tags = course.tags || [];
              const description =
                course.description || "No description available";
              const truncatedDescription =
                description.length > 100
                  ? `${description.substring(0, 100)}...`
                  : description;

              return (
                <TableRow
                  key={course.id}
                  sx={{
                    "&:hover": { backgroundColor: "#f9fafb" },
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <TableCell>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: "#1a1f2e",
                      }}
                    >
                      {course.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={course.difficulty_level || "Beginner"}
                      size="small"
                      sx={{
                        ...getDifficultyStyles(course.difficulty_level),
                        fontSize: "0.75rem",
                        height: 24,
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {tags.length > 0 ? (
                        tags.slice(0, 2).map((tag, idx) => (
                          <Chip
                            key={idx}
                            label={tag}
                            size="small"
                            sx={{
                              backgroundColor: "#e0e7ff",
                              color: "#6366f1",
                              fontSize: "0.75rem",
                              height: 24,
                              fontWeight: 500,
                              textTransform: "capitalize",
                            }}
                          />
                        ))
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#9ca3af",
                            fontSize: "0.75rem",
                            fontStyle: "italic",
                          }}
                        >
                          No tags
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#6b7280",
                        fontSize: "0.875rem",
                        maxWidth: 300,
                      }}
                      title={description}
                    >
                      {truncatedDescription}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        course.certificate_available
                          ? "Available"
                          : "Not Available"
                      }
                      size="small"
                      sx={{
                        backgroundColor: course.certificate_available
                          ? "#d1fae5"
                          : "#fee2e2",
                        color: course.certificate_available
                          ? "#065f46"
                          : "#991b1b",
                        fontSize: "0.75rem",
                        height: 24,
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(course.is_enrolled)}
                      size="small"
                      sx={getStatusChipSx(course.is_enrolled)}
                    />
                  </TableCell>
                  <TableCell>
                    {course.rating !== undefined ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Rating
                          value={course.rating}
                          precision={0.1}
                          readOnly
                          size="small"
                          sx={{
                            "& .MuiRating-iconFilled": {
                              color: "#fbbf24",
                            },
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#6b7280",
                            fontSize: "0.75rem",
                            ml: 0.5,
                          }}
                        >
                          ({course.rating_count || 0})
                        </Typography>
                      </Box>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#9ca3af",
                          fontSize: "0.75rem",
                          fontStyle: "italic",
                        }}
                      >
                        4.8/5
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ color: "#6b7280", fontSize: "0.875rem" }}
                    >
                      {course.is_free || parseFloat(course.price || "0") === 0
                        ? "Free"
                        : `₹${parseFloat(course.price).toFixed(2)}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {course.is_enrolled ? (
                      <Link
                        href={`/courses/${course.id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            backgroundColor: "#6366f1",
                            color: "#ffffff",
                            textTransform: "none",
                            fontSize: "0.875rem",
                            px: 2,
                            py: 0.5,
                            borderRadius: 1.5,
                            "&:hover": {
                              backgroundColor: "#4f46e5",
                            },
                          }}
                        >
                          Continue
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={(e) => handleEnrollClick(e, course.id)}
                        disabled={
                          (enrollingCourseId !== undefined &&
                            enrollingCourseId !== null) ||
                          course.enrollment_enabled === false
                        }
                        sx={{
                          backgroundColor: "#6366f1",
                          color: "#ffffff",
                          textTransform: "none",
                          fontSize: "0.875rem",
                          px: 2,
                          py: 0.5,
                          borderRadius: 1.5,
                          "&:hover": {
                            backgroundColor: "#4f46e5",
                          },
                        }}
                      >
                        {enrollingCourseId === course.id ? (
                          <CircularProgress size={16} sx={{ color: "white" }} />
                        ) : (
                          "Enroll"
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 3,
          px: 1,
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: "#6b7280", fontSize: "0.875rem" }}
        >
          Showing result {startIndex}-{endIndex} of {totalCount} Entries
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            startIcon={<IconWrapper icon="mdi:chevron-left" size={18} />}
            sx={{
              borderColor: "#e5e7eb",
              color: "#6b7280",
              textTransform: "none",
              px: 2,
              "&:disabled": { opacity: 0.5 },
              "&:hover": {
                borderColor: "#d1d5db",
                backgroundColor: "#f9fafb",
              },
            }}
          >
            Previous
          </Button>
          <Button
            variant="outlined"
            disabled={endIndex >= totalCount}
            onClick={() => onPageChange(page + 1)}
            endIcon={<IconWrapper icon="mdi:chevron-right" size={18} />}
            sx={{
              borderColor: "#e5e7eb",
              color: "#6b7280",
              textTransform: "none",
              px: 2,
              "&:disabled": { opacity: 0.5 },
              "&:hover": {
                borderColor: "#d1d5db",
                backgroundColor: "#f9fafb",
              },
            }}
          >
            Next
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
