"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { KpiRail } from "@/components/scorecard/shared";
import {
  instructorService,
  type InstructorDashboard,
  type InstructorStudentRow,
} from "@/lib/services/instructor.service";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

const BUCKETS = [
  { label: "0–25%", min: 0, max: 25, color: "#ef4444" },
  { label: "25–50%", min: 25, max: 50, color: "#f59e0b" },
  { label: "50–75%", min: 50, max: 75, color: "#6366f1" },
  { label: "75–100%", min: 75, max: 100.01, color: "#10b981" },
];

export default function InstructorAnalyticsPage() {
  const [dash, setDash] = useState<InstructorDashboard | null>(null);
  const [students, setStudents] = useState<InstructorStudentRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [d, s] = await Promise.all([
          instructorService.getDashboard(),
          instructorService.getStudents({ page: 1, pageSize: 100 }),
        ]);
        if (cancelled) return;
        setDash(d);
        setStudents(s.results);
      } catch (e) {
        if (!cancelled) setError(getAxiosErrorDetail(e, "Couldn't load analytics."));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const distribution = useMemo(() => {
    const counts = BUCKETS.map(() => 0);
    students.forEach((s) => {
      const idx = BUCKETS.findIndex((b) => s.progress >= b.min && s.progress < b.max);
      if (idx >= 0) counts[idx] += 1;
    });
    const max = Math.max(1, ...counts);
    return BUCKETS.map((b, i) => ({ ...b, count: counts[i], pct: (counts[i] / max) * 100 }));
  }, [students]);

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Teach"
        title="Analytics"
        description="How your students are progressing across the courses and batches you teach."
        accent="cyan"
        icon="mdi:chart-box-outline"
      />

      {error && <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>{error}</Typography>}

      {!error && (
        <>
          <KpiRail
            items={[
              { value: `${dash?.avg_progress ?? 0}%`, label: "Avg progress", accent: "#6366f1" },
              { value: `${dash?.completion_rate ?? 0}%`, label: "Completed", accent: "#10b981" },
              { value: dash?.active_students ?? 0, label: "Active (7d)", accent: "#06b6d4" },
              { value: dash?.at_risk_count ?? 0, label: "At risk", accent: "#ef4444" },
            ]}
          />

          <Box sx={{ mt: 3.5, p: { xs: 2, md: 3 }, borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)" }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Icon icon="mdi:chart-bar" width={20} style={{ color: "#06b6d4" }} />
              <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>Progress distribution</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.82rem" }}>
                · {students.length} student{students.length === 1 ? "" : "s"}
              </Typography>
            </Stack>
            <Stack spacing={1.5}>
              {distribution.map((b) => (
                <Stack key={b.label} direction="row" alignItems="center" spacing={1.5}>
                  <Typography sx={{ width: 72, fontSize: "0.8rem", color: "text.secondary", flexShrink: 0 }}>{b.label}</Typography>
                  <Box sx={{ flex: 1, height: 22, borderRadius: 1.5, bgcolor: "color-mix(in srgb, var(--border-default) 40%, transparent)", overflow: "hidden" }}>
                    <Box sx={{ width: `${b.pct}%`, height: "100%", borderRadius: 1.5, background: b.color, transition: "width .5s ease" }} />
                  </Box>
                  <Typography sx={{ width: 32, textAlign: "right", fontWeight: 800, fontSize: "0.85rem" }}>{b.count}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </>
      )}
    </PageShell>
  );
}
