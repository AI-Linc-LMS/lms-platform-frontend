"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { Reveal } from "@/components/scorecard/shared";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type { DecaySpec, PointsSystem } from "@/lib/types/points-system";

const fmtSecs = (s: number) => (s < 120 ? `${s}s` : `${Math.round(s / 60)} min`);
const fmtTick = (s: number) => (s < 60 ? `${s}s` : `${Math.round(s / 60)}m`);

// Shared card style + hover lift, matching the dashboard / course panels.
const CARD = {
  borderRadius: 4,
  border: "1px solid #eef2f7",
  bgcolor: "#fff",
  boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
  transition: "transform .15s, box-shadow .15s",
  "&:hover": { transform: "translateY(-2px)", boxShadow: "0 16px 34px -22px rgba(16,24,40,0.25)" },
};

function SectionHeader({ icon, title, subtitle, gradient = "linear-gradient(135deg, #6366f1, #a855f7)" }: { icon: string; title: string; subtitle: string; gradient?: string }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.75 }}>
      <Box sx={{ width: 34, height: 34, borderRadius: 2.5, flexShrink: 0, display: "grid", placeItems: "center", color: "white", background: gradient, boxShadow: "0 8px 18px -10px rgba(124,58,237,0.6)" }}>
        <Icon icon={icon} width={19} />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a", lineHeight: 1.15 }}>{title}</Typography>
        <Typography sx={{ fontSize: "0.8rem", color: "#64748b" }}>{subtitle}</Typography>
      </Box>
    </Stack>
  );
}

function DecayChart({ spec }: { spec: DecaySpec }) {
  const W = 480, H = 150, padL = 30, padB = 22, padT = 10, padR = 10;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const x = (t: number) => padL + (t / spec.tMax) * innerW;
  const y = (p: number) => padT + (1 - p / spec.base) * innerH;
  const line = spec.curve.map((c, i) => `${i === 0 ? "M" : "L"} ${x(c.t).toFixed(1)} ${y(c.pts).toFixed(1)}`).join(" ");
  const area = `${line} L ${x(spec.tMax).toFixed(1)} ${y(0).toFixed(1)} L ${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`;
  const ticks = [0, Math.round(spec.tMax / 2), spec.tMax];
  const gid = spec.title.replace(/\s+/g, "");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#a855f7" stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id={`line-${gid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#c026d3" />
        </linearGradient>
      </defs>
      <rect x={padL} y={padT} width={x(spec.grace) - padL} height={innerH} fill="#22c55e" opacity={0.1} rx={3} />
      <text x={x(spec.grace / 2)} y={padT + 14} textAnchor="middle" fontSize="9" fontWeight="700" fill="#16a34a">full</text>
      {[spec.base, Math.round(spec.base / 2), 0].map((p) => (
        <text key={p} x={padL - 6} y={y(p) + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{p}</text>
      ))}
      {ticks.map((t) => (
        <text key={t} x={x(t)} y={H - 6} textAnchor="middle" fontSize="9" fill="#94a3b8">{fmtTick(t)}</text>
      ))}
      <path d={area} fill={`url(#fill-${gid})`} />
      <path d={line} fill="none" stroke={`url(#line-${gid})`} strokeWidth={2.5} strokeLinejoin="round" />
      <circle cx={x(0)} cy={y(spec.base)} r={3.5} fill="#6366f1" />
    </svg>
  );
}

