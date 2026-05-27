"use client";

import { useMemo, useState } from "react";
import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  AnimatedRing,
  CountUp,
  Reveal,
  SectionHero,
  SectionShell,
  fadeRise,
  gridStagger,
  useViewportEntrance,
} from "@/components/scorecard/shared";
import type {
  InterviewParameter,
  MockInterview,
  MockInterviewPerformance,
} from "@/lib/types/scorecard.types";
import { proficiencyBandColor } from "@/lib/utils/scorecard-visual";

interface MockInterviewSectionProps {
  data: MockInterviewPerformance;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function FeedbackList({
  title,
  items,
  icon,
  color,
}: {
  title: string;
  items: string[];
  icon: string;
  color: string;
}) {
  if (!items.length) return null;
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
        <Box sx={{ color }}>
          <IconWrapper icon={icon} size={14} />
        </Box>
        <Typography
          variant="caption"
          sx={{ fontWeight: 800, color: "var(--font-primary)", fontSize: "0.65rem", letterSpacing: "0.16em", textTransform: "uppercase" }}
        >
          {title}
        </Typography>
      </Box>
      <Box
        component="ul"
        sx={{ pl: 2, m: 0, display: "grid", gap: 0.25, color: "var(--font-primary)", fontSize: "0.82rem", lineHeight: 1.5 }}
      >
        {items.map((item, idx) => (
          <Box component="li" key={`${title}-${idx}`}>
            {item}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function ParameterBars({ parameters }: { parameters: InterviewParameter[] }) {
  if (!parameters.length) return null;
  return (
    <Box sx={{ display: "grid", gap: 0.75 }}>
      {parameters.map((p) => {
        const accent = proficiencyBandColor(p.score);
        return (
          <Box key={p.name}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.25 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--font-primary)", fontSize: "0.72rem" }}>
                {p.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: 800, color: accent, fontVariantNumeric: "tabular-nums", fontSize: "0.72rem" }}
              >
                {p.score.toFixed(0)}%
              </Typography>
            </Box>
            <Box sx={{ height: 5, borderRadius: 999, bgcolor: "color-mix(in srgb, var(--border-default) 45%, transparent)", overflow: "hidden" }}>
              <Box
                sx={{
                  width: `${Math.max(0, Math.min(100, p.score))}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${accent} 0%, color-mix(in srgb, ${accent} 65%, transparent) 100%)`,
                  transition: "width 0.6s ease",
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function InterviewCard({ interview, expanded, onToggle }: {
  interview: MockInterview;
  expanded: boolean;
  onToggle: () => void;
}) {
  const accent = interview.overallScore != null ? proficiencyBandColor(interview.overallScore) : "var(--font-secondary)";
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
      }}
    >
      <Box
        sx={{
          position: "relative",
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
          bgcolor: "var(--card-bg)",
          transition: "border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease",
          "&:hover": {
            borderColor: "color-mix(in srgb, #a855f7 35%, transparent)",
            transform: "translateY(-1px)",
            boxShadow: "0 18px 40px -24px color-mix(in srgb, #a855f7 30%, transparent)",
          },
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            width: 4,
            background:
              interview.overallScore != null
                ? `linear-gradient(180deg, ${accent} 0%, color-mix(in srgb, ${accent} 70%, transparent) 100%)`
                : "color-mix(in srgb, var(--border-default) 90%, transparent)",
            opacity: 0.85,
          }}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto" },
            gap: { xs: 2, sm: 2.5 },
            p: { xs: 2, sm: 2.5 },
            pl: { xs: 2.5, sm: 3 },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  color: "var(--font-primary)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={interview.title}
              >
                {interview.title}
              </Typography>
              {interview.difficulty && (
                <Chip
                  size="small"
                  label={interview.difficulty}
                  sx={{
                    height: 20,
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    bgcolor: "color-mix(in srgb, #a855f7 14%, transparent)",
                    color: "#6d28d9",
                  }}
                />
              )}
              {interview.topic && (
                <Chip
                  size="small"
                  label={interview.topic}
                  variant="outlined"
                  sx={{
                    height: 20,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "var(--font-secondary)",
                    borderColor: "color-mix(in srgb, var(--border-default) 80%, transparent)",
                  }}
                />
              )}
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, color: "var(--font-secondary)", fontSize: "0.78rem", mb: 1.25 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconWrapper icon="mdi:calendar-month-outline" size={13} />
                {formatDate(interview.date)}
              </Box>
              {interview.subtopic && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <IconWrapper icon="mdi:tag-outline" size={13} />
                  {interview.subtopic}
                </Box>
              )}
            </Box>
            <ParameterBars parameters={interview.parameters} />
            {expanded && (
              <Box
                sx={{
                  mt: 1.75,
                  pt: 1.75,
                  borderTop: "1px dashed color-mix(in srgb, var(--border-default) 70%, transparent)",
                  display: "grid",
                  gap: 1.5,
                }}
              >
                <FeedbackList title="Strengths" items={interview.feedback.strengths} icon="mdi:thumb-up-outline" color="#10b981" />
                <FeedbackList title="Areas to improve" items={interview.feedback.areasOfImprovement} icon="mdi:lightbulb-on-outline" color="#f59e0b" />
                {interview.feedback.mentorComments && (
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5, color: "var(--accent-indigo-dark)" }}>
                      <IconWrapper icon="mdi:comment-text-outline" size={14} />
                      <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.65rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--font-primary)" }}>
                        Overall feedback
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: "var(--font-primary)", fontSize: "0.85rem", lineHeight: 1.55 }}>
                      {interview.feedback.mentorComments}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "row", sm: "column" },
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              minWidth: { xs: "auto", sm: 110 },
            }}
          >
            {interview.overallScore != null ? (
              <AnimatedRing
                value={interview.overallScore}
                size={84}
                strokeWidth={9}
                color={accent}
                caption="Score"
                valueFontSize={20}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                  px: 2,
                  py: 1.25,
                  borderRadius: 2,
                  border: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
                }}
              >
                <IconWrapper icon="mdi:hourglass-empty" size={20} color="var(--font-secondary)" />
                <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontWeight: 700 }}>
                  Pending
                </Typography>
              </Box>
            )}
            <IconButton
              size="small"
              onClick={onToggle}
              sx={{
                color: "var(--font-secondary)",
                "&:hover": { color: "#6d28d9", bgcolor: "color-mix(in srgb, #a855f7 10%, transparent)" },
              }}
              aria-label={expanded ? "Hide interview feedback" : "Show interview feedback"}
            >
              <IconWrapper icon={expanded ? "mdi:chevron-up" : "mdi:chevron-down"} size={18} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}

