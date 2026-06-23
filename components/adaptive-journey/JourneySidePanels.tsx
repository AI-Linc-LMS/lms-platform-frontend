"use client";

import { useEffect, useState } from "react";
import { Avatar, Box, ButtonBase, LinearProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type { JourneyBoard, Leaderboard, TrendDirection } from "@/lib/types/adaptive-journey";

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

function TrendArrow({ trend }: { trend: TrendDirection }) {
  if (trend === "up") return <Icon icon="mdi:trending-up" width={15} color="#15803d" />;
  if (trend === "down") return <Icon icon="mdi:trending-down" width={15} color="#b91c1c" />;
  return <Icon icon="mdi:trending-neutral" width={15} color="#94a3b8" />;
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
        <Typography sx={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.5 }}>
          Complete <b>{c.certificateThreshold}%</b> of the course to unlock certificate download &amp; LinkedIn sharing.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <ButtonBase disabled={!certReady} sx={{ flex: 1, py: 0.9, borderRadius: 2, fontWeight: 700, fontSize: "0.8rem", gap: 0.5, color: certReady ? "white" : "#94a3b8", bgcolor: certReady ? "#6366f1" : "#f1f5f9", border: "1px solid #eef2f7" }}>
            <Icon icon="mdi:download" width={16} /> Certificate
          </ButtonBase>
          <ButtonBase disabled={!certReady} sx={{ flex: 1, py: 0.9, borderRadius: 2, fontWeight: 700, fontSize: "0.8rem", gap: 0.5, color: certReady ? "#0a66c2" : "#94a3b8", bgcolor: "#f1f5f9", border: "1px solid #eef2f7" }}>
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
            <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>Track your learning journey</Typography>
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
          <Box sx={{ flex: 1, p: 1, borderRadius: 2, border: "1px solid #eef2f7" }}>
            <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: 0.5, color: "#94a3b8" }}>POINTS EARNED</Typography>
            <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>
              {pc.pointsEarned}<span style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600 }}> / {pc.pointsTotal}</span>
            </Typography>
          </Box>
          <Box sx={{ flex: 1, p: 1, borderRadius: 2, border: "1px solid #eef2f7" }}>
            <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: 0.5, color: "#94a3b8" }}>ON-TIME RATE</Typography>
            <Typography sx={{ fontWeight: 800, color: "#15803d", fontSize: "0.95rem" }}>
              {pc.onTimeRate != null ? `${Math.round(pc.onTimeRate * 100)}%` : "—"}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ mt: 1.25, p: 1, borderRadius: 2, bgcolor: "#f5f3ff" }}>
          <Typography sx={{ fontSize: "0.74rem", color: "#6d28d9", fontWeight: 600, lineHeight: 1.45 }}>
            <Icon icon="mdi:star-four-points" width={13} style={{ verticalAlign: "-2px" }} /> <b>AI momentum:</b> {momentum}
          </Typography>
        </Box>
      </Card>

      {/* Leaderboard */}
      {leaderboard && (
        <Card>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Box sx={{ width: 30, height: 30, borderRadius: 2, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
              <Icon icon="mdi:trophy" width={17} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.92rem" }}>Leaderboard</Typography>
              <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>Top performers · this course</Typography>
            </Box>
          </Stack>

          {leaderboard.climb_plan && (
            <Box sx={{ mb: 1, p: 1, borderRadius: 2, bgcolor: "#f5f3ff" }}>
              <Typography sx={{ fontSize: "0.74rem", color: "#6d28d9", fontWeight: 600, lineHeight: 1.45 }}>
                <Icon icon="mdi:star-four-points" width={13} style={{ verticalAlign: "-2px" }} /> {leaderboard.climb_plan.text}
              </Typography>
            </Box>
          )}

          <Stack spacing={0.5}>
            {leaderboard.rows.slice(0, 5).map((row) => (
              <Stack key={row.rank} direction="row" spacing={1} alignItems="center" sx={{ p: 0.75, borderRadius: 2, bgcolor: row.is_current_user ? "#eef2ff" : "transparent", border: row.is_current_user ? "1px solid #c7d2fe" : "1px solid transparent" }}>
                <Avatar src={row.profile_pic_url ?? undefined} sx={{ width: 26, height: 26, fontSize: "0.72rem", bgcolor: row.rank <= 3 ? "#fde68a" : "#e2e8f0", color: "#0f172a" }}>
                  {row.name?.[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: row.is_current_user ? 800 : 700, fontSize: "0.82rem", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.is_current_user ? "You" : row.name}
                  </Typography>
                  <Typography sx={{ fontSize: "0.66rem", color: "#94a3b8" }}>Score: {row.score.toLocaleString()}</Typography>
                </Box>
                <TrendArrow trend={row.trend} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", color: "#475569", width: 26, textAlign: "right" }}>#{row.rank}</Typography>
              </Stack>
            ))}
          </Stack>
        </Card>
      )}
    </>
  );
}
