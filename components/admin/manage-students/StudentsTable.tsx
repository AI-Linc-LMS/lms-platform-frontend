"use client";

import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Avatar,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  Student,
  CourseCompletionStats,
} from "@/lib/services/admin/admin-student.service";

type SortOption =
  | "name"
  | "marks"
  | "last_activity"
  | "time_spent"
  | "streak"
  | "completion_pct"
  | "attendance_pct"
  | "saved_resume";
type SortOrder = "asc" | "desc";

interface StudentsTableProps {
  students: Student[];
  completionStats: Record<number, CourseCompletionStats>;
  loading: boolean;
  loadingStats: boolean;
  sortBy: SortOption;
  sortOrder: SortOrder;
  onSort: (field: SortOption) => void;
}

const getSortIcon = (
  currentSort: SortOption,
  sortBy: SortOption,
  sortOrder: SortOrder
) => {
  if (currentSort !== sortBy) return null;
  return sortOrder === "asc" ? "mdi:arrow-up" : "mdi:arrow-down";
};

const getInitials = (name: string) => {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function StudentsTable({
  students,
  completionStats,
  loading,
  loadingStats,
  sortBy,
  sortOrder,
  onSort,
}: StudentsTableProps) {
  const router = useRouter();
  const { t } = useTranslation("common");

  if (loading) {
    return (
      <Paper
        sx={{
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        overflow: "hidden",
        backgroundColor: "#ffffff",
      }}
    >
      <TableContainer
        sx={{
          maxHeight: { xs: "70vh", sm: "none" },
          overflowX: "auto",
          "&::-webkit-scrollbar": {
            height: { xs: 6, sm: 8 },
            width: { xs: 6, sm: 8 },
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
        <Table
          sx={{
            minWidth: 920,
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: "#f9fafb",
                "& .MuiTableCell-head": {
                  borderBottom: "2px solid #e5e7eb",
                  py: 2,
                },
              }}
            >
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  whiteSpace: "nowrap",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    "&:hover": { color: "#6366f1" },
                    transition: "color 0.2s",
                  }}
                  onClick={() => onSort("name")}
                >
                  <IconWrapper
                    icon="mdi:account-outline"
                    size={18}
                    color="#6b7280"
                  />
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    {t("adminManageStudents.name").toUpperCase()}
                  </Box>
                  {getSortIcon("name", sortBy, sortOrder) && (
                    <IconWrapper
                      icon={getSortIcon("name", sortBy, sortOrder)!}
                      size={16}
                      color="inherit"
                    />
                  )}
                </Box>
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  whiteSpace: "nowrap",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <IconWrapper
                    icon="mdi:book-open-outline"
                    size={18}
                    color="#6b7280"
                  />
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    {t("adminManageStudents.enroll").toUpperCase()}
                  </Box>
                </Box>
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  whiteSpace: "nowrap",
                  display: { xs: "none", md: "table-cell" },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <IconWrapper icon="mdi:target" size={18} color="#6b7280" />
                {t("adminManageStudents.mostActive").toUpperCase()}
                </Box>
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  whiteSpace: "nowrap",
                  display: { xs: "none", sm: "table-cell" },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    "&:hover": { color: "#6366f1" },
                    transition: "color 0.2s",
                  }}
                  onClick={() => onSort("saved_resume")}
                >
                  <IconWrapper icon="mdi:file-document-outline" size={18} color="#6b7280" />
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", md: "inline" } }}
                  >
                    {t("adminManageStudents.savedResume").toUpperCase()}
                  </Box>
                  {getSortIcon("saved_resume", sortBy, sortOrder) && (
                    <IconWrapper
                      icon={getSortIcon("saved_resume", sortBy, sortOrder)!}
                      size={16}
                      color="inherit"
                    />
                  )}
                </Box>
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  whiteSpace: "nowrap",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    "&:hover": { color: "#6366f1" },
                    transition: "color 0.2s",
                  }}
                  onClick={() => onSort("completion_pct")}
                >
                  <IconWrapper icon="mdi:chart-bar" size={18} color="#6b7280" />
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    {t("adminManageStudents.completionPct").toUpperCase()}
                  </Box>
                  {getSortIcon("completion_pct", sortBy, sortOrder) && (
                    <IconWrapper
                      icon={getSortIcon("completion_pct", sortBy, sortOrder)!}
                      size={16}
                      color="inherit"
                    />
                  )}
                </Box>
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  whiteSpace: "nowrap",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    "&:hover": { color: "#6366f1" },
                    transition: "color 0.2s",
                  }}
                  onClick={() => onSort("attendance_pct")}
                >
                  <IconWrapper icon="mdi:chart-bar" size={18} color="#6b7280" />
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    {t("adminManageStudents.attendancePct").toUpperCase()}
                  </Box>
                  {getSortIcon("attendance_pct", sortBy, sortOrder) && (
                    <IconWrapper
                      icon={getSortIcon("attendance_pct", sortBy, sortOrder)!}
                      size={16}
                      color="inherit"
                    />
                  )}
                </Box>
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  whiteSpace: "nowrap",
                  textAlign: "center",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
                  <IconWrapper
                    icon="mdi:cog-outline"
                    size={18}
                    color="#6b7280"
                  />
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    {t("adminManageStudents.actions").toUpperCase()}
                  </Box>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!Array.isArray(students) || students.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  sx={{
                    py: 6,
                    border: "none",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <IconWrapper
                      icon="mdi:account-off-outline"
                      size={48}
                      color="#d1d5db"
                    />
                    <Typography
                      variant="body1"
                      sx={{
                        color: "#6b7280",
                        fontWeight: 500,
                      }}
                    >
                      {t("adminManageStudents.noStudentsFound")}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#9ca3af",
                      }}
                    >
                      {t("adminManageStudents.tryAdjustingFilters")}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => {
                const stats = completionStats[student.user_id] || completionStats[student.id];
                return (
                  <TableRow
                    key={student.id}
                    sx={{
                      "&:hover": {
                        backgroundColor: "#f9fafb",
                        transition: "background-color 0.2s",
                      },
                      "&:last-child td": {
                        borderBottom: "none",
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        py: 2,
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: { xs: 32, sm: 40 },
                            height: { xs: 32, sm: 40 },
                            bgcolor: "#6366f1",
                            fontSize: { xs: "0.7rem", sm: "0.875rem" },
                          }}
                        >
                          {getInitials(student.name)}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                color: "#111827",
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {student.name || t("adminManageStudents.na")}
                            </Typography>
                            {!student.is_active && (
                              <Chip
                                label={t("adminManageStudents.inactive")}
                                size="small"
                                sx={{
                                  backgroundColor: "#fee2e2",
                                  color: "#991b1b",
                                  fontSize: "0.65rem",
                                  height: 18,
                                  "& .MuiChip-label": {
                                    px: 0.5,
                                  },
                                }}
                              />
                            )}
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#6b7280",
                              fontSize: { xs: "0.65rem", sm: "0.75rem" },
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {student.email || t("adminManageStudents.na")}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 2,
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      }}
                    >
                      <Chip
                        label={student.enrollment_count}
                        size="small"
                        sx={{
                          backgroundColor: "#eef2ff",
                          color: "#6366f1",
                          fontWeight: 600,
                          fontSize: { xs: "0.7rem", sm: "0.75rem" },
                        }}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 2,
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        display: { xs: "none", md: "table-cell" },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#374151",
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 200,
                        }}
                      >
                        {student.most_active_course || t("adminManageStudents.noActivity")}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 2,
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        display: { xs: "none", sm: "table-cell" },
                      }}
                    >
                      <Chip
                        label={
                          student.has_saved_resume
                            ? t("adminManageStudents.resumeYes")
                            : t("adminManageStudents.resumeNo")
                        }
                        size="small"
                        sx={{
                          backgroundColor: student.has_saved_resume ? "#dcfce7" : "#f3f4f6",
                          color: student.has_saved_resume ? "#166534" : "#6b7280",
                          fontWeight: 600,
                          fontSize: { xs: "0.7rem", sm: "0.75rem" },
                        }}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 2,
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      }}
                    >
                      {loadingStats ? (
                        <CircularProgress size={16} />
                      ) : stats ? (
                        <Box sx={{ minWidth: { xs: 80, sm: 120 } }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: { xs: 0.5, sm: 1 },
                              mb: 0.5,
                            }}
                          >
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(stats.completion_percentage, 100)}
                              sx={{
                                flex: 1,
                                height: { xs: 6, sm: 8 },
                                borderRadius: 1,
                                backgroundColor: "#e5e7eb",
                                "& .MuiLinearProgress-bar": {
                                  backgroundColor:
                                    stats.completion_percentage >= 80
                                      ? "#10b981"
                                      : stats.completion_percentage >= 50
                                      ? "#f59e0b"
                                      : "#ef4444",
                                  borderRadius: 1,
                                },
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                color: "#374151",
                                minWidth: { xs: 30, sm: 40 },
                                textAlign: "right",
                                fontSize: { xs: "0.65rem", sm: "0.75rem" },
                              }}
                            >
                              {stats.completion_percentage.toFixed(0)}%
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#6b7280",
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          }}
                        >
                          {t("adminManageStudents.na")}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 2,
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      }}
                    >
                      {loadingStats ? (
                        <CircularProgress size={16} />
                      ) : stats ? (
                        <Box sx={{ minWidth: { xs: 80, sm: 120 } }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: { xs: 0.5, sm: 1 },
                              mb: 0.5,
                            }}
                          >
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(stats.attendance_percentage, 100)}
                              sx={{
                                flex: 1,
                                height: { xs: 6, sm: 8 },
                                borderRadius: 1,
                                backgroundColor: "#e5e7eb",
                                "& .MuiLinearProgress-bar": {
                                  backgroundColor:
                                    stats.attendance_percentage >= 80
                                      ? "#10b981"
                                      : stats.attendance_percentage >= 50
                                      ? "#f59e0b"
                                      : "#ef4444",
                                  borderRadius: 1,
                                },
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                color: "#374151",
                                minWidth: { xs: 30, sm: 40 },
                                textAlign: "right",
                                fontSize: { xs: "0.65rem", sm: "0.75rem" },
                              }}
                            >
                              {stats.attendance_percentage.toFixed(0)}%
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#6b7280",
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          }}
                        >
                          {t("adminManageStudents.na")}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 2,
                        textAlign: "center",
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                        <IconButton
                          size="small"
                          onClick={() =>
                            router.push(`/admin/profile/${student.id}`)
                          }
                          title={t("profile.tabProfile")}
                          sx={{
                            color: "#6366f1",
                            "&:hover": {
                              backgroundColor: "#eef2ff",
                              transform: "scale(1.1)",
                            },
                            transition: "all 0.2s",
                          }}
                        >
                          <IconWrapper icon="mdi:eye" size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() =>
                            router.push(`/admin/manage-students/${student.id}`)
                          }
                          title={t("manageStudents.courseManagement")}
                          sx={{
                            color: "#6366f1",
                            "&:hover": {
                              backgroundColor: "#eef2ff",
                              transform: "scale(1.1)",
                            },
                            transition: "all 0.2s",
                          }}
                        >
                          <IconWrapper icon="mdi:school-outline" size={18} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
