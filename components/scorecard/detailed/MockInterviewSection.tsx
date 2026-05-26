"use client";

import { useState } from "react";
import { Box, Chip, IconButton, LinearProgress, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AnimatedRing, CountUp, Reveal, gridStagger } from "@/components/scorecard/shared";
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
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function ParameterBars({ parameters }: { parameters: InterviewParameter[] }) {
  if (!parameters.length) {
    return (
      <Typography variant="caption" color="text.secondary">
        Parameter-level scores not available for this interview.
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "grid", gap: 0.75 }}>
      {parameters.map((p) => {
        const accent = proficiencyBandColor(p.score);
        return (
          <Box key={p.name}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 0.25,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--font-primary)", fontSize: "0.72rem" }}>
                {p.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: accent,
                  fontVariantNumeric: "tabular-nums",
                  fontSize: "0.72rem",
                }}
              >
                {p.score.toFixed(0)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.max(0, Math.min(100, p.score))}
              sx={{
                height: 5,
                borderRadius: 3,
                bgcolor: "color-mix(in srgb, var(--border-default) 45%, transparent)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 3,
                  backgroundColor: accent,
                },
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
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
        <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--font-primary)", fontSize: "0.7rem", letterSpacing: 0.4, textTransform: "uppercase" }}>
          {title}
        </Typography>
      </Box>
      <Box
        component="ul"
        sx={{
          pl: 2,
          m: 0,
          display: "grid",
          gap: 0.25,
          color: "var(--font-primary)",
          fontSize: "0.8rem",
          lineHeight: 1.5,
        }}
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

function InterviewCard({
  interview,
  expanded,
  onToggle,
}: {
  interview: MockInterview;
  expanded: boolean;
  onToggle: () => void;
}) {
  const accent =
    interview.overallScore != null
      ? proficiencyBandColor(interview.overallScore)
      : "var(--font-secondary)";

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
          border:
            "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
          bgcolor: "var(--card-bg)",
          transition: "border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease",
          "&:hover": {
            borderColor:
              "color-mix(in srgb, var(--accent-purple) 35%, transparent)",
            transform: "translateY(-1px)",
            boxShadow:
              "0 18px 40px -24px color-mix(in srgb, var(--accent-purple) 30%, transparent)",
          },
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            width: 4,
            background: interview.overallScore != null
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
                  letterSpacing: -0.1,
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
                    fontWeight: 700,
                    bgcolor: "color-mix(in srgb, var(--accent-purple) 14%, transparent)",
                    color: "var(--accent-purple-dark, #6d28d9)",
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
                    fontWeight: 600,
                    color: "var(--font-secondary)",
                    borderColor: "color-mix(in srgb, var(--border-default) 80%, transparent)",
                  }}
                />
              )}
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, color: "var(--font-secondary)", fontSize: "0.78rem", mb: 1.25 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconWrapper icon="mdi:calendar-month-outline" size={14} />
                {formatDate(interview.date)}
              </Box>
              {interview.subtopic && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <IconWrapper icon="mdi:tag-outline" size={14} />
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
                  borderTop:
                    "1px dashed color-mix(in srgb, var(--border-default) 70%, transparent)",
                  display: "grid",
                  gap: 1.5,
                }}
              >
                <FeedbackList
                  title="Strengths"
                  items={interview.feedback.strengths}
                  icon="mdi:thumb-up-outline"
                  color="#10b981"
                />
                <FeedbackList
                  title="Areas to improve"
                  items={interview.feedback.areasOfImprovement}
                  icon="mdi:lightbulb-on-outline"
                  color="#f59e0b"
                />
                {interview.feedback.mentorComments && (
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5, color: "var(--accent-indigo-dark)" }}>
                      <IconWrapper icon="mdi:comment-text-outline" size={14} />
                      <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.7rem", letterSpacing: 0.4, textTransform: "uppercase", color: "var(--font-primary)" }}>
                        Overall feedback
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: "var(--font-primary)", fontSize: "0.85rem", lineHeight: 1.5 }}>
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
                <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontWeight: 600 }}>
                  Pending
                </Typography>
              </Box>
            )}
            <IconButton
              size="small"
              onClick={onToggle}
              sx={{
                color: "var(--font-secondary)",
                "&:hover": {
                  color: "var(--accent-indigo-dark)",
                  bgcolor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                },
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const improvementColor =
    data.improvementSinceFirst >= 0 ? "#10b981" : "#ef4444";

  return (
    <Reveal as="section">
      <Box
        sx={{
          position: "relative",
          borderRadius: 4,
          overflow: "hidden",
          border:
            "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
          backgroundColor: "var(--card-bg)",
          boxShadow:
            "0 1px 0 color-mix(in srgb, var(--border-default) 60%, transparent), 0 30px 60px -30px rgba(15, 23, 42, 0.18)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.45,
            backgroundImage: [
              "radial-gradient(55% 70% at 100% 0%, color-mix(in srgb, var(--accent-purple) 16%, transparent), transparent 60%)",
              "radial-gradient(45% 60% at 0% 0%, color-mix(in srgb, var(--accent-indigo) 12%, transparent), transparent 60%)",
            ].join(", "),
            pointerEvents: "none",
          }}
        />

        <Box sx={{ position: "relative", p: { xs: 2.5, sm: 3.5, md: 4.5 } }}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              pb: { xs: 2.5, md: 3 },
              mb: { xs: 2.5, md: 3 },
              borderBottom:
                "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #a855f7 0%, #6d28d9 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "0 12px 24px -12px color-mix(in srgb, #a855f7 50%, transparent)",
                  flexShrink: 0,
                }}
              >
                <IconWrapper icon="mdi:account-voice" size={22} color="#fff" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: "var(--font-primary)",
                    fontSize: { xs: "1.05rem", sm: "1.2rem" },
                    lineHeight: 1.25,
                  }}
                >
                  Mock Interview Performance
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem", mt: 0.25 }}>
                  Latest score, readiness index, parameter breakdown, and mentor feedback per attempt.
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, auto)" },
                gap: { xs: 1, sm: 1.5 },
              }}
            >
              {[
                { label: "Interviews", value: data.totalInterviews, color: "var(--accent-purple-dark, #6d28d9)" },
                {
                  label: "Latest",
                  value: `${Math.round(data.latestInterviewScore)}%`,
                  color: proficiencyBandColor(data.latestInterviewScore),
                },
                {
                  label: "Readiness",
                  value: `${Math.round(data.interviewReadinessIndex)}%`,
                  color: proficiencyBandColor(data.interviewReadinessIndex),
                },
                {
                  label: "Improvement",
                  value: `${data.improvementSinceFirst >= 0 ? "+" : ""}${data.improvementSinceFirst.toFixed(0)}%`,
                  color: improvementColor,
                },
              ].map((stat) => (
                <Box
                  key={stat.label}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 2,
                    bgcolor:
                      "color-mix(in srgb, var(--border-default) 30%, transparent)",
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 78,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase", fontSize: "0.65rem" }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      color: stat.color,
                      fontSize: "1.05rem",
                      lineHeight: 1.2,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {typeof stat.value === "number" ? <CountUp value={stat.value} duration={0.8} /> : stat.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {data.interviews.length === 0 ? (
            <Box
              sx={{
                py: { xs: 4, sm: 6 },
                textAlign: "center",
                borderRadius: 2,
                border: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
                color: "var(--font-secondary)",
              }}
            >
              <IconWrapper icon="mdi:account-voice" size={40} color="var(--font-secondary)" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                No mock interviews completed yet. Schedule one to populate this section.
              </Typography>
            </Box>
          ) : (
            <motion.div
              variants={gridStagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
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
          )}
        </Box>
      </Box>
    </Reveal>
  );
}
