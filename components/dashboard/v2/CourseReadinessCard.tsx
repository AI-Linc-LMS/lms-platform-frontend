"use client";

import { useRouter } from "next/navigation";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { AnimatedRing } from "@/components/scorecard/shared";
import type { DashboardCourse } from "@/lib/types/dashboard";
import { BAND_STYLE, SignalBar } from "./parts";

const SIGNALS: { key: "coverage" | "precision" | "craft" | "clutch"; icon: string; label: string; sub: string }[] = [
  { key: "coverage", icon: "mdi:book-open-variant", label: "Curriculum Coverage", sub: "topics & skills completed" },
  { key: "precision", icon: "mdi:target", label: "Practice Precision", sub: "accuracy in quizzes & drills" },
  { key: "craft", icon: "mdi:code-tags", label: "Applied Craft", sub: "hands-on coding expertise" },
  { key: "clutch", icon: "mdi:trophy-variant", label: "Clutch Performance", sub: "assessments & interviews" },
];

export function CourseReadinessCard({
  courses, activeCourseId, onSelect,
}: { courses: DashboardCourse[]; activeCourseId: number | null; onSelect: (id: number) => void }) {
  const router = useRouter();
  const active = courses.find((c) => c.id === activeCourseId) ?? courses[0];
  if (!active) return null;

  const overall = active.readiness.overall;
  const skills = active.skillProfile.skills;
  const strongest = skills.length ? skills[0] : null;
  const weakest = skills.length ? skills[skills.length - 1] : null;
  const fixRoute = active.resumeSubmoduleId
    ? `/adaptive-courses/${active.id}/submodule/${active.resumeSubmoduleId}`
    : `/adaptive-courses/${active.id}`;

  return (
    <Box sx={{ borderRadius: 4, p: { xs: 2, md: 2.5 }, mb: 2.5, color: "#fff", backgroundColor: "#110b2e", backgroundImage: "linear-gradient(160deg, #1a1442 0%, #110b2e 100%)", boxShadow: "0 18px 40px -24px rgba(76,29,149,0.6)" }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.75 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ width: 32, height: 32, borderRadius: 2, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #6366f1, #a855f7)" }}>
            <Icon icon="mdi:target-variant" width={18} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.15rem" }}>Course readiness</Typography>
        </Stack>
        <Typography sx={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.55)", display: { xs: "none", sm: "block" }, maxWidth: 240, textAlign: "right" }}>
          Four signals of how prepared you are in each course
        </Typography>
      </Stack>

      {/* Tabs */}
      {courses.length > 1 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          {[...courses]
            .sort((a, b) => (b.readiness.overall.percent ?? -1) - (a.readiness.overall.percent ?? -1))
            .map((c) => {
            const on = c.id === active.id;
            return (
              <ButtonBase
                key={c.id}
                onClick={() => onSelect(c.id)}
                sx={{ px: 1.5, py: 0.75, borderRadius: 999, gap: 0.6, fontSize: "0.82rem", fontWeight: 700, color: on ? "#fff" : "rgba(255,255,255,0.6)", bgcolor: on ? "rgba(255,255,255,0.14)" : "transparent", border: "1px solid", borderColor: on ? "rgba(255,255,255,0.2)" : "transparent" }}
              >
                <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: BAND_STYLE[c.readiness.overall.band].bar }} />
                {c.title}
                {c.readiness.overall.percent != null && (
                  <Box component="span" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 800 }}>{c.readiness.overall.percent}%</Box>
                )}
              </ButtonBase>
            );
          })}
        </Stack>
      )}

      {/* Ring + signals */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="center">
        <Box sx={{ flexShrink: 0, textAlign: "center" }}>
          {/* Overlay confined to the ring box (150x150) so the % sits at the ring's centre */}
          <Box sx={{ position: "relative", width: 150, height: 150, mx: "auto" }}>
            <AnimatedRing value={overall.percent ?? 0} size={150} strokeWidth={12} color="#a855f7" colorEnd="#6366f1" trackColor="rgba(255,255,255,0.12)" showValue={false} />
            <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              {overall.percent == null ? (
                <>
                  <Typography sx={{ fontWeight: 900, fontSize: "1.5rem", color: "rgba(255,255,255,0.9)", lineHeight: 1 }}>New</Typography>
                  <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: 1, color: "rgba(255,255,255,0.6)", mt: 0.4 }}>TO START</Typography>
                </>
              ) : (
                <>
                  <Typography sx={{ fontWeight: 900, fontSize: "2rem", color: "#fff", lineHeight: 1 }}>
                    {overall.percent}<Box component="span" sx={{ fontSize: "1rem" }}>%</Box>
                  </Typography>
                  <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: 1, color: "rgba(255,255,255,0.6)", mt: 0.4 }}>READY</Typography>
                </>
              )}
            </Box>
          </Box>
          <Typography sx={{ mt: 1, fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{active.title}</Typography>
        </Box>

        <Box sx={{ flex: 1, width: "100%" }}>
          {[...SIGNALS]
            .sort((a, b) => (active.readiness[b.key].percent ?? -1) - (active.readiness[a.key].percent ?? -1))
            .map((s) => {
            const cell = active.readiness[s.key];
            return <SignalBar key={s.key} icon={s.icon} label={s.label} sub={s.sub} percent={cell.percent} band={cell.band} dark />;
          })}
        </Box>
      </Stack>

      {/* AI insight strip */}
      {(strongest || weakest) && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} justifyContent="space-between" sx={{ mt: 1.5, p: 1.75, borderRadius: 3, bgcolor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Stack direction="row" spacing={0.75} alignItems="flex-start" sx={{ minWidth: 0 }}>
            <Icon icon="mdi:star-four-points" width={16} color="#fde68a" style={{ flexShrink: 0, marginTop: 2 }} />
            <Typography sx={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
              In <b style={{ color: "#fff" }}>{active.title}</b> you&apos;re strongest at{" "}
              {strongest && <Box component="span" sx={{ color: "#86efac", fontWeight: 700 }}>{strongest.skill} ({strongest.percent}%)</Box>}
              {strongest && weakest && " and weakest at "}
              {weakest && <Box component="span" sx={{ color: "#f0abfc", fontWeight: 700 }}>{weakest.skill} ({weakest.percent}%)</Box>}. {active.skillProfile.aiTip}
            </Typography>
          </Stack>
          <ButtonBase onClick={() => router.push(fixRoute)} sx={{ flexShrink: 0, px: 2.25, py: 1, borderRadius: 999, fontWeight: 800, fontSize: "0.85rem", color: "white", gap: 0.5, background: "linear-gradient(135deg, #a855f7, #ec4899)" }}>
            Fix it <Icon icon="mdi:arrow-right" width={16} />
          </ButtonBase>
        </Stack>
      )}
    </Box>
  );
}
