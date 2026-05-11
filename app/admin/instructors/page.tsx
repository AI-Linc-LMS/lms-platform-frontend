"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Typography,
  Checkbox,
  ListItemText,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
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

export default function InstructorsPage() {
  const { t } = useTranslation("common");
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<InstructorListStatus>("pending");
  const [rows, setRows] = useState<InstructorRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [busyId, setBusyId] = useState<number | null>(null);

  const [confirmApproveRow, setConfirmApproveRow] = useState<InstructorRow | null>(null);
  const [confirmRejectRow, setConfirmRejectRow] = useState<InstructorRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmReopenRow, setConfirmReopenRow] = useState<InstructorRow | null>(null);

  const [assignRow, setAssignRow] = useState<InstructorRow | null>(null);
  const [allCourses, setAllCourses] = useState<CourseOption[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);

  const [promoteRow, setPromoteRow] = useState<InstructorRow | null>(null);
  const [promoteRole, setPromoteRole] = useState<PromoteRole>("course_manager");

  const [viewCoursesRow, setViewCoursesRow] = useState<InstructorRow | null>(null);

  const [menuRow, setMenuRow] = useState<InstructorRow | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const load = useCallback(
    async (status: InstructorListStatus = activeTab) => {
      try {
        setLoading(true);
        const data = await adminInstructorsService.listInstructors(status);
        setRows(data);
      } catch (err: unknown) {
        showToast(readApiError(err, t("adminInstructors.errors.loadFailed")), "error");
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, showToast, t]
  );

  useEffect(() => {
    void load(activeTab);
  }, [load, activeTab]);

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
      await load();
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
      const res = await adminInstructorsService.rejectInstructor(row.id, rejectReason || undefined);
      showToast(res.detail || t("adminInstructors.toasts.rejected"), "success");
      setConfirmRejectRow(null);
      setRejectReason("");
      await load();
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
      await load();
    } catch (err: unknown) {
      showToast(readApiError(err, t("adminInstructors.errors.reopenFailed")), "error");
    } finally {
      setBusyId(null);
    }
  };

  const openAssignDialog = async (row: InstructorRow) => {
    setAssignRow(row);
    setSelectedCourseIds((row.assigned_courses ?? []).map((c) => c.id));
    closeMenu();
    if (allCourses.length === 0) {
      await refreshCourses();
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
      await load();
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
      await load();
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
            onClick={() => setConfirmApproveRow(row)}
            sx={{
              textTransform: "none",
              backgroundColor: "var(--accent-indigo)",
              color: "var(--font-light)",
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
            onClick={() => {
              setRejectReason("");
              setConfirmRejectRow(row);
            }}
            sx={{ textTransform: "none" }}
            color="error"
          >
            {t("adminInstructors.actions.reject")}
          </Button>
        </Stack>
      );
    }
    if (activeTab === "approved") {
      return (
        <IconButton size="small" onClick={(e) => openMenu(row, e.currentTarget)}>
          <IconWrapper icon="mdi:dots-vertical" size={20} />
        </IconButton>
      );
    }
    return (
      <Button
        size="small"
        variant="outlined"
        disabled={busyId === row.id}
        onClick={() => setConfirmReopenRow(row)}
        sx={{ textTransform: "none" }}
      >
        {t("adminInstructors.actions.reopen")}
      </Button>
    );
  };

  const columns = useMemo(() => {
    const cols = [
      t("adminInstructors.columns.email"),
      t("adminInstructors.columns.fullName"),
      t("adminInstructors.columns.phone"),
      t("adminInstructors.columns.createdAt"),
    ];
    if (activeTab === "approved") cols.push(t("adminInstructors.columns.assignedCourses"));
    if (activeTab === "rejected") {
      cols.push(t("adminInstructors.columns.reviewedAt"));
      cols.push(t("adminInstructors.columns.rejectionReason"));
    }
    cols.push(t("adminInstructors.columns.actions"));
    return cols;
  }, [activeTab, t]);

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: "var(--font-primary)" }}>
          {t("adminInstructors.title")}
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: "var(--font-secondary)" }}>
          {t("adminInstructors.subtitle")}
        </Typography>

        <Tabs
          value={activeTab}
          onChange={(_, v: InstructorListStatus) => setActiveTab(v)}
          sx={{ mb: 2, borderBottom: "1px solid var(--border-default)" }}
        >
          {STATUS_TABS.map((s) => (
            <Tab key={s} value={s} label={t(`adminInstructors.tabs.${s}`)} />
          ))}
        </Tabs>

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
            <TableHead sx={{ backgroundColor: "var(--surface)" }}>
              <TableRow>
                {columns.map((c, i) => (
                  <TableCell
                    key={c + i}
                    align={i === columns.length - 1 ? "right" : "left"}
                    sx={{ color: "var(--font-primary)", fontWeight: 600 }}
                  >
                    {c}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                    <Typography sx={{ color: "var(--font-secondary)" }}>
                      {t(`adminInstructors.empty.${activeTab}`)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{
                      "& td": { borderColor: "var(--border-default)" },
                      "&:hover": {
                        backgroundColor:
                          "color-mix(in srgb, var(--surface) 80%, var(--background) 20%)",
                      },
                    }}
                  >
                    <TableCell sx={{ color: "var(--font-primary)" }}>{row.email}</TableCell>
                    <TableCell sx={{ color: "var(--font-primary)" }}>{row.full_name}</TableCell>
                    <TableCell sx={{ color: "var(--font-secondary)" }}>
                      {row.phone_number || "—"}
                    </TableCell>
                    <TableCell sx={{ color: "var(--font-secondary)" }}>
                      {formatDate(row.created_at)}
                    </TableCell>
                    {activeTab === "approved" && (
                      <TableCell sx={{ color: "var(--font-secondary)" }}>
                        {row.assigned_courses && row.assigned_courses.length > 0 ? (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {row.assigned_courses.slice(0, 3).map((c) => (
                              <Chip key={c.id} label={c.title} size="small" />
                            ))}
                            {row.assigned_courses.length > 3 && (
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`+${row.assigned_courses.length - 3}`}
                              />
                            )}
                          </Stack>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    )}
                    {activeTab === "rejected" && (
                      <>
                        <TableCell sx={{ color: "var(--font-secondary)" }}>
                          {formatDate(row.pending_reviewed_at)}
                        </TableCell>
                        <TableCell sx={{ color: "var(--font-secondary)" }}>
                          {row.pending_rejection_reason?.trim() || "—"}
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
              if (menuRow) void openAssignDialog(menuRow);
            }}
          >
            {t("adminInstructors.actions.assignCourses")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (menuRow) {
                setPromoteRole("course_manager");
                setPromoteRow(menuRow);
              }
              closeMenu();
            }}
          >
            {t("adminInstructors.actions.promote")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (menuRow) setViewCoursesRow(menuRow);
              closeMenu();
            }}
          >
            {t("adminInstructors.actions.viewCourses")}
          </MenuItem>
        </Menu>

        {/* Approve dialog */}
        <Dialog
          open={Boolean(confirmApproveRow)}
          onClose={() => busyId === null && setConfirmApproveRow(null)}
          PaperProps={{ sx: { backgroundColor: "var(--card-bg)" } }}
        >
          <DialogTitle>{t("adminInstructors.confirm.approveTitle")}</DialogTitle>
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
              sx={{ color: "var(--font-secondary)" }}
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
          PaperProps={{ sx: { backgroundColor: "var(--card-bg)" } }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>{t("adminInstructors.confirm.rejectTitle")}</DialogTitle>
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
              sx={{ color: "var(--font-secondary)" }}
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
          PaperProps={{ sx: { backgroundColor: "var(--card-bg)" } }}
        >
          <DialogTitle>{t("adminInstructors.confirm.reopenTitle")}</DialogTitle>
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
              sx={{ color: "var(--font-secondary)" }}
            >
              {t("adminInstructors.confirm.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleReopenConfirmed()}
              disabled={busyId !== null}
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
          PaperProps={{ sx: { backgroundColor: "var(--card-bg)" } }}
        >
          <DialogTitle>
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
              <Typography sx={{ color: "var(--font-secondary)", py: 2 }}>
                {t("adminInstructors.assignDialog.noCourses")}
              </Typography>
            ) : (
              <Stack sx={{ maxHeight: 320, overflowY: "auto" }}>
                {allCourses.map((c) => {
                  const checked = selectedCourseIds.includes(c.id);
                  return (
                    <FormControlLabel
                      key={c.id}
                      control={
                        <Checkbox
                          checked={checked}
                          onChange={(_, v) => {
                            setSelectedCourseIds((prev) =>
                              v ? [...prev, c.id] : prev.filter((id) => id !== c.id)
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
                })}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setAssignRow(null)}
              disabled={busyId !== null}
              sx={{ color: "var(--font-secondary)" }}
            >
              {t("adminInstructors.confirm.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleAssignSave()}
              disabled={busyId !== null || coursesLoading}
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
          PaperProps={{ sx: { backgroundColor: "var(--card-bg)" } }}
        >
          <DialogTitle>
            {t("adminInstructors.confirm.promoteTitle", { name: promoteRow?.full_name ?? "" })}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 2 }}>
              {t("adminInstructors.confirm.promoteBody")}
            </Typography>
            <FormControl>
              <RadioGroup
                value={promoteRole}
                onChange={(_, v) => setPromoteRole(v as PromoteRole)}
              >
                <FormControlLabel
                  value="course_manager"
                  control={<Radio />}
                  label={t("adminInstructors.confirm.promoteRoleCourseManager")}
                />
                <FormControlLabel
                  value="admin"
                  control={<Radio />}
                  label={t("adminInstructors.confirm.promoteRoleAdmin")}
                />
              </RadioGroup>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setPromoteRow(null)}
              disabled={busyId !== null}
              sx={{ color: "var(--font-secondary)" }}
            >
              {t("adminInstructors.confirm.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={() => void handlePromoteConfirmed()}
              disabled={busyId !== null}
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
          PaperProps={{ sx: { backgroundColor: "var(--card-bg)" } }}
        >
          <DialogTitle>
            {t("adminInstructors.viewCourses.title", { name: viewCoursesRow?.full_name ?? "" })}
          </DialogTitle>
          <DialogContent>
            {viewCoursesRow?.assigned_courses && viewCoursesRow.assigned_courses.length > 0 ? (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {viewCoursesRow.assigned_courses.map((c) => (
                  <Chip key={c.id} label={c.title} size="small" />
                ))}
              </Stack>
            ) : (
              <Typography sx={{ color: "var(--font-secondary)", py: 2 }}>
                {t("adminInstructors.viewCourses.noCourses")}
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setViewCoursesRow(null)}>
              {t("adminInstructors.confirm.cancel")}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}
