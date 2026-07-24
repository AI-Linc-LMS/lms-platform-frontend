"use client";

import { useMemo, useState } from "react";
import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
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
import type { Skill, SkillBreakdown } from "@/lib/types/scorecard.types";
import {
  proficiencyBandColor,
  gradeLevelColor,
  gradeLevelGradient,
} from "@/lib/utils/scorecard-visual";

interface SkillScorecardSectionProps {
  data: Skill[];
}

type SortMode = "proficiency" | "name" | "confidence";
const SORT_OPTIONS: { id: SortMode; label: string; icon: string }[] = [
  { id: "proficiency", label: "Proficiency", icon: "mdi:trending-up" },
  { id: "confidence", label: "Confidence", icon: "mdi:shield-check" },
  { id: "name", label: "Name", icon: "mdi:sort-alphabetical-ascending" },
];

const BREAKDOWN_ROWS: Array<{
  key: keyof SkillBreakdown;
  label: string;
  short: string;
  icon: string;
  countKey?:
    | "quizCount"
    | "codingCount"
    | "videoCount"
    | "assessmentCount"
    | "interviewCount";
}> = [
  { key: "quizScore", label: "Quizzes", short: "Quiz", icon: "mdi:format-list-checks", countKey: "quizCount" },
  { key: "assessmentScore", label: "Assessments", short: "Asmt", icon: "mdi:clipboard-check", countKey: "assessmentCount" },
  { key: "codingScore", label: "Coding", short: "Code", icon: "mdi:code-braces", countKey: "codingCount" },
  { key: "interviewScore", label: "Interviews", short: "Intv", icon: "mdi:account-voice", countKey: "interviewCount" },
  { key: "videoScore", label: "Videos", short: "Video", icon: "mdi:play-circle-outline", countKey: "videoCount" },
];

// ─── Glass surface - shared backdrop styling ─────────────────────────────────
const glass = {
  position: "relative" as const,
  borderRadius: 4,
  bgcolor: "color-mix(in srgb, var(--card-bg) 55%, transparent)",
  border: "1px solid color-mix(in srgb, var(--border-default) 60%, transparent)",
  backdropFilter: "blur(18px) saturate(140%)",
  WebkitBackdropFilter: "blur(18px) saturate(140%)",
  boxShadow:
    "0 1px 0 0 color-mix(in srgb, #fff 12%, transparent) inset, 0 24px 60px -32px color-mix(in srgb, var(--accent-indigo) 30%, transparent)",
};

function strengthMeta(strength: Skill["strength"]) {
  if (strength === "Strong") return { color: "#10b981", label: "Strong" };
  if (strength === "Intermediate") return { color: "#f59e0b", label: "Intermediate" };
  return { color: "#ef4444", label: "Needs attention" };
}

// ─── Custom recharts tooltip ─────────────────────────────────────────────────
function GlassTip(props: Record<string, unknown>) {
  const active = props.active as boolean | undefined;
  const payload = props.payload as
    | { value?: number; name?: string; color?: string; payload?: { color?: string } }[]
    | undefined;
  const label = props.label as string | number | undefined;
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const color = p.color || p.payload?.color || "var(--accent-indigo)";
  return (
    <Box
      sx={{
        px: 1.25,
        py: 0.75,
        borderRadius: 2,
        bgcolor: "color-mix(in srgb, var(--card-bg) 85%, transparent)",
        backdropFilter: "blur(10px)",
        border: `1px solid color-mix(in srgb, ${color} 36%, transparent)`,
        boxShadow: "0 12px 24px -16px rgba(0,0,0,0.25)",
      }}
    >
      <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--font-primary)", letterSpacing: 0.2 }}>
        {label ?? p.name}
      </Typography>
      <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>
        {typeof p.value === "number" ? `${Math.round(p.value)}` : p.value}
        <Box component="span" sx={{ fontSize: "0.6em", ml: 0.25, color: "var(--font-secondary)" }}>
          %
        </Box>
      </Typography>
    </Box>
  );
}

