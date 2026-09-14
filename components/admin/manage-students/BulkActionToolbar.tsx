"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  ListItemText,
  MenuItem,
  TextField,
  CircularProgress,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { adminStudentService, Student } from "@/lib/services/admin/admin-student.service";
import { PAID_COURSE_NEEDS_COMP } from "@/lib/services/admin/admin-adaptive-course.service";

interface BulkActionToolbarProps {
  selected: Student[];
  courses: Array<{ id: number; title: string }>;
  /** Adaptive courses available for bulk enroll/unenroll (optional). */
  adaptiveCourses?: Array<{ id: number; title: string }>;
  onClear: () => void;
  /** Called after a successful bulk operation so the parent can refresh + clear. */
  onDone: () => void;
}

type CourseDialogMode = "enroll" | "unenroll" | null;
type ConfirmMode = "deactivate" | "activate" | "reset" | null;

const INDIGO = "#6366f1";

export function BulkActionToolbar({
  selected,
  courses,
  adaptiveCourses = [],
  onClear,
  onDone,
}: BulkActionToolbarProps) {
  const { showToast } = useToast();
  const [courseDialog, setCourseDialog] = useState<CourseDialogMode>(null);
  const [confirm, setConfirm] = useState<ConfirmMode>(null);
  const [pickedCourses, setPickedCourses] = useState<number[]>([]);
  const [pickedAdaptiveCourses, setPickedAdaptiveCourses] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  // Paid adaptive courses the bulk enrol was refused on, waiting on the admin's "give it free?".
  // Held HERE, before onDone: onDone clears the selection, and with no selection this toolbar
  // returns null, which would unmount the prompt along with it.
  const [compAsk, setCompAsk] = useState<{
    /** The refused PAIRS, grouped by course: only these are retried with a comp. Retrying every
     *  refused learner against every refused course comped pairs nobody was refused on. */
    byCourse: Array<{ adaptiveId: number; studentIds: number[] }>;
    learnerCount: number;
    enrolledSoFar: number;
    /** First-pass failures that were not paid refusals. Reported in the final toast. */
    otherFailed: number;
  } | null>(null);

  const studentIds = useMemo(() => selected.map((s) => s.id), [selected]);
  const count = selected.length;

  const closeCourseDialog = () => {
    setCourseDialog(null);
    setPickedCourses([]);
    setPickedAdaptiveCourses([]);
  };

  const runCourseAction = async () => {
    if (!courseDialog || pickedCourses.length + pickedAdaptiveCourses.length === 0) return;
    try {
      setBusy(true);
      const res = await adminStudentService.bulkCourseAction(
        courseDialog,
        studentIds,
        pickedCourses,
        pickedAdaptiveCourses
      );
      const paidRefusals =
        courseDialog === "enroll" ? res.results.filter((r) => r.code === PAID_COURSE_NEEDS_COMP) : [];
      if (paidRefusals.length > 0) {
        // Ask before refreshing: see compAsk. Everything else in this batch has already landed.
        const byCourse = new Map<number, number[]>();
        for (const r of paidRefusals) {
          if (typeof r.adaptive_course_id !== "number") continue;
          byCourse.set(r.adaptive_course_id, [...(byCourse.get(r.adaptive_course_id) ?? []), r.student_id]);
        }
        setCompAsk({
          byCourse: Array.from(byCourse, ([adaptiveId, ids]) => ({ adaptiveId, studentIds: ids })),
          learnerCount: new Set(paidRefusals.map((r) => r.student_id)).size,
          enrolledSoFar: res.succeeded,
          otherFailed: Math.max(0, res.failed - paidRefusals.length),
        });
        setCourseDialog(null);
        return;
      }
      showToast(
        `${courseDialog === "enroll" ? "Enrolled" : "Unenrolled"}: ${res.succeeded} ok${
          res.failed ? `, ${res.failed} failed` : ""
        }`,
        res.failed ? "warning" : "success"
      );
      closeCourseDialog();
      onDone();
    } catch (e: unknown) {
      showToast(
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Bulk action failed",
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

  const finishComp = async (give: boolean) => {
    const ask = compAsk;
    if (!ask) return;
    setCompAsk(null);
    const others = ask.otherFailed ? `, ${ask.otherFailed} failed for other reasons` : "";
    if (!give) {
      const plural = ask.byCourse.length > 1;
      showToast(
        `Enrolled ${ask.enrolledSoFar}${others}. The paid course${plural ? "s were" : " was"} not given to learners who haven't bought ${plural ? "them" : "it"}.`,
        ask.otherFailed ? "warning" : "info"
      );
      closeCourseDialog();
      onDone();
      return;
    }
    let comped = 0;
    let compFailed = 0;
    try {
      setBusy(true);
      // One request per course, carrying only the learners refused on THAT course.
      for (const group of ask.byCourse) {
        const res = await adminStudentService.bulkCourseAction("enroll", group.studentIds, [], [group.adaptiveId], {
          compPaid: true,
        });
        comped += res.succeeded;
        compFailed += res.failed;
      }
      const failures = compFailed + ask.otherFailed;
      showToast(
        `Enrolled ${ask.enrolledSoFar + comped} (${comped} free of charge)${failures ? `, ${failures} failed` : ""}`,
        failures ? "warning" : "success"
      );
    } catch (e: unknown) {
      // Each learner is applied on its own server-side, so a failed request can still have given
      // some of them the course. Say so rather than promising nothing changed.
      showToast(
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          `Couldn't confirm free access for everyone${comped ? ` (${comped} confirmed)` : ""}. Some learners may already have it. Refresh to check.`,
        "error"
      );
    } finally {
      setBusy(false);
      closeCourseDialog();
      onDone();
    }
  };

  const runConfirmAction = async () => {
    if (!confirm) return;
    try {
      setBusy(true);
      const tasks = selected.map((s) => {
        if (confirm === "activate") return adminStudentService.activateStudent(s.id);
        if (confirm === "deactivate") return adminStudentService.deactivateStudent(s.id);
        return adminStudentService.manageStudentAction(s.id, "reset_progress");
      });
      const results = await Promise.allSettled(tasks);
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - ok;
      showToast(
        `${ok} updated${failed ? `, ${failed} failed` : ""}`,
        failed ? "warning" : "success"
      );
      setConfirm(null);
      onDone();
    } catch {
      showToast("Bulk action failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const exportSelected = () => {
    const headers = ["Name", "Email", "Status", "Enrollments", "Most active course"];
    const escape = (v: string | number) => {
      const s = String(v ?? "");
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = selected.map((s) =>
      [
        escape(s.name ?? ""),
        escape(s.email ?? ""),
        s.is_active ? "Active" : "Inactive",
        escape(s.enrollment_count ?? 0),
        escape(s.most_active_course ?? ""),
      ].join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `selected-students-${count}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (count === 0) return null;

  const actionBtnSx = {
    fontWeight: 700,
    textTransform: "none" as const,
    borderRadius: 999,
    color: "#fff",
    borderColor: "rgba(255,255,255,0.4)",
  };

  return (
    <>
      <Box
        sx={{
          position: "sticky",
          top: 12,
          zIndex: 5,
          mb: 2,
          px: 2,
          py: 1.25,
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
          background: "linear-gradient(135deg,#6366f1 0%,#a855f7 60%,#ec4899 100%)",
          boxShadow: "0 18px 36px -16px rgba(99,102,241,0.55)",
        }}
      >
        <Typography sx={{ color: "#fff", fontWeight: 800, mr: 0.5 }}>
          {count} selected
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<IconWrapper icon="mdi:account-plus" size={18} />}
          onClick={() => setCourseDialog("enroll")}
          sx={actionBtnSx}
        >
          Enroll to course
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<IconWrapper icon="mdi:account-minus" size={18} />}
          onClick={() => setCourseDialog("unenroll")}
          sx={actionBtnSx}
        >
          Unenroll from course
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<IconWrapper icon="mdi:account-check" size={18} />}
          onClick={() => setConfirm("activate")}
          sx={actionBtnSx}
        >
          Activate
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<IconWrapper icon="mdi:account-off" size={18} />}
          onClick={() => setConfirm("deactivate")}
          sx={actionBtnSx}
        >
          Deactivate
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<IconWrapper icon="mdi:refresh" size={18} />}
          onClick={() => setConfirm("reset")}
          sx={actionBtnSx}
        >
          Clear activity log
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<IconWrapper icon="mdi:download" size={18} />}
          onClick={exportSelected}
          sx={actionBtnSx}
        >
          Export
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          size="small"
          onClick={onClear}
          startIcon={<IconWrapper icon="mdi:close" size={18} />}
          sx={{ color: "#fff", fontWeight: 700, textTransform: "none" }}
        >
          Clear
        </Button>
      </Box>

      {/* Course picker dialog (enroll / unenroll) */}
      <Dialog open={courseDialog !== null} onClose={closeCourseDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {courseDialog === "enroll" ? "Enroll" : "Unenroll"} {count} student
          {count > 1 ? "s" : ""}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 2 }}>
            Choose one or more courses. Each selected student will be{" "}
            {courseDialog === "enroll" ? "enrolled in" : "unenrolled from"} every course you pick.
          </Typography>
          <TextField
            select
            fullWidth
            label="Courses"
            value={pickedCourses}
            onChange={(e) => {
              const v = e.target.value as unknown as number[];
              setPickedCourses(typeof v === "string" ? [] : v);
            }}
            SelectProps={{
              multiple: true,
              renderValue: (sel) =>
                (sel as number[])
                  .map((id) => courses.find((c) => c.id === id)?.title || id)
                  .join(", "),
            }}
          >
            {courses.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                <Checkbox checked={pickedCourses.includes(c.id)} size="small" />
                <ListItemText primary={c.title} />
              </MenuItem>
            ))}
          </TextField>

          {adaptiveCourses.length > 0 && (
            <TextField
              select
              fullWidth
              label="Adaptive courses"
              value={pickedAdaptiveCourses}
              onChange={(e) => {
                const v = e.target.value as unknown as number[];
                setPickedAdaptiveCourses(typeof v === "string" ? [] : v);
              }}
              sx={{ mt: 2 }}
              SelectProps={{
                multiple: true,
                renderValue: (sel) =>
                  (sel as number[])
                    .map((id) => adaptiveCourses.find((c) => c.id === id)?.title || id)
                    .join(", "),
              }}
            >
              {adaptiveCourses.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  <Checkbox checked={pickedAdaptiveCourses.includes(c.id)} size="small" />
                  <ListItemText primary={c.title} />
                </MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeCourseDialog} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={runCourseAction}
            disabled={busy || pickedCourses.length + pickedAdaptiveCourses.length === 0}
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ bgcolor: INDIGO, fontWeight: 700, textTransform: "none" }}
          >
            {courseDialog === "enroll" ? "Enroll" : "Unenroll"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* A paid adaptive course the bulk enrol was refused on: give it free, or leave it. */}
      <Dialog open={compAsk !== null} onClose={() => void finishComp(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Give a paid course for free?</DialogTitle>
        <DialogContent>
          {compAsk && (
            <Typography variant="body2" sx={{ color: "var(--font-secondary)", lineHeight: 1.6 }}>
              <strong>
                {compAsk.byCourse
                  .map((g) => adaptiveCourses.find((c) => c.id === g.adaptiveId)?.title || `Course ${g.adaptiveId}`)
                  .join(", ")}
              </strong>{" "}
              {compAsk.byCourse.length > 1 ? "are paid courses" : "is a paid course"}, and{" "}
              {compAsk.learnerCount === 1
                ? "1 selected learner hasn't"
                : `${compAsk.learnerCount} selected learners haven't`}{" "}
              bought {compAsk.byCourse.length > 1 ? "them" : "it"}. Giving access is free: they won&apos;t be
              charged and no payment is recorded. Everyone else still has to buy it.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => void finishComp(false)} disabled={busy} sx={{ textTransform: "none", fontWeight: 600 }}>
            Don&apos;t give it
          </Button>
          <Button
            variant="contained"
            onClick={() => void finishComp(true)}
            disabled={busy}
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ bgcolor: INDIGO, fontWeight: 700, textTransform: "none" }}
          >
            Give free access
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm dialog (activate / deactivate / reset) */}
      <Dialog open={confirm !== null} onClose={() => setConfirm(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800, textTransform: "capitalize" }}>
          {confirm} {count} student{count > 1 ? "s" : ""}?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
            {confirm === "reset"
              ? "This permanently deletes the activity and time-tracking log for the selected students. It does NOT clear adaptive course progress, points, certificates or assessment scores — for that, use Reset learning progress on a single student. This cannot be undone."
              : confirm === "deactivate"
              ? "Selected students will be deactivated and lose access until reactivated."
              : "Selected students will be reactivated."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirm(null)} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={confirm === "activate" ? "success" : "error"}
            onClick={runConfirmAction}
            disabled={busy}
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ fontWeight: 700, textTransform: "none" }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
