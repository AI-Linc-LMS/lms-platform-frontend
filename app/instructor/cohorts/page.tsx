"use client";

import { useEffect, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { Reveal } from "@/components/scorecard/shared";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { instructorService, type InstructorCohortDetail } from "@/lib/services/instructor.service";

const GRADS = [
  "linear-gradient(120deg,#6366f1,#f59e0b)",
  "linear-gradient(120deg,#a855f7,#ec4899)",
  "linear-gradient(120deg,#6366f1,#8b5cf6)",
  "linear-gradient(120deg,#0ea5e9,#6366f1)",
];

function fmtEnd(d: string | null): string {
  if (!d) return "";
  try {
    return `Ends ${new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase()}`;
  } catch {
    return "";
  }
}

export default function InstructorCohortsPage() {
  const { push, prefetch } = useInstantNavigation();
  const [cohorts, setCohorts] = useState<InstructorCohortDetail[]>([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await instructorService.getDashboard();
        if (!cancelled) {
          setCohorts(d.cohorts_detailed);
          setCode(d.instructor_code);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Couldn't load your cohorts.");
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
        eyebrow="Teaching"
        title="My Cohorts"
        description="Courses and cohorts assigned to you by admin. Membership is managed centrally — you own delivery, sessions and reporting."
        accent="purple"
        icon="mdi:school-outline"
        action={
          <HeaderActionButton icon="mdi:download-outline" variant="ghost" onClick={() => window.print()}>
            Export report
          </HeaderActionButton>
        }
      />

      {/* Assignment banner */}
      <Box sx={{ mb: 3, p: 2, borderRadius: 3, display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center",
        justifyContent: "space-between", bgcolor: "color-mix(in srgb,#6366f1 8%,transparent)",
        border: "1px solid color-mix(in srgb,#6366f1 22%,transparent)" }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "#4f46e5" }}>
          <Icon icon="mdi:information-outline" width={18} />
          <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
            Cohort rosters are assigned by your admin. Students join using your instructor code
            {code ? <> — <b>{code}</b>.</> : "."}
          </Typography>
        </Stack>
        <Button href="/tickets" startIcon={<Icon icon="mdi:headset" width={16} />}
          sx={{ textTransform: "none", fontWeight: 700, color: "#6366f1" }}>Request a change</Button>
      </Box>

      {error && <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>{error}</Typography>}
      {!error && !loading && cohorts.length === 0 && (
        <Box sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default)" }}>
          <Typography sx={{ color: "text.secondary" }}>No cohorts assigned yet. An admin can assign you to a cohort.</Typography>
        </Box>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }, gap: 2.5 }}>
        {cohorts.map((c, i) => (
          <Reveal key={c.id} delay={Math.min(i, 8) * 0.05}>
            <Box sx={{ borderRadius: 4, overflow: "hidden", bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)",
              boxShadow: "0 10px 30px -24px rgba(16,24,40,.3)" }}>
              {/* Gradient header */}
              <Box sx={{ p: 2, background: GRADS[i % GRADS.length], color: "#fff", minHeight: 96 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Chip size="small" label={c.client_name || "Cohort"} sx={{ fontWeight: 700, color: "#fff",
                    bgcolor: "rgba(255,255,255,0.18)" }} />
                  {c.end_date && <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: 0.6,
                    bgcolor: "rgba(0,0,0,0.2)", px: 1, py: 0.4, borderRadius: 999 }}>{fmtEnd(c.end_date)}</Typography>}
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: "50%", display: "grid", placeItems: "center",
                    bgcolor: "rgba(255,255,255,0.25)", border: "2px solid rgba(255,255,255,0.5)" }}>
                    <Icon icon="mdi:account" width={18} />
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", ml: 0.5 }}>
                    {c.student_count} student{c.student_count === 1 ? "" : "s"}
                  </Typography>
                </Stack>
              </Box>
              {/* Body */}
              <Box sx={{ p: 2.25 }}>
                <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>{c.name}</Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.secondary", mt: 0.5 }}>
                  <Icon icon="mdi:bookmark-outline" width={14} />
                  <Typography sx={{ fontSize: "0.82rem" }}>{c.client_name || "AI Linc"}</Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, mb: 0.5 }}>
                  <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>Cohort progress</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.85rem" }}>{c.progress}%</Typography>
                </Stack>
                <Box sx={{ height: 8, borderRadius: 4, bgcolor: "color-mix(in srgb,var(--border-default) 50%,transparent)", overflow: "hidden" }}>
                  <Box sx={{ width: `${Math.max(0, Math.min(100, c.progress))}%`, height: "100%", background: GRADS[i % GRADS.length] }} />
                </Box>

                <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderRadius: 2.5,
                  border: "1px solid var(--border-default)", overflow: "hidden" }}>
                  {[
                    { n: c.student_count, l: "students", d: false },
                    { n: `${c.avg_score}%`, l: "avg score", d: false },
                    { n: c.at_risk, l: "at risk", d: c.at_risk > 0 },
                  ].map((s, j) => (
                    <Box key={s.l} sx={{ p: 1.5, textAlign: "center", borderLeft: j ? "1px solid var(--border-default)" : "none" }}>
                      <Typography sx={{ fontWeight: 900, fontSize: "1.2rem", color: s.d ? "#ef4444" : "var(--font-primary)" }}>{s.n}</Typography>
                      <Typography sx={{ fontSize: "0.62rem", color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.4 }}>{s.l}</Typography>
                    </Box>
                  ))}
                </Box>

                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button fullWidth onClick={() => push(`/instructor/cohorts/${c.id}`)}
                    onMouseEnter={() => prefetch(`/instructor/cohorts/${c.id}`)}
                    endIcon={<Icon icon="mdi:arrow-right" width={18} />}
                    sx={{ py: 1.1, borderRadius: 2.5, fontWeight: 800, textTransform: "none", color: "#fff",
                      background: "linear-gradient(135deg,#7c3aed,#ec4899)", "&:hover": { filter: "brightness(1.06)" } }}>
                    Student report
                  </Button>
                  <Button onClick={() => push("/instructor/live-sessions")}
                    sx={{ minWidth: 48, borderRadius: 2.5, border: "1px solid var(--border-default)", color: "#6366f1" }}>
                    <Icon icon="mdi:access-point" width={18} />
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Reveal>
        ))}
      </Box>
    </PageShell>
  );
}