export function MockInterviewSection({ data }: MockInterviewSectionProps) {
  const entrance = useViewportEntrance();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const latest = data.interviews[0] ?? null;
  const radarData = useMemo(() => {
    if (!latest) return [];
    return latest.parameters.map((p) => ({ subject: p.name, score: p.score, fullMark: 100 }));
  }, [latest]);

  const improvementColor = data.improvementSinceFirst >= 0 ? "#10b981" : "#ef4444";

  return (
    <Reveal as="section">
      <SectionShell
        radialMesh={[
          "radial-gradient(55% 70% at 100% 0%, color-mix(in srgb, #a855f7 16%, transparent), transparent 60%)",
          "radial-gradient(45% 60% at 0% 0%, color-mix(in srgb, var(--accent-indigo) 12%, transparent), transparent 60%)",
        ]}
      >
        <SectionHero
          chapter="Chapter 07"
          title="Mock Interview Performance"
          subtitle="Latest score, readiness index, parameter breakdown, and mentor feedback per attempt."
          iconBadge={{
            icon: "mdi:account-voice",
            gradient: "linear-gradient(135deg, #a855f7 0%, #6d28d9 100%)",
          }}
        />

        {data.interviews.length === 0 ? (
          <Box
            sx={{
              py: { xs: 5, sm: 7 },
              textAlign: "center",
              borderRadius: 3,
              border: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
              color: "var(--font-secondary)",
            }}
          >
            <IconWrapper icon="mdi:account-voice" size={48} color="var(--font-secondary)" />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              No mock interviews completed yet. Schedule one to populate this section.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Hero: latest report card with radar chart + readiness ring */}
            {latest && (
              <Box
                component={motion.div}
                variants={fadeRise}
                {...entrance}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 280px)" },
                  gap: { xs: 2.5, md: 3 },
                  mb: { xs: 3.5, md: 4.5 },
                }}
              >
                {/* Radar */}
                <Box
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    borderRadius: 3,
                    background:
                      "linear-gradient(160deg, color-mix(in srgb, #a855f7 10%, transparent) 0%, color-mix(in srgb, var(--accent-indigo) 6%, transparent) 100%)",
                    border: "1px solid color-mix(in srgb, #a855f7 22%, transparent)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "#6d28d9", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", fontSize: "0.68rem" }}
                      >
                        Latest interview · {formatDate(latest.date)}
                      </Typography>
                      <Typography
                        sx={{ fontWeight: 800, color: "var(--font-primary)", fontSize: { xs: "1.1rem", md: "1.25rem" }, letterSpacing: "-0.02em" }}
                      >
                        {latest.title}
                      </Typography>
                    </Box>
                    {latest.overallScore != null && (
                      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                        <Typography
                          sx={{
                            fontWeight: 800,
                            color: proficiencyBandColor(latest.overallScore),
                            fontSize: { xs: "1.8rem", md: "2.2rem" },
                            letterSpacing: "-0.03em",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {Math.round(latest.overallScore)}
                        </Typography>
                        <Typography
                          sx={{ color: "var(--font-secondary)", fontWeight: 700, fontSize: "0.85rem" }}
                        >
                          / 100
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  {radarData.length >= 3 ? (
                    <Box sx={{ width: "100%", height: 240 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="color-mix(in srgb, var(--border-default) 60%, transparent)" />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: "var(--font-secondary)", fontSize: 10 }}
                          />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar
                            name="Score"
                            dataKey="score"
                            stroke="#a855f7"
                            strokeWidth={2}
                            fill="#a855f7"
                            fillOpacity={0.3}
                            isAnimationActive
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Box sx={{ mt: 1 }}>
                      <ParameterBars parameters={latest.parameters} />
                    </Box>
                  )}
                </Box>

                {/* Readiness ring */}
                <Box
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: 3,
                    background:
                      "linear-gradient(160deg, color-mix(in srgb, #a855f7 14%, transparent) 0%, color-mix(in srgb, #6d28d9 6%, transparent) 100%)",
                    border: "1px solid color-mix(in srgb, #a855f7 26%, transparent)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    textAlign: "center",
                  }}
                >
                  <AnimatedRing
                    value={data.interviewReadinessIndex}
                    size={140}
                    strokeWidth={11}
                    color="#a855f7"
                    colorEnd="#6d28d9"
                    caption=""
                    valueFontSize={32}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: "#6d28d9", fontWeight: 800, letterSpacing: "0.18em", fontSize: "0.66rem", textTransform: "uppercase", mt: 1 }}
                  >
                    Interview Readiness
                  </Typography>
                  <Typography sx={{ fontWeight: 700, color: "var(--font-primary)", fontSize: "0.85rem" }}>
                    {data.totalInterviews} attempts ·{" "}
                    <Box component="span" sx={{ color: improvementColor, fontWeight: 800 }}>
                      {data.improvementSinceFirst >= 0 ? "+" : ""}
                      {data.improvementSinceFirst.toFixed(0)}%
                    </Box>{" "}
                    since first
                  </Typography>
                </Box>
              </Box>
            )}

            {/* KPI rail */}
            <Box
              component={motion.div}
              variants={gridStagger}
              {...entrance}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                borderTop: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                borderBottom: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                mb: { xs: 3.5, md: 4.5 },
              }}
            >
              {[
                { label: "Interviews", value: data.totalInterviews, accent: "#6d28d9" },
                { label: "Latest", value: Math.round(data.latestInterviewScore), suffix: "%", accent: proficiencyBandColor(data.latestInterviewScore) },
                { label: "Readiness", value: Math.round(data.interviewReadinessIndex), suffix: "%", accent: proficiencyBandColor(data.interviewReadinessIndex) },
                { label: "Improvement", value: Math.round(data.improvementSinceFirst), suffix: "%", accent: improvementColor, sign: data.improvementSinceFirst >= 0 },
              ].map((kpi, idx) => (
                <Box
                  key={kpi.label}
                  component={motion.div}
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
                  }}
                  sx={{
                    position: "relative",
                    py: { xs: 2.25, md: 2.75 },
                    px: { xs: 1.5, sm: 2 },
                    borderRight: {
                      xs: idx % 2 !== 1 ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" : "none",
                      md: idx !== 3 ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" : "none",
                    },
                    borderBottom: { xs: idx < 2 ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" : "none", md: "none" },
                    "&:hover": { backgroundColor: `color-mix(in srgb, ${kpi.accent} 6%, transparent)` },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: 28,
                      height: 2,
                      background: kpi.accent,
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 800,
                      color: "var(--font-primary)",
                      fontSize: { xs: "1.7rem", sm: "2.1rem", md: "2.6rem" },
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {kpi.sign !== undefined && kpi.sign && kpi.value > 0 ? "+" : ""}
                    <CountUp value={kpi.value} duration={1.4} />
                    {kpi.suffix}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--font-secondary)",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      display: "block",
                      mt: 1,
                    }}
                  >
                    {kpi.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Typography
              variant="caption"
              sx={{
                color: "var(--font-secondary)",
                fontSize: "0.7rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                display: "block",
                mb: 1.5,
              }}
            >
              History
            </Typography>

            <motion.div
              variants={gridStagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.05 }}
              style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}
            >
              {data.interviews.map((iv) => (
                <InterviewCard
                  key={iv.interviewId}
                  interview={iv}
                  expanded={expandedId === iv.interviewId}
                  onToggle={() => setExpandedId(expandedId === iv.interviewId ? null : iv.interviewId)}
                />
              ))}
            </motion.div>
          </>
        )}
      </SectionShell>
    </Reveal>
  );
}
