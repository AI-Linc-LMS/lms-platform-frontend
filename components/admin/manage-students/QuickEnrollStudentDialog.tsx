"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { adminStudentEnrollmentService } from "@/lib/services/admin/admin-student-enrollment.service";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";
import {
  adminAdaptiveCourseService,
  type AdminAdaptiveCourseListItem,
} from "@/lib/services/admin/admin-adaptive-course.service";
import { Course } from "@/lib/services/courses.service";

interface QuickEnrollStudentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** When set, enrolls into this one adaptive course (course-builder Students tab) - the course
   *  pickers are hidden and this is the fixed target. */
  lockedAdaptiveCourse?: { id: number; title: string };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function QuickEnrollStudentDialog({
  open,
  onClose,
  onSuccess,
  lockedAdaptiveCourse,
}: QuickEnrollStudentDialogProps) {
  const { showToast } = useToast();
  const { t } = useTranslation("common");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [adaptiveCourses, setAdaptiveCourses] = useState<AdminAdaptiveCourseListItem[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [selectedAdaptiveCourseIds, setSelectedAdaptiveCourseIds] = useState<number[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (open) {
      loadCourses();
    } else {
      // Reset on close
      setName("");
      setEmail("");
      setPhone("");
      setSelectedCourseIds([]);
      setSelectedAdaptiveCourseIds([]);
      setConfirmOpen(false);
      setSubmitting(false);
      setNameError("");
      setEmailError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadCourses = async () => {
    if (lockedAdaptiveCourse) return; // fixed target - no pickers needed
    try {
      setLoadingCourses(true);
      const raw = await adminCoursesService.getCourses();
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { results?: unknown[] })?.results)
          ? ((raw as { results: unknown[] }).results as unknown[])
          : [];
      setCourses(list as Course[]);
      try {
        setAdaptiveCourses(await adminAdaptiveCourseService.listCourses());
      } catch {
        setAdaptiveCourses([]);
      }
    } catch {
      showToast(t("adminManageStudents.failedToLoadCourses"), "error");
    } finally {
      setLoadingCourses(false);
    }
  };

  const validate = (): boolean => {
    const nErr = name.trim() ? "" : t("adminManageStudents.quickEnroll.nameRequired");
    const eErr = !email.trim()
      ? t("adminManageStudents.quickEnroll.emailRequired")
      : !EMAIL_RE.test(email.trim())
        ? t("adminManageStudents.quickEnroll.emailInvalid")
        : "";
    setNameError(nErr);
    setEmailError(eErr);
    return !nErr && !eErr;
  };

  const handleEnrollClick = () => {
    if (validate()) setConfirmOpen(true);
  };

  const doEnroll = async () => {
    setConfirmOpen(false);
    try {
      setSubmitting(true);
      const adaptiveIds = lockedAdaptiveCourse
        ? String(lockedAdaptiveCourse.id)
        : selectedAdaptiveCourseIds.join(",");
      const res = await adminStudentEnrollmentService.quickEnrollStudent({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        course_ids: lockedAdaptiveCourse ? "" : selectedCourseIds.join(","),
        adaptive_course_ids: adaptiveIds,
      });
      // Count every selected course the student now belongs to (newly enrolled + already enrolled),
      // so an idempotent re-enroll doesn't misreport "0 course(s)".
      const enrolledCount =
        res.legacy_enrolled.length +
        res.legacy_already_enrolled.length +
        res.adaptive_enrolled +
        res.adaptive_already_enrolled;
      const msg = res.created_account
        ? t("adminManageStudents.quickEnroll.successCreated", { name: name.trim(), count: enrolledCount })
        : t("adminManageStudents.quickEnroll.successExisting", { name: name.trim(), count: enrolledCount });
      showToast(msg, "success");
      onSuccess?.();
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : t("adminManageStudents.quickEnroll.failed"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const courseCount =
    (lockedAdaptiveCourse ? 1 : selectedAdaptiveCourseIds.length) + selectedCourseIds.length;

  return (
    <>
      <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {t("adminManageStudents.quickEnroll.title")}
          <IconButton onClick={onClose} disabled={submitting} size="small" aria-label="close">
            <IconWrapper icon="mdi:close" size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("adminManageStudents.quickEnroll.subtitle")}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label={t("adminManageStudents.quickEnroll.nameLabel")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!nameError}
              helperText={nameError}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label={t("adminManageStudents.quickEnroll.emailLabel")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!emailError}
              helperText={emailError}
              required
              fullWidth
            />
            <TextField
              label={t("adminManageStudents.quickEnroll.phoneLabel")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
            />

            {lockedAdaptiveCourse ? (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t("adminManageStudents.quickEnroll.enrollingInto")}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip label={lockedAdaptiveCourse.title} color="primary" variant="outlined" />
                </Box>
              </Box>
            ) : loadingCourses ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  {t("adminManageStudents.quickEnroll.loadingCourses")}
                </Typography>
              </Box>
            ) : (
              <>
                <FormControl fullWidth size="small">
                  <InputLabel>{t("adminManageStudents.quickEnroll.coursesLabel")}</InputLabel>
                  <Select
                    multiple
                    value={selectedCourseIds}
                    label={t("adminManageStudents.quickEnroll.coursesLabel")}
                    onChange={(e) => setSelectedCourseIds(e.target.value as number[])}
                    renderValue={(ids) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {(ids as number[]).map((id) => (
                          <Chip
                            key={id}
                            size="small"
                            label={courses.find((c) => c.id === id)?.title || `Course ${id}`}
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {courses.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {adaptiveCourses.length > 0 && (
                  <FormControl fullWidth size="small">
                    <InputLabel>{t("adminManageStudents.quickEnroll.adaptiveCoursesLabel")}</InputLabel>
                    <Select
                      multiple
                      value={selectedAdaptiveCourseIds}
                      label={t("adminManageStudents.quickEnroll.adaptiveCoursesLabel")}
                      onChange={(e) => setSelectedAdaptiveCourseIds(e.target.value as number[])}
                      renderValue={(ids) => (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {(ids as number[]).map((id) => (
                            <Chip
                              key={id}
                              size="small"
                              label={adaptiveCourses.find((c) => c.id === id)?.title || `Adaptive ${id}`}
                            />
                          ))}
                        </Box>
                      )}
                    >
                      {adaptiveCourses.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                <Typography variant="caption" color="text.secondary">
                  {t("adminManageStudents.quickEnroll.coursesOptionalHint")}
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting} color="inherit">
            {t("adminManageStudents.cancel")}
          </Button>
          <Button onClick={handleEnrollClick} disabled={submitting} variant="contained">
            {submitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("adminManageStudents.quickEnroll.enrollAction")
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title={t("adminManageStudents.quickEnroll.confirmTitle")}
        message={t("adminManageStudents.quickEnroll.confirmMessage", {
          name: name.trim(),
          email: email.trim(),
          count: courseCount,
        })}
        confirmText={t("adminManageStudents.quickEnroll.enrollAction")}
        cancelText={t("adminManageStudents.cancel")}
        onConfirm={doEnroll}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
