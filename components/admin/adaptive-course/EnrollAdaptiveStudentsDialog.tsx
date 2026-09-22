"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { phoneIconTapSx, phoneSheetDialogSx, phoneTapSx } from "./coursePhone";
import { useToast } from "@/components/common/Toast";
import {
  adminStudentService,
  type Student,
} from "@/lib/services/admin/admin-student.service";
import { adminAdaptiveCourseService } from "@/lib/services/admin/admin-adaptive-course.service";
import { adminCohortsService, type CohortListItem } from "@/lib/services/admin/admin-cohorts.service";
import { StudentAvatar } from "./studentVisuals";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

interface Props {
  open: boolean;
  courseId: number;
  /** UserProfile ids already enrolled - shown disabled so admins don't re-add. */
  enrolledIds: Set<number>;
  onClose: () => void;
  onEnrolled: () => void;
}

const PAGE_SIZE = 20;

interface PassCounts {
  succeeded: number;
  skipped: number;
  missing: number;
  failed: number;
}

const NO_PASS: PassCounts = { succeeded: 0, skipped: 0, missing: 0, failed: 0 };

/** Search the tenant student roster and enroll the selected students into an
 *  adaptive course. Reuses the existing manage-students directory endpoint. */
export function EnrollAdaptiveStudentsDialog({
  open,
  courseId,
  enrolledIds,
  onClose,
  onEnrolled,
}: Props) {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  // The batch to ALSO put these learners in. "" = none: enrolling is the course only, and never
  // creates a batch. Picked from the tenant's existing batches; hidden when there are none or the
  // caller cannot list them (the cohort screens are feature-gated).
  const [batches, setBatches] = useState<CohortListItem[]>([]);
  const [batchId, setBatchId] = useState<number | "">("");
  const theme = useTheme();
  // On a phone the sheet holds itself open while the enrolment request runs.
  const holdOpen = useMediaQuery(theme.breakpoints.down("sm")) && submitting;
  const requestClose = () => {
    if (!holdOpen) onClose();
  };
  // Learners the course was refused to because it is paid, waiting on the admin's "give it free?",
  // with what the first pass already did so the final message can report both.
  const [compAsk, setCompAsk] = useState<{ ids: number[]; first: PassCounts } | null>(null);
  // A response can land after the dialog was closed mid-request, or closed AND reopened. The
  // prompt belongs to the opening that sent the request, so each opening gets its own number and
  // a response for an earlier one never arms a prompt over the admin's fresh selection.
  const openingRef = useRef(open ? 1 : 0);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
    if (open) openingRef.current += 1;
    else setCompAsk(null);
  }, [open]);

  const load = useCallback(
    async (q: string, p: number) => {
      setLoading(true);
      try {
        const res = await adminStudentService.getManageStudents({
          search: q || undefined,
          role: "student",
          page: p,
          limit: PAGE_SIZE,
        });
        setStudents(res.students);
        setTotalPages(res.pagination.total_pages || 1);
      } catch {
        showToast("Couldn't load students.", "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setSelected(new Set());
    setPage(1);
    setBatchId("");
    void load("", 1);
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    let live = true;
    adminCohortsService
      .listCohorts()
      .then((cs) => {
        if (live) setBatches(cs.filter((c) => c.status !== "archived"));
      })
      .catch(() => {
        if (live) setBatches([]);
      });
    return () => {
      live = false;
    };
  }, [open]);

  // Debounced search.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setPage(1);
      void load(search, 1);
    }, 350);
    return () => clearTimeout(t);
  }, [search, open, load]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** One line for everything that happened across both passes. */
  function summarise(first: PassCounts, pass: PassCounts, compNow: boolean, extra = ""): string {
    return (
      `Enrolled ${first.succeeded + pass.succeeded}` +
      (compNow && pass.succeeded ? ` (${pass.succeeded} free of charge)` : "") +
      (first.skipped + pass.skipped ? ` · ${first.skipped + pass.skipped} already enrolled` : "") +
      (first.missing + pass.missing ? ` · ${first.missing + pass.missing} not found` : "") +
      (first.failed + pass.failed ? ` · ${first.failed + pass.failed} failed` : "") +
      extra
    );
  }

  /** The admin said no to "give it free?" (Cancel, Escape or backdrop). Still report the first pass. */
  function declineComp() {
    const ask = compAsk;
    setCompAsk(null);
    if (!ask) return;
    showToast(
      summarise(ask.first, NO_PASS, false, ` · ${ask.ids.length} not enrolled: the paid course was not given free`),
      ask.first.failed ? "error" : "info",
    );
  }

  /** `comp`: the learners an admin just agreed to give this paid course to, free, and what the
   *  first pass had already done. */
  async function handleEnroll(comp?: { ids: number[]; first: PassCounts }) {
    if ((!comp && selected.size === 0) || submitting) return;
    setSubmitting(true);
    const opening = openingRef.current;
    const first = comp?.first ?? NO_PASS;
    try {
      const res = await adminAdaptiveCourseService.enrollStudents(
        courseId,
        comp ? comp.ids : Array.from(selected),
        { compPaid: Boolean(comp), ...(batchId ? { cohortId: batchId } : {}) },
      );
      const pass: PassCounts = {
        succeeded: res.succeeded,
        skipped: res.skipped ?? 0,
        missing: res.missing?.length ?? 0,
        failed: (res as { failed?: unknown[] }).failed?.length ?? 0,
      };
      const refusedIds = (res.refused ?? [])
        .map((r) => r.student_id)
        .filter((id): id is number => typeof id === "number");

      // A paid course used to come back as "Enrolled 0" with no reason and no way through, while
      // the platform's own messages told admins to "enroll individual students as a comp".
      if (!comp && refusedIds.length > 0) {
        if (pass.succeeded > 0) onEnrolled();
        const sameOpening = openRef.current && opening === openingRef.current;
        if (res.can_comp === true && sameOpening) {
          setCompAsk({ ids: refusedIds, first: pass });
          return;
        }
        const why =
          res.can_comp === true
            ? // The dialog was closed or reopened while the request was out: say how to finish.
              " not enrolled: this is a paid course. Enroll them again to give it to them free."
            : res.can_comp === false
            ? " not enrolled: this is a paid course and only an admin can give it to learners who haven't bought it."
            : " not enrolled: this is a paid course, so learners have to buy it first.";
        showToast(summarise(pass, NO_PASS, false, ` · ${refusedIds.length}${why}`), "error");
        return;
      }

      const batchNote = res.cohort
        ? ` · ${res.cohort.added} added to ${res.cohort.name}` +
          (res.cohort.already ? ` (${res.cohort.already} already in it)` : "")
        : "";
      const msg = summarise(
        first,
        pass,
        Boolean(comp),
        (refusedIds.length ? ` · ${refusedIds.length} still need to buy it` : "") + batchNote,
      );
      // "Enrolled 0" is not a success, and neither is a batch where anyone failed in EITHER pass:
      // a green toast and a closed dialog read as "everyone is in".
      if (first.failed + pass.failed > 0 || first.succeeded + pass.succeeded === 0) {
        showToast(msg, first.failed + pass.failed > 0 ? "error" : "info");
        onEnrolled();
        return;
      }
      showToast(msg, "success");
      onEnrolled();
      // Only the opening that sent this request may be closed by it. An admin who closed and
      // reopened the dialog meanwhile has a new selection on screen that this must not throw away.
      if (openRef.current && opening === openingRef.current) onClose();
    } catch (e) {
      const detail = getAxiosErrorDetail(e, comp ? "Couldn't give free access." : "Enrollment failed.");
      // After a first pass, what it already did is still true: report it with the failure.
      showToast(comp ? `${summarise(first, NO_PASS, false)} · ${comp.ids.length} not given free: ${detail}` : detail, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={requestClose} maxWidth="sm" fullWidth sx={phoneSheetDialogSx} PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box sx={{ width: 34, height: 34, borderRadius: 2.5, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, var(--module-tile-from, #6366f1) 0%, var(--module-tile-to, #a855f7) 100%)" }}>
            <Icon icon="mdi:account-plus" width={20} />
          </Box>
          Enroll students
        </Box>
        <IconButton onClick={requestClose} disabled={holdOpen} size="small" sx={phoneIconTapSx}>
          <Icon icon="mdi:close" width={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon icon="mdi:magnify" width={18} />
              </InputAdornment>
            ),
            sx: { borderRadius: 999 },
          }}
          sx={{ mb: 1.5 }}
        />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={26} />
          </Box>
        ) : students.length === 0 ? (
          <Typography sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
            No students found.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, maxHeight: 380, overflowY: "auto", px: 0.25 }}>
            {students.map((s) => {
              const already = enrolledIds.has(s.id);
              const picked = selected.has(s.id);
              return (
                <Box
                  key={s.id}
                  component="label"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    pl: 1,
                    pr: 1.5,
                    py: 0.85,
                    borderRadius: 2.5,
                    cursor: already ? "not-allowed" : "pointer",
                    border: "1px solid",
                    borderColor: picked ? "color-mix(in srgb, #6366f1 45%, transparent)" : "transparent",
                    bgcolor: picked ? "color-mix(in srgb, #6366f1 8%, transparent)" : "transparent",
                    transition: "background-color 120ms ease, border-color 120ms ease",
                    "&:hover": { bgcolor: already ? "transparent" : picked ? "color-mix(in srgb, #6366f1 10%, transparent)" : "action.hover" },
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={already || picked}
                    disabled={already}
                    onChange={() => toggle(s.id)}
                    sx={{ color: "#6366f1", "&.Mui-checked": { color: "#6366f1" } }}
                  />
                  <StudentAvatar name={s.name} email={s.email} size={34} dim={already} />
                  <Box sx={{ minWidth: 0, flex: 1, opacity: already ? 0.6 : 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.88rem" }} noWrap>
                      {s.name || s.email}
                    </Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: "0.78rem" }} noWrap>
                      {s.email}
                    </Typography>
                  </Box>
                  {already && (
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex", alignItems: "center", gap: 0.3,
                        px: 1, py: 0.25, borderRadius: 999, fontSize: "0.7rem", fontWeight: 800,
                        color: "#10b981", bgcolor: "color-mix(in srgb, #10b981 14%, transparent)",
                      }}
                    >
                      <Icon icon="mdi:check-circle" width={13} />
                      Enrolled
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}

        {batches.length > 0 && (
          <TextField
            select
            fullWidth
            size="small"
            label="Also add to a batch (optional)"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value === "" ? "" : Number(e.target.value))}
            helperText={
              batchId
                ? "They'll join this batch too, and get its sessions and anything else posted to it."
                : "Course only. Enrolling never creates a batch."
            }
            sx={{ mt: 2 }}
          >
            <MenuItem value="">No batch - course only</MenuItem>
            {batches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        {totalPages > 1 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mt: 1.5 }}>
            <Button
              size="small"
              sx={phoneTapSx}
              disabled={page <= 1 || loading}
              onClick={() => {
                const p = page - 1;
                setPage(p);
                void load(search, p);
              }}
            >
              Prev
            </Button>
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
              Page {page} / {totalPages}
            </Typography>
            <Button
              size="small"
              sx={phoneTapSx}
              disabled={page >= totalPages || loading}
              onClick={() => {
                const p = page + 1;
                setPage(p);
                void load(search, p);
              }}
            >
              Next
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Typography sx={{ flex: 1, fontSize: "0.82rem", color: "text.secondary", fontWeight: 600 }}>
          {selected.size} selected
        </Typography>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: "none", fontWeight: 700 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disableElevation
          onClick={() => void handleEnroll()}
          disabled={selected.size === 0 || submitting}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:check" width={18} />}
          sx={{
            textTransform: "none", fontWeight: 800, borderRadius: 999, px: 2.5,
            background: "linear-gradient(135deg, var(--module-tile-from, #6366f1) 0%, var(--module-tile-to, #a855f7) 100%)",
            "&:hover": { background: "linear-gradient(135deg, #5457e5 0%, #9b46f0 100%)" },
            "&.Mui-disabled": { background: "color-mix(in srgb, #6366f1 30%, transparent)", color: "white" },
          }}
        >
          {submitting ? "Enrolling…" : "Enroll selected"}
        </Button>
      </DialogActions>
      <Dialog open={compAsk !== null} onClose={declineComp} maxWidth="xs" fullWidth sx={phoneSheetDialogSx}>
        <DialogTitle sx={{ fontWeight: 800 }}>Give this paid course for free?</DialogTitle>
        <DialogContent>
          {compAsk && (
            <Typography variant="body2" sx={{ color: "var(--font-secondary)", lineHeight: 1.6 }}>
              This is a paid course, and {compAsk.ids.length === 1 ? "1 selected learner hasn't" : `${compAsk.ids.length} selected learners haven't`}{" "}
              bought it. Enrolling {compAsk.ids.length === 1 ? "them" : "them all"} gives it free: they won&apos;t be
              charged and no payment is recorded. Everyone else still has to buy it.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={declineComp} sx={{ textTransform: "none", fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={() => {
              const ask = compAsk;
              setCompAsk(null);
              if (ask) void handleEnroll(ask);
            }}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Give free access
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