function ChartCard({ spec }: { spec: DecaySpec }) {
  return (
    <Box sx={{ ...CARD, p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>{spec.title} · {spec.base} pts</Typography>
        <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>grace {fmtSecs(spec.grace)}, then −{spec.dec} / {spec.iv}s</Typography>
      </Stack>
      <DecayChart spec={spec} />
      <Typography sx={{ fontSize: "0.76rem", color: "#64748b", mt: 1, lineHeight: 1.5 }}>
        Full <b>{spec.base}</b> for the first {fmtSecs(spec.grace)}; then −{spec.dec} every {spec.iv}s, down to a <b>{spec.floor}</b> floor.
      </Typography>
    </Box>
  );
}

const DIFF_STYLE: Record<string, { color: string; bg: string }> = {
  Easy: { color: "#15803d", bg: "#f0fdf4" },
  Medium: { color: "#b45309", bg: "#fffbeb" },
  Hard: { color: "#b91c1c", bg: "#fef2f2" },
};
const LATE_STYLE = [
  { color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
  { color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  { color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
];

function HeroChip({ icon, text }: { icon: string; text: string }) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ px: 1.1, py: 0.5, borderRadius: 999, bgcolor: "rgba(255,255,255,0.16)", fontSize: "0.76rem", fontWeight: 700 }}>
      <Icon icon={icon} width={14} /> {text}
    </Stack>
  );
}

export function PointsSystemContent() {
  const [data, setData] = useState<PointsSystem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    adaptiveJourneyService.getPointsSystem()
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Box sx={{ display: "grid", placeItems: "center", py: 12 }}><CircularProgress sx={{ color: "#7c3aed" }} /></Box>;
  if (!data) return <Typography sx={{ color: "#b91c1c", py: 6, textAlign: "center", fontWeight: 600 }}>Couldn&apos;t load the points system.</Typography>;

  const wkDay = (n: number) => (n - 1) * data.late.staggerDays + 1;

  return (
    <Box>
      {/* Hero */}
      <Reveal>
        <Box sx={{ borderRadius: 5, p: { xs: 2.5, md: 3.5 }, mb: 3, color: "white", position: "relative", overflow: "hidden", background: "radial-gradient(110% 130% at 90% -10%, rgba(236,72,153,0.45) 0%, rgba(124,58,237,0.0) 55%), linear-gradient(135deg, #7c3aed 0%, #a855f7 55%, #c026d3 100%)", boxShadow: "0 24px 60px -30px rgba(124,58,237,0.7)" }}>
          <Stack direction="row" spacing={1.75} alignItems="flex-start">
            <Box sx={{ width: 52, height: 52, borderRadius: 3, flexShrink: 0, display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.25)" }}>
              <Icon icon="mdi:star-four-points" width={28} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.6rem", md: "2.1rem" }, lineHeight: 1.1 }}>{data.title}</Typography>
                <Box sx={{ px: 1, py: 0.3, borderRadius: 999, fontSize: "0.62rem", fontWeight: 800, color: "#7c3aed", bgcolor: "white" }}>UNIFIED</Box>
              </Stack>
              <Typography sx={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.88)", mt: 1, maxWidth: 720, lineHeight: 1.55 }}>{data.subtitle}</Typography>
              <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1.75 }}>
                <HeroChip icon="mdi:medal-outline" text={`${data.activities.length} ways to earn`} />
                <HeroChip icon="mdi:timer-sand" text="Time-decay" />
                <HeroChip icon="mdi:speedometer" text="Difficulty ×" />
                <HeroChip icon="mdi:calendar-clock" text="Weekly windows" />
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Reveal>

      {/* 1 · Points by activity */}
      <Reveal>
        <Box sx={{ mb: 4 }}>
          <SectionHeader icon="mdi:medal" title="Points by activity" subtitle="Every activity awards points — harder + faster earns more." gradient="linear-gradient(135deg, #6366f1, #a855f7)" />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", lg: "repeat(4,1fr)" }, gap: 1.5 }}>
            {data.activities.map((a) => (
              <Stack key={a.key} direction="row" alignItems="center" spacing={1.25} sx={{ ...CARD, p: 1.75, borderLeft: "3px solid", borderLeftColor: a.accent }}>
                <Box sx={{ width: 38, height: 38, borderRadius: 2.5, flexShrink: 0, display: "grid", placeItems: "center", color: a.accent, bgcolor: `${a.accent}1a` }}>
                  <Icon icon={a.icon} width={20} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.86rem", color: "#0f172a", lineHeight: 1.2 }}>{a.label}</Typography>
                  <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>{a.sub}</Typography>
                </Box>
                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                  <Typography component="span" sx={{ fontWeight: 900, fontSize: "1.05rem", color: a.accent }}>{a.points}</Typography>
                  <Typography component="span" sx={{ fontSize: "0.66rem", color: "#94a3b8", ml: 0.3 }}>{a.unit}</Typography>
                </Box>
              </Stack>
            ))}
          </Box>
        </Box>
      </Reveal>

      {/* 2 · Time-decay */}
      <Reveal>
        <Box sx={{ mb: 4 }}>
          <SectionHeader icon="mdi:timer-sand" title="Time-decay" subtitle="Answer well & quickly to keep more." gradient="linear-gradient(135deg, #8b5cf6, #ec4899)" />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr 340px" }, gap: 1.5 }}>
            <ChartCard spec={data.decay.quizEasy} />
            <ChartCard spec={data.decay.codingHard} />
            <Box sx={{ p: 2.25, borderRadius: 4, color: "#fff", backgroundColor: "#0f0a28", backgroundImage: "linear-gradient(160deg, #1a1442, #0f0a28)", boxShadow: "0 18px 40px -24px rgba(76,29,149,0.6)" }}>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                <Icon icon="mdi:function-variant" width={16} color="#c4b5fd" />
                <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: 0.8, color: "rgba(255,255,255,0.6)" }}>THE FORMULA</Typography>
              </Stack>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(0,0,0,0.35)", fontFamily: "monospace", fontSize: "0.8rem", color: "#c4b5fd", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {data.formula}
              </Box>
              <Typography sx={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.65)", mt: 1.5, lineHeight: 1.55 }}>{data.formulaNote}</Typography>
            </Box>
          </Box>
        </Box>
      </Reveal>

      {/* 3 + 4 */}
      <Reveal>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2, mb: 4 }}>
          <Box sx={{ ...CARD, p: 2.25, "&:hover": undefined }}>
            <SectionHeader icon="mdi:speedometer" title="Difficulty multiplier" subtitle="Harder items are worth more." gradient="linear-gradient(135deg, #f59e0b, #ef4444)" />
            <Stack spacing={1}>
              {data.difficulty.map((d) => {
                const s = DIFF_STYLE[d.label] ?? DIFF_STYLE.Medium;
                return (
                  <Stack key={d.label} direction="row" alignItems="center" spacing={2} sx={{ p: 1.25, borderRadius: 2.5, bgcolor: s.bg }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.86rem", color: s.color, minWidth: 64 }}>{d.label}</Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: "0.95rem", color: s.color, minWidth: 48 }}>×{d.mult.toFixed(1)}</Typography>
                    <Typography sx={{ fontSize: "0.8rem", color: "#475569" }}>Quiz <b>{d.quiz}</b> · Coding <b>{d.coding}</b></Typography>
                  </Stack>
                );
              })}
            </Stack>
            <Stack direction="row" spacing={0.6} alignItems="flex-start" sx={{ mt: 1.5, p: 1.25, borderRadius: 2, bgcolor: "#f5f3ff" }}>
              <Icon icon="mdi:star-four-points" width={13} color="#6d28d9" style={{ flexShrink: 0, marginTop: 2 }} />
              <Typography sx={{ fontSize: "0.74rem", color: "#6d28d9", fontWeight: 600, lineHeight: 1.45 }}>
                The AI serves difficulty matched to your level — so the points you earn reflect real stretch, not farming easy items.
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ ...CARD, p: 2.25, "&:hover": undefined }}>
            <SectionHeader icon="mdi:calendar-clock" title="Weekly late penalty" subtitle="Beat the deadline to keep full credit." gradient="linear-gradient(135deg, #ef4444, #f59e0b)" />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              {data.late.bands.map((b, i) => {
                const s = LATE_STYLE[i] ?? LATE_STYLE[0];
                return (
                  <Box key={b.label} sx={{ flex: 1, p: 1.5, borderRadius: 2.5, bgcolor: s.bg, border: `1px solid ${s.border}` }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: "#0f172a" }}>{b.label}</Typography>
                    <Typography sx={{ fontSize: "0.66rem", color: "#94a3b8" }}>{b.note}</Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: "1.4rem", color: s.color, mt: 0.5 }}>×{b.mult.toFixed(1)}</Typography>
                    <Typography sx={{ fontSize: "0.7rem", color: s.color, fontWeight: 700 }}>{b.caption}</Typography>
                  </Box>
                );
              })}
            </Stack>
            <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 2, bgcolor: "#f8fafc" }}>
              <Typography sx={{ fontSize: "0.74rem", color: "#475569", lineHeight: 1.5 }}>
                <b>Per-week windows.</b> Admin sets a course start date; week N opens on day{" "}
                <b>(N−1)×{data.late.staggerDays} + 1</b> with a {data.late.windowDays}-day window. e.g. Week 4 →
                days {wkDay(4)}–{wkDay(4) + data.late.windowDays - 1}.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Reveal>

      {/* Worked example */}
      <Reveal>
        <Box sx={{ borderRadius: 5, p: { xs: 2.5, md: 3.5 }, color: "white", position: "relative", overflow: "hidden", background: "radial-gradient(110% 130% at 10% 110%, rgba(236,72,153,0.4) 0%, rgba(124,58,237,0) 55%), linear-gradient(135deg, #7c3aed 0%, #a855f7 55%, #c026d3 100%)", boxShadow: "0 24px 60px -30px rgba(124,58,237,0.7)" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "300px 1fr" }, gap: { xs: 2.5, md: 4 }, alignItems: "center" }}>
            <Box>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                <Icon icon="mdi:lightbulb-on" width={16} />
                <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: 0.8, color: "rgba(255,255,255,0.75)" }}>WORKED EXAMPLE · ONE WEEK</Typography>
              </Stack>
              <Typography sx={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.92)", lineHeight: 1.55 }}>{data.workedExample.summary}</Typography>
            </Box>
            <Box>
              <Stack spacing={0.5}>
                {data.workedExample.rows.map((r) => (
                  <Stack key={r.label} direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.85, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                    <Typography sx={{ flex: 1, minWidth: 0, fontSize: "0.84rem", color: "rgba(255,255,255,0.9)" }}>{r.label}</Typography>
                    {r.late ? (
                      <Typography sx={{ fontWeight: 800, fontSize: "0.85rem" }}>
                        <Box component="span" sx={{ color: "rgba(255,255,255,0.5)", textDecoration: "line-through", mr: 0.75 }}>{r.raw}</Box>
                        {r.final}
                      </Typography>
                    ) : (
                      <Typography sx={{ fontWeight: 800, fontSize: "0.85rem" }}>{r.final}</Typography>
                    )}
                    <Box sx={{ px: 0.85, py: 0.2, borderRadius: 999, fontSize: "0.62rem", fontWeight: 800, color: "white", bgcolor: r.late ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.18)", minWidth: 64, textAlign: "center" }}>
                      {r.late ? `−${data.workedExample.latePct}% late` : "on time"}
                    </Box>
                  </Stack>
                ))}
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
                <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>Week total</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: "1.6rem" }}>{data.workedExample.total} <Box component="span" sx={{ fontSize: "0.9rem", fontWeight: 700 }}>pts</Box></Typography>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Reveal>
    </Box>
  );
}
