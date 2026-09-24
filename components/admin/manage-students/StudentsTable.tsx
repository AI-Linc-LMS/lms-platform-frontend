"use client";

import { useState, type ReactNode } from "react";
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
  Checkbox,
  CircularProgress,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  Student,
  CourseCompletionStats,
} from "@/lib/services/admin/admin-student.service";
import { completionStatsFor } from "@/lib/utils/student-risk";
import { StudentCards } from "./StudentCards";
import { useIsPhone } from "./mobile";
import { StudentResumeDialog } from "./StudentResumeDialog";

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
  /** When false, render table only (nest inside a parent Paper on the page). */
  wrapInPaper?: boolean;
  /** Enable the leading selection checkbox column (for bulk actions). */
  selectable?: boolean;
  /** Selected student ids (UserProfile.id) - controlled by the parent. */
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  /** Toggle selection of every student currently rendered. */
  onToggleSelectAll?: () => void;
  /** Header checkbox state across the full (filtered) set. */
  allSelected?: boolean;
  someSelected?: boolean;
  /** Per-row delete (permanent). When provided, a red delete action renders in the row. */
  onDelete?: (student: Student) => void;
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

const tablePaperSx = {
  borderRadius: 2,
  border: "1px solid var(--border-default)",
  boxShadow: "0 2px 12px color-mix(in srgb, var(--font-primary) 6%, transparent)",
  overflow: "hidden" as const,
  backgroundColor: "var(--card-bg)",
};

