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
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminStudentService,
  type BulkEnrolResponse,
  type BulkEnrolResultRow,
  Student,
} from "@/lib/services/admin/admin-student.service";
import { BULK_MAX_PAIRS, BULK_MAX_STUDENTS } from "./bulkEnrolLimits";
import { PAID_COURSE_NEEDS_COMP } from "@/lib/services/admin/admin-adaptive-course.service";
import { ResponsiveDialog } from "@/components/common/mobile/ResponsiveDialog";
import { ScrollRow } from "@/components/common/mobile/ScrollRow";
import { PHONE_TAP, SHEET_BUTTON_SX, useIsPhone } from "./mobile";
import { BulkEnrolReport } from "./BulkEnrolReport";

interface BulkActionToolbarProps {
  selected: Student[];
  courses: Array<{ id: number; title: string }>;
  /** Adaptive courses available for bulk enroll/unenroll (optional). */
  adaptiveCourses?: Array<{ id: number; title: string }>;
  /** Batches (cohorts) the caller may put the selection into. Empty when the tenant has no
   *  Cohort Builder, or when a scoped role staffs none — in which case no batch picker shows. */
  batches?: Array<{ id: number; name: string }>;
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
  batches = [],
  onClear,
  onDone,
}: BulkActionToolbarProps) {
  const { showToast } = useToast();
  const { t } = useTranslation("common");
  const isPhone = useIsPhone();
  const [courseDialog, setCourseDialog] = useState<CourseDialogMode>(null);
  const [confirm, setConfirm] = useState<ConfirmMode>(null);
  const [pickedCourses, setPickedCourses] = useState<number[]>([]);
  const [pickedAdaptiveCourses, setPickedAdaptiveCourses] = useState<number[]>([]);
  const [pickedCohorts, setPickedCohorts] = useState<number[]>([]);
  /** The enrol dialog is two steps: choose the targets, then confirm the exact sentence. */
  const [step, setStep] = useState<"pick" | "confirm">("pick");
  const [busy, setBusy] = useState(false);
  // The per-student report, with the selection SNAPSHOT it describes. Snapshotted for the same
  // reason compAsk is held here: onDone clears the selection, and the report names the learners.
  const [report, setReport] = useState<{
    action: "enroll" | "unenroll";
    data: BulkEnrolResponse;
    students: Student[];
  } | null>(null);
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
    setPickedCohorts([]);
    setStep("pick");
  };

  /** Every picked target, with the name the admin will see in the confirmation. */
  const pickedTargets = useMemo(
    () => [
      ...pickedCourses.map((id) => ({
        key: `c${id}`,
        name: courses.find((c) => c.id === id)?.title ?? `#${id}`,
      })),
      ...pickedAdaptiveCourses.map((id) => ({
        key: `a${id}`,
        name: adaptiveCourses.find((c) => c.id === id)?.title ?? `#${id}`,
      })),
      ...pickedCohorts.map((id) => ({
        key: `b${id}`,
        name: t("bulkEnrol.batchNamed", { name: batches.find((b) => b.id === id)?.name ?? `#${id}` }),
      })),
    ],
    [pickedCourses, pickedAdaptiveCourses, pickedCohorts, courses, adaptiveCourses, batches, t]
  );
  const pairCount = count * pickedTargets.length;
  // Refused HERE, before the request, and with the same numbers the server would answer with:
  // a count an admin reads has to be the count that gets enrolled.
  const overCap = count > BULK_MAX_STUDENTS || pairCount > BULK_MAX_PAIRS;

  /** A result row's course / batch, by the name the admin picked. */
  const targetName = (row: BulkEnrolResultRow) => {
    if (typeof row.cohort_id === "number") {
      return t("bulkEnrol.batchNamed", { name: batches.find((b) => b.id === row.cohort_id)?.name ?? `#${row.cohort_id}` });
    }
    if (typeof row.adaptive_course_id === "number") {
      return adaptiveCourses.find((c) => c.id === row.adaptive_course_id)?.title ?? `#${row.adaptive_course_id}`;
    }
    if (typeof row.course_id === "number") {
      return courses.find((c) => c.id === row.course_id)?.title ?? `#${row.course_id}`;
    }
    return t("bulkEnrol.theSelection");
  };

  const runCourseAction = async () => {
    if (!courseDialog || pickedTargets.length === 0 || overCap) return;
    const actedOn = selected;
    try {
      setBusy(true);
      const res = await adminStudentService.bulkCourseAction(
        courseDialog,
        studentIds,
        pickedCourses,
        pickedAdaptiveCourses,
        { cohortIds: pickedCohorts }
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
      // Not a toast: some of the selection is always already enrolled and some is always
      // refused, and "37 ok" is exactly the sentence that hides both.
      setReport({ action: courseDialog, data: res, students: actedOn });
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

  const reportDialog = (
    <BulkEnrolReport
      open={report !== null}
      onClose={() => setReport(null)}
      action={report?.action ?? "enroll"}
      report={report?.data ?? null}
      students={report?.students ?? []}
      targetName={targetName}
    />
  );

  // The report OUTLIVES the selection: onDone clears it, and with nothing selected this toolbar
  // is gone — which would take the report with it before anyone read a word of it.
  if (count === 0) return report ? reportDialog : null;

  const actionBtnSx = {
    fontWeight: 700,
    textTransform: "none" as const,
    borderRadius: 999,
    color: "#fff",
    borderColor: "rgba(255,255,255,0.4)",
  };

  // ---- the three dialogs' bodies, shared by the desktop Dialog and the phone sheet ----------

  const enrolling = courseDialog === "enroll";
  const courseTitle =
    step === "confirm"
      ? enrolling
        ? t("bulkEnrol.confirmEnrolTitle", { n: count })
        : t("bulkEnrol.confirmRemoveTitle", { n: count })
      : enrolling
        ? t("bulkEnrol.pickEnrolTitle", { n: count })
        : t("bulkEnrol.pickRemoveTitle", { n: count });

  const targetList = pickedTargets.map((tt) => tt.name).join(", ");
  const confirmStepBody = (
    <Box data-testid="bulk-enrol-confirm">
      <Typography variant="body2" sx={{ color: "var(--font-primary)", mb: 1.5, lineHeight: 1.6 }}>
        {enrolling
          ? t("bulkEnrol.confirmEnrolBody", { n: count, targets: targetList })
          : t("bulkEnrol.confirmRemoveBody", { n: count, targets: targetList })}
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--font-secondary)", lineHeight: 1.6 }}>
        {enrolling ? t("bulkEnrol.confirmEnrolNote") : t("bulkEnrol.confirmRemoveNote")}
      </Typography>
      {enrolling && pickedCohorts.length > 0 && (
        <Typography variant="body2" sx={{ color: "var(--font-secondary)", mt: 1, lineHeight: 1.6 }}>
          {t("bulkEnrol.confirmBatchNote")}
        </Typography>
      )}
    </Box>
  );

  const pickStepBody = (
    <>
      <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 2 }}>
        {enrolling ? t("bulkEnrol.pickEnrolHint") : t("bulkEnrol.pickRemoveHint")}
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
          <MenuItem key={c.id} value={c.id} sx={PHONE_TAP}>
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
            <MenuItem key={c.id} value={c.id} sx={PHONE_TAP}>
              <Checkbox checked={pickedAdaptiveCourses.includes(c.id)} size="small" />
              <ListItemText primary={c.title} />
            </MenuItem>
          ))}
        </TextField>
      )}

      {batches.length > 0 && (
        <TextField
          select
          fullWidth
          data-testid="bulk-batch-picker"
          label={t("bulkEnrol.batchesLabel")}
          helperText={enrolling ? t("bulkEnrol.batchesHelp") : undefined}
          value={pickedCohorts}
          onChange={(e) => {
            const v = e.target.value as unknown as number[];
            setPickedCohorts(typeof v === "string" ? [] : v);
          }}
          sx={{ mt: 2 }}
          SelectProps={{
            multiple: true,
            renderValue: (sel) =>
              (sel as number[]).map((id) => batches.find((b) => b.id === id)?.name || id).join(", "),
          }}
        >
          {batches.map((b) => (
            <MenuItem key={b.id} value={b.id} sx={PHONE_TAP}>
              <Checkbox checked={pickedCohorts.includes(b.id)} size="small" />
              <ListItemText primary={b.name} />
            </MenuItem>
          ))}
        </TextField>
      )}

      {overCap && (
        <Typography
          data-testid="bulk-over-cap"
          variant="body2"
          sx={{ mt: 2, color: "#ef4444", fontWeight: 600, lineHeight: 1.6 }}
        >
          {t("bulkEnrol.tooMany", {
            students: count,
            targets: pickedTargets.length,
            pairs: pairCount,
            maxStudents: BULK_MAX_STUDENTS,
            maxPairs: BULK_MAX_PAIRS,
          })}
        </Typography>
      )}
    </>
  );

  const courseBody = step === "confirm" ? confirmStepBody : pickStepBody;
  const canContinue = pickedTargets.length > 0 && !overCap;
  const primaryLabel =
    step === "pick"
      ? t("bulkEnrol.continue")
      : enrolling
        ? t("bulkEnrol.enrolAction")
        : t("bulkEnrol.removeAction");
  const onPrimary = () => (step === "pick" ? setStep("confirm") : void runCourseAction());

  const compBody = compAsk && (
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
  );

  const confirmTitle = (
    <>
      {confirm} {count} student{count > 1 ? "s" : ""}?
    </>
  );
  const confirmBody = (
    <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
      {confirm === "reset"
        ? "This permanently deletes the activity and time-tracking log for the selected students. It does NOT clear adaptive course progress, points, certificates or assessment scores — for that, use Reset learning progress on a single student. This cannot be undone."
        : confirm === "deactivate"
        ? "Selected students will be deactivated and lose access until reactivated."
        : "Selected students will be reactivated."}
    </Typography>
  );

  const busyIcon = busy ? <CircularProgress size={16} color="inherit" /> : undefined;

  // ---- phone ----------------------------------------------------------------------------------

  if (isPhone) {
    const noop = () => undefined;
    const phoneActions: Array<{ label: string; icon: string; onClick: () => void }> = [
      { label: t("bulkEnrol.enrolButton"), icon: "mdi:account-plus", onClick: () => setCourseDialog("enroll") },
      { label: t("bulkEnrol.removeButton"), icon: "mdi:account-minus", onClick: () => setCourseDialog("unenroll") },
      { label: "Activate", icon: "mdi:account-check", onClick: () => setConfirm("activate") },
      { label: "Deactivate", icon: "mdi:account-off", onClick: () => setConfirm("deactivate") },
      { label: "Clear activity log", icon: "mdi:refresh", onClick: () => setConfirm("reset") },
      { label: "Export", icon: "mdi:download", onClick: exportSelected },
    ];
    return (
      <>
        {/* Pinned just above the phone's floating dock, so the actions stay under the thumb while
            students are picked further down the list. (The desktop bar is `sticky`, which the
            page's overflow:auto wrappers turn into a bar that scrolls away.) */}
        <Box
          role="toolbar"
          aria-label="Bulk actions for selected students"
          data-testid="phone-bulk-toolbar"
          sx={{
            position: "fixed",
            insetInline: 12,
            bottom: "calc(env(safe-area-inset-bottom) + 84px)",
            zIndex: 1150,
            pt: 0.5,
            pb: 1,
            borderRadius: 3,
            background: "linear-gradient(135deg,#6366f1 0%,#a855f7 60%,#ec4899 100%)",
            boxShadow: "0 18px 36px -16px rgba(99,102,241,0.55)",
            overflow: "hidden",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2 }}>
            <Typography sx={{ color: "#fff", fontWeight: 800, flex: 1 }}>{count} selected</Typography>
            <Button
              onClick={onClear}
              startIcon={<IconWrapper icon="mdi:close" size={18} />}
              sx={{ color: "#fff", fontWeight: 700, textTransform: "none", minHeight: 44 }}
            >
              Clear
            </Button>
          </Box>
          <ScrollRow ariaLabel="Bulk actions" gutter={0} sx={{ px: 1.5 }}>
            {phoneActions.map((a) => (
              <Button
                key={a.label}
                variant="outlined"
                startIcon={<IconWrapper icon={a.icon} size={18} />}
                onClick={a.onClick}
                sx={{ ...actionBtnSx, minHeight: 44, px: 2, whiteSpace: "nowrap" }}
              >
                {a.label}
              </Button>
            ))}
          </ScrollRow>
        </Box>

        <ResponsiveDialog
          open={courseDialog !== null}
          onClose={busy ? noop : closeCourseDialog}
          hideCloseButton={busy}
          title={courseTitle}
          footer={
            <>
              <Button
                variant="outlined"
                onClick={step === "confirm" ? () => setStep("pick") : closeCourseDialog}
                disabled={busy}
                sx={SHEET_BUTTON_SX}
              >
                {step === "confirm" ? t("bulkEnrol.back") : "Cancel"}
              </Button>
              <Button
                variant="contained"
                onClick={onPrimary}
                disabled={busy || !canContinue}
                startIcon={busyIcon}
                sx={{ ...SHEET_BUTTON_SX, bgcolor: INDIGO }}
              >
                {primaryLabel}
              </Button>
            </>
          }
        >
          <Box sx={{ pt: 0.5 }}>{courseBody}</Box>
        </ResponsiveDialog>

        <ResponsiveDialog
          open={compAsk !== null}
          onClose={busy ? noop : () => void finishComp(false)}
          hideCloseButton
          title="Give a paid course for free?"
          footer={
            <>
              <Button variant="outlined" onClick={() => void finishComp(false)} disabled={busy} sx={SHEET_BUTTON_SX}>
                Don&apos;t give it
              </Button>
              <Button
                variant="contained"
                onClick={() => void finishComp(true)}
                disabled={busy}
                startIcon={busyIcon}
                sx={{ ...SHEET_BUTTON_SX, bgcolor: INDIGO }}
              >
                Give free access
              </Button>
            </>
          }
        >
          {compBody}
        </ResponsiveDialog>

        <ResponsiveDialog
          open={confirm !== null}
          onClose={busy ? noop : () => setConfirm(null)}
          hideCloseButton={busy}
          title={<Box component="span" sx={{ textTransform: "capitalize" }}>{confirmTitle}</Box>}
          footer={
            <>
              <Button variant="outlined" onClick={() => setConfirm(null)} disabled={busy} sx={SHEET_BUTTON_SX}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color={confirm === "activate" ? "success" : "error"}
                onClick={runConfirmAction}
                disabled={busy}
                startIcon={busyIcon}
                sx={SHEET_BUTTON_SX}
              >
                Confirm
              </Button>
            </>
          }
        >
          {confirmBody}
        </ResponsiveDialog>

        {reportDialog}
      </>
    );
  }

  // ---- sm and up: the original toolbar and dialogs ---------------------------------------------

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
          {t("bulkEnrol.enrolButton")}
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<IconWrapper icon="mdi:account-minus" size={18} />}
          onClick={() => setCourseDialog("unenroll")}
          sx={actionBtnSx}
        >
          {t("bulkEnrol.removeButton")}
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
        <DialogTitle sx={{ fontWeight: 800 }}>{courseTitle}</DialogTitle>
        <DialogContent>{courseBody}</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={step === "confirm" ? () => setStep("pick") : closeCourseDialog}
            disabled={busy}
          >
            {step === "confirm" ? t("bulkEnrol.back") : "Cancel"}
          </Button>
          <Button
            variant="contained"
            onClick={onPrimary}
            disabled={busy || !canContinue}
            startIcon={busyIcon}
            sx={{ bgcolor: INDIGO, fontWeight: 700, textTransform: "none" }}
          >
            {primaryLabel}
          </Button>
        </DialogActions>
      </Dialog>

      {/* A paid adaptive course the bulk enrol was refused on: give it free, or leave it. */}
      <Dialog open={compAsk !== null} onClose={() => void finishComp(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Give a paid course for free?</DialogTitle>
        <DialogContent>{compBody}</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => void finishComp(false)} disabled={busy} sx={{ textTransform: "none", fontWeight: 600 }}>
            Don&apos;t give it
          </Button>
          <Button
            variant="contained"
            onClick={() => void finishComp(true)}
            disabled={busy}
            startIcon={busyIcon}
            sx={{ bgcolor: INDIGO, fontWeight: 700, textTransform: "none" }}
          >
            Give free access
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm dialog (activate / deactivate / reset) */}
      <Dialog open={confirm !== null} onClose={() => setConfirm(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800, textTransform: "capitalize" }}>{confirmTitle}</DialogTitle>
        <DialogContent>{confirmBody}</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirm(null)} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={confirm === "activate" ? "success" : "error"}
            onClick={runConfirmAction}
            disabled={busy}
            startIcon={busyIcon}
            sx={{ fontWeight: 700, textTransform: "none" }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {reportDialog}
    </>
  );
}
