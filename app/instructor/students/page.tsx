"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, Button, Chip, LinearProgress, Stack, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { RosterRow } from "@/components/instructor/RosterRow";
import { StudentDetailDrawer } from "@/components/instructor/StudentDetailDrawer";
import { instructorService, type InstructorStudentRow } from "@/lib/services/instructor.service";

export default function InstructorStudentsPage() {
  const [rows, setRows] = useState<InstructorStudentRow[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const load = useCallback(async (search: string, p: number) => {
    setLoading(true);
    try {
      const data = await instructorService.getStudents(search || undefined, p);
      setRows(data.results);
      setCount(data.count);
      setPage(data.page);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load your students.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("", 1);
  }, [load]);

  // Debounced search.
  useEffect(() => {
    const h = setTimeout(() => void load(query, 1), 350);
    return () => clearTimeout(h);
  }, [query, load]);

  const pageSize = 25;
  const pages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Teach"
        title="Students"
        description="Everyone in the courses and batches you're assigned to, with their progress."
        accent="emerald"
        icon="mdi:account-school"
      />

      <TextField
        size="small"
        fullWidth
        placeholder="Search students by name or email…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ maxWidth: 420, mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "var(--surface)" } }}
        InputProps={{ startAdornment: <Icon icon="mdi:magnify" width={18} style={{ marginRight: 6, opacity: 0.6 }} /> }}
      />

      {error && <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>{error}</Typography>}
      {!error && !loading && rows.length === 0 && (
        <Box sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default)" }}>
          <Typography sx={{ color: "text.secondary" }}>
            {count === 0 ? "No students in your courses or batches yet." : "No students match your search."}
          </Typography>
        </Box>
      )}

      <Stack spacing={1}>
        {rows.map((s) => (
          <RosterRow
            key={s.student_id}
            name={s.name}
            email={s.email}
            onClick={() => setSelected(s.student_id)}
            right={
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 96, display: { xs: "none", sm: "block" } }}>
                  <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, s.progress))}
                    sx={{ height: 6, borderRadius: 3 }} />
                  <Typography sx={{ fontSize: "0.68rem", color: "text.secondary", mt: 0.25 }}>
                    {Math.round(s.progress)}% avg
                  </Typography>
                </Box>
                <Chip size="small" icon={<Icon icon="mdi:book-outline" width={13} />}
                  label={s.courses_count} sx={{ fontWeight: 700 }} />
              </Stack>
            }
          />
        ))}
      </Stack>

      {pages > 1 && (
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
          <Button disabled={page <= 1 || loading} onClick={() => void load(query, page - 1)}
            startIcon={<Icon icon="mdi:chevron-left" />}>Prev</Button>
          <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>Page {page} of {pages} · {count} students</Typography>
          <Button disabled={page >= pages || loading} onClick={() => void load(query, page + 1)}
            endIcon={<Icon icon="mdi:chevron-right" />}>Next</Button>
        </Stack>
      )}

      <StudentDetailDrawer studentId={selected} open={selected != null} onClose={() => setSelected(null)} />
    </PageShell>
  );
}
