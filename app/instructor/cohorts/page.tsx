"use client";

import { useEffect, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { Reveal } from "@/components/scorecard/shared";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { instructorService, type InstructorCohort } from "@/lib/services/instructor.service";

export default function InstructorCohortsPage() {
  const { push, prefetch } = useInstantNavigation();
  const [cohorts, setCohorts] = useState<InstructorCohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await instructorService.getCohorts();
        if (!cancelled) setCohorts(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Couldn't load your batches.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Teach"
        title="My batches"
        description="The cohorts you're assigned to. Open one for its roster and student details."
        accent="indigo"
        icon="mdi:account-group"
      />
      {error && <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>{error}</Typography>}
      {!error && !loading && cohorts.length === 0 && (
        <Box sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default)" }}>
          <Typography sx={{ color: "text.secondary" }}>No batches assigned yet. An admin can assign you to a cohort.</Typography>
        </Box>
      )}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 2 }}>
        {cohorts.map((c, i) => (
          <Reveal key={c.id} delay={Math.min(i, 8) * 0.05}>
            <Box
              onClick={() => push(`/instructor/cohorts/${c.id}`)}
              onMouseEnter={() => prefetch(`/instructor/cohorts/${c.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") push(`/instructor/cohorts/${c.id}`); }}
              sx={{ cursor: "pointer", p: 2.25, borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)",
                transition: "transform .14s, box-shadow .14s, border-color .14s",
                "&:hover": { transform: "translateY(-3px)", borderColor: "color-mix(in srgb, #6366f1 40%, transparent)", boxShadow: "0 20px 40px -26px rgba(99,102,241,0.45)" } }}
            >
              <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2.5, display: "grid", placeItems: "center", color: "#fff", flexShrink: 0, background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                  <Icon icon="mdi:account-group" width={20} />
                </Box>
                <Chip size="small" label={c.status} sx={{ fontWeight: 700, textTransform: "capitalize" }} />
              </Stack>
              <Typography sx={{ fontWeight: 800, fontSize: "1rem" }} noWrap>{c.name}</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.84rem", mt: 0.5 }}>
                {c.member_count} student{c.member_count === 1 ? "" : "s"} · {c.artifact_count} item{c.artifact_count === 1 ? "" : "s"}
              </Typography>
            </Box>
          </Reveal>
        ))}
      </Box>
    </PageShell>
  );
}