export function StudentsTable({
  students,
  completionStats,
  loading,
  loadingStats,
  sortBy,
  sortOrder,
  onSort,
  wrapInPaper = true,
  selectable = false,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected = false,
  someSelected = false,
  onDelete,
}: StudentsTableProps) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const colCount = selectable ? 8 : 7;
  const isPhone = useIsPhone();
  // The student whose saved resume is open. "Saved resume: Yes" used to be a dead label.
  const [resumeFor, setResumeFor] = useState<Student | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);

  const shell = (children: ReactNode) =>
    wrapInPaper ? (
      <Paper sx={tablePaperSx}>{children}</Paper>
    ) : (
      <Box sx={{ overflow: "hidden", backgroundColor: "var(--card-bg)" }}>{children}</Box>
    );

  if (loading) {
    return shell(
      <Box sx={{ py: 6, px: 2, textAlign: "center" }}>
        <CircularProgress size={36} sx={{ color: "var(--accent-indigo)" }} />
        <Typography
          variant="body2"
          sx={{ mt: 2, color: "var(--font-secondary)", fontWeight: 500 }}
        >
          {t("adminManageStudents.loadingStudents")}
        </Typography>
      </Box>
    );
  }

  // A phone gets one card per student instead of a 920px table; sm and up get the table below,
  // unchanged. The cards are their own surfaces, so they are not wrapped in the table's shell.
  if (isPhone) {
    return (
      <StudentCards
        students={Array.isArray(students) ? students : []}
        completionStats={completionStats}
        loadingStats={loadingStats}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
        selectable={selectable}
        selectedIds={selectedIds}
        onToggleSelect={onToggleSelect}
        onToggleSelectAll={onToggleSelectAll}
        allSelected={allSelected}
        someSelected={someSelected}
        onDelete={onDelete}
      />
    );
  }

  return shell(
      <TableContainer
        sx={{
          maxHeight: { xs: "70vh", sm: "none" },
          overflowX: "auto",
          "&::-webkit-scrollbar": {
            height: { xs: 6, sm: 8 },
            width: { xs: 6, sm: 8 },
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "var(--surface)",
            borderRadius: 4,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "var(--border-default)",
            borderRadius: 4,
            "&:hover": {
              backgroundColor:
                "color-mix(in srgb, var(--border-default) 70%, var(--font-secondary) 30%)",
            },
          },
        }}
      >
        <Table
          stickyHeader
          sx={{
            minWidth: 920,
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: "var(--surface)",
                "& .MuiTableCell-head": {
                  borderBottom: "2px solid var(--border-default)",
                  py: 2,
                  backgroundColor: "var(--surface)",
                },
              }}
            >
              {selectable && (
                <TableCell padding="checkbox" sx={{ backgroundColor: "var(--surface)" }}>
                  <Checkbox
                    size="small"
                    checked={allSelected}
                    indeterminate={!allSelected && someSelected}
                    onChange={() => onToggleSelectAll?.()}
                    sx={{ color: "var(--accent-indigo)", "&.Mui-checked": { color: "var(--accent-indigo)" } }}
                    inputProps={{ "aria-label": "Select all students" }}
                  />
                </TableCell>
              )}
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "var(--font-primary)",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  whiteSpace: "nowrap",
                }}
              >
                <Tooltip title={t("adminManageStudents.clickToSort")} enterDelay={400}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      cursor: "pointer",
                      "&:hover": { color: "var(--accent-indigo)" },
                      transition: "color 0.2s",
                    }}
                    onClick={() => onSort("name")}
                  >
                    <IconWrapper
                      icon="mdi:account-outline"
                      size={18}
                      color="var(--font-secondary)"
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
                </Tooltip>
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "var(--font-primary)",
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
                    color="var(--font-secondary)"
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
                  color: "var(--font-primary)",
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
                <Tooltip title={t("adminManageStudents.clickToSort")} enterDelay={400}>
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
                </Tooltip>
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  whiteSpace: "nowrap",
                }}
              >
                <Tooltip title={t("adminManageStudents.clickToSort")} enterDelay={400}>
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
                </Tooltip>
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  whiteSpace: "nowrap",
                }}
              >
                <Tooltip title={t("adminManageStudents.clickToSort")} enterDelay={400}>
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
                </Tooltip>
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
                {t("adminManageStudents.batches", "BATCHES")}
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
                  colSpan={colCount}
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
                const stats = completionStatsFor(completionStats, student);
                // Live sessions are the answer this column should give; the roll-call activity
                // system is what it used to give and is kept as a fallback.
                const liveAttendance = student.live_attendance;
                const attendancePercent =
                  liveAttendance && liveAttendance.percent !== null
                    ? liveAttendance.percent
                    : stats && stats.total_attendance_activities > 0
                      ? stats.attendance_percentage
                      : null;
                return (
                  <TableRow
                    key={student.id}
                    data-testid="student-row"
                    sx={{
                      "&:nth-of-type(even)": {
                        backgroundColor:
                          "color-mix(in srgb, var(--font-primary) 2.5%, var(--card-bg))",
                      },
                      "&:hover": {
                        backgroundColor:
                          "color-mix(in srgb, var(--accent-indigo) 6%, var(--card-bg))",
                        transition: "background-color 0.15s ease",
                      },
                      "&:last-child td": {
                        borderBottom: "none",
                      },
                    }}
                    selected={selectable && selectedIds?.has(student.id)}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={selectedIds?.has(student.id) ?? false}
                          onChange={() => onToggleSelect?.(student.id)}
                          sx={{ color: "var(--accent-indigo)", "&.Mui-checked": { color: "var(--accent-indigo)" } }}
                          inputProps={{ "aria-label": `Select ${student.name}` }}
                        />
                      </TableCell>
                    )}
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
                          src={student.profile_pic_url || undefined}
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
                              color: "var(--font-secondary)",
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
                          backgroundColor:
                            "color-mix(in srgb, var(--primary-500) 14%, var(--surface) 86%)",
                          color: "var(--primary-700)",
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
                          color: "var(--font-primary)",
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
                    {/* Which batch a student is in was not on this screen at all, so an admin
                        could see their marks and their streak but not who teaches them. */}
                    <TableCell
                      sx={{
                        py: 2,
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        display: { xs: "none", md: "table-cell" },
                      }}
                    >
                      {student.cohorts && student.cohorts.length > 0 ? (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, maxWidth: 220 }}>
                          {student.cohorts.map((cohort) => (
                            <Chip
                              key={cohort.id}
                              label={cohort.name}
                              size="small"
                              sx={{
                                backgroundColor:
                                  "color-mix(in srgb, var(--accent-purple, var(--primary-500)) 12%, var(--surface) 88%)",
                                color: "var(--font-primary)",
                                fontWeight: 600,
                                fontSize: { xs: "0.65rem", sm: "0.7rem" },
                              }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{ color: "#6b7280", fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                        >
                          {t("adminManageStudents.noBatch", "No batch")}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 2,
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        display: { xs: "none", sm: "table-cell" },
                      }}
                    >
                      {student.has_saved_resume ? (
                        <Tooltip title={t("adminManageStudents.resumeViewer.view", "View resume")}>
                          <Chip
                            label={t("adminManageStudents.resumeYes")}
                            size="small"
                            icon={<IconWrapper icon="mdi:file-eye-outline" size={14} color="#166534" />}
                            onClick={() => {
                              setResumeFor(student);
                              setResumeOpen(true);
                            }}
                            aria-label={t("adminManageStudents.resumeViewer.viewOf", {
                              name: student.name,
                              defaultValue: "View {{name}}'s resume",
                            })}
                            data-testid={`view-resume-${student.id}`}
                            sx={{
                              backgroundColor: "#dcfce7",
                              color: "#166534",
                              fontWeight: 600,
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                              cursor: "pointer",
                              "&:hover": { backgroundColor: "#bbf7d0" },
                            }}
                          />
                        </Tooltip>
                      ) : (
                        <Chip
                          label={t("adminManageStudents.resumeNo")}
                          size="small"
                          sx={{
                            backgroundColor: "#f3f4f6",
                            color: "#6b7280",
                            fontWeight: 600,
                            fontSize: { xs: "0.7rem", sm: "0.75rem" },
                          }}
                        />
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
                      {loadingStats && !student.live_attendance ? (
                        <CircularProgress size={16} />
                      ) : /* LIVE SESSIONS first: the reported gap was that this screen said
                             nothing about them. `live_attendance` counts the classes on this
                             student's roster that have already ended and started after they
                             joined, against the ones they turned up to.

                             The roll-call activity system is the fallback, and still reports
                             nothing when it has no activities - a zero denominator rendered as a
                             red 0% is a number no one earned and no one can improve. */
                      attendancePercent !== null ? (
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
                              value={Math.min(attendancePercent, 100)}
                              sx={{
                                flex: 1,
                                height: { xs: 6, sm: 8 },
                                borderRadius: 1,
                                backgroundColor: "#e5e7eb",
                                "& .MuiLinearProgress-bar": {
                                  backgroundColor:
                                    attendancePercent >= 80
                                      ? "#10b981"
                                      : attendancePercent >= 50
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
                              {attendancePercent.toFixed(0)}%
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
                          aria-label={t("profile.tabProfile")}
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
                          aria-label={t("manageStudents.courseManagement")}
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
                        {onDelete && (
                          <IconButton
                            size="small"
                            onClick={() => onDelete(student)}
                            title="Delete student"
                            aria-label="Delete student"
                            sx={{
                              color: "#ef4444",
                              "&:hover": { backgroundColor: "#fef2f2", transform: "scale(1.1)" },
                              transition: "all 0.2s",
                            }}
                          >
                            <IconWrapper icon="mdi:trash-can-outline" size={18} />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <StudentResumeDialog
          open={resumeOpen}
          onClose={() => setResumeOpen(false)}
          studentId={resumeFor?.id ?? null}
          studentName={resumeFor?.name}
        />
      </TableContainer>
  );
}
