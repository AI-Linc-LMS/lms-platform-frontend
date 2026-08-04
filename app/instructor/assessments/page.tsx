"use client";

import { useEffect, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { Reveal } from "@/components/scorecard/shared";
import { instructorService, type InstructorAssessment } from "@/lib/services/instructor.service";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

export default function InstructorGradebookPage() {
  const [items, setItems] = useState<InstructorAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await instructorService.getAssessments();
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) setError(getAxiosErrorDetail(e, "Couldn't load your assessments."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPending = items.reduce((n, a) => n + a.pending_grading, 0);

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Teach"
        title="Gradebook"
        description="Assessments mapped to your batches. Track submissions and what's pending your review."
        accent="amber"
        icon="mdi:clipboard-check-outline"
      />

      {totalPending > 0 && (
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, display: "inline-flex", alignItems: "center", gap: 1,
          bgcolor: "color-mix(in srgb, #f59e0b 12%, transparent)", color: "#b45309", fontWeight: 700 }}>
          <Icon icon="mdi:alert-circle-outline" width={18} />
          {totalPending} submission{totalPending === 1 ? "" : "s"} pending your grading
        </Box>
      )}

      {error && <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>{error}</Typography>}
      {!error && !loading && items.length === 0 && (
        <Box sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default)" }}>
          <Typography sx={{ color: "text.secondary" }}>No assessments mapped to your batches yet.</Typography>
        </Box>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
        {items.map((a, i) => (
          <Reveal key={a.id} delay={Math.min(i, 8) * 0.05}>
            <Box sx={{ p: 2.25, borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)" }}>
              <Stack direction="row" alignItems="flex-start" spacing={1.25}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2.5, flexShrink: 0, display: "grid", placeItems: "center",
                  color: "#fff", background: "linear-gradient(135deg,#f59e0b,#ec4899)" }}>
                  <Icon icon="mdi:clipboard-text-outline" width={20} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "1rem" }} noWrap>{a.title}</Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: "0.82rem" }}>{a.duration_minutes} min</Typography>
                </Box>
                {a.is_draft && <Chip size="small" label="draft" sx={{ fontWeight: 700 }} />}
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <Chip size="small" icon={<Icon icon="mdi:file-document-outline" width={14} />}
                  label={`${a.submissions} submission${a.submissions === 1 ? "" : "s"}`} />
                <Chip size="small"
                  icon={<Icon icon={a.pending_grading ? "mdi:clock-alert-outline" : "mdi:check-circle-outline"} width={14} />}
                  label={a.pending_grading ? `${a.pending_grading} to grade` : "up to date"}
                  sx={{ fontWeight: 700, color: a.pending_grading ? "#b45309" : "#059669",
                    bgcolor: `color-mix(in srgb, ${a.pending_grading ? "#f59e0b" : "#10b981"} 14%, transparent)` }} />
              </Stack>
            </Box>
          </Reveal>
        ))}
      </Box>
    </PageShell>
  );
}
