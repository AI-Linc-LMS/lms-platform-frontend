"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Chip, Stack, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { StudentDetailDrawer } from "@/components/instructor/StudentDetailDrawer";
import { instructorService, type CohortRoster } from "@/lib/services/instructor.service";
import { RosterRow } from "@/components/instructor/RosterRow";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

export default function InstructorCohortPage() {
  const params = useParams();
  const cohortId = Number(params?.id);
  const { push } = useInstantNavigation();
  const [roster, setRoster] = useState<CohortRoster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (!cohortId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await instructorService.getCohortStudents(cohortId);
        if (!cancelled) setRoster(r);
      } catch (e) {
        if (!cancelled) setError(getAxiosErrorDetail(e, "Couldn't load this batch."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cohortId]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = roster?.results ?? [];
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
  }, [roster, query]);

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Batch"
        title={roster?.name || "Batch"}
        description={`${roster?.count ?? 0} student${(roster?.count ?? 0) === 1 ? "" : "s"} in this batch.`}
        accent="indigo"
        icon="mdi:account-group"
        action={
          <HeaderActionButton icon="mdi:arrow-left" variant="ghost" onClick={() => push("/instructor/dashboard")}>
            Dashboard
          </HeaderActionButton>
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
                {roster?.count ? "No students match your search." : "No students in this batch yet."}
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
                right={<Chip size="small" label={r.status} sx={{ fontWeight: 700, textTransform: "capitalize" }} />}
              />
            ))}
          </Stack>
        </>
      )}

      <StudentDetailDrawer studentId={selected} open={selected != null} onClose={() => setSelected(null)} />
    </PageShell>
  );
}
