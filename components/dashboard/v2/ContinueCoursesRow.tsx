"use client";

import { useRouter } from "next/navigation";
import { Box, ButtonBase, LinearProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { Reveal } from "@/components/scorecard/shared";
import type { DashboardCourse } from "@/lib/types/dashboard";
import { SectionHeader, daysLeft, fmtDate } from "./parts";

const ACCENTS = [
  { bar: "linear-gradient(90deg,#7c3aed,#a855f7)", btn: "linear-gradient(135deg,#7c3aed,#a855f7)" },
  { bar: "linear-gradient(90deg,#6366f1,#3b82f6)", btn: "linear-gradient(135deg,#6366f1,#3b82f6)" },
  { bar: "linear-gradient(90deg,#10b981,#22c55e)", btn: "linear-gradient(135deg,#10b981,#22c55e)" },
  { bar: "linear-gradient(90deg,#f59e0b,#f97316)", btn: "linear-gradient(135deg,#f59e0b,#f97316)" },
];

export function ContinueCoursesRow({ courses }: { courses: DashboardCourse[] }) {
  const router = useRouter();
  if (!courses.length) return null;

  return (
    <Box sx={{ mt: 1 }}>
      <SectionHeader icon="mdi:play-box-multiple" title="Continue your courses" subtitle="Pick up where you left off" />
      {/* minmax(0,1fr), not 1fr (= minmax(auto,1fr)): the cards' nowrap "You left at" value
          would otherwise inflate a column's min-content and make the cards unequal width. */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))", lg: "repeat(3,minmax(0,1fr))" }, gap: 2 }}>
        {courses.map((c, i) => {
          const accent = ACCENTS[i % ACCENTS.length];
          const left = c.upNext?.title || "Get started";
          const dl = daysLeft(c.due?.dueAt);
          const overdue = dl != null && dl < 0;
          const soon = dl != null && dl >= 0 && dl <= 2;
          const resume = c.resumeSubmoduleId
            ? `/adaptive-courses/${c.id}/submodule/${c.resumeSubmoduleId}`
            : `/adaptive-courses/${c.id}`;
          return (
            <Reveal key={c.id} delay={i * 0.05}>
              <Box sx={{ borderRadius: 4, border: "1px solid #eef2f7", bgcolor: "#fff", overflow: "hidden", boxShadow: "0 1px 2px rgba(16,24,40,0.04)", display: "flex", flexDirection: "column", height: "100%" }}>
                {c.cardImageUrl ? (
                  <Box sx={{ position: "relative", height: 116, overflow: "hidden" }}>
                    <Box component="img" src={c.cardImageUrl} alt="" loading="lazy" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(15,10,40,0) 45%, rgba(15,10,40,0.35) 100%)" }} />
                    <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: accent.bar }} />
                  </Box>
                ) : (
                  <Box sx={{ height: 4, background: accent.bar }} />
                )}
                <Box sx={{ p: 2, display: "flex", flexDirection: "column", flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a", lineHeight: 1.25 }}>{c.title}</Typography>

                  <Box sx={{ mt: 1.25, p: 1.25, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #eef2f7" }}>
                    <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: 0.5, color: "#94a3b8", textTransform: "uppercase" }}>You left at</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{left}</Typography>
                  </Box>

                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5, mb: 0.5 }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b" }}>Progress</Typography>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f172a" }}>{c.completionPct}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={c.completionPct} sx={{ height: 7, borderRadius: 4, bgcolor: "#eef2f7", "& .MuiLinearProgress-bar": { borderRadius: 4, background: accent.bar } }} />

                  {c.due?.dueAt && (
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1.25 }}>
                      <Icon icon={overdue ? "mdi:alarm" : "mdi:calendar-clock"} width={14} color={overdue ? "#dc2626" : soon ? "#b45309" : "#15803d"} />
                      <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: overdue ? "#dc2626" : soon ? "#b45309" : "#15803d" }}>
                        Due {fmtDate(c.due.dueAt)}{dl != null && dl >= 0 ? ` · ${dl} day${dl === 1 ? "" : "s"} left` : overdue ? " · overdue" : ""}
                      </Typography>
                    </Stack>
                  )}
                  {c.due?.penaltyNote && (
                    <Stack direction="row" spacing={0.5} alignItems="flex-start" sx={{ mt: 0.5 }}>
                      <Icon icon="mdi:alert" width={13} color={overdue || soon ? "#dc2626" : "#94a3b8"} style={{ flexShrink: 0, marginTop: 2 }} />
                      <Typography sx={{ fontSize: "0.72rem", color: overdue || soon ? "#dc2626" : "#94a3b8", lineHeight: 1.4 }}>{c.due.penaltyNote}</Typography>
                    </Stack>
                  )}

                  <Box sx={{ flex: 1 }} />
                  <ButtonBase
                    onClick={() => router.push(resume)}
                    sx={{ mt: 1.75, py: 1.1, borderRadius: 2.5, fontWeight: 800, fontSize: "0.88rem", color: "white", gap: 0.5, background: accent.btn }}
                  >
                    Continue <Icon icon="mdi:arrow-right" width={16} />
                  </ButtonBase>
                </Box>
              </Box>
            </Reveal>
          );
        })}
      </Box>
    </Box>
  );
}
