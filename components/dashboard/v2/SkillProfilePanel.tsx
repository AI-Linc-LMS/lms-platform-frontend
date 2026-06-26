"use client";

import { Box, LinearProgress, MenuItem, Select, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { DashboardCourse } from "@/lib/types/dashboard";
import { PanelCard } from "./parts";

const SKILL_STYLE = {
  strong: { color: "#15803d", bg: "#dcfce7", bar: "#22c55e", label: "Strong" },
  emerging: { color: "#b45309", bg: "#fef3c7", bar: "#f59e0b", label: "Emerging" },
};

export function SkillProfilePanel({
  courses, activeCourseId, onSelect, crossCourseMastery,
}: {
  courses: DashboardCourse[];
  activeCourseId: number | null;
  onSelect: (id: number) => void;
  crossCourseMastery: number | null;
}) {
  const active = courses.find((c) => c.id === activeCourseId) ?? courses[0];
  if (!active) return null;
  const sp = active.skillProfile;
  const tier = sp.fieldTier ? sp.fieldTier.toUpperCase() : null;

  return (
    <PanelCard>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.25 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ width: 30, height: 30, borderRadius: 2, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #6366f1, #a855f7)" }}>
            <Icon icon="mdi:brain" width={17} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: 0.6, color: "#7c3aed" }}>
              ADAPTIVE{tier ? ` · ${tier}` : ""}
            </Typography>
            <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem", lineHeight: 1.1 }}>Your Skill Profile</Typography>
          </Box>
        </Stack>
      </Stack>

      {courses.length > 1 && (
        <Select
          size="small"
          value={active.id}
          onChange={(e) => onSelect(Number(e.target.value))}
          fullWidth
          sx={{ mb: 1.5, fontSize: "0.82rem", fontWeight: 700, "& .MuiSelect-select": { py: 0.75 } }}
        >
          {courses.map((c) => (
            <MenuItem key={c.id} value={c.id} sx={{ fontSize: "0.82rem" }}>{c.title}</MenuItem>
          ))}
        </Select>
      )}

      <Box sx={{ p: 1.5, borderRadius: 3, color: "white", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", mb: 1.5 }}>
        <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: 0.5, color: "rgba(255,255,255,0.85)" }}>MASTERY · THIS COURSE</Typography>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between">
          <Typography sx={{ fontWeight: 900, fontSize: "2rem", lineHeight: 1 }}>{sp.mastery ?? "—"}%</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.85)" }}>{sp.skillsTracked} skills tracked</Typography>
        </Stack>
        {crossCourseMastery != null && (
          <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.8)", mt: 0.5 }}>Across all courses: {crossCourseMastery}%</Typography>
        )}
      </Box>

      {sp.skills.length > 0 ? (
        <Stack spacing={1.1}>
          {sp.skills.slice(0, 6).map((sk) => {
            const s = SKILL_STYLE[sk.band];
            return (
              <Box key={sk.skill}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.4 }}>
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a" }}>{sk.skill}</Typography>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Box component="span" sx={{ px: 0.75, py: 0.15, borderRadius: 999, fontSize: "0.6rem", fontWeight: 800, color: s.color, bgcolor: s.bg }}>{s.label}</Box>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: s.color, minWidth: 36, textAlign: "right" }}>{sk.percent}%</Typography>
                  </Stack>
                </Stack>
                <LinearProgress variant="determinate" value={sk.percent} sx={{ height: 6, borderRadius: 4, bgcolor: "#eef2f7", "& .MuiLinearProgress-bar": { bgcolor: s.bar, borderRadius: 4 } }} />
              </Box>
            );
          })}
        </Stack>
      ) : (
        <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8", py: 1 }}>Take the calibration to map your skills here.</Typography>
      )}

      <Stack direction="row" spacing={0.6} alignItems="flex-start" sx={{ mt: 1.5, p: 1.25, borderRadius: 2, bgcolor: "#f5f3ff" }}>
        <Icon icon="mdi:star-four-points" width={13} color="#6d28d9" style={{ flexShrink: 0, marginTop: 2 }} />
        <Typography sx={{ fontSize: "0.74rem", color: "#6d28d9", fontWeight: 600, lineHeight: 1.45 }}>{sp.aiTip}</Typography>
      </Stack>
    </PanelCard>
  );
}
