"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import {
  adminAdaptiveCourseService,
  type AdaptiveStudentProgressDetail,
  type EnrolledAdaptiveStudent,
} from "@/lib/services/admin/admin-adaptive-course.service";
import { EnrollAdaptiveStudentsDialog } from "./EnrollAdaptiveStudentsDialog";
import { BulkEnrollmentDialog } from "@/components/admin/manage-students/BulkEnrollmentDialog";
import { QuickEnrollStudentDialog } from "@/components/admin/manage-students/QuickEnrollStudentDialog";
import { GradientBar, StudentAvatar, TYPE_COLOR } from "./studentVisuals";

interface Props {
  courseId: number;
  courseTitle: string;
}

const PAGE_SIZE = 25;

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

const gradientBtnSx = {
  fontWeight: 800,
  textTransform: "none" as const,
  borderRadius: 999,
  px: 2.25,
  color: "white",
  background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
  boxShadow: "0 12px 24px -14px rgba(99,102,241,0.7)",
  "&:hover": { background: "linear-gradient(135deg, #5457e5 0%, #9b46f0 100%)" },
};

const outlineBtnSx = {
  fontWeight: 800,
  textTransform: "none" as const,
  borderRadius: 999,
  px: 2,
  color: "#6366f1",
  borderColor: "color-mix(in srgb, #6366f1 40%, transparent)",
  "&:hover": { borderColor: "#6366f1", bgcolor: "color-mix(in srgb, #6366f1 6%, transparent)" },
};

