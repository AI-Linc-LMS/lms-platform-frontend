"use client";

import { Box, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { JourneyAdaptive } from "@/lib/services/admin/admin-student.service";
import { ADAPTIVE, EmptyState, SkillBars, StatPill } from "./shared";

function Panel({
  icon,
  title,
  accent,
  children,
}: {
  icon: string;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
        backgroundColor: "var(--card-bg)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: `color-mix(in srgb, ${accent} 14%, transparent)`,
          }}
        >
          <IconWrapper icon={icon} size={20} color={accent} />
        </Box>
        <Typography sx={{ fontWeight: 700, color: "var(--font-primary)" }}>{title}</Typography>
      </Box>
      {children}
    </Box>
  );
}

export function AdaptiveTab({ adaptive }: { adaptive: JourneyAdaptive }) {
  const { quiz, coding, video } = adaptive;
  const totalSessions =
    (quiz?.session_count ?? 0) + (coding?.session_count ?? 0) + (video?.session_count ?? 0);

  if (totalSessions === 0) {
    return (
      <EmptyState
        icon="mdi:brain"
        title="No adaptive learning activity"
        hint="Adaptive quiz, coding, and video sessions will appear here once the student starts them."
      />
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Panel icon="mdi:lightbulb-on" title="Adaptive Quiz" accent={ADAPTIVE.indigo}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
          <StatPill label="Sessions" value={quiz.session_count} accent={ADAPTIVE.indigo} />
          <StatPill label="Completed" value={quiz.completed_count} accent={ADAPTIVE.green} />
        </Box>
        <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--font-secondary)", mb: 1 }}>
          Skill ability (θ → normalized)
        </Typography>
        <SkillBars
          data={Object.fromEntries(
            Object.entries(quiz.skill_ability || {}).map(([k, v]) => [
              k,
              // θ typically ranges ~[-3,3]; map to 0..100 for display.
              Math.max(0, Math.min(100, ((v + 3) / 6) * 100)),
            ])
          )}
          scale={100}
          emptyLabel="No quiz ability estimated yet."
        />
      </Panel>

      <Panel icon="mdi:code-braces" title="Adaptive Coding" accent={ADAPTIVE.pink}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
          <StatPill label="Sessions" value={coding.session_count} accent={ADAPTIVE.pink} />
          <StatPill label="Passed" value={coding.passed_count} accent={ADAPTIVE.green} />
        </Box>
        <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--font-secondary)", mb: 1 }}>
          Skill mastery
        </Typography>
        <SkillBars data={coding.mastery || {}} scale={1} emptyLabel="No mastery recorded yet." />
        {Array.isArray(coding.misconceptions) && coding.misconceptions.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--font-secondary)", mb: 1 }}>
              Recent conceptual gaps
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {coding.misconceptions.slice(-12).map((m, i) => {
                const label =
                  typeof m === "string"
                    ? m
                    : (m as { conceptual_gap?: string; gap?: string })?.conceptual_gap ||
                      (m as { gap?: string })?.gap ||
                      JSON.stringify(m).slice(0, 40);
                return (
                  <Box
                    key={i}
                    sx={{
                      px: 1,
                      py: 0.4,
                      borderRadius: 999,
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: ADAPTIVE.red,
                      bgcolor: "color-mix(in srgb, #ef4444 12%, transparent)",
                    }}
                  >
                    {label}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Panel>

      <Panel icon="mdi:play-circle" title="Video Companion" accent={ADAPTIVE.purple}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          <StatPill label="Sessions" value={video.session_count} accent={ADAPTIVE.purple} />
          <StatPill label="Completed" value={video.completed_count} accent={ADAPTIVE.green} />
          <StatPill
            label="Avg comprehension"
            value={
              video.avg_comprehension != null
                ? `${Math.round(video.avg_comprehension * 100)}%`
                : "—"
            }
            accent={ADAPTIVE.blue}
          />
        </Box>
      </Panel>
    </Box>
  );
}
