"use client";

import { useCallback, useEffect, useState } from "react";
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
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import {
  adminStudentService,
  type Student,
} from "@/lib/services/admin/admin-student.service";
import { adminAdaptiveCourseService } from "@/lib/services/admin/admin-adaptive-course.service";
import { StudentAvatar } from "./studentVisuals";

interface Props {
  open: boolean;
  courseId: number;
  /** UserProfile ids already enrolled - shown disabled so admins don't re-add. */
  enrolledIds: Set<number>;
  onClose: () => void;
  onEnrolled: () => void;
}

const PAGE_SIZE = 20;

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
    void load("", 1);
  }, [open, load]);

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

  async function handleEnroll() {
    if (selected.size === 0 || submitting) return;
    setSubmitting(true);
    try {
      const res = await adminAdaptiveCourseService.enrollStudents(courseId, Array.from(selected));
      const msg =
        `Enrolled ${res.succeeded}` +
        (res.skipped ? ` · ${res.skipped} already enrolled` : "") +
        (res.missing && res.missing.length ? ` · ${res.missing.length} not found` : "");
      showToast(msg, "success");
      onEnrolled();
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Enrollment failed.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box sx={{ width: 34, height: 34, borderRadius: 2.5, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}>
            <Icon icon="mdi:account-plus" width={20} />
          </Box>
          Enroll students
        </Box>
        <IconButton onClick={onClose} size="small">
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

        {totalPages > 1 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mt: 1.5 }}>
            <Button
              size="small"
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
            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
            "&:hover": { background: "linear-gradient(135deg, #5457e5 0%, #9b46f0 100%)" },
            "&.Mui-disabled": { background: "color-mix(in srgb, #6366f1 30%, transparent)", color: "white" },
          }}
        >
          {submitting ? "Enrolling…" : "Enroll selected"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