export function CourseStudentsPanel({ courseId, courseTitle }: Props) {
  const { showToast } = useToast();
  const [rows, setRows] = useState<EnrolledAdaptiveStudent[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [quickEnrollOpen, setQuickEnrollOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const load = useCallback(
    async (q: string, p: number) => {
      setLoading(true);
      try {
        const res = await adminAdaptiveCourseService.listCourseStudents(courseId, {
          search: q || undefined,
          page: p,
          page_size: PAGE_SIZE,
        });
        setRows(res.results);
        setCount(res.count);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Couldn't load students.", "error");
      } finally {
        setLoading(false);
      }
    },
    [courseId, showToast],
  );

  useEffect(() => {
    void load("", 1);
  }, [load]);

  // Debounced search.
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      void load(search, 1);
    }, 350);
    return () => clearTimeout(t);
  }, [search, load]);

  function reload() {
    void load(search, page);
  }

  async function handleUnenroll(student: EnrolledAdaptiveStudent) {
    if (busyId) return;
    if (!window.confirm(`Remove ${student.name || student.email} from this course? Their past activity is preserved.`)) {
      return;
    }
    setBusyId(student.student_id);
    try {
      await adminAdaptiveCourseService.unenrollStudents(courseId, [student.student_id]);
      showToast("Student removed.", "success");
      // If we just removed the last row on a page, step back a page.
      const nextPage = rows.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      void load(search, nextPage);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't remove student.", "error");
    } finally {
      setBusyId(null);
    }
  }

  const enrolledIds = useMemo(() => new Set(rows.map((r) => r.student_id)), [rows]);

  // Summary over the loaded page (labelled as such so it's not mistaken for global).
  const pageStats = useMemo(() => {
    if (rows.length === 0) return { avg: 0, started: 0 };
    const sum = rows.reduce((n, r) => n + r.progress_percentage, 0);
    return { avg: Math.round(sum / rows.length), started: rows.filter((r) => r.progress_percentage > 0).length };
  }, [rows]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: 1 }}>
            Enrolled students
            <Box
              component="span"
              sx={{
                px: 1.1, py: 0.15, borderRadius: 999, fontSize: "0.8rem", fontWeight: 800, color: "white",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              }}
            >
              {count}
            </Box>
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.82rem", mt: 0.25 }}>
            Only enrolled students can see and open this adaptive course.
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<Icon icon="mdi:account-plus-outline" width={18} />} onClick={() => setQuickEnrollOpen(true)} sx={outlineBtnSx}>
          Add new student
        </Button>
        <Button variant="outlined" startIcon={<Icon icon="mdi:file-upload-outline" width={18} />} onClick={() => setCsvOpen(true)} sx={outlineBtnSx}>
          Upload CSV
        </Button>
        <Button variant="contained" disableElevation startIcon={<Icon icon="mdi:account-plus" width={18} />} onClick={() => setEnrollOpen(true)} sx={gradientBtnSx}>
          Enroll students
        </Button>
      </Box>

      {/* Summary rail */}
      {count > 0 && (
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
          <StatChip icon="mdi:account-group-outline" accent="#6366f1" value={count} label="Enrolled" />
          <StatChip icon="mdi:rocket-launch-outline" accent="#10b981" value={pageStats.started} label="Started (this page)" />
          <StatChip icon="mdi:chart-line" accent="#a855f7" value={`${pageStats.avg}%`} label="Avg progress (this page)" />
        </Box>
      )}

      <TextField
        fullWidth
        size="small"
        placeholder="Search enrolled students…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Icon icon="mdi:magnify" width={18} />
            </InputAdornment>
          ),
          sx: { borderRadius: 999, bgcolor: "var(--card-bg, #fff)" },
        }}
        sx={{ mb: 2 }}
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : rows.length === 0 ? (
        <Box
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            textAlign: "center",
            bgcolor: "color-mix(in srgb, var(--card-bg) 60%, transparent)",
            border: "1px dashed color-mix(in srgb, var(--border-default) 90%, transparent)",
          }}
        >
          <Icon icon="mdi:account-school-outline" width={44} style={{ color: "#a855f7" }} />
          <Typography sx={{ fontWeight: 800, mt: 1.5 }}>
            {search ? "No students match your search" : "No students enrolled yet"}
          </Typography>
          {!search && (
            <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
              Use <strong>Enroll students</strong> or <strong>Upload CSV</strong> to give students access.
            </Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {rows.map((s) => (
            <Box
              key={s.student_id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                borderRadius: 3,
                bgcolor: "var(--card-bg, #fff)",
                border: "1px solid var(--border-default, #ececf1)",
                transition: "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
                "&:hover": {
                  transform: "translateY(-1px)",
                  borderColor: "color-mix(in srgb, #6366f1 35%, transparent)",
                  boxShadow: "0 16px 30px -24px rgba(99,102,241,0.5)",
                },
              }}
            >
              <StudentAvatar name={s.name} email={s.email} />
              <Box sx={{ minWidth: 0, flex: 1.4 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }} noWrap>
                  {s.name || s.email}
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.78rem" }} noWrap>
                  {s.email}
                </Typography>
              </Box>
              <Box sx={{ flex: 1.2, minWidth: 130 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <GradientBar value={s.progress_percentage} height={7} />
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, minWidth: 38, textAlign: "right" }}>
                    {Math.round(s.progress_percentage)}%
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", mt: 0.4 }}>
                  {s.completed}/{s.total} items
                </Typography>
              </Box>
              <Box sx={{ flex: 0.8, minWidth: 96, display: { xs: "none", sm: "block" } }}>
                <Typography sx={{ fontSize: "0.66rem", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>
                  Last active
                </Typography>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{fmtDate(s.last_activity)}</Typography>
              </Box>
              <Tooltip title="View progress" arrow>
                <IconButton
                  size="small"
                  onClick={() => setDetailId(s.student_id)}
                  sx={{ color: "#6366f1", bgcolor: "color-mix(in srgb, #6366f1 8%, transparent)", "&:hover": { bgcolor: "color-mix(in srgb, #6366f1 16%, transparent)" } }}
                >
                  <Icon icon="mdi:chart-box-outline" width={19} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove from course" arrow>
                <span>
                  <IconButton
                    size="small"
                    disabled={busyId === s.student_id}
                    onClick={() => void handleUnenroll(s)}
                    sx={{ color: "#ef4444", bgcolor: "color-mix(in srgb, #ef4444 8%, transparent)", "&:hover": { bgcolor: "color-mix(in srgb, #ef4444 16%, transparent)" } }}
                  >
                    {busyId === s.student_id ? <CircularProgress size={16} /> : <Icon icon="mdi:account-remove-outline" width={19} />}
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          ))}
        </Box>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mt: 2 }}>
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

      <EnrollAdaptiveStudentsDialog
        open={enrollOpen}
        courseId={courseId}
        enrolledIds={enrolledIds}
        onClose={() => setEnrollOpen(false)}
        onEnrolled={reload}
      />

      <BulkEnrollmentDialog
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        onSuccess={reload}
        lockedAdaptiveCourse={{ id: courseId, title: courseTitle }}
      />

      <QuickEnrollStudentDialog
        open={quickEnrollOpen}
        onClose={() => setQuickEnrollOpen(false)}
        onSuccess={reload}
        lockedAdaptiveCourse={{ id: courseId, title: courseTitle }}
      />

      <StudentProgressDialog courseId={courseId} studentId={detailId} onClose={() => setDetailId(null)} />
    </Box>
  );
}

function StatChip({ icon, accent, value, label }: { icon: string; accent: string; value: number | string; label: string }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 1,
        borderRadius: 3,
        bgcolor: `color-mix(in srgb, ${accent} 7%, var(--card-bg))`,
        border: `1px solid color-mix(in srgb, ${accent} 22%, transparent)`,
      }}
    >
      <Box sx={{ width: 32, height: 32, borderRadius: 2, display: "grid", placeItems: "center", color: "white", background: accent, flexShrink: 0 }}>
        <Icon icon={icon} width={18} />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.1 }}>{value}</Typography>
        <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", fontWeight: 600 }}>{label}</Typography>
      </Box>
    </Box>
  );
}

