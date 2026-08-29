"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminInstructorsService,
  type CreateInstructorConflict,
} from "@/lib/services/admin/admin-instructors.service";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";
import {
  adminAdaptiveCourseService,
  type AdminAdaptiveCourseListItem,
} from "@/lib/services/admin/admin-adaptive-course.service";
import { Course } from "@/lib/services/courses.service";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AddInstructorDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function conflictOf(e: unknown): CreateInstructorConflict | null {
  const body = (e as { response?: { status?: number; data?: unknown } })?.response;
  if (body?.status !== 409) return null;
  const data = body.data as CreateInstructorConflict | undefined;
  return data?.reason ? data : null;
}

export function AddInstructorDialog({ open, onClose, onSuccess }: AddInstructorDialogProps) {
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [adaptiveCourses, setAdaptiveCourses] = useState<AdminAdaptiveCourseListItem[]>([]);
  const [courseIds, setCourseIds] = useState<number[]>([]);
  const [adaptiveIds, setAdaptiveIds] = useState<number[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  // A 409 the admin can act on, kept on screen rather than flashed as a toast: the whole point is
  // that they read which of the five situations they are in before deciding.
  const [conflict, setConflict] = useState<CreateInstructorConflict | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setPhone("");
      setCourseIds([]);
      setAdaptiveIds([]);
      setNameError("");
      setEmailError("");
      setConflict(null);
      setSubmitting(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingCourses(true);
      try {
        const raw = await adminCoursesService.getCourses();
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray((raw as { results?: unknown[] })?.results)
            ? ((raw as { results: unknown[] }).results as unknown[])
            : [];
        if (!cancelled) setCourses(list as Course[]);
      } catch {
        if (!cancelled) setCourses([]);
      }
      try {
        const adaptive = await adminAdaptiveCourseService.listCourses();
        if (!cancelled) setAdaptiveCourses(adaptive);
      } catch {
        if (!cancelled) setAdaptiveCourses([]);
      }
      if (!cancelled) setLoadingCourses(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const submit = async (promoteExisting = false) => {
    const nErr = name.trim() ? "" : "Enter their name.";
    const eErr = !email.trim()
      ? "Enter their email."
      : !EMAIL_RE.test(email.trim())
        ? "That does not look like an email address."
        : "";
    setNameError(nErr);
    setEmailError(eErr);
    if (nErr || eErr) return;

    setSubmitting(true);
    setConflict(null);
    try {
      const res = await adminInstructorsService.createInstructor({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        course_ids: courseIds,
        adaptive_course_ids: adaptiveIds,
        ...(promoteExisting ? { promote_existing: true } : {}),
      });
      showToast(
        res.invite_email_sent
          ? `${res.detail} We emailed them how to sign in.`
          : res.detail,
        "success"
      );
      onSuccess?.();
      onClose();
    } catch (e) {
      const c = conflictOf(e);
      if (c) {
        setConflict(c);
      } else {
        const detail =
          ((e as { response?: { data?: { error?: string; detail?: string } } })?.response?.data
            ?.error) ??
          ((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail) ??
          (e instanceof Error ? e.message : "Could not create the instructor.");
        showToast(detail, "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        Add an instructor
        <IconButton onClick={onClose} disabled={submitting} size="small" aria-label="close">
          <IconWrapper icon="mdi:close" size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Creates an approved instructor account straight away, so they do not have to sign up and
          wait for review. You never set their password: they will get an email telling them to use
          Forgot password the first time they sign in.
        </Typography>

        {conflict && (
          <Alert
            severity={conflict.can_promote ? "warning" : "info"}
            sx={{ mb: 2 }}
            action={
              conflict.can_promote ? (
                <Button
                  color="inherit"
                  size="small"
                  disabled={submitting}
                  onClick={() => submit(true)}
                >
                  Make them an instructor
                </Button>
              ) : undefined
            }
          >
            {conflict.error}
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!nameError}
            helperText={nameError}
            required
            fullWidth
            autoFocus
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setConflict(null); // a different address is a different question
            }}
            error={!!emailError}
            helperText={emailError}
            required
            fullWidth
          />
          <TextField
            label="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
          />

          {loadingCourses ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Loading courses…
              </Typography>
            </Box>
          ) : (
            <>
              {courses.length > 0 && (
                <FormControl fullWidth size="small">
                  <InputLabel>Courses to teach</InputLabel>
                  <Select
                    multiple
                    value={courseIds}
                    label="Courses to teach"
                    onChange={(e) => setCourseIds(e.target.value as number[])}
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
              )}
              {adaptiveCourses.length > 0 && (
                <FormControl fullWidth size="small">
                  <InputLabel>Adaptive courses to teach</InputLabel>
                  <Select
                    multiple
                    value={adaptiveIds}
                    label="Adaptive courses to teach"
                    onChange={(e) => setAdaptiveIds(e.target.value as number[])}
                    renderValue={(ids) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {(ids as number[]).map((id) => (
                          <Chip
                            key={id}
                            size="small"
                            label={
                              adaptiveCourses.find((c) => c.id === id)?.title || `Adaptive ${id}`
                            }
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
                Courses are optional — you can assign them later from this page.
              </Typography>
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          Cancel
        </Button>
        <Button onClick={() => submit(false)} disabled={submitting} variant="contained">
          {submitting ? <CircularProgress size={20} color="inherit" /> : "Add instructor"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
