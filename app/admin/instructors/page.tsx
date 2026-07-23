"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/common/PageShell";
import {
  ModulePageHeader,
} from "@/components/common/ModulePageHeader";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminInstructorsService,
  type InstructorListStatus,
  type InstructorRow,
  type PromoteRole,
} from "@/lib/services/admin/admin-instructors.service";
import { adminCourseBuilderService } from "@/lib/services/admin/admin-course-builder.service";
import { formatDate } from "@/lib/utils/date-utils";

interface CourseOption {
  id: number;
  title: string;
}

type ApiErrorShape = { response?: { data?: { detail?: string; error?: string } } };

function readApiError(err: unknown, fallback: string): string {
  const ax = err as ApiErrorShape;
  return ax.response?.data?.detail || ax.response?.data?.error || fallback;
}

const STATUS_TABS: InstructorListStatus[] = ["pending", "approved", "rejected"];

const STATUS_VISUAL: Record<
  InstructorListStatus,
  { icon: string; accent: string; tint: string }
> = {
  pending: {
    icon: "mdi:clock-outline",
    accent: "var(--accent-amber, #d97706)",
    tint: "color-mix(in srgb, #f59e0b 14%, var(--surface) 86%)",
  },
  approved: {
    icon: "mdi:check-circle-outline",
    accent: "var(--accent-emerald, #059669)",
    tint: "color-mix(in srgb, #10b981 14%, var(--surface) 86%)",
  },
  rejected: {
    icon: "mdi:close-circle-outline",
    accent: "var(--accent-rose, #dc2626)",
    tint: "color-mix(in srgb, #ef4444 12%, var(--surface) 88%)",
  },
};