function StudentProgressDialog({
  courseId,
  studentId,
  onClose,
}: {
  courseId: number;
  studentId: number | null;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const router = useRouter();
  const [detail, setDetail] = useState<AdaptiveStudentProgressDetail | null>(null);

  useEffect(() => {
    if (studentId == null) return;
    let cancelled = false;
    adminAdaptiveCourseService
      .getStudentProgress(courseId, studentId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((e) => {
        if (cancelled) return;
        showToast(e instanceof Error ? e.message : "Couldn't load progress.", "error");
        onClose();
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, studentId, showToast, onClose]);

  const ready = detail != null && detail.student_id === studentId;
  const by = ready ? detail.progress.by_type : undefined;
  const pct = ready ? detail.progress.progress_percentage : 0;

  const typeRows: Array<{ key: keyof typeof TYPE_COLOR; label: string; icon: string; done: number; total: number; excluded?: boolean }> = by
    ? [
        { key: "quiz", label: "Quizzes", icon: "mdi:tune-vertical", done: by.quiz.completed, total: by.quiz.total },
        { key: "coding", label: "Coding", icon: "mdi:robot-happy-outline", done: by.coding.completed, total: by.coding.total },
        { key: "video", label: "Videos", icon: "mdi:play-circle-outline", done: by.video.completed, total: by.video.total },
        { key: "article", label: "Articles", icon: "mdi:book-open-variant", done: 0, total: by.article.total, excluded: true },
      ]
    : [];

  return (
    <Dialog open={studentId != null} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        Student progress
        <IconButton onClick={onClose} size="small">
          <Icon icon="mdi:close" width={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {!ready || !detail ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress size={26} />
          </Box>
        ) : (
          <Box>
            {/* Hero */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
              <StudentAvatar name={detail.name} email={detail.email} size={48} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800 }} noWrap>{detail.name}</Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.82rem" }} noWrap>{detail.email}</Typography>
              </Box>
            </Box>

            {/* Progress ring */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2.5 }}>
              <ProgressRing value={pct} />
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.92rem" }}>
                  {detail.progress.completed}/{detail.progress.total} items complete
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                  Last active {fmtDate(detail.progress.last_activity)}
                </Typography>
              </Box>
            </Box>

            {/* Per-type breakdown */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              {typeRows.map((r) => {
                const color = TYPE_COLOR[r.key];
                const ratio = r.total > 0 ? (r.done / r.total) * 100 : 0;
                return (
                  <Box key={r.key} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: 2, display: "grid", placeItems: "center", color: "white", background: color, flexShrink: 0 }}>
                      <Icon icon={r.icon} width={17} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.4 }}>
                        <Typography sx={{ fontSize: "0.84rem", fontWeight: 700 }}>
                          {r.label}
                          {r.excluded && (
                            <Typography component="span" sx={{ color: "text.disabled", fontSize: "0.7rem", ml: 0.5, fontWeight: 600 }}>
                              (not counted in %)
                            </Typography>
                          )}
                        </Typography>
                        <Typography sx={{ fontSize: "0.84rem", fontWeight: 800 }}>
                          {r.excluded ? r.total : `${r.done}/${r.total}`}
                        </Typography>
                      </Box>
                      {!r.excluded && (
                        <Box sx={{ position: "relative", height: 5, borderRadius: 999, bgcolor: `color-mix(in srgb, ${color} 14%, transparent)`, overflow: "hidden" }}>
                          <Box sx={{ position: "absolute", inset: 0, width: `${ratio}%`, borderRadius: 999, background: color }} />
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* This modal is a glance. The full report is where the real answers are. */}
            <ButtonBase
              onClick={() => router.push(`/admin/adaptive-courses/${courseId}/students/${studentId}`)}
              sx={{
                mt: 2.5, width: "100%", py: 1.25, borderRadius: 2.5, gap: 0.75,
                fontWeight: 700, fontSize: "0.85rem", color: "white",
                background: "linear-gradient(135deg,#6366f1,#a855f7)",
              }}
            >
              View full activity &amp; performance report
              <Icon icon="mdi:arrow-right" width={17} />
            </ButtonBase>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Circular gradient progress ring with the % in the center. */
function ProgressRing({ value, size = 84 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        background: `conic-gradient(#a855f7 ${v * 3.6}deg, color-mix(in srgb, #6366f1 14%, transparent) 0deg)`,
      }}
    >
      <Box
        sx={{
          width: size - 14,
          height: size - 14,
          borderRadius: "50%",
          bgcolor: "var(--card-bg, #fff)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", lineHeight: 1 }}>{Math.round(v)}%</Typography>
      </Box>
    </Box>
  );
}
