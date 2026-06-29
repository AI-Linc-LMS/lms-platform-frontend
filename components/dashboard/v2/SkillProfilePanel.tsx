"use client";

import { useRouter } from "next/navigation";
import { Box, ButtonBase, LinearProgress, MenuItem, Select, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { DashboardCourse } from "@/lib/types/dashboard";
import { PanelCard } from "./parts";

const SKILL_STYLE = {
  strong: { color: "#15803d", bg: "#dcfce7", bar: "#22c55e", label: "Strong" },
  emerging: { color: "#7c3aed", bg: "#f3e8ff", bar: "#a855f7", label: "Emerging" },
};

export function SkillProfilePanel({
  courses, activeCourseId, onSelect, crossCourseMastery,
}: {
  courses: DashboardCourse[];
  activeCourseId: number | null;
  onSelect: (id: number) => void;
  crossCourseMastery: number | null;
}) {
  const router = useRouter();
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
        <ButtonBase onClick={() => router.push(`/adaptive-courses/${active.id}`)} sx={{ fontSize: "0.74rem", fontWeight: 700, color: "#7c3aed", flexShrink: 0, gap: 0.25 }}>
          Full report →
        </ButtonBase>
      </Stack>

      {courses.length > 1 && (
        <Select
          size="small"
          value={active.id}
          onChange={(e) => onSelect(Number(e.target.value))}
          fullWidth
          MenuProps={{
            elevation: 0,
            PaperProps: { sx: { mt: 0.75, borderRadius: 3, border: "1px solid #eef2f7", boxShadow: "0 18px 44px -18px rgba(16,24,40,0.32)", overflow: "hidden" } },
            MenuListProps: { sx: { py: 0.5 } },
          }}
          renderValue={(val) => {
            const c = courses.find((x) => x.id === val);
            return (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#a855f7", flexShrink: 0 }} />
                <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c?.title}</Box>
              </Stack>
            );
          }}
          sx={{
            mb: 1.5, borderRadius: 2.5, bgcolor: "#fff", fontSize: "0.86rem", fontWeight: 700, color: "#0f172a",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#c4b5fd" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#7c3aed", borderWidth: 2 },
            "& .MuiSelect-select": { py: 1, pl: 1.5, display: "flex", alignItems: "center" },
            "& .MuiSelect-icon": { color: "#94a3b8", right: 10 },
          }}
        >
          {courses.map((c) => (
            <MenuItem
              key={c.id}
              value={c.id}
              sx={{
                fontSize: "0.86rem", fontWeight: 600, py: 1, px: 1.5, gap: 1, mx: 0.5, borderRadius: 2,
                "&:hover": { bgcolor: "#f8fafc" },
                "&.Mui-selected": { bgcolor: "#f5f3ff" },
                "&.Mui-selected:hover": { bgcolor: "#ede9fe" },
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, bgcolor: c.id === active.id ? "#a855f7" : "#cbd5e1" }} />
              <Box component="span" sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</Box>
              {c.id === active.id && <Icon icon="mdi:check" width={16} color="#7c3aed" />}
            </MenuItem>
          ))}
        </Select>
      )}

      <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: "#f5f3ff", border: "1px solid #ede9fe", mb: 1.5 }}>
        <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: 0.5, color: "#94a3b8" }}>MASTERY · THIS COURSE</Typography>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between">
          <Typography sx={{ fontWeight: 900, fontSize: "2.2rem", lineHeight: 1, color: "#6366f1" }}>{sp.mastery ?? "—"}%</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>{sp.skillsTracked} skills tracked</Typography>
        </Stack>
        {crossCourseMastery != null && (
          <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8", mt: 0.5 }}>Across all courses: <b style={{ color: "#475569" }}>{crossCourseMastery}%</b></Typography>
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
        <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8", py: 1 }}>Complete course quizzes to map your skills here.</Typography>
      )}

      <Stack direction="row" spacing={0.6} alignItems="flex-start" sx={{ mt: 1.5, p: 1.25, borderRadius: 2, bgcolor: "#f5f3ff" }}>
        <Icon icon="mdi:star-four-points" width={13} color="#6d28d9" style={{ flexShrink: 0, marginTop: 2 }} />
        <Typography sx={{ fontSize: "0.74rem", color: "#6d28d9", fontWeight: 600, lineHeight: 1.45 }}>{sp.aiTip}</Typography>
      </Stack>
    </PanelCard>
  );
}
