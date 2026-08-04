"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Chip, LinearProgress, Stack, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { useToast } from "@/components/common/Toast";
import { StudentDetailDrawer } from "@/components/instructor/StudentDetailDrawer";
import { RosterRow } from "@/components/instructor/RosterRow";
import { instructorService, type CourseStudentRow } from "@/lib/services/instructor.service";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

export default function InstructorCoursePage() {
  const params = useParams();
  const courseId = Number(params?.id);
  const { push } = useInstantNavigation();
  const { showToast } = useToast();
  const [rows, setRows] = useState<CourseStudentRow[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);
  // The roster endpoint does not say who authored the course, so this comes from the list the
  // instructor already loaded. Absent (deep link, hard refresh) it stays false and the builder
  // link simply is not offered — the card on /instructor/courses is the reliable route.
  const [authoredByMe, setAuthoredByMe] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    instructorService
      .getCourses()
      .then((list) => {
        if (cancelled) return;
        const mine = list.find((c) => c.kind === "adaptive" && c.id === courseId);
        setAuthoredByMe(!!mine?.authored_by_me);
      })
      .catch(() => {
        // A missing link is a missing convenience, not a broken page.
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const r = await instructorService.getCourseStudents(courseId);
      setRows(r.results);
      setCount(r.count);
    } catch (e) {
      setError(getAxiosErrorDetail(e, "Couldn't load this course."));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
  }, [rows, query]);

  async function handleRemove(studentId: number, name: string) {
    if (removing != null) return;
    if (!window.confirm(`Remove ${name || "this student"} from the course?`)) return;
    setRemoving(studentId);
    try {
      await instructorService.unenrollCourseStudents(courseId, [studentId]);
      setRows((prev) => prev.filter((r) => r.student_id !== studentId));
      setCount((c) => Math.max(0, c - 1));
      showToast("Student removed from the course.", "success");
    } catch (e) {
      showToast(getAxiosErrorDetail(e, "Couldn't remove the student."), "error");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Course"
        title="Course students"
        description={`${count} enrolled student${count === 1 ? "" : "s"}.`}
        accent="purple"
        icon="mdi:book-education"
        action={
          <Stack direction="row" spacing={1}>
            {/* Offered only for a course this instructor BUILT. Being assigned to teach a course
                does not carry the right to rewrite it, and the server says so — a button that
                403s is worse than no button. */}
            {authoredByMe && (
              <HeaderActionButton
                icon="mdi:hammer-wrench"
                onClick={() => push(`/admin/adaptive-courses/${courseId}`)}
              >
                Open the builder
              </HeaderActionButton>
            )}
            <HeaderActionButton icon="mdi:arrow-left" variant="ghost" onClick={() => push("/instructor/dashboard")}>
              Dashboard
            </HeaderActionButton>
          </Stack>
        }
      />

      {error && <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>{error}</Typography>}

      {!error && (
        <>
          <TextField
            size="small"
            fullWidth
            placeholder="Search students…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ maxWidth: 380, mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "var(--surface)" } }}
            InputProps={{ startAdornment: <Icon icon="mdi:magnify" width={18} style={{ marginRight: 6, opacity: 0.6 }} /> }}
          />

          {!loading && visible.length === 0 && (
            <Box sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default)" }}>
              <Typography sx={{ color: "text.secondary" }}>
                {count ? "No students match your search." : "No students enrolled yet."}
              </Typography>
            </Box>
          )}

          <Stack spacing={1}>
            {visible.map((r) => (
              <RosterRow
                key={r.student_id}
                name={r.name}
                email={r.email}
                onClick={() => setSelected(r.student_id)}
                right={
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ width: 92, display: { xs: "none", sm: "block" } }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.max(0, Math.min(100, r.progress_percentage || 0))}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography sx={{ fontSize: "0.68rem", color: "text.secondary", mt: 0.25 }}>
                        {Math.round(r.progress_percentage || 0)}% · {r.completed}/{r.total}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={removing === r.student_id ? "Removing…" : "Remove"}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleRemove(r.student_id, r.name);
                      }}
                      disabled={removing === r.student_id}
                      sx={{ fontWeight: 700, cursor: "pointer", color: "#ef4444",
                        bgcolor: "color-mix(in srgb, #ef4444 12%, transparent)" }}
                    />
                  </Stack>
                }
              />
            ))}
          </Stack>
        </>
      )}

      <StudentDetailDrawer studentId={selected} open={selected != null} onClose={() => setSelected(null)} />
    </PageShell>
  );
}