// ─── Concentric dual ring - outer proficiency, inner confidence ──────────────
function DualRing({ proficiency, confidence, accent }: { proficiency: number; confidence: number; accent: string }) {
  return (
    <Box sx={{ position: "relative", width: 96, height: 96, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <AnimatedRing value={proficiency} size={96} strokeWidth={9} color={accent} showValue={false} />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AnimatedRing
          value={confidence}
          size={64}
          strokeWidth={5}
          color="color-mix(in srgb, var(--font-secondary) 70%, transparent)"
          showValue={false}
          glow={false}
        />
      </Box>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: "1.1rem",
            color: "var(--font-primary)",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.03em",
          }}
        >
          {Math.round(proficiency)}
          <Box component="span" sx={{ fontSize: "0.55em", color: "var(--font-secondary)", ml: 0.2 }}>
            %
          </Box>
        </Typography>
        <Typography
          sx={{
            fontSize: "0.52rem",
            fontWeight: 800,
            color: "var(--font-secondary)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            mt: 0.25,
          }}
        >
          {Math.round(confidence)}% conf
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Skill card - glass surface, mini bar chart, dual ring ───────────────────
function SkillCard({
  skill,
  expanded,
  onToggle,
}: {
  skill: Skill;
  expanded: boolean;
  onToggle: () => void;
}) {
  const accent = proficiencyBandColor(skill.proficiencyScore);
  const levelColor = gradeLevelColor(skill.level);
  const strength = strengthMeta(skill.strength);

  const channelData = BREAKDOWN_ROWS.map((row) => {
    const value = skill.breakdown[row.key] ?? 0;
    const count = row.countKey ? skill.breakdownCounts?.[row.countKey] ?? 0 : 0;
    return {
      key: row.key,
      name: row.short,
      fullName: row.label,
      value,
      count,
      color: count > 0 ? proficiencyBandColor(value) : "color-mix(in srgb, var(--border-default) 45%, transparent)",
      active: count > 0,
    };
  });
  const activeCount = channelData.filter((c) => c.active).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <Box
        sx={{
          ...glass,
          overflow: "hidden",
          transition: "border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease",
          "&:hover": {
            borderColor: `color-mix(in srgb, ${accent} 55%, transparent)`,
            transform: "translateY(-2px)",
            boxShadow: `0 1px 0 0 color-mix(in srgb, #fff 12%, transparent) inset, 0 30px 70px -34px color-mix(in srgb, ${accent} 55%, transparent)`,
          },
        }}
      >
        {/* Gradient accent strip - top edge */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: gradeLevelGradient(skill.level),
            opacity: 0.95,
          }}
        />
        {/* Soft accent glow */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            top: -60,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: `radial-gradient(circle, color-mix(in srgb, ${accent} 18%, transparent) 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto" },
            gap: { xs: 2, sm: 2.5 },
            p: { xs: 2, sm: 2.5 },
            pt: { xs: 2.25, sm: 2.75 },
            position: "relative",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  color: "var(--font-primary)",
                  letterSpacing: "-0.015em",
                  lineHeight: 1.2,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: "1rem",
                }}
                title={skill.name}
              >
                {skill.name}
              </Typography>
              {skill.category && (
                <Chip
                  size="small"
                  label={skill.category}
                  sx={{
                    height: 20,
                    fontWeight: 700,
                    fontSize: "0.64rem",
                    bgcolor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                    color: "var(--accent-indigo-dark)",
                    border: "1px solid color-mix(in srgb, var(--accent-indigo) 22%, transparent)",
                  }}
                />
              )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, flexWrap: "wrap", mb: 1.5 }}>
              <Chip
                size="small"
                label={skill.level}
                sx={{
                  height: 22,
                  fontWeight: 800,
                  fontSize: "0.66rem",
                  color: levelColor,
                  bgcolor: `color-mix(in srgb, ${levelColor} 14%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${levelColor} 24%, transparent)`,
                }}
              />
              <Chip
                size="small"
                icon={
                  <Box
                    component="span"
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor: strength.color,
                      boxShadow: `0 0 0 3px color-mix(in srgb, ${strength.color} 20%, transparent)`,
                      ml: 0.5,
                    }}
                  />
                }
                label={strength.label}
                sx={{
                  height: 22,
                  fontWeight: 700,
                  fontSize: "0.66rem",
                  color: strength.color,
                  bgcolor: `color-mix(in srgb, ${strength.color} 12%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${strength.color} 22%, transparent)`,
                  "& .MuiChip-icon": { ml: 0.5, mr: -0.25 },
                }}
              />
              <Tooltip
                title={`Confidence reflects how many attempts inform this skill (${skill.confidenceScore}%).`}
                arrow
                placement="top"
              >
                <Chip
                  size="small"
                  icon={<IconWrapper icon="mdi:shield-check" size={12} />}
                  label={`${skill.confidenceScore}%`}
                  sx={{
                    height: 22,
                    fontWeight: 700,
                    fontSize: "0.66rem",
                    color: "var(--font-secondary)",
                    bgcolor: "color-mix(in srgb, var(--border-default) 30%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--border-default) 50%, transparent)",
                  }}
                />
              </Tooltip>
            </Box>

            {/* Channel spectrum - mini bar chart */}
            {activeCount === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1.25,
                  borderRadius: 2,
                  border: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
                  color: "var(--font-secondary)",
                }}
              >
                <IconWrapper icon="mdi:flag-outline" size={14} />
                <Typography variant="caption" sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                  No attempts yet - practice any channel to start scoring this skill.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  position: "relative",
                  height: 108,
                  borderRadius: 2.5,
                  px: 0.5,
                  py: 0.75,
                  bgcolor: "color-mix(in srgb, var(--border-default) 18%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--border-default) 40%, transparent)",
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }} barCategoryGap="22%">
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "var(--font-secondary)", fontSize: 10, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis hide domain={[0, 100]} />
                    <RechartsTooltip
                      cursor={{ fill: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)" }}
                      content={(p) => <GlassTip {...p} />}
                    />
                    <Bar dataKey="value" radius={[6, 6, 2, 2]} maxBarSize={32}>
                      {channelData.map((c) => (
                        <Cell key={c.key} fill={c.color} fillOpacity={c.active ? 1 : 0.35} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}

            {expanded && skill.breakdownItems && (
              <Box
                sx={{
                  mt: 2,
                  pt: 2,
                  borderTop: "1px dashed color-mix(in srgb, var(--border-default) 70%, transparent)",
                  display: "grid",
                  gap: 1.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    color: "var(--font-secondary)",
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                    fontSize: "0.65rem",
                  }}
                >
                  Recent activity
                </Typography>
                {(
                  [
                    { label: "Quiz", items: skill.breakdownItems.quiz },
                    { label: "Coding", items: skill.breakdownItems.coding },
                    { label: "Assessment", items: skill.breakdownItems.assessment },
                    { label: "Interview", items: skill.breakdownItems.interview },
                    { label: "Video", items: skill.breakdownItems.video },
                  ] as const
                )
                  .filter((b) => Array.isArray(b.items) && b.items.length > 0)
                  .map((b) => (
                    <Box key={b.label}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--font-primary)", fontSize: "0.72rem" }}>
                        {b.label}
                      </Typography>
                      <Box component="ul" sx={{ pl: 2, mt: 0.25, mb: 0, color: "var(--font-secondary)" }}>
                        {b.items.slice(0, 3).map((item, i) => (
                          <Box component="li" key={`${item.name}-${i}`} sx={{ fontSize: "0.78rem", lineHeight: 1.5 }}>
                            <Box component="span" sx={{ color: "var(--font-primary)" }}>
                              {item.name || "Untitled"}
                            </Box>
                            {item.score != null && (
                              <Box
                                component="span"
                                sx={{
                                  ml: 0.75,
                                  color: proficiencyBandColor(item.score),
                                  fontWeight: 700,
                                }}
                              >
                                {item.score}%
                              </Box>
                            )}
                            {item.courseName && (
                              <Box component="span" sx={{ ml: 0.75 }}>
                                · {item.courseName}
                              </Box>
                            )}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  ))}
              </Box>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "row", sm: "column" },
              alignItems: "center",
              justifyContent: "center",
              gap: 1.25,
              minWidth: { xs: "auto", sm: 110 },
            }}
          >
            <DualRing proficiency={skill.proficiencyScore} confidence={skill.confidenceScore} accent={accent} />
            <IconButton
              size="small"
              onClick={onToggle}
              sx={{
                color: "var(--font-secondary)",
                border: "1px solid color-mix(in srgb, var(--border-default) 60%, transparent)",
                "&:hover": {
                  color: "var(--accent-indigo-dark)",
                  bgcolor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                  borderColor: "color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
                },
              }}
              aria-label={expanded ? "Hide breakdown details" : "Show breakdown details"}
            >
              <IconWrapper icon={expanded ? "mdi:chevron-up" : "mdi:chevron-down"} size={16} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────
export function SkillScorecardSection({ data }: SkillScorecardSectionProps) {
  const entrance = useViewportEntrance();
  const [sortMode, setSortMode] = useState<SortMode>("proficiency");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of data) if (s.category) set.add(s.category);
    return Array.from(set).sort();
  }, [data]);

  const filteredAndSorted = useMemo(() => {
    const filtered = selectedCategory === "all" ? data : data.filter((s) => (s.category || "") === selectedCategory);
    const sorted = [...filtered];
    if (sortMode === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortMode === "confidence")
      sorted.sort((a, b) => b.confidenceScore - a.confidenceScore || b.proficiencyScore - a.proficiencyScore);
    else sorted.sort((a, b) => b.proficiencyScore - a.proficiencyScore || b.confidenceScore - a.confidenceScore);
    return sorted;
  }, [data, sortMode, selectedCategory]);

  const summary = useMemo(() => {
    if (!data.length)
      return {
        total: 0,
        avg: 0,
        strong: 0,
        interviewReady: 0,
        avgConfidence: 0,
        topSkills: [] as Skill[],
        distribution: [] as { label: string; range: string; count: number; color: string }[],
        strengthSplit: [] as { name: string; value: number; color: string }[],
      };
    const total = data.length;
    const avg = Math.round(data.reduce((acc, s) => acc + (Number.isFinite(s.proficiencyScore) ? s.proficiencyScore : 0), 0) / total);
    const avgConfidence = Math.round(
      data.reduce((acc, s) => acc + (Number.isFinite(s.confidenceScore) ? s.confidenceScore : 0), 0) / total,
    );
    const strong = data.filter((s) => s.strength === "Strong").length;
    const interviewReady = data.filter((s) => s.level === "Interview-Ready").length;
    const topSkills = [...data].sort((a, b) => b.proficiencyScore - a.proficiencyScore).slice(0, 8);

    const buckets = [
      { label: "Emerging", range: "0–20", min: 0, max: 20, color: "#ef4444" },
      { label: "Building", range: "20–40", min: 20, max: 40, color: "#f97316" },
      { label: "Developing", range: "40–60", min: 40, max: 60, color: "#f59e0b" },
      { label: "Proficient", range: "60–80", min: 60, max: 80, color: "#10b981" },
      { label: "Mastery", range: "80–100", min: 80, max: 100, color: "#0a66c2" },
    ];
    const distribution = buckets.map((b) => ({
      label: b.label,
      range: b.range,
      color: b.color,
      count: data.filter((s) => s.proficiencyScore >= b.min && (b.max === 100 ? s.proficiencyScore <= 100 : s.proficiencyScore < b.max)).length,
    }));

    const strengthSplit = [
      { name: "Strong", value: data.filter((s) => s.strength === "Strong").length, color: "#10b981" },
      { name: "Intermediate", value: data.filter((s) => s.strength === "Intermediate").length, color: "#f59e0b" },
      { name: "Needs Attention", value: data.filter((s) => s.strength === "Needs Attention").length, color: "#ef4444" },
    ];

    return { total, avg, avgConfidence, strong, interviewReady, topSkills, distribution, strengthSplit };
  }, [data]);

  // Radar data - top 8 skills (or all if fewer). Trimmed names for radial labels.
  const radarData = useMemo(() => {
    return summary.topSkills.map((s) => ({
      subject: s.name.length > 14 ? `${s.name.slice(0, 12)}…` : s.name,
      full: s.name,
      score: Math.max(0, Math.min(100, s.proficiencyScore)),
      confidence: Math.max(0, Math.min(100, s.confidenceScore)),
    }));
  }, [summary.topSkills]);

  const SKILLS_PREVIEW_LIMIT = 8;
  const [showAllSkills, setShowAllSkills] = useState(false);
  const visibleSkills = useMemo(
    () => (showAllSkills ? filteredAndSorted : filteredAndSorted.slice(0, SKILLS_PREVIEW_LIMIT)),
    [filteredAndSorted, showAllSkills],
  );

  if (data.length === 0) {
    return (
      <Reveal as="section">
        <SectionShell
          radialMesh={[
            "radial-gradient(55% 70% at 0% 0%, color-mix(in srgb, var(--accent-indigo) 16%, transparent), transparent 60%)",
          ]}
        >
          <SectionHero
            chapter="Chapter 04"
            title="Skill Scorecard"
            subtitle="Per-skill proficiency across quizzes, assessments, coding, interviews, and videos."
            iconBadge={{
              icon: "mdi:star-circle",
              gradient: "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-indigo-dark) 100%)",
            }}
          />
          <Box
            sx={{
              ...glass,
              py: { xs: 5, sm: 7 },
              textAlign: "center",
              color: "var(--font-secondary)",
            }}
          >
            <IconWrapper icon="mdi:medal-outline" size={48} color="var(--font-secondary)" />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              No skill scores yet. Once admins tag content with skills and you complete attempts, cards populate here.
            </Typography>
          </Box>
        </SectionShell>
      </Reveal>
    );
  }

  return (
    <Reveal as="section">
      <SectionShell
        radialMesh={[
          "radial-gradient(55% 70% at 0% 0%, color-mix(in srgb, var(--accent-indigo) 18%, transparent), transparent 60%)",
          "radial-gradient(45% 60% at 100% 100%, color-mix(in srgb, var(--accent-purple) 14%, transparent), transparent 60%)",
          "radial-gradient(35% 45% at 70% 0%, color-mix(in srgb, #10b981 8%, transparent), transparent 60%)",
        ]}
      >
        <SectionHero
          chapter="Chapter 04"
          title="Skill Scorecard"
          subtitle="Per-skill proficiency across quizzes, assessments, coding, interviews, and videos."
          iconBadge={{
            icon: "mdi:star-circle",
            gradient: "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-indigo-dark) 100%)",
          }}
        />

        {/* ─── Hero: Radar constellation + mean ring ──────────────────────── */}
        <Box
          component={motion.div}
          variants={fadeRise}
          {...entrance}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) minmax(0, 300px)" },
            gap: { xs: 2.5, lg: 3 },
            mb: { xs: 3.5, md: 4 },
          }}
        >
          {/* Radar */}
          <Box
            sx={{
              ...glass,
              p: { xs: 2, md: 3 },
              minHeight: { xs: 340, md: 380 },
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1.25,
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-purple) 100%)",
                  color: "#fff",
                }}
              >
                <IconWrapper icon="mdi:radar" size={16} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, color: "var(--font-primary)", fontSize: "0.92rem", letterSpacing: "-0.01em" }}>
                  Skill Constellation
                </Typography>
                <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontSize: "0.7rem", fontWeight: 600 }}>
                  Top {radarData.length} skills · proficiency vs. confidence
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }} />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "var(--accent-indigo)" }} />
                  <Typography variant="caption" sx={{ fontSize: "0.66rem", color: "var(--font-secondary)", fontWeight: 700 }}>
                    Proficiency
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "var(--accent-purple)", opacity: 0.6 }} />
                  <Typography variant="caption" sx={{ fontSize: "0.66rem", color: "var(--font-secondary)", fontWeight: 700 }}>
                    Confidence
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ flex: 1, minHeight: 280 }}>
              {radarData.length >= 3 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }} outerRadius="78%">
                    <defs>
                      <linearGradient id="radarFillProf" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="var(--accent-indigo)" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity={0.35} />
                      </linearGradient>
                      <linearGradient id="radarFillConf" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="var(--accent-purple)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <PolarGrid stroke="color-mix(in srgb, var(--border-default) 65%, transparent)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "var(--font-secondary)", fontSize: 11, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Confidence"
                      dataKey="confidence"
                      stroke="var(--accent-purple)"
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                      fill="url(#radarFillConf)"
                      isAnimationActive
                    />
                    <Radar
                      name="Proficiency"
                      dataKey="score"
                      stroke="var(--accent-indigo)"
                      strokeWidth={2}
                      fill="url(#radarFillProf)"
                      isAnimationActive
                    />
                    <RechartsTooltip content={(p) => <GlassTip {...p} />} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--font-secondary)",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <IconWrapper icon="mdi:radar" size={32} />
                  <Typography variant="caption" sx={{ fontSize: "0.78rem", fontWeight: 600 }}>
                    Track at least 3 skills to unlock the constellation view.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Mean ring + leader */}
          <Box
            sx={{
              ...glass,
              background:
                "linear-gradient(165deg, color-mix(in srgb, var(--accent-indigo) 16%, transparent) 0%, color-mix(in srgb, var(--accent-purple) 8%, transparent) 100%)",
              p: { xs: 2.5, md: 3 },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              textAlign: "center",
            }}
          >
            <AnimatedRing
              value={summary.avg}
              size={148}
              strokeWidth={12}
              color="var(--accent-indigo)"
              colorEnd="var(--accent-purple)"
              valueFontSize={34}
            />
            <Typography
              variant="caption"
              sx={{
                color: "var(--font-secondary)",
                fontWeight: 800,
                letterSpacing: "0.18em",
                fontSize: "0.66rem",
                textTransform: "uppercase",
                mt: 0.5,
              }}
            >
              Mean Proficiency
            </Typography>
            <Typography sx={{ fontWeight: 700, color: "var(--font-primary)", fontSize: "0.86rem" }}>
              across <CountUp value={summary.total} /> tracked skills
            </Typography>
            {summary.topSkills[0] && (
              <Box
                sx={{
                  mt: 0.5,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  bgcolor: "color-mix(in srgb, #fbbf24 14%, transparent)",
                  border: "1px solid color-mix(in srgb, #fbbf24 28%, transparent)",
                }}
              >
                <IconWrapper icon="mdi:trophy" size={14} color="#d97706" />
                <Typography sx={{ fontWeight: 800, fontSize: "0.72rem", color: "#92400e", letterSpacing: 0.2 }}>
                  Leading: {summary.topSkills[0].name}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* ─── KPI strip - glass cards ─────────────────────────────────────── */}
        <Box
          component={motion.div}
          variants={gridStagger}
          {...entrance}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 1.5,
            mb: { xs: 3.5, md: 4 },
          }}
        >
          {[
            {
              value: summary.total,
              label: "Skills tracked",
              icon: "mdi:star-four-points",
              accent: "var(--accent-indigo)",
            },
            {
              value: summary.avg,
              label: "Mean proficiency",
              icon: "mdi:gauge",
              accent: proficiencyBandColor(summary.avg),
              suffix: "%",
            },
            {
              value: summary.strong,
              label: "Strong skills",
              icon: "mdi:check-decagram",
              accent: "#10b981",
            },
            {
              value: summary.interviewReady,
              label: "Interview-ready",
              icon: "mdi:account-tie",
              accent: "#0a66c2",
            },
          ].map((kpi) => (
            <Box
              key={kpi.label}
              component={motion.div}
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
              }}
              sx={{
                ...glass,
                p: { xs: 1.75, md: 2.25 },
                display: "flex",
                flexDirection: "column",
                gap: 1,
                overflow: "hidden",
                transition: "transform 0.2s ease, border-color 0.2s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  borderColor: `color-mix(in srgb, ${kpi.accent} 45%, transparent)`,
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: -30,
                  right: -30,
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, color-mix(in srgb, ${kpi.accent} 22%, transparent) 0%, transparent 70%)`,
                  pointerEvents: "none",
                },
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: `color-mix(in srgb, ${kpi.accent} 14%, transparent)`,
                  color: kpi.accent,
                  border: `1px solid color-mix(in srgb, ${kpi.accent} 26%, transparent)`,
                }}
              >
                <IconWrapper icon={kpi.icon} size={16} />
              </Box>
              <Typography
                sx={{
                  fontWeight: 900,
                  color: "var(--font-primary)",
                  fontSize: { xs: "1.7rem", sm: "2rem", md: "2.3rem" },
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <CountUp value={kpi.value} duration={1.4} />
                {kpi.suffix}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                {kpi.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* ─── Distribution donut + strength composition ──────────────────── */}
        {summary.total >= 3 && (
          <Box
            component={motion.div}
            variants={fadeRise}
            {...entrance}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" },
              gap: 1.5,
              mb: { xs: 3, md: 4 },
            }}
          >
            {/* Donut */}
            <Box sx={{ ...glass, p: { xs: 2, md: 2.5 } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <IconWrapper icon="mdi:chart-donut" size={14} color="var(--accent-indigo-dark)" />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    fontSize: "0.66rem",
                    color: "var(--font-secondary)",
                  }}
                >
                  Proficiency distribution
                </Typography>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.1fr)", alignItems: "center", gap: 2 }}>
                <Box sx={{ height: 200, position: "relative" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.distribution}
                        dataKey="count"
                        nameKey="label"
                        innerRadius="62%"
                        outerRadius="92%"
                        paddingAngle={3}
                        stroke="none"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {summary.distribution.map((b) => (
                          <Cell key={b.label} fill={b.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={(p) => <GlassTip {...p} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 900,
                        fontSize: "1.6rem",
                        color: "var(--font-primary)",
                        lineHeight: 1,
                        letterSpacing: "-0.03em",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      <CountUp value={summary.total} />
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.6rem",
                        fontWeight: 800,
                        color: "var(--font-secondary)",
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        mt: 0.5,
                      }}
                    >
                      Skills
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "grid", gap: 0.65 }}>
                  {summary.distribution.map((b) => {
                    const pct = summary.total > 0 ? Math.round((b.count / summary.total) * 100) : 0;
                    return (
                      <Box
                        key={b.label}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "auto 1fr auto",
                          alignItems: "center",
                          gap: 1,
                          py: 0.4,
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: b.color,
                            boxShadow: `0 0 0 3px color-mix(in srgb, ${b.color} 18%, transparent)`,
                          }}
                        />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: "0.74rem", color: "var(--font-primary)", lineHeight: 1.2 }}>
                            {b.label}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: "0.62rem", color: "var(--font-secondary)", fontWeight: 600 }}>
                            {b.range}%
                          </Typography>
                        </Box>
                        <Typography
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.78rem",
                            color: b.color,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {b.count}
                          <Box component="span" sx={{ fontSize: "0.62em", color: "var(--font-secondary)", ml: 0.4, fontWeight: 700 }}>
                            · {pct}%
                          </Box>
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>

            {/* Strength composition */}
            <Box sx={{ ...glass, p: { xs: 2, md: 2.5 }, display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <IconWrapper icon="mdi:shield-star" size={14} color="var(--accent-indigo-dark)" />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    fontSize: "0.66rem",
                    color: "var(--font-secondary)",
                  }}
                >
                  Strength composition
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Tooltip title={`Mean confidence across all skills: ${summary.avgConfidence}%`} arrow>
                  <Chip
                    size="small"
                    icon={<IconWrapper icon="mdi:shield-check" size={12} />}
                    label={`${summary.avgConfidence}% avg confidence`}
                    sx={{
                      height: 22,
                      fontWeight: 700,
                      fontSize: "0.66rem",
                      color: "var(--accent-indigo-dark)",
                      bgcolor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--accent-indigo) 22%, transparent)",
                    }}
                  />
                </Tooltip>
              </Box>

              {/* Segmented bar */}
              <Box
                sx={{
                  display: "flex",
                  height: 32,
                  borderRadius: 999,
                  overflow: "hidden",
                  bgcolor: "color-mix(in srgb, var(--border-default) 30%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--border-default) 50%, transparent)",
                  mb: 1.75,
                }}
              >
                {summary.strengthSplit.map((s) => {
                  const share = summary.total > 0 ? (s.value / summary.total) * 100 : 0;
                  if (share === 0) return null;
                  return (
                    <Tooltip key={s.name} title={`${s.name}: ${s.value} (${Math.round(share)}%)`} arrow placement="top">
                      <Box
                        sx={{
                          width: `${share}%`,
                          background: `linear-gradient(90deg, ${s.color} 0%, color-mix(in srgb, ${s.color} 70%, transparent) 100%)`,
                          transition: "width 0.6s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          "&:not(:last-of-type)": { borderRight: "2px solid var(--card-bg)" },
                        }}
                      >
                        {share > 14 && (
                          <Typography
                            sx={{
                              color: "#fff",
                              fontWeight: 800,
                              fontSize: "0.72rem",
                              fontVariantNumeric: "tabular-nums",
                              textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                            }}
                          >
                            {Math.round(share)}%
                          </Typography>
                        )}
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 1,
                  flex: 1,
                  minHeight: 0,
                }}
              >
                {summary.strengthSplit.map((s) => {
                  const share = summary.total > 0 ? Math.round((s.value / summary.total) * 100) : 0;
                  return (
                    <Box
                      key={s.name}
                      sx={{
                        p: { xs: 1.25, md: 1.5 },
                        borderRadius: 2,
                        bgcolor: `color-mix(in srgb, ${s.color} 8%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${s.color} 22%, transparent)`,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: 0.75,
                        minHeight: 96,
                        position: "relative",
                        overflow: "hidden",
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          bottom: -30,
                          right: -30,
                          width: 80,
                          height: 80,
                          borderRadius: "50%",
                          background: `radial-gradient(circle, color-mix(in srgb, ${s.color} 16%, transparent) 0%, transparent 70%)`,
                          pointerEvents: "none",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, position: "relative" }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: s.color,
                            boxShadow: `0 0 0 3px color-mix(in srgb, ${s.color} 20%, transparent)`,
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: "0.62rem",
                            fontWeight: 800,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "var(--font-secondary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={s.name}
                        >
                          {s.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, position: "relative" }}>
                        <Typography
                          sx={{
                            fontWeight: 900,
                            fontSize: { xs: "1.45rem", md: "1.7rem" },
                            color: s.color,
                            lineHeight: 1,
                            letterSpacing: "-0.03em",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          <CountUp value={s.value} />
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.66rem",
                            fontWeight: 700,
                            color: "var(--font-secondary)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          · {share}%
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        )}

        {/* ─── Filter + sort ───────────────────────────────────────────────── */}
        <Box
          sx={{
            ...glass,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.25,
            p: { xs: 1.25, md: 1.5 },
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6, alignItems: "center" }}>
            <Chip
              label="All skills"
              size="small"
              onClick={() => setSelectedCategory("all")}
              sx={{
                fontWeight: 700,
                fontSize: "0.7rem",
                height: 26,
                bgcolor:
                  selectedCategory === "all"
                    ? "var(--accent-indigo)"
                    : "color-mix(in srgb, var(--border-default) 30%, transparent)",
                color: selectedCategory === "all" ? "#fff" : "var(--font-secondary)",
                border: selectedCategory === "all"
                  ? "1px solid var(--accent-indigo)"
                  : "1px solid color-mix(in srgb, var(--border-default) 60%, transparent)",
                "&:hover": {
                  bgcolor: selectedCategory === "all"
                    ? "var(--accent-indigo-dark)"
                    : "color-mix(in srgb, var(--accent-indigo) 14%, transparent)",
                },
              }}
            />
            {categories.map((cat) => (
              <Chip
                key={cat}
                size="small"
                label={cat}
                onClick={() => setSelectedCategory(cat)}
                sx={{
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  height: 26,
                  bgcolor:
                    selectedCategory === cat
                      ? "var(--accent-indigo)"
                      : "color-mix(in srgb, var(--border-default) 30%, transparent)",
                  color: selectedCategory === cat ? "#fff" : "var(--font-secondary)",
                  border: selectedCategory === cat
                    ? "1px solid var(--accent-indigo)"
                    : "1px solid color-mix(in srgb, var(--border-default) 60%, transparent)",
                  "&:hover": {
                    bgcolor: selectedCategory === cat
                      ? "var(--accent-indigo-dark)"
                      : "color-mix(in srgb, var(--accent-indigo) 14%, transparent)",
                  },
                }}
              />
            ))}
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, ml: "auto", alignItems: "center" }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.62rem",
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--font-secondary)",
                mr: 0.5,
              }}
            >
              Sort
            </Typography>
            {SORT_OPTIONS.map((opt) => {
              const selected = sortMode === opt.id;
              return (
                <Tooltip key={opt.id} title={`Sort by ${opt.label}`} arrow>
                  <IconButton
                    size="small"
                    onClick={() => setSortMode(opt.id)}
                    sx={{
                      color: selected ? "var(--accent-indigo-dark)" : "var(--font-secondary)",
                      bgcolor: selected ? "color-mix(in srgb, var(--accent-indigo) 14%, transparent)" : "transparent",
                      border: selected
                        ? "1px solid color-mix(in srgb, var(--accent-indigo) 30%, transparent)"
                        : "1px solid transparent",
                      "&:hover": {
                        bgcolor: "color-mix(in srgb, var(--accent-indigo) 14%, transparent)",
                      },
                    }}
                    aria-label={`Sort by ${opt.label}`}
                  >
                    <IconWrapper icon={opt.icon} size={15} />
                  </IconButton>
                </Tooltip>
              );
            })}
          </Box>
        </Box>

        {/* ─── Skill cards grid ────────────────────────────────────────────── */}
        <motion.div
          variants={gridStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 380px), 1fr))",
            gap: 14,
          }}
        >
          {visibleSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              expanded={expandedId === skill.id}
              onToggle={() => setExpandedId(expandedId === skill.id ? null : skill.id)}
            />
          ))}
        </motion.div>

        {filteredAndSorted.length > SKILLS_PREVIEW_LIMIT && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2.5 }}>
            <Box
              component="button"
              onClick={() => setShowAllSkills((v) => !v)}
              sx={{
                appearance: "none",
                border: "1px solid color-mix(in srgb, var(--accent-indigo) 28%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                backdropFilter: "blur(10px)",
                color: "var(--accent-indigo-dark)",
                fontWeight: 800,
                fontSize: "0.78rem",
                letterSpacing: "0.04em",
                px: 2.25,
                py: 1,
                borderRadius: 999,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "var(--accent-indigo)",
                  backgroundColor: "color-mix(in srgb, var(--accent-indigo) 14%, transparent)",
                  transform: "translateY(-1px)",
                  boxShadow: "0 10px 24px -16px color-mix(in srgb, var(--accent-indigo) 60%, transparent)",
                },
              }}
              aria-expanded={showAllSkills}
              aria-label={showAllSkills ? "Show fewer skills" : `Show all ${filteredAndSorted.length} skills`}
            >
              <IconWrapper icon={showAllSkills ? "mdi:chevron-up" : "mdi:chevron-down"} size={16} />
              {showAllSkills ? `Show top ${SKILLS_PREVIEW_LIMIT}` : `Show all ${filteredAndSorted.length} skills`}
            </Box>
          </Box>
        )}
      </SectionShell>
    </Reveal>
  );
}