function getInitials(name: string, email: string): string {
  const source = (name || email || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColorFor(seed: string): string {
  const palette = [
    "#6366f1",
    "#0ea5e9",
    "#10b981",
    "#f59e0b",
    "#ec4899",
    "#8b5cf6",
    "#14b8a6",
    "#f43f5e",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return palette[Math.abs(hash) % palette.length];
}

export default function InstructorsPage() {
  const { t } = useTranslation("common");
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<InstructorListStatus>("pending");
  const [dataByStatus, setDataByStatus] = useState<
    Record<InstructorListStatus, InstructorRow[] | null>
  >({ pending: null, approved: null, rejected: null });
  const [loadingByStatus, setLoadingByStatus] = useState<
    Record<InstructorListStatus, boolean>
  >({ pending: true, approved: true, rejected: true });
  const [searchTerm, setSearchTerm] = useState("");

  const [busyId, setBusyId] = useState<number | null>(null);

  const [confirmApproveRow, setConfirmApproveRow] = useState<InstructorRow | null>(null);
  const [confirmRejectRow, setConfirmRejectRow] = useState<InstructorRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmReopenRow, setConfirmReopenRow] = useState<InstructorRow | null>(null);

  const [assignRow, setAssignRow] = useState<InstructorRow | null>(null);
  const [allCourses, setAllCourses] = useState<CourseOption[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [courseSearch, setCourseSearch] = useState("");

  const [promoteRow, setPromoteRow] = useState<InstructorRow | null>(null);
  const [promoteRole, setPromoteRole] = useState<PromoteRole>("course_manager");

  const [viewCoursesRow, setViewCoursesRow] = useState<InstructorRow | null>(null);

  const [menuRow, setMenuRow] = useState<InstructorRow | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const loadStatus = useCallback(
    async (status: InstructorListStatus) => {
      setLoadingByStatus((s) => ({ ...s, [status]: true }));
      try {
        const data = await adminInstructorsService.listInstructors(status);
        setDataByStatus((d) => ({ ...d, [status]: data }));
      } catch (err: unknown) {
        showToast(readApiError(err, t("adminInstructors.errors.loadFailed")), "error");
        setDataByStatus((d) => ({ ...d, [status]: [] }));
      } finally {
        setLoadingByStatus((s) => ({ ...s, [status]: false }));
      }
    },
    [showToast, t]
  );

  const refreshAll = useCallback(async () => {
    await Promise.all(STATUS_TABS.map((s) => loadStatus(s)));
  }, [loadStatus]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const refreshCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      const raw = await adminCourseBuilderService.getCourses();
      const list = Array.isArray(raw) ? raw : raw?.results ?? raw?.courses ?? [];
      const options: CourseOption[] = list
        .map((c: { id?: number; title?: string }) =>
          c && typeof c.id === "number" && typeof c.title === "string"
            ? { id: c.id, title: c.title }
            : null
        )
        .filter((c: CourseOption | null): c is CourseOption => c !== null);
      setAllCourses(options);
    } catch (err: unknown) {
      showToast(readApiError(err, t("adminInstructors.errors.coursesLoadFailed")), "error");
      setAllCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, [showToast, t]);

  const counts = useMemo(
    () => ({
      pending: dataByStatus.pending?.length ?? 0,
      approved: dataByStatus.approved?.length ?? 0,
      rejected: dataByStatus.rejected?.length ?? 0,
    }),
    [dataByStatus]
  );

  const visibleRows = useMemo(() => {
    const list = dataByStatus[activeTab] ?? [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
    );
  }, [dataByStatus, activeTab, searchTerm]);

  const openMenu = (row: InstructorRow, anchor: HTMLElement) => {
    setMenuRow(row);
    setMenuAnchor(anchor);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuRow(null);
  };

  const handleApproveConfirmed = async () => {
    const row = confirmApproveRow;
    if (!row) return;
    try {
      setBusyId(row.id);
      const res = await adminInstructorsService.approveInstructor(row.id);
      showToast(res.detail || t("adminInstructors.toasts.approved"), "success");
      setConfirmApproveRow(null);
      await Promise.all([loadStatus("pending"), loadStatus("approved")]);
    } catch (err: unknown) {
      showToast(readApiError(err, t("adminInstructors.errors.approveFailed")), "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectConfirmed = async () => {
    const row = confirmRejectRow;
    if (!row) return;
    try {
      setBusyId(row.id);
      const res = await adminInstructorsService.rejectInstructor(
        row.id,
        rejectReason || undefined
      );
      showToast(res.detail || t("adminInstructors.toasts.rejected"), "success");
      setConfirmRejectRow(null);
      setRejectReason("");
      await Promise.all([loadStatus("pending"), loadStatus("rejected")]);
    } catch (err: unknown) {
      showToast(readApiError(err, t("adminInstructors.errors.rejectFailed")), "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleReopenConfirmed = async () => {
    const row = confirmReopenRow;
    if (!row) return;
    try {
      setBusyId(row.id);
      const res = await adminInstructorsService.reopenInstructor(row.id);
      showToast(res.detail || t("adminInstructors.toasts.reopened"), "success");
      setConfirmReopenRow(null);
      await Promise.all([loadStatus("pending"), loadStatus("rejected")]);
    } catch (err: unknown) {
      showToast(readApiError(err, t("adminInstructors.errors.reopenFailed")), "error");
    } finally {
      setBusyId(null);
    }
  };

  const openAssignDialog = async (row: InstructorRow) => {
    setAssignRow(row);
    setSelectedCourseIds((row.assigned_courses ?? []).map((c) => c.id));
    setCourseSearch("");
    closeMenu();
    if (allCourses.length === 0) {
      await refreshCourses();
    }
  };

  const filteredAssignCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return allCourses;
    return allCourses.filter((c) => c.title.toLowerCase().includes(q));
  }, [allCourses, courseSearch]);

  const allFilteredSelected =
    filteredAssignCourses.length > 0 &&
    filteredAssignCourses.every((c) => selectedCourseIds.includes(c.id));

  const toggleAllFiltered = () => {
    if (allFilteredSelected) {
      const remove = new Set(filteredAssignCourses.map((c) => c.id));
      setSelectedCourseIds((prev) => prev.filter((id) => !remove.has(id)));
    } else {
      const add = new Set(selectedCourseIds);
      filteredAssignCourses.forEach((c) => add.add(c.id));
      setSelectedCourseIds(Array.from(add));
    }
  };

  const handleAssignSave = async () => {
    const row = assignRow;
    if (!row) return;
    try {
      setBusyId(row.id);
      const res = await adminInstructorsService.assignCoursesToInstructor(
        row.id,
        selectedCourseIds,
        "set"
      );
      showToast(res.detail || t("adminInstructors.toasts.coursesAssigned"), "success");
      setAssignRow(null);
      await loadStatus("approved");
    } catch (err: unknown) {
      showToast(readApiError(err, t("adminInstructors.errors.assignFailed")), "error");
    } finally {
      setBusyId(null);
    }
  };

  const handlePromoteConfirmed = async () => {
    const row = promoteRow;
    if (!row) return;
    try {
      setBusyId(row.id);
      const res = await adminInstructorsService.promoteInstructor(row.id, promoteRole);
      showToast(res.detail || t("adminInstructors.toasts.promoted"), "success");
      setPromoteRow(null);
      await loadStatus("approved");
    } catch (err: unknown) {
      showToast(readApiError(err, t("adminInstructors.errors.promoteFailed")), "error");
    } finally {
      setBusyId(null);
    }
  };

  const renderActions = (row: InstructorRow) => {
    if (activeTab === "pending") {
      return (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            size="small"
            variant="contained"
            disabled={busyId === row.id}
            startIcon={<IconWrapper icon="mdi:check" size={16} />}
            onClick={() => setConfirmApproveRow(row)}
            sx={{
              textTransform: "none",
              backgroundColor: "var(--accent-indigo)",
              color: "var(--font-light)",
              boxShadow: "0 1px 4px color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
              "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
            }}
          >
            {busyId === row.id
              ? t("adminInstructors.loading.approving")
              : t("adminInstructors.actions.approve")}
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={busyId === row.id}
            color="error"
            startIcon={<IconWrapper icon="mdi:close" size={16} />}
            onClick={() => {
              setRejectReason("");
              setConfirmRejectRow(row);
            }}
            sx={{ textTransform: "none" }}
          >
            {t("adminInstructors.actions.reject")}
          </Button>
        </Stack>
      );
    }
    if (activeTab === "approved") {
      return (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            size="small"
            variant="outlined"
            startIcon={<IconWrapper icon="mdi:book-plus-multiple-outline" size={16} />}
            onClick={() => void openAssignDialog(row)}
            sx={{ textTransform: "none" }}
          >
            {t("adminInstructors.actions.assignCourses")}
          </Button>
          <Tooltip title={t("adminInstructors.actions.promote")}>
            <IconButton size="small" onClick={(e) => openMenu(row, e.currentTarget)}>
              <IconWrapper icon="mdi:dots-vertical" size={20} />
            </IconButton>
          </Tooltip>
        </Stack>
      );
    }
    return (
      <Button
        size="small"
        variant="outlined"
        disabled={busyId === row.id}
        startIcon={<IconWrapper icon="mdi:refresh" size={16} />}
        onClick={() => setConfirmReopenRow(row)}
        sx={{ textTransform: "none" }}
      >
        {t("adminInstructors.actions.reopen")}
      </Button>
    );
  };

  const columns = useMemo(() => {
    const cols = [
      t("adminInstructors.columns.fullName"),
      t("adminInstructors.columns.phone"),
      t("adminInstructors.columns.createdAt"),
      "CV",
    ];
    if (activeTab === "approved") cols.push(t("adminInstructors.columns.assignedCourses"));
    if (activeTab === "rejected") {
      cols.push(t("adminInstructors.columns.reviewedAt"));
      cols.push(t("adminInstructors.columns.rejectionReason"));
    }
    cols.push(t("adminInstructors.columns.actions"));
    return cols;
  }, [activeTab, t]);

  const loading = loadingByStatus[activeTab];

  return (
    <PageShell maxWidth={1200}>
      <ModulePageHeader
        eyebrow="People"
        title="Instructors"
        description="Add instructors and manage their access."
        accent="indigo"
        icon="mdi:account-tie"
      />

      {/* Status quick-stats (click to switch tab) */}
      <Box
        sx={{
          display: "flex",
          justifyContent: { xs: "stretch", md: "flex-end" },
          mb: 2.5,
        }}
      >
            <Stack
              direction="row"
              spacing={1.25}
              sx={{
                width: { xs: "100%", md: "auto" },
                flexShrink: 0,
              }}
            >
              {STATUS_TABS.map((s) => {
                const v = STATUS_VISUAL[s];
                return (
                  <Paper
                    key={s}
                    elevation={0}
                    onClick={() => setActiveTab(s)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveTab(s);
                      }
                    }}
                    sx={{
                      flex: { xs: 1, md: "0 0 auto" },
                      minWidth: { md: 116 },
                      px: 1.5,
                      py: 1.25,
                      borderRadius: 2,
                      cursor: "pointer",
                      border: `1px solid ${
                        activeTab === s ? v.accent : "var(--border-default)"
                      }`,
                      backgroundColor:
                        activeTab === s ? v.tint : "var(--surface)",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        backgroundColor: v.tint,
                        borderColor: v.accent,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        color: v.accent,
                        mb: 0.25,
                      }}
                    >
                      <IconWrapper icon={v.icon} size={16} />
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                      >
                        {t(`adminInstructors.stats.${s}`)}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        color: "var(--font-primary)",
                        fontWeight: 700,
                        fontSize: "1.25rem",
                        lineHeight: 1.1,
                      }}
                    >
                      {loadingByStatus[s] && dataByStatus[s] === null
                        ? "—"
                        : counts[s]}
                    </Typography>
                  </Paper>
                );
              })}
            </Stack>
      </Box>

        {/* Tabs */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 1.5,
            mb: 1.5,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, v: InstructorListStatus) => {
              setActiveTab(v);
              setSearchTerm("");
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              "& .MuiTab-root": {
                textTransform: "none",
                minHeight: 40,
                fontWeight: 600,
                color: "var(--font-secondary)",
                "&.Mui-selected": { color: "var(--accent-indigo)" },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "var(--accent-indigo)",
                height: 3,
                borderRadius: 2,
              },
            }}
          >
            {STATUS_TABS.map((s) => (
              <Tab
                key={s}
                value={s}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {t(`adminInstructors.tabs.${s}`)}
                    <Badge
                      badgeContent={
                        loadingByStatus[s] && dataByStatus[s] === null
                          ? 0
                          : counts[s]
                      }
                      showZero
                      sx={{
                        "& .MuiBadge-badge": {
                          position: "static",
                          transform: "none",
                          backgroundColor:
                            activeTab === s
                              ? "color-mix(in srgb, var(--accent-indigo) 16%, var(--surface) 84%)"
                              : "var(--surface)",
                          color:
                            activeTab === s
                              ? "var(--accent-indigo)"
                              : "var(--font-secondary)",
                          border: "1px solid var(--border-default)",
                          minWidth: 22,
                          height: 20,
                          fontWeight: 700,
                          fontSize: "0.7rem",
                        },
                      }}
                    />
                  </Box>
                }
              />
            ))}
          </Tabs>

          <TextField
            size="small"
            placeholder={t("adminInstructors.searchPlaceholder") as string}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              minWidth: { xs: "100%", sm: 280 },
              "& .MuiInputBase-root": {
                backgroundColor: "var(--card-bg)",
                borderRadius: 2,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconWrapper icon="mdi:magnify" size={20} />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <IconWrapper icon="mdi:close" size={16} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
        </Box>

        {/* Table */}
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--card-bg)",
            borderRadius: 2,
          }}
        >
          <Table size="small">
            <TableHead
              sx={{
                backgroundColor:
                  "color-mix(in srgb, var(--surface) 70%, var(--card-bg) 30%)",
              }}
            >
              <TableRow>
                {columns.map((c, i) => (
                  <TableCell
                    key={c + i}
                    align={i === columns.length - 1 ? "right" : "left"}
                    sx={{
                      color: "var(--font-secondary)",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      borderColor: "var(--border-default)",
                    }}
                  >
                    {c}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (dataByStatus[activeTab]?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                    <Stack alignItems="center" spacing={1.5}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: STATUS_VISUAL[activeTab].tint,
                          color: STATUS_VISUAL[activeTab].accent,
                        }}
                      >
                        <IconWrapper icon={STATUS_VISUAL[activeTab].icon} size={32} />
                      </Box>
                      <Typography sx={{ color: "var(--font-secondary)" }}>
                        {searchTerm
                          ? t("adminInstructors.noMatch")
                          : t(`adminInstructors.empty.${activeTab}`)}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{
                      "& td": { borderColor: "var(--border-default)" },
                      "&:hover": {
                        backgroundColor:
                          "color-mix(in srgb, var(--surface) 70%, var(--card-bg) 30%)",
                      },
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            backgroundColor: avatarColorFor(row.email || row.full_name),
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                          }}
                        >
                          {getInitials(row.full_name, row.email)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              color: "var(--font-primary)",
                              fontWeight: 600,
                              fontSize: "0.875rem",
                              lineHeight: 1.2,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.full_name || row.email}
                          </Typography>
                          <Typography
                            sx={{
                              color: "var(--font-secondary)",
                              fontSize: "0.75rem",
                              lineHeight: 1.3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ color: "var(--font-secondary)" }}>
                      {row.phone_number || "—"}
                    </TableCell>
                    <TableCell sx={{ color: "var(--font-secondary)" }}>
                      {formatDate(row.created_at)}
                    </TableCell>
                    <TableCell>
                      {row.instructor_cv_url ? (
                        <Button
                          size="small"
                          variant="outlined"
                          component="a"
                          href={row.instructor_cv_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={
                            <IconWrapper icon="mdi:file-pdf-box" size={16} />
                          }
                          sx={{
                            textTransform: "none",
                            color: "var(--accent-indigo)",
                            borderColor:
                              "color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
                            "&:hover": {
                              borderColor: "var(--accent-indigo)",
                              backgroundColor:
                                "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                            },
                          }}
                        >
                          View CV
                        </Button>
                      ) : (
                        <Typography
                          sx={{
                            color: "var(--font-secondary)",
                            fontSize: "0.8125rem",
                          }}
                        >
                          —
                        </Typography>
                      )}
                    </TableCell>
                    {activeTab === "approved" && (
                      <TableCell>
                        {row.assigned_courses && row.assigned_courses.length > 0 ? (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            flexWrap="wrap"
                            useFlexGap
                            sx={{ rowGap: 0.5 }}
                          >
                            {row.assigned_courses.slice(0, 3).map((c) => (
                              <Chip
                                key={c.id}
                                label={c.title}
                                size="small"
                                sx={{
                                  backgroundColor:
                                    "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface) 90%)",
                                  color: "var(--accent-indigo)",
                                  fontWeight: 500,
                                  maxWidth: 200,
                                }}
                              />
                            ))}
                            {row.assigned_courses.length > 3 && (
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`+${row.assigned_courses.length - 3}`}
                                onClick={() => setViewCoursesRow(row)}
                                sx={{ cursor: "pointer" }}
                              />
                            )}
                          </Stack>
                        ) : (
                          <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.8125rem" }}>
                            —
                          </Typography>
                        )}
                      </TableCell>
                    )}
                    {activeTab === "rejected" && (
                      <>
                        <TableCell sx={{ color: "var(--font-secondary)" }}>
                          {formatDate(row.pending_reviewed_at)}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "var(--font-secondary)",
                            maxWidth: 260,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Tooltip title={row.pending_rejection_reason || ""}>
                            <span>{row.pending_rejection_reason?.trim() || "—"}</span>
                          </Tooltip>
                        </TableCell>
                      </>
                    )}
                    <TableCell align="right">{renderActions(row)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Approved-row actions menu */}
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
          <MenuItem
            onClick={() => {
              if (menuRow) {
                setPromoteRole("course_manager");
                setPromoteRow(menuRow);
              }
              closeMenu();
            }}
          >
            <IconWrapper icon="mdi:shield-account-outline" size={18} />
            <Box sx={{ ml: 1 }}>{t("adminInstructors.actions.promote")}</Box>
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (menuRow) setViewCoursesRow(menuRow);
              closeMenu();
            }}
          >
            <IconWrapper icon="mdi:book-open-variant" size={18} />
            <Box sx={{ ml: 1 }}>{t("adminInstructors.actions.viewCourses")}</Box>
          </MenuItem>
        </Menu>

        {/* Approve dialog */}
        <Dialog
          open={Boolean(confirmApproveRow)}
          onClose={() => busyId === null && setConfirmApproveRow(null)}
          PaperProps={{
            sx: { backgroundColor: "var(--card-bg)", borderRadius: 3 },
          }}
        >
          <DialogTitle
            sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 6 }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: STATUS_VISUAL.approved.tint,
                color: STATUS_VISUAL.approved.accent,
              }}
            >
              <IconWrapper icon="mdi:check-circle-outline" size={22} />
            </Box>
            {t("adminInstructors.confirm.approveTitle")}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
              {t("adminInstructors.confirm.approveBody", {
                name: confirmApproveRow?.full_name ?? "",
                email: confirmApproveRow?.email ?? "",
              })}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setConfirmApproveRow(null)}
              disabled={busyId !== null}
              sx={{ color: "var(--font-secondary)", textTransform: "none" }}
            >
              {t("adminInstructors.confirm.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleApproveConfirmed()}
              disabled={busyId !== null}
              sx={{
                backgroundColor: "var(--accent-indigo)",
                color: "var(--font-light)",
                textTransform: "none",
                "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
              }}
            >
              {busyId !== null
                ? t("adminInstructors.loading.approving")
                : t("adminInstructors.confirm.approveCta")}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reject dialog */}
        <Dialog
          open={Boolean(confirmRejectRow)}
          onClose={() => busyId === null && setConfirmRejectRow(null)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: { backgroundColor: "var(--card-bg)", borderRadius: 3 },
          }}
        >
          <DialogTitle
            sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 6 }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: STATUS_VISUAL.rejected.tint,
                color: STATUS_VISUAL.rejected.accent,
              }}
            >
              <IconWrapper icon="mdi:close-circle-outline" size={22} />
            </Box>
            {t("adminInstructors.confirm.rejectTitle")}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 2 }}>
              {t("adminInstructors.confirm.rejectBody", {
                name: confirmRejectRow?.full_name ?? "",
                email: confirmRejectRow?.email ?? "",
              })}
            </Typography>
            <TextField
              label={t("adminInstructors.confirm.reasonLabel")}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              disabled={busyId !== null}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setConfirmRejectRow(null)}
              disabled={busyId !== null}
              sx={{ color: "var(--font-secondary)", textTransform: "none" }}
            >
              {t("adminInstructors.confirm.cancel")}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => void handleRejectConfirmed()}
              disabled={busyId !== null}
              sx={{ textTransform: "none" }}
            >
              {busyId !== null
                ? t("adminInstructors.loading.rejecting")
                : t("adminInstructors.confirm.rejectCta")}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reopen dialog */}
        <Dialog
          open={Boolean(confirmReopenRow)}
          onClose={() => busyId === null && setConfirmReopenRow(null)}
          PaperProps={{
            sx: { backgroundColor: "var(--card-bg)", borderRadius: 3 },
          }}
        >
          <DialogTitle
            sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 6 }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: STATUS_VISUAL.pending.tint,
                color: STATUS_VISUAL.pending.accent,
              }}
            >
              <IconWrapper icon="mdi:refresh" size={22} />
            </Box>
            {t("adminInstructors.confirm.reopenTitle")}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
              {t("adminInstructors.confirm.reopenBody", {
                name: confirmReopenRow?.full_name ?? "",
                email: confirmReopenRow?.email ?? "",
              })}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setConfirmReopenRow(null)}
              disabled={busyId !== null}
              sx={{ color: "var(--font-secondary)", textTransform: "none" }}
            >
              {t("adminInstructors.confirm.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleReopenConfirmed()}
              disabled={busyId !== null}
              sx={{ textTransform: "none" }}
            >
              {busyId !== null
                ? t("adminInstructors.loading.reopening")
                : t("adminInstructors.confirm.reopenCta")}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Assign courses dialog */}
        <Dialog
          open={Boolean(assignRow)}
          onClose={() => busyId === null && setAssignRow(null)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: { backgroundColor: "var(--card-bg)", borderRadius: 3 },
          }}
        >
          <DialogTitle
            sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 6 }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  "color-mix(in srgb, var(--accent-indigo) 16%, var(--surface) 84%)",
                color: "var(--accent-indigo)",
              }}
            >
              <IconWrapper icon="mdi:book-plus-multiple-outline" size={22} />
            </Box>
            {t("adminInstructors.assignDialog.title", { name: assignRow?.full_name ?? "" })}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 2 }}>
              {t("adminInstructors.assignDialog.body")}
            </Typography>

            {coursesLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : allCourses.length === 0 ? (
              <Stack alignItems="center" spacing={1.5} sx={{ py: 4 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      "color-mix(in srgb, var(--accent-indigo) 8%, var(--surface) 92%)",
                    color: "var(--accent-indigo)",
                  }}
                >
                  <IconWrapper icon="mdi:book-off-outline" size={28} />
                </Box>
                <Typography sx={{ color: "var(--font-secondary)" }}>
                  {t("adminInstructors.assignDialog.noCourses")}
                </Typography>
              </Stack>
            ) : (
              <>
                <TextField
                  size="small"
                  fullWidth
                  placeholder={
                    t("adminInstructors.assignDialog.searchPlaceholder") as string
                  }
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  sx={{ mb: 1.5 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconWrapper icon="mdi:magnify" size={18} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 0.5,
                    pb: 0.5,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                    {t("adminInstructors.assignDialog.selectedCount", {
                      count: selectedCourseIds.length,
                    })}
                  </Typography>
                  <Button
                    size="small"
                    onClick={toggleAllFiltered}
                    sx={{ textTransform: "none" }}
                  >
                    {allFilteredSelected
                      ? t("adminInstructors.assignDialog.clearAll")
                      : t("adminInstructors.assignDialog.selectAll")}
                  </Button>
                </Box>
                <Divider sx={{ mb: 1 }} />
                <Stack
                  sx={{
                    maxHeight: 320,
                    overflowY: "auto",
                    "& .MuiFormControlLabel-root": {
                      m: 0,
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      "&:hover": {
                        backgroundColor:
                          "color-mix(in srgb, var(--accent-indigo) 6%, var(--surface) 94%)",
                      },
                    },
                  }}
                >
                  {filteredAssignCourses.length === 0 ? (
                    <Typography
                      sx={{
                        color: "var(--font-secondary)",
                        textAlign: "center",
                        py: 3,
                      }}
                    >
                      {t("adminInstructors.noMatch")}
                    </Typography>
                  ) : (
                    filteredAssignCourses.map((c) => {
                      const checked = selectedCourseIds.includes(c.id);
                      return (
                        <FormControlLabel
                          key={c.id}
                          control={
                            <Checkbox
                              checked={checked}
                              onChange={(_, v) => {
                                setSelectedCourseIds((prev) =>
                                  v
                                    ? [...prev, c.id]
                                    : prev.filter((id) => id !== c.id)
                                );
                              }}
                            />
                          }
                          label={
                            <ListItemText
                              primary={c.title}
                              primaryTypographyProps={{
                                sx: { color: "var(--font-primary)" },
                              }}
                            />
                          }
                        />
                      );
                    })
                  )}
                </Stack>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setAssignRow(null)}
              disabled={busyId !== null}
              sx={{ color: "var(--font-secondary)", textTransform: "none" }}
            >
              {t("adminInstructors.confirm.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleAssignSave()}
              disabled={busyId !== null || coursesLoading}
              sx={{
                backgroundColor: "var(--accent-indigo)",
                color: "var(--font-light)",
                textTransform: "none",
                "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
              }}
            >
              {busyId !== null
                ? t("adminInstructors.loading.assigning")
                : t("adminInstructors.assignDialog.save")}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Promote dialog */}
        <Dialog
          open={Boolean(promoteRow)}
          onClose={() => busyId === null && setPromoteRow(null)}
          fullWidth
          maxWidth="xs"
          PaperProps={{
            sx: { backgroundColor: "var(--card-bg)", borderRadius: 3 },
          }}
        >
          <DialogTitle
            sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 6 }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  "color-mix(in srgb, var(--accent-indigo) 16%, var(--surface) 84%)",
                color: "var(--accent-indigo)",
              }}
            >
              <IconWrapper icon="mdi:shield-account-outline" size={22} />
            </Box>
            {t("adminInstructors.confirm.promoteTitle", {
              name: promoteRow?.full_name ?? "",
            })}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 2 }}>
              {t("adminInstructors.confirm.promoteBody")}
            </Typography>
            <FormControl fullWidth>
              <RadioGroup
                value={promoteRole}
                onChange={(_, v) => setPromoteRole(v as PromoteRole)}
              >
                {[
                  { value: "course_manager", label: t("adminInstructors.confirm.promoteRoleCourseManager"), icon: "mdi:account-cog-outline" },
                  { value: "admin", label: t("adminInstructors.confirm.promoteRoleAdmin"), icon: "mdi:shield-crown-outline" },
                ].map((opt) => (
                  <Paper
                    key={opt.value}
                    variant="outlined"
                    sx={{
                      mb: 1,
                      px: 1.5,
                      py: 1,
                      borderRadius: 2,
                      borderColor:
                        promoteRole === opt.value
                          ? "var(--accent-indigo)"
                          : "var(--border-default)",
                      backgroundColor:
                        promoteRole === opt.value
                          ? "color-mix(in srgb, var(--accent-indigo) 6%, var(--card-bg) 94%)"
                          : "var(--card-bg)",
                    }}
                  >
                    <FormControlLabel
                      value={opt.value}
                      control={<Radio />}
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <IconWrapper icon={opt.icon} size={18} />
                          <Typography sx={{ fontWeight: 500, color: "var(--font-primary)" }}>
                            {opt.label}
                          </Typography>
                        </Box>
                      }
                      sx={{ width: "100%", m: 0 }}
                    />
                  </Paper>
                ))}
              </RadioGroup>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setPromoteRow(null)}
              disabled={busyId !== null}
              sx={{ color: "var(--font-secondary)", textTransform: "none" }}
            >
              {t("adminInstructors.confirm.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={() => void handlePromoteConfirmed()}
              disabled={busyId !== null}
              sx={{
                backgroundColor: "var(--accent-indigo)",
                color: "var(--font-light)",
                textTransform: "none",
                "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
              }}
            >
              {busyId !== null
                ? t("adminInstructors.loading.promoting")
                : t("adminInstructors.confirm.promoteCta")}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View courses dialog */}
        <Dialog
          open={Boolean(viewCoursesRow)}
          onClose={() => setViewCoursesRow(null)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: { backgroundColor: "var(--card-bg)", borderRadius: 3 },
          }}
        >
          <DialogTitle
            sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 6 }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  "color-mix(in srgb, var(--accent-indigo) 16%, var(--surface) 84%)",
                color: "var(--accent-indigo)",
              }}
            >
              <IconWrapper icon="mdi:book-open-variant" size={22} />
            </Box>
            {t("adminInstructors.viewCourses.title", {
              name: viewCoursesRow?.full_name ?? "",
            })}
          </DialogTitle>
          <DialogContent>
            {viewCoursesRow?.assigned_courses && viewCoursesRow.assigned_courses.length > 0 ? (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ rowGap: 0.5 }}>
                {viewCoursesRow.assigned_courses.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.title}
                    size="small"
                    sx={{
                      backgroundColor:
                        "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface) 90%)",
                      color: "var(--accent-indigo)",
                      fontWeight: 500,
                    }}
                  />
                ))}
              </Stack>
            ) : (
              <Stack alignItems="center" spacing={1.5} sx={{ py: 3 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      "color-mix(in srgb, var(--accent-indigo) 8%, var(--surface) 92%)",
                    color: "var(--accent-indigo)",
                  }}
                >
                  <IconWrapper icon="mdi:book-off-outline" size={28} />
                </Box>
                <Typography sx={{ color: "var(--font-secondary)" }}>
                  {t("adminInstructors.viewCourses.noCourses")}
                </Typography>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setViewCoursesRow(null)}
              sx={{ textTransform: "none" }}
            >
              {t("adminInstructors.confirm.cancel")}
            </Button>
          </DialogActions>
        </Dialog>
    </PageShell>
  );
}
