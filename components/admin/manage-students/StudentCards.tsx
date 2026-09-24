"use client";

import { useState } from "react";
import {
  Avatar,
  Box,
  ButtonBase,
  Checkbox,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ScrollRow } from "@/components/common/mobile/ScrollRow";
import type { CourseCompletionStats, Student } from "@/lib/services/admin/admin-student.service";
import { completionStatsFor } from "@/lib/utils/student-risk";
import { CardStat } from "./mobile";
import { StudentResumeDialog } from "./StudentResumeDialog";

/* ==========================================================================
 * The student directory on a phone: one card per student.
 *
 * On an iPhone 14 the directory was a 920px sticky-header table inside a 390px screen, read two
 * columns at a time. Its row actions were three 28px icons at the far right edge, and the email
 * and percentages were 10.4px.
 *
 * Each card carries what an admin decides on - who, completion, attendance, courses, resume,
 * batch - and every action the table row had, behind one 44px menu. Selection for the bulk
 * toolbar is a 44px checkbox on the card, and the table's click-to-sort headers become a row of
 * sort pills. The desktop table is not built from this: StudentsTable renders it unchanged.
 * ======================================================================== */

export type StudentSortOption =
  | "name"
  | "marks"
  | "last_activity"
  | "time_spent"
  | "streak"
  | "completion_pct"
  | "attendance_pct"
  | "saved_resume";

export interface StudentCardsProps {
  students: Student[];
  completionStats: Record<number, CourseCompletionStats>;
  loadingStats: boolean;
  sortBy: StudentSortOption;
  sortOrder: "asc" | "desc";
  onSort: (field: StudentSortOption) => void;
  selectable?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  onToggleSelectAll?: () => void;
  allSelected?: boolean;
  someSelected?: boolean;
  onDelete?: (student: Student) => void;
}

