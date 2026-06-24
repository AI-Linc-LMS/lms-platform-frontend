"use client";

import { useEffect, useState } from "react";
import { Avatar, Box, ButtonBase, LinearProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type { JourneyBoard, Leaderboard } from "@/lib/types/adaptive-journey";

// Medal colours for the top-3 rank circles.
const RANK_BG = ["#fde68a", "#e5e7eb", "#e7c4a0"];
const RANK_FG = ["#92400e", "#475569", "#7c4a14"];
const AV_COLORS = ["#6366f1", "#0d9488", "#b91c1c", "#16a34a", "#7c3aed", "#db2777", "#ca8a04", "#0ea5e9"];

function avatarColor(name: string): string {
  let h = 0;
  for (const ch of name || "x") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AV_COLORS[h % AV_COLORS.length];
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function Card({ children }: { children: React.ReactNode }) {
  return <Box sx={{ p: 2, mb: 2, borderRadius: 4, border: "1px solid #eef2f7", bgcolor: "#fff" }}>{children}</Box>;
}

export function JourneySidePanels({ courseId, board }: { courseId: number; board: JourneyBoard }) {
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);

  useEffect(() => {
    if (!Number.isFinite(courseId)) return;
    let cancelled = false;
    (async () => {
      try {
        const l = await adaptiveJourneyService.getLeaderboard(courseId);
        if (!cancelled) setLeaderboard(l);
      } catch {
        /* leaderboard optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const pc = board.progressCard;
  const c = board.course;
  const completion = pc.completionPct ?? 0;
  const certReady = completion >= c.certificateThreshold;

  const current = board.weeks.flatMap((w) => w.nodes).find((n) => n.status === "current");
  const currentWeek = board.weeks.find((w) => w.nodes.some((n) => n.status === "current"));
  const due = currentWeek?.schedule?.dueAt;
  const momentum = current
    ? `finish the current ${current.type === "topic" ? "topic" : "step"}${due ? ` by ${fmtDate(due)}` : ""} to stay penalty-free and lock in the next ${current.score.total} pts at full value.`
    : "complete a step today to keep your momentum and your streak alive.";

  return (
    <>
      {/* Certificate */}
      <Card>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Box sx={{ width: 30, height: 30, borderRadius: 2, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
            <Icon icon="mdi:certificate" width={17} />
          </Box>
          <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.92rem" }}>Certificate</Typography>
        </Stack>
        <Typography sx={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.5 }}>
          Complete <b style={{ color: "#0f172a" }}>{c.certificateThreshold}%</b> of the course to unlock certificate download &amp; LinkedIn sharing.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <ButtonBase disabled={!certReady} sx={{ flex: 1, py: 0.9, borderRadius: 2, fontWeight: 700, fontSize: "0.8rem", gap: 0.5, color: certReady ? "white" : "#64748b", bgcolor: certReady ? "#6366f1" : "#f1f5f9", border: "1px solid #eef2f7" }}>
            <Icon icon="mdi:download" width={16} /> Certificate
          </ButtonBase>
          <ButtonBase disabled={!certReady} sx={{ flex: 1, py: 0.9, borderRadius: 2, fontWeight: 700, fontSize: "0.8rem", gap: 0.5, color: certReady ? "#0a66c2" : "#64748b", bgcolor: "#f1f5f9", border: "1px solid #eef2f7" }}>
            <Icon icon="mdi:linkedin" width={16} /> Share
          </ButtonBase>
        </Stack>
      </Card>

      {/* Your Progress */}
      <Card>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
          <Box sx={{ width: 30, height: 30, borderRadius: 2, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #6366f1, #a855f7)" }}>
            <Icon icon="mdi:chart-line" width={17} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.92rem" }}>Your Progress</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "#64748b" }}>Track your learning journey</Typography>
          </Box>
        </Stack>

        <Box sx={{ p: 1.5, borderRadius: 3, color: "white", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline">
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Overall completion</Typography>
            <Typography sx={{ fontWeight: 900, fontSize: "1.5rem" }}>{completion}%</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={completion} sx={{ mt: 0.75, height: 7, borderRadius: 4, bgcolor: "rgba(255,255,255,0.25)", "& .MuiLinearProgress-bar": { bgcolor: "white" } }} />
        </Box>

        <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
          <Box sx={{ flex: 1, p: 1, borderRadius: 2.5, bgcolor: "#f5f3ff", border: "1px solid #ede9fe" }}>
            <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: 0.5, color: "#7c3aed" }}>POINTS EARNED</Typography>
            <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>
              {pc.pointsEarned}<span style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 600 }}> / {pc.pointsTotal}</span>
            </Typography>
          </Box>
          <Box sx={{ flex: 1, p: 1, borderRadius: 2.5, bgcolor: "#f0fdf4", border: "1px solid #dcfce7" }}>
            <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: 0.5, color: "#15803d" }}>ON-TIME RATE</Typography>
            <Typography sx={{ fontWeight: 800, color: "#15803d", fontSize: "0.95rem" }}>
              {pc.onTimeRate != null ? `${Math.round(pc.onTimeRate * 100)}%` : "—"}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.6} alignItems="flex-start" sx={{ mt: 1.25, p: 1, borderRadius: 2, bgcolor: "#f5f3ff" }}>
          <Icon icon="mdi:star-four-points" width={13} color="#6d28d9" style={{ flexShrink: 0, marginTop: 3 }} />
          <Typography sx={{ fontSize: "0.74rem", color: "#6d28d9", fontWeight: 600, lineHeight: 1.45 }}>
            <b>AI momentum:</b> {momentum}
          </Typography>
        </Stack>
      </Card>

      {/* Leaderboard */}
      {leaderboard && (
        <Card>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Box sx={{ width: 30, height: 30, borderRadius: 2, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
              <Icon icon="mdi:trophy" width={17} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.92rem" }}>Leaderboard</Typography>
              <Typography sx={{ fontSize: "0.72rem", color: "#64748b" }}>Top performers · this course</Typography>
            </Box>
            <Icon icon="mdi:information-outline" width={16} color="#cbd5e1" />
          </Stack>

          {leaderboard.climb_plan && (
            <Stack direction="row" spacing={0.6} alignItems="flex-start" sx={{ mb: 1.25, p: 1, borderRadius: 2, background: "linear-gradient(135deg, #f5f3ff, #fdf2f8)" }}>
              <Icon icon="mdi:star-four-points" width={13} color="#6d28d9" style={{ flexShrink: 0, marginTop: 3 }} />
              <Typography sx={{ fontSize: "0.74rem", color: "#6d28d9", fontWeight: 600, lineHeight: 1.45 }}>
                {leaderboard.climb_plan.text}
              </Typography>
            </Stack>
          )}

          <Stack spacing={0.75}>
            {leaderboard.rows.slice(0, 5).map((row) => {
              const top3 = row.rank <= 3;
              return (
                <Stack
                  key={row.rank}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{
                    p: 0.85, borderRadius: 2.5,
                    bgcolor: row.is_current_user ? "#eef2ff" : top3 ? "#fffdf2" : "#fff",
                    border: row.is_current_user ? "1px solid #c7d2fe" : top3 ? "1px solid #fde68a" : "1px solid #eef2f7",
                  }}
                >
                  <Box sx={{ width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, fontWeight: 800, fontSize: "0.7rem", bgcolor: top3 ? RANK_BG[row.rank - 1] : "#e2e8f0", color: top3 ? RANK_FG[row.rank - 1] : "#64748b" }}>
                    {row.rank}
                  </Box>
                  <Avatar src={row.profile_pic_url ?? undefined} sx={{ width: 28, height: 28, fontSize: "0.74rem", bgcolor: avatarColor(row.name), color: "white", fontWeight: 700 }}>
                    {row.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: row.is_current_user ? 800 : 700, fontSize: "0.84rem", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.is_current_user ? <>You <span style={{ color: "#6366f1", fontWeight: 700 }}>(you)</span></> : row.name}
                    </Typography>
                    <Typography sx={{ fontSize: "0.66rem", color: "#64748b" }}>Score: {row.score.toLocaleString()}</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: "#6d28d9" }}>#{row.rank}</Typography>
                </Stack>
              );
            })}
          </Stack>
        </Card>
      )}
    </>
  );
}
