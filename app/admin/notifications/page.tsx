"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Checkbox,
  ListItemText,
  OutlinedInput,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  InputAdornment,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { config } from "@/lib/config";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import {
  adminNotificationService,
  SendNotificationPayload,
} from "@/lib/services/admin/admin-notification.service";
import {
  adminStudentService,
  Student,
} from "@/lib/services/admin/admin-student.service";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";

type TargetType = "individual" | "course" | "client";

interface CourseOption {
  id: number;
  title: string;
}

const QUICK_LINKS = [
  { label: "Dashboard", url: "/dashboard" },
  { label: "Courses", url: "/courses" },
  { label: "Jobs", url: "/jobs-v2" },
  { label: "Assessments", url: "/assessments" },
  { label: "Community", url: "/community" },
  { label: "Profile", url: "/profile" },
];

export default function AdminNotificationsPage() {
  const { showToast } = useToast();
  const { clientInfo } = useClientInfo();
  const clientId = clientInfo?.id ?? config.clientId;

  const [targetType, setTargetType] = useState<TargetType>("individual");
  const [studentIds, setStudentIds] = useState<number[]>([]);
  const [courseId, setCourseId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [sending, setSending] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const res = await adminStudentService.getManageStudents({
        page: 1,
        limit: 500,
      });
      setStudents(res.students || []);
    } catch {
      setStudents([]);
      showToast("Failed to load students", "error");
    } finally {
      setLoadingStudents(false);
    }
  }, [showToast]);

  const loadCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const data = await adminCoursesService.getCourses({ limit: 200 });
      const list = Array.isArray(data) ? data : (data as { results?: CourseOption[] }).results || [];
      setCourses(
        list.map((c: { id: number; title: string }) => ({
          id: c.id,
          title: c.title || `Course ${c.id}`,
        }))
      );
    } catch {
      setCourses([]);
      showToast("Failed to load courses", "error");
    } finally {
      setLoadingCourses(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (targetType === "individual") {
      loadStudents();
    } else if (targetType === "course") {
      loadCourses();
    }
  }, [targetType, loadStudents, loadCourses]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      showToast("Title is required", "error");
      return;
    }
    if (!message.trim()) {
      showToast("Message is required", "error");
      return;
    }
    if (targetType === "individual" && studentIds.length === 0) {
      showToast("Select at least one student", "error");
      return;
    }
    if (targetType === "course" && !courseId) {
      showToast("Select a course", "error");
      return;
    }

    setSending(true);
    try {
      const payload: SendNotificationPayload = {
        target_type: targetType,
        title: title.trim(),
        message: message.trim(),
      };
      if (actionUrl.trim()) {
        payload.action_url = actionUrl.trim();
      }
      if (targetType === "individual") {
        payload.student_ids = studentIds;
      } else if (targetType === "course") {
        payload.course_id = Number(courseId);
      }

      const result = await adminNotificationService.sendCustomNotification(
        clientId,
        payload
      );
      showToast(result.message || "Notification sent successfully", "success");
      setTitle("");
      setMessage("");
      setActionUrl("");
      setStudentIds([]);
      setCourseId("");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to send notification",
        "error"
      );
    } finally {
      setSending(false);
    }
  };

  const handleSelectAllStudents = () => {
    if (studentIds.length === students.length) {
      setStudentIds([]);
    } else {
      setStudentIds(students.map((s) => s.id));
    }
  };

  const recipientLabel =
    targetType === "individual"
      ? `${studentIds.length} student${studentIds.length !== 1 ? "s" : ""} selected`
      : targetType === "course"
        ? courseId
          ? `All students in "${courses.find((c) => c.id === courseId)?.title || "course"}"`
          : "Select a course"
        : "All students in client";

  const canSubmit =
    title.trim() &&
    message.trim() &&
    (targetType === "client" ||
      (targetType === "individual" && studentIds.length > 0) ||
      (targetType === "course" && courseId));

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 720, mx: "auto" }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
            mb: 3,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              backgroundColor: "rgba(99, 102, 241, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconWrapper icon="mdi:bell-badge" size={28} color="#6366f1" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary" }}>
              Send Custom Notification
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mt: 0.5, lineHeight: 1.5 }}
            >
              Send in-app notifications to students. Choose individual students, all
              students in a course, or all students in the client.
            </Typography>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {/* Target type selector */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: "text.secondary" }}>
            Recipients
          </Typography>
          <ToggleButtonGroup
            value={targetType}
            exclusive
            onChange={(_, v) => v && setTargetType(v)}
            sx={{
              mb: 2,
              "& .MuiToggleButtonGroup-grouped": {
                border: "1px solid",
                borderColor: "divider",
                textTransform: "none",
                fontWeight: 500,
              },
              "& .Mui-selected": {
                backgroundColor: "rgba(99, 102, 241, 0.12) !important",
                color: "#6366f1",
                borderColor: "#6366f1",
              },
            }}
          >
            <ToggleButton value="individual">
              <Box component="span" sx={{ mr: 0.75, display: "inline-flex" }}>
                <IconWrapper icon="mdi:account" size={18} />
              </Box>
              Individual
            </ToggleButton>
            <ToggleButton value="course">
              <Box component="span" sx={{ mr: 0.75, display: "inline-flex" }}>
                <IconWrapper icon="mdi:book-open-variant" size={18} />
              </Box>
              By course
            </ToggleButton>
            <ToggleButton value="client">
              <Box component="span" sx={{ mr: 0.75, display: "inline-flex" }}>
                <IconWrapper icon="mdi:domain" size={18} />
              </Box>
              All in client
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Recipient count chip */}
          <Box sx={{ mb: 2 }}>
            <Chip
              label={recipientLabel}
              size="small"
              sx={{
                backgroundColor: "rgba(99, 102, 241, 0.08)",
                color: "#6366f1",
                fontWeight: 500,
              }}
            />
          </Box>

          {targetType === "individual" && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Students</InputLabel>
              <Select
                multiple
                value={studentIds}
                onChange={(e) => {
                  const v = e.target.value;
                  setStudentIds(typeof v === "string" ? [] : (v as number[]));
                }}
                input={
                  <OutlinedInput
                    label="Students"
                    endAdornment={
                      loadingStudents ? (
                        <InputAdornment position="end">
                          <CircularProgress size={20} />
                        </InputAdornment>
                      ) : null
                    }
                  />
                }
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.length === 0
                      ? "Select students"
                      : selected.length <= 3
                        ? selected.map((id) => {
                            const s = students.find((x) => x.id === id);
                            return (
                              <Chip
                                key={id}
                                label={s?.name || s?.email || `#${id}`}
                                size="small"
                                sx={{ height: 24 }}
                              />
                            );
                          })
                        : `${selected.length} students selected`}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    sx: { maxHeight: 320 },
                  },
                }}
              >
                <MenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelectAllStudents();
                  }}
                  dense
                >
                  <Checkbox
                    checked={
                      students.length > 0 && studentIds.length === students.length
                    }
                    indeterminate={
                      studentIds.length > 0 && studentIds.length < students.length
                    }
                  />
                  <ListItemText primary="Select all" />
                </MenuItem>
                {loadingStudents ? (
                  <MenuItem disabled>
                    <CircularProgress size={24} sx={{ mx: "auto" }} />
                  </MenuItem>
                ) : students.length === 0 ? (
                  <MenuItem disabled>
                    <ListItemText primary="No students found" />
                  </MenuItem>
                ) : (
                  students.map((s) => (
                    <MenuItem key={s.id} value={s.id} dense>
                      <Checkbox checked={studentIds.includes(s.id)} />
                      <ListItemText
                        primary={s.name || `${s.first_name} ${s.last_name}`}
                        secondary={s.email}
                        primaryTypographyProps={{ fontSize: "0.875rem" }}
                        secondaryTypographyProps={{ fontSize: "0.75rem" }}
                      />
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          )}

          {targetType === "course" && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Course</InputLabel>
              <Select
                value={courseId}
                label="Course"
                onChange={(e) => setCourseId(e.target.value as number | "")}
                disabled={loadingCourses}
              >
                <MenuItem value="">
                  <em>Select a course</em>
                </MenuItem>
                {courses.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: "text.secondary" }}>
              Notification content
            </Typography>

            <TextField
              fullWidth
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New course available"
              sx={{ mb: 2 }}
              required
              inputProps={{ maxLength: 100 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="caption" color="text.disabled">
                      {title.length}/100
                    </Typography>
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ mb: 2, position: "relative" }}>
              <TextField
                fullWidth
                label="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your notification message..."
                multiline
                rows={4}
                required
                inputProps={{ maxLength: 500 }}
              />
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ position: "absolute", bottom: 8, right: 14 }}
              >
                {message.length}/500
              </Typography>
            </Box>
            <TextField
              fullWidth
              label="Action URL (optional)"
              placeholder="/courses/123 or /jobs-v2"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              sx={{ mb: 1 }}
              helperText="Link to open when user clicks the notification"
              InputProps={{
                startAdornment: actionUrl ? (
                  <InputAdornment position="start">
                    <IconWrapper icon="mdi:link" size={18} color="text.disabled" />
                  </InputAdornment>
                ) : null,
              }}
            />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1 }}>
              {QUICK_LINKS.map((link) => (
                <Chip
                  key={link.url}
                  label={link.label}
                  size="small"
                  onClick={() => setActionUrl(link.url)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.12)" },
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Preview */}
          {title && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 2,
                backgroundColor: "rgba(99, 102, 241, 0.04)",
                borderColor: "rgba(99, 102, 241, 0.2)",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", mb: 0.5 }}>
                Preview
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                {message || "No message"}
              </Typography>
            </Paper>
          )}

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={sending || !canSubmit}
            startIcon={
              sending ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <IconWrapper icon="mdi:send" size={18} />
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 1.25,
              borderRadius: 2,
              backgroundColor: "#6366f1",
              "&:hover": { backgroundColor: "#4f46e5" },
            }}
          >
            {sending ? "Sending..." : "Send Notification"}
          </Button>
        </Paper>
      </Box>
    </MainLayout>
  );
}