const getInitials = (name: string) => {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

/** Batch chips shown on a card before the rest collapse into "+N". */
const MAX_BATCHES = 3;

const barColor =(pct: number) => (pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444");

function PercentBar({ value }: { value: number }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
      <LinearProgress
        variant="determinate"
        value={Math.min(value, 100)}
        sx={{
          flex: 1,
          height: 8,
          borderRadius: 1,
          backgroundColor: "#e5e7eb",
          "& .MuiLinearProgress-bar": { backgroundColor: barColor(value), borderRadius: 1 },
        }}
      />
      <Typography
        component="span"
        sx={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--font-primary)", minWidth: 36, textAlign: "end" }}
      >
        {value.toFixed(0)}%
      </Typography>
    </Box>
  );
}

const SORTS: Array<{ key: StudentSortOption; labelKey: string }> = [
  { key: "name", labelKey: "adminManageStudents.name" },
  { key: "completion_pct", labelKey: "adminManageStudents.completionPct" },
  { key: "attendance_pct", labelKey: "adminManageStudents.attendancePct" },
  { key: "saved_resume", labelKey: "adminManageStudents.savedResume" },
];

export function StudentCards({
  students,
  completionStats,
  loadingStats,
  sortBy,
  sortOrder,
  onSort,
  selectable = false,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected = false,
  someSelected = false,
  onDelete,
}: StudentCardsProps) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const [menu, setMenu] = useState<{ anchor: HTMLElement; student: Student } | null>(null);
  const [allBatches, setAllBatches] = useState<Set<number>>(new Set());
  const theme = useTheme();
  const menuEdge = theme.direction === "rtl" ? "left" : "right";

  // The student whose saved resume is open, as a bottom sheet.
  const [resumeFor, setResumeFor] = useState<Student | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);

  const closeMenu = () => setMenu(null);
  const go = (href: string) => {
    closeMenu();
    router.push(href);
  };
  const openResume = (student: Student) => {
    closeMenu();
    setResumeFor(student);
    setResumeOpen(true);
  };

  return (
    <Box data-testid="student-cards" sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      {/* Sorting: the table's clickable headers, as one-tap pills. */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
        {selectable && (
          <Checkbox
            checked={allSelected}
            indeterminate={!allSelected && someSelected}
            onChange={() => onToggleSelectAll?.()}
            sx={{ width: 44, height: 44, flexShrink: 0, color: "var(--accent-indigo)", "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: "var(--accent-indigo)" } }}
            inputProps={{ "aria-label": "Select all students" }}
          />
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <ScrollRow ariaLabel={t("adminManageStudents.mobile.sortBy", "Sort by")} gutter={0}>
            {SORTS.map((s) => {
              const active = sortBy === s.key;
              return (
                <Box
                  key={s.key}
                  component="button"
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSort(s.key)}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    minHeight: 44,
                    px: 1.5,
                    borderRadius: 999,
                    cursor: "pointer",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    border: "1px solid",
                    borderColor: active ? "var(--accent-indigo)" : "var(--border-default)",
                    color: active ? "var(--accent-indigo)" : "var(--font-secondary)",
                    background: active
                      ? "color-mix(in srgb, var(--accent-indigo) 10%, var(--card-bg))"
                      : "var(--card-bg)",
                  }}
                >
                  {t(s.labelKey)}
                  {active && (
                    <IconWrapper icon={sortOrder === "asc" ? "mdi:arrow-up" : "mdi:arrow-down"} size={16} />
                  )}
                </Box>
              );
            })}
          </ScrollRow>
        </Box>
      </Box>

      {students.length === 0 ? (
        <Box sx={{ py: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, textAlign: "center" }}>
          <IconWrapper icon="mdi:account-off-outline" size={48} color="#d1d5db" />
          <Typography sx={{ color: "#6b7280", fontWeight: 500 }}>{t("adminManageStudents.noStudentsFound")}</Typography>
          <Typography sx={{ color: "#6b7280", fontSize: "0.8125rem" }}>{t("adminManageStudents.tryAdjustingFilters")}</Typography>
        </Box>
      ) : (
        students.map((student) => {
          const stats = completionStatsFor(completionStats, student);
          const live = student.live_attendance;
          const attendance =
            live && live.percent !== null
              ? live.percent
              : stats && stats.total_attendance_activities > 0
                ? stats.attendance_percentage
                : null;
          const selected = selectedIds?.has(student.id) ?? false;
          const name = student.name || t("adminManageStudents.na");
          return (
            <Box
              key={student.id}
              data-testid="student-card"
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: selected ? "var(--accent-indigo)" : "var(--border-default)",
                backgroundColor: selected
                  ? "color-mix(in srgb, var(--accent-indigo) 5%, var(--card-bg))"
                  : "var(--card-bg)",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 0.5, pt: 0.5 }}>
                {selectable && (
                  <Checkbox
                    checked={selected}
                    onChange={() => onToggleSelect?.(student.id)}
                    sx={{ width: 44, height: 44, flexShrink: 0, color: "var(--accent-indigo)", "&.Mui-checked": { color: "var(--accent-indigo)" } }}
                    inputProps={{ "aria-label": `Select ${student.name}` }}
                  />
                )}
                {/* The card's title opens the student, as the course-management icon did. */}
                <ButtonBase
                  onClick={() => router.push(`/admin/manage-students/${student.id}`)}
                  aria-label={`${t("manageStudents.courseManagement")}: ${name}`}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 48,
                    justifyContent: "flex-start",
                    gap: 1.25,
                    px: selectable ? 0 : 1,
                    borderRadius: 2,
                    textAlign: "start",
                  }}
                >
                  <Avatar
                    src={student.profile_pic_url || undefined}
                    sx={{ width: 40, height: 40, bgcolor: "#6366f1", fontSize: "0.875rem", flexShrink: 0 }}
                  >
                    {getInitials(student.name)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                      <Typography
                        component="span"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          color: "var(--font-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          minWidth: 0,
                        }}
                      >
                        {name}
                      </Typography>
                      {!student.is_active && (
                        <Chip
                          label={t("adminManageStudents.inactive")}
                          size="small"
                          sx={{ flexShrink: 0, backgroundColor: "#fee2e2", color: "#991b1b", fontSize: "0.75rem", height: 22 }}
                        />
                      )}
                    </Box>
                    <Typography
                      component="span"
                      sx={{
                        display: "block",
                        fontSize: "0.8125rem",
                        color: "var(--font-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {student.email || t("adminManageStudents.na")}
                    </Typography>
                  </Box>
                </ButtonBase>
                <IconButton
                  aria-label={t("adminManageStudents.mobile.rowActions", { name, defaultValue: "Actions for {{name}}" })}
                  aria-haspopup="menu"
                  onClick={(e) => setMenu({ anchor: e.currentTarget, student })}
                  sx={{ width: 44, height: 44, flexShrink: 0, color: "var(--font-secondary)" }}
                >
                  <IconWrapper icon="mdi:dots-vertical" size={22} />
                </IconButton>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0, 1fr)",
                  columnGap: 1.5,
                  rowGap: 1,
                  px: 1.75,
                  pt: 0.75,
                  pb: 1.75,
                }}
              >
                <CardStat label={t("adminManageStudents.mobile.completion", "Completion")}>
                  {loadingStats ? (
                    <CircularProgress size={16} />
                  ) : stats ? (
                    <PercentBar value={stats.completion_percentage} />
                  ) : (
                    t("adminManageStudents.na")
                  )}
                </CardStat>
                <CardStat label={t("adminManageStudents.mobile.attendance", "Attendance")}>
                  {loadingStats && !live ? (
                    <CircularProgress size={16} />
                  ) : attendance !== null ? (
                    <PercentBar value={attendance} />
                  ) : (
                    t("adminManageStudents.na")
                  )}
                </CardStat>
                <CardStat label={t("adminManageStudents.mobile.courses", "Courses")}>
                  <Box component="span" sx={{ fontWeight: 700 }}>
                    {student.enrollment_count}
                  </Box>
                  {student.most_active_course ? (
                    <Box
                      component="span"
                      sx={{ color: "var(--font-secondary)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {student.most_active_course}
                    </Box>
                  ) : null}
                </CardStat>
                <CardStat label={t("adminManageStudents.savedResume")}>
                  {student.has_saved_resume ? (
                    <Chip
                      label={t("adminManageStudents.resumeViewer.view", "View resume")}
                      size="small"
                      icon={<IconWrapper icon="mdi:file-eye-outline" size={16} color="#166534" />}
                      onClick={() => openResume(student)}
                      aria-label={t("adminManageStudents.resumeViewer.viewOf", {
                        name: student.name,
                        defaultValue: "View {{name}}'s resume",
                      })}
                      data-testid={`view-resume-${student.id}`}
                      sx={{
                        backgroundColor: "#dcfce7",
                        color: "#166534",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        height: 32,
                        position: "relative",
                        // A 32px pill that takes a 44px thumb: the hit area reaches past the paint.
                        "&::after": { content: '""', position: "absolute", inset: "-6px -2px" },
                      }}
                    />
                  ) : (
                    <Chip
                      label={t("adminManageStudents.resumeNo")}
                      size="small"
                      sx={{
                        backgroundColor: "#f3f4f6",
                        color: "#6b7280",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    />
                  )}
                </CardStat>
                <CardStat label={t("adminManageStudents.mobile.batches", "Batches")}>
                  {student.cohorts && student.cohorts.length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {/* A learner can sit in twenty batches; a card shows three and a count, so one
                          student does not take three screens of the list. */}
                      {student.cohorts.length > MAX_BATCHES + 1 && !allBatches.has(student.id) && (
                        <ButtonBase
                          onClick={() => setAllBatches((prev) => new Set(prev).add(student.id))}
                          aria-label={`Show all ${student.cohorts.length} batches`}
                          sx={{
                            order: 1,
                            minHeight: 44,
                            px: 1,
                            borderRadius: 2,
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                            color: "var(--accent-indigo)",
                          }}
                        >
                          {`+${student.cohorts.length - MAX_BATCHES}`}
                        </ButtonBase>
                      )}
                      {(student.cohorts.length > MAX_BATCHES + 1 && !allBatches.has(student.id)
                        ? student.cohorts.slice(0, MAX_BATCHES)
                        : student.cohorts
                      ).map((c) => (
                        <Chip
                          key={c.id}
                          label={c.name}
                          size="small"
                          sx={{
                            maxWidth: "100%",
                            backgroundColor:
                              "color-mix(in srgb, var(--accent-purple, var(--primary-500)) 12%, var(--surface) 88%)",
                            color: "var(--font-primary)",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                          }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Box component="span" sx={{ color: "var(--font-secondary)" }}>
                      {t("adminManageStudents.noBatch", "No batch")}
                    </Box>
                  )}
                </CardStat>
              </Box>
            </Box>
          );
        })
      )}

      <Menu
        anchorEl={menu?.anchor ?? null}
        open={Boolean(menu)}
        onClose={closeMenu}
        // The "more" button sits at the card's end edge: right in LTR, left in RTL.
        anchorOrigin={{ vertical: "bottom", horizontal: menuEdge }}
        transformOrigin={{ vertical: "top", horizontal: menuEdge }}
        slotProps={{ paper: { sx: { minWidth: 220, borderRadius: 2 } } }}
      >
        <MenuItem sx={{ minHeight: 48 }} onClick={() => menu && go(`/admin/profile/${menu.student.id}`)}>
          <ListItemIcon>
            <IconWrapper icon="mdi:eye" size={20} color="#6366f1" />
          </ListItemIcon>
          {t("profile.tabProfile")}
        </MenuItem>
        <MenuItem sx={{ minHeight: 48 }} onClick={() => menu && go(`/admin/manage-students/${menu.student.id}`)}>
          <ListItemIcon>
            <IconWrapper icon="mdi:school-outline" size={20} color="#6366f1" />
          </ListItemIcon>
          {t("manageStudents.courseManagement")}
        </MenuItem>
        {menu?.student.has_saved_resume && (
          <MenuItem sx={{ minHeight: 48 }} onClick={() => menu && openResume(menu.student)}>
            <ListItemIcon>
              <IconWrapper icon="mdi:file-eye-outline" size={20} color="#6366f1" />
            </ListItemIcon>
            {t("adminManageStudents.resumeViewer.view", "View resume")}
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem
            sx={{ minHeight: 48, color: "#ef4444" }}
            onClick={() => {
              const s = menu?.student;
              closeMenu();
              if (s) onDelete(s);
            }}
          >
            <ListItemIcon>
              <IconWrapper icon="mdi:trash-can-outline" size={20} color="#ef4444" />
            </ListItemIcon>
            Delete student
          </MenuItem>
        )}
      </Menu>

      <StudentResumeDialog
        open={resumeOpen}
        onClose={() => setResumeOpen(false)}
        studentId={resumeFor?.id ?? null}
        studentName={resumeFor?.name}
      />
    </Box>
  );
}
