"use client";

import { useEffect, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { Reveal } from "@/components/scorecard/shared";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { instructorService, type InstructorCohortDetail } from "@/lib/services/instructor.service";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

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

/** Percent display that reads cleanly at the low end (0 / <1% / rounded). */
function fmtPct(n: number): string {
  const v = Number(n) || 0;
  if (v <= 0) return "0%";
  if (v < 1) return "<1%";
  return `${Math.round(v)}%`;
}

/** Overlapping (cascade) avatar cluster for a cohort's students. */
function AvatarCascade({ count }: { count: number }) {
  const shown = Math.min(Math.max(count, 0), 4);
  const extra = count - shown;
  return (
    <Stack direction="row" alignItems="center" spacing={0.75}>
      {shown > 0 && (
        <Box sx={{ display: "flex" }}>
          {Array.from({ length: shown }).map((_, i) => (
            <Box key={i} sx={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center",
              bgcolor: "rgba(255,255,255,0.28)", border: "2px solid rgba(255,255,255,0.85)",
              ml: i === 0 ? 0 : "-11px", zIndex: shown - i, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
              <Icon icon="mdi:account" width={15} style={{ color: "#fff" }} />
            </Box>
          ))}
          {extra > 0 && (
            <Box sx={{ minWidth: 30, height: 30, px: 0.6, borderRadius: 999, display: "grid", placeItems: "center",
              bgcolor: "rgba(0,0,0,0.32)", border: "2px solid rgba(255,255,255,0.7)", ml: "-11px", zIndex: 0 }}>
              <Typography sx={{ fontSize: "0.64rem", fontWeight: 900, color: "#fff" }}>+{extra}</Typography>
            </Box>
          )}
        </Box>
      )}
      <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", ml: shown > 0 ? 0.5 : 0 }}>
        {count} student{count === 1 ? "" : "s"}
      </Typography>
    </Stack>
  );
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
        if (!cancelled) setError(getAxiosErrorDetail(e, "Couldn't load your cohorts."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Export a CSV of the instructor's cohorts/courses + their student stats (was window.print()).
  const exportCsv = () => {
    if (cohorts.length === 0) return;
    const esc = (v: string) => {
      const s = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const header = ["Cohort / Course", "Client", "Status", "Ends", "Students", "Avg score %", "At risk", "Progress %"];
    const rows = cohorts.map((c) =>
      [c.name, c.client_name || "", c.status || "", c.end_date || "", String(c.student_count),
        String(Math.round(c.avg_score)), String(c.at_risk), String(Math.round(c.progress))]
        .map(esc).join(","),
    );
    const csv = [header.map(esc).join(","), ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "cohort-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Teaching"
        title="My Cohorts"
        description="A batch is a group of students studying together. Open one to see its students, the courses it is doing, and its progress. Rosters and course mapping are set by your admin."
        accent="purple"
        icon="mdi:school-outline"
        action={
          <HeaderActionButton icon="mdi:download-outline" variant="ghost" onClick={exportCsv} disabled={cohorts.length === 0}>
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
            {code ? <>: <b>{code}</b>.</> : "."}
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
                <Box sx={{ mt: 1.5 }}>
                  <AvatarCascade count={c.student_count} />
                </Box>
              </Box>
              {/* Body */}
              <Box sx={{ p: 2.25 }}>
                <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>{c.name}</Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.secondary", mt: 0.5 }}>
                  <Icon icon="mdi:bookmark-outline" width={14} />
                  <Typography sx={{ fontSize: "0.82rem" }}>{c.client_name || "AI Linc"}</Typography>
                </Stack>

                {/* What this batch is actually studying. Without it, "My Cohorts" and "My Courses"
                    read as two unrelated lists and nobody can tell which batch does which course. */}
                <Box sx={{ mt: 1.25, display: "flex", flexWrap: "wrap", gap: 0.6, alignItems: "center" }}>
                  <Icon icon="mdi:book-open-variant" width={14} style={{ color: "var(--font-tertiary)" }} />
                  {(c.courses ?? []).length === 0 ? (
                    <Typography sx={{ fontSize: "0.78rem", color: "var(--font-tertiary)", fontStyle: "italic" }}>
                      No course assigned yet — ask your admin to map one to this batch.
                    </Typography>
                  ) : (
                    (c.courses ?? []).slice(0, 3).map((co) => (
                      <Chip
                        key={co.id}
                        size="small"
                        label={co.title}
                        sx={{ fontWeight: 700, fontSize: "0.7rem", height: 22,
                              bgcolor: "color-mix(in srgb,#6366f1 12%,transparent)", color: "#4f46e5" }}
                      />
                    ))
                  )}
                  {(c.courses ?? []).length > 3 && (
                    <Typography sx={{ fontSize: "0.74rem", color: "var(--font-tertiary)", fontWeight: 700 }}>
                      +{(c.courses ?? []).length - 3} more
                    </Typography>
                  )}
                </Box>

                <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, mb: 0.5 }}>
                  <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>Cohort progress</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.85rem" }}>{fmtPct(c.progress)}</Typography>
                </Stack>
                <Box sx={{ height: 8, borderRadius: 4, bgcolor: "color-mix(in srgb,var(--border-default) 50%,transparent)", overflow: "hidden" }}>
                  <Box sx={{ width: `${Math.max(0, Math.min(100, c.progress))}%`, height: "100%", background: GRADS[i % GRADS.length] }} />
                </Box>

                <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderRadius: 2.5,
                  border: "1px solid var(--border-default)", overflow: "hidden" }}>
                  {[
                    { n: c.student_count, l: "students", d: false },
                    { n: fmtPct(c.avg_score), l: "avg score", d: false },
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
