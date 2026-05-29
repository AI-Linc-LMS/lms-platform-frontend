"use client";

import { useMemo, useState } from "react";
import { Box, Chip, IconButton, LinearProgress, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";
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
  icon: string;
  countKey?:
    | "quizCount"
    | "codingCount"
    | "videoCount"
    | "assessmentCount"
    | "interviewCount";
}> = [
  { key: "quizScore", label: "Quizzes", icon: "mdi:format-list-checks", countKey: "quizCount" },
  { key: "assessmentScore", label: "Assessments", icon: "mdi:clipboard-check", countKey: "assessmentCount" },
  { key: "codingScore", label: "Coding", icon: "mdi:code-braces", countKey: "codingCount" },
  { key: "interviewScore", label: "Interviews", icon: "mdi:account-voice", countKey: "interviewCount" },
  { key: "videoScore", label: "Videos", icon: "mdi:play-circle-outline", countKey: "videoCount" },
];

function strengthChipProps(strength: Skill["strength"]) {
  if (strength === "Strong") return { color: "#10b981", bg: "color-mix(in srgb, #10b981 14%, transparent)" };
  if (strength === "Intermediate") return { color: "#f59e0b", bg: "color-mix(in srgb, #f59e0b 14%, transparent)" };
  return { color: "#ef4444", bg: "color-mix(in srgb, #ef4444 14%, transparent)" };
}

/** Top-3 medallion — large ring with skill name + level chip + best channel. */
function SkillMedallion({ skill, rank }: { skill: Skill; rank: number }) {
  const accent = proficiencyBandColor(skill.proficiencyScore);
  const rankColors = ["#fbbf24", "#9ca3af", "#d97706"];
  const rankIcons = ["mdi:trophy", "mdi:trophy-variant", "mdi:medal"];
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 18, scale: 0.94 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
      }}
    >
      <Box
        sx={{
          position: "relative",
          p: { xs: 2, md: 2.5 },
          borderRadius: 3,
          background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 14%, transparent) 0%, color-mix(in srgb, ${accent} 4%, transparent) 100%)`,
          border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
          minHeight: 230,
          transition: "transform 0.25s ease, box-shadow 0.25s ease",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: `0 24px 50px -28px color-mix(in srgb, ${accent} 50%, transparent)`,
          },
        }}
      >
        {/* Rank badge */}
        <Box
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            display: "flex",
            alignItems: "center",
            gap: 0.4,
            px: 0.75,
            py: 0.25,
            borderRadius: 999,
            bgcolor: `color-mix(in srgb, ${rankColors[rank]} 16%, transparent)`,
            color: rankColors[rank],
            fontWeight: 800,
            fontSize: "0.65rem",
            letterSpacing: "0.04em",
          }}
        >
          <IconWrapper icon={rankIcons[rank]} size={12} />#{rank + 1}
        </Box>
        <AnimatedRing
          value={skill.proficiencyScore}
          size={108}
          strokeWidth={11}
          color={accent}
          caption=""
          valueFontSize={24}
        />
        <Typography
          sx={{
            fontWeight: 800,
            color: "var(--font-primary)",
            fontSize: "0.95rem",
            textAlign: "center",
            lineHeight: 1.2,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
            letterSpacing: "-0.01em",
          }}
          title={skill.name}
        >
          {skill.name}
        </Typography>
        <Chip
          size="small"
          label={skill.level}
          sx={{
            height: 20,
            fontSize: "0.65rem",
            fontWeight: 800,
            color: gradeLevelColor(skill.level),
            bgcolor: `color-mix(in srgb, ${gradeLevelColor(skill.level)} 14%, transparent)`,
            letterSpacing: "0.04em",
          }}
        />
      </Box>
    </motion.div>
  );
}

function SkillCard({ skill, expanded, onToggle }: { skill: Skill; expanded: boolean; onToggle: () => void }) {
  const accent = proficiencyBandColor(skill.proficiencyScore);
  const levelColor = gradeLevelColor(skill.level);
  const strengthStyle = strengthChipProps(skill.strength);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
      }}
    >
      <Box
        sx={{
          position: "relative",
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
          bgcolor: "var(--card-bg)",
          transition: "border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            borderColor: "color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
            transform: "translateY(-1px)",
            boxShadow:
              "0 18px 40px -24px color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
          },
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            width: 4,
            background: gradeLevelGradient(skill.level),
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1, flexWrap: "wrap" }}>
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
                title={skill.name}
              >
                {skill.name}
              </Typography>
              {skill.category && (
                <Chip
                  size="small"
                  label={skill.category}
                  sx={{
                    height: 22,
                    fontWeight: 700,
                    fontSize: "0.68rem",
                    bgcolor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                    color: "var(--accent-indigo-dark)",
                  }}
                />
              )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap", mb: 1.5 }}>
              <Chip
                size="small"
                label={skill.level}
                sx={{
                  height: 22,
                  fontWeight: 800,
                  fontSize: "0.68rem",
                  color: levelColor,
                  bgcolor: `color-mix(in srgb, ${levelColor} 12%, transparent)`,
                }}
              />
              <Chip
                size="small"
                label={skill.strength}
                sx={{
                  height: 22,
                  fontWeight: 800,
                  fontSize: "0.68rem",
                  color: strengthStyle.color,
                  bgcolor: strengthStyle.bg,
                }}
              />
              <Tooltip
                title={`Confidence reflects how many attempts inform this skill (currently ${skill.confidenceScore}%). More attempts → higher confidence.`}
                arrow
                placement="top"
              >
                <Chip
                  size="small"
                  icon={<IconWrapper icon="mdi:shield-check" size={14} />}
                  label={`${skill.confidenceScore}% conf`}
                  sx={{
                    height: 22,
                    fontWeight: 700,
                    fontSize: "0.68rem",
                    color: "var(--font-secondary)",
                    bgcolor: "color-mix(in srgb, var(--border-default) 35%, transparent)",
                  }}
                />
              </Tooltip>
            </Box>

            <Box sx={{ display: "grid", gap: 0.75 }}>
              {BREAKDOWN_ROWS.map((row) => {
                const value = skill.breakdown[row.key] ?? 0;
                const count = row.countKey ? skill.breakdownCounts?.[row.countKey] : undefined;
                const hasData = (count ?? 0) > 0;
                return (
                  <Box
                    key={row.key}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "auto minmax(0, 1fr) auto",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: hasData ? "var(--font-primary)" : "var(--font-secondary)",
                        opacity: hasData ? 1 : 0.55,
                      }}
                    >
                      <IconWrapper icon={row.icon} size={14} />
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.7rem" }}>
                        {row.label}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 6,
                        borderRadius: 999,
                        bgcolor: "color-mix(in srgb, var(--border-default) 45%, transparent)",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          width: `${Math.max(0, Math.min(100, value))}%`,
                          height: "100%",
                          borderRadius: 999,
                          background: `linear-gradient(90deg, ${proficiencyBandColor(value)} 0%, color-mix(in srgb, ${proficiencyBandColor(value)} 65%, transparent) 100%)`,
                          transition: "width 0.6s ease",
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 700,
                        color: hasData ? "var(--font-primary)" : "var(--font-secondary)",
                        minWidth: 56,
                        textAlign: "right",
                        fontSize: "0.72rem",
                      }}
                    >
                      {hasData ? `${value.toFixed(0)}% · ${count}` : "—"}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

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
                  sx={{ fontWeight: 800, color: "var(--font-secondary)", letterSpacing: 0.4, textTransform: "uppercase", fontSize: "0.65rem" }}
                >
                  Recent activity
                </Typography>
                {([
                  { label: "Quiz", items: skill.breakdownItems.quiz },
                  { label: "Coding", items: skill.breakdownItems.coding },
                  { label: "Assessment", items: skill.breakdownItems.assessment },
                  { label: "Interview", items: skill.breakdownItems.interview },
                  { label: "Video", items: skill.breakdownItems.video },
                ] as const)
                  .filter((b) => Array.isArray(b.items) && b.items.length > 0)
                  .map((b) => (
                    <Box key={b.label}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--font-primary)", fontSize: "0.72rem" }}>
                        {b.label}
                      </Typography>
                      <Box component="ul" sx={{ pl: 2, mt: 0.25, mb: 0, color: "var(--font-secondary)" }}>
                        {b.items.slice(0, 3).map((item, i) => (
                          <Box
                            component="li"
                            key={`${item.name}-${i}`}
                            sx={{ fontSize: "0.78rem", lineHeight: 1.5 }}
                          >
                            <Box component="span" sx={{ color: "var(--font-primary)" }}>
                              {item.name || "Untitled"}
                            </Box>
                            {item.score != null && (
                              <Box component="span" sx={{ ml: 0.75, color: proficiencyBandColor(item.score), fontWeight: 700 }}>
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
              gap: 1,
              minWidth: { xs: "auto", sm: 100 },
            }}
          >
            <AnimatedRing
              value={skill.proficiencyScore}
              size={88}
              strokeWidth={9}
              color={accent}
              caption="Proficiency"
              valueFontSize={20}
            />
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
              aria-label={expanded ? "Hide breakdown details" : "Show breakdown details"}
            >
              <IconWrapper icon={expanded ? "mdi:chevron-up" : "mdi:chevron-down"} size={18} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}

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
    if (!data.length) return { total: 0, avg: 0, strong: 0, interviewReady: 0, topThree: [] as Skill[], distribution: [] as { label: string; count: number; color: string }[] };
    const total = data.length;
    const avg = Math.round(data.reduce((acc, s) => acc + (Number.isFinite(s.proficiencyScore) ? s.proficiencyScore : 0), 0) / total);
    const strong = data.filter((s) => s.strength === "Strong").length;
    const interviewReady = data.filter((s) => s.level === "Interview-Ready").length;
    const topThree = [...data].sort((a, b) => b.proficiencyScore - a.proficiencyScore).slice(0, 3);
    // Proficiency distribution buckets (0-20 / 20-40 / 40-60 / 60-80 / 80-100)
    // so the section can show "where do my skills sit" without needing 35 rows.
    const buckets = [
      { label: "0–20", min: 0, max: 20, color: "#ef4444" },
      { label: "20–40", min: 20, max: 40, color: "#f97316" },
      { label: "40–60", min: 40, max: 60, color: "#f59e0b" },
      { label: "60–80", min: 60, max: 80, color: "#10b981" },
      { label: "80–100", min: 80, max: 100, color: "#0a66c2" },
    ];
    const distribution = buckets.map((b) => ({
      label: b.label,
      color: b.color,
      count: data.filter((s) => s.proficiencyScore >= b.min && (b.max === 100 ? s.proficiencyScore <= 100 : s.proficiencyScore < b.max)).length,
    }));
    return { total, avg, strong, interviewReady, topThree, distribution };
  }, [data]);

  // Collapse the list once it gets long. The top 8 stay visible by default;
  // the rest sit behind a "Show all" toggle so the section doesn't sprawl
  // into a 35-skill wall.
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
              py: { xs: 5, sm: 7 },
              textAlign: "center",
              borderRadius: 3,
              border: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
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
          "radial-gradient(55% 70% at 0% 0%, color-mix(in srgb, var(--accent-indigo) 16%, transparent), transparent 60%)",
          "radial-gradient(45% 60% at 100% 100%, color-mix(in srgb, var(--accent-purple) 12%, transparent), transparent 60%)",
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

        {/* Hero: Top-3 medallions + master proficiency ring */}
        <Box
          component={motion.div}
          variants={fadeRise}
          {...entrance}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 280px)" },
            gap: { xs: 2.5, md: 3 },
            mb: { xs: 3.5, md: 4 },
          }}
        >
          <Box
            component={motion.div}
            variants={gridStagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(3, 1fr)" },
              gap: 1.5,
            }}
          >
            {summary.topThree.map((s, i) => (
              <SkillMedallion key={s.id} skill={s} rank={i} />
            ))}
          </Box>
          <Box
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: 3,
              background:
                "linear-gradient(160deg, color-mix(in srgb, var(--accent-indigo) 12%, transparent) 0%, color-mix(in srgb, var(--accent-purple) 6%, transparent) 100%)",
              border: "1px solid color-mix(in srgb, var(--accent-indigo) 22%, transparent)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              textAlign: "center",
            }}
          >
            <AnimatedRing
              value={summary.avg}
              size={140}
              strokeWidth={11}
              color="var(--accent-indigo)"
              colorEnd="var(--accent-purple)"
              caption=""
              valueFontSize={32}
            />
            <Typography
              variant="caption"
              sx={{
                color: "var(--font-secondary)",
                fontWeight: 700,
                letterSpacing: "0.16em",
                fontSize: "0.66rem",
                textTransform: "uppercase",
                mt: 1,
              }}
            >
              Mean Proficiency
            </Typography>
            <Typography sx={{ fontWeight: 700, color: "var(--font-primary)", fontSize: "0.85rem" }}>
              across <CountUp value={summary.total} /> tracked skills
            </Typography>
          </Box>
        </Box>

        {/* Editorial KPI rail */}
        <Box
          component={motion.div}
          variants={gridStagger}
          {...entrance}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            borderTop: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
            borderBottom: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
            mb: { xs: 3.5, md: 4 },
          }}
        >
          {[
            { value: summary.total, label: "Skills tracked", accent: "var(--accent-indigo-dark)" },
            { value: summary.avg, label: "Avg %", accent: proficiencyBandColor(summary.avg), suffix: "%" },
            { value: summary.strong, label: "Strong skills", accent: "#10b981" },
            { value: summary.interviewReady, label: "Interview-ready", accent: "#0a66c2" },
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

        {/* Proficiency distribution — quick "where do my skills sit" read */}
        {summary.distribution.length > 0 && summary.total >= 3 && (
          <Box
            component={motion.div}
            variants={fadeRise}
            {...entrance}
            sx={{
              p: { xs: 2, md: 2.5 },
              borderRadius: 3,
              border: "1px solid color-mix(in srgb, var(--border-default) 75%, transparent)",
              bgcolor: "color-mix(in srgb, var(--card-bg) 92%, transparent)",
              mb: { xs: 3, md: 4 },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <IconWrapper icon="mdi:chart-bar" size={14} color="var(--accent-indigo-dark)" />
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
              <Box
                sx={{
                  flex: 1,
                  height: 1,
                  ml: 0.5,
                  background:
                    "linear-gradient(90deg, color-mix(in srgb, var(--border-default) 70%, transparent) 0%, transparent 100%)",
                }}
              />
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${summary.distribution.length}, 1fr)`,
                gap: { xs: 0.5, sm: 1 },
                alignItems: "end",
                height: { xs: 96, md: 112 },
              }}
            >
              {(() => {
                const maxCount = Math.max(1, ...summary.distribution.map((b) => b.count));
                return summary.distribution.map((bucket) => {
                  const pctHeight = (bucket.count / maxCount) * 100;
                  return (
                    <Box key={bucket.label} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                      <Box
                        sx={{
                          width: "100%",
                          height: `${Math.max(6, pctHeight)}%`,
                          borderRadius: "8px 8px 4px 4px",
                          background: `linear-gradient(180deg, ${bucket.color} 0%, color-mix(in srgb, ${bucket.color} 60%, transparent) 100%)`,
                          boxShadow: `inset 0 -2px 6px color-mix(in srgb, ${bucket.color} 70%, transparent)`,
                          transition: "height 0.6s ease",
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "center",
                          pt: 0.5,
                        }}
                      >
                        {bucket.count > 0 && (
                          <Typography
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.7rem",
                              color: "#fff",
                              fontVariantNumeric: "tabular-nums",
                              textShadow: "0 1px 2px rgba(0,0,0,0.18)",
                            }}
                          >
                            {bucket.count}
                          </Typography>
                        )}
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.66rem",
                          fontWeight: 700,
                          color: "var(--font-secondary)",
                          letterSpacing: "0.04em",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {bucket.label}%
                      </Typography>
                    </Box>
                  );
                });
              })()}
            </Box>
          </Box>
        )}

        {/* Filter + sort row */}
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
            <Chip
              label="All skills"
              size="small"
              onClick={() => setSelectedCategory("all")}
              sx={{
                fontWeight: 700,
                bgcolor:
                  selectedCategory === "all"
                    ? "var(--accent-indigo)"
                    : "color-mix(in srgb, var(--border-default) 35%, transparent)",
                color: selectedCategory === "all" ? "#fff" : "var(--font-secondary)",
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
                  bgcolor:
                    selectedCategory === cat
                      ? "var(--accent-indigo)"
                      : "color-mix(in srgb, var(--border-default) 35%, transparent)",
                  color: selectedCategory === cat ? "#fff" : "var(--font-secondary)",
                }}
              />
            ))}
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, ml: "auto" }}>
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
                      "&:hover": { bgcolor: "color-mix(in srgb, var(--accent-indigo) 14%, transparent)" },
                    }}
                    aria-label={`Sort by ${opt.label}`}
                  >
                    <IconWrapper icon={opt.icon} size={16} />
                  </IconButton>
                </Tooltip>
              );
            })}
          </Box>
        </Box>

        <motion.div
          variants={gridStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}
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

        {/* "Show all" toggle — keeps the section scannable when there are
            many tracked skills. Hides itself when the filter+sort already
            yields ≤ preview limit. */}
        {filteredAndSorted.length > SKILLS_PREVIEW_LIMIT && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2.5 }}>
            <Box
              component="button"
              onClick={() => setShowAllSkills((v) => !v)}
              sx={{
                appearance: "none",
                border: "1px solid color-mix(in srgb, var(--accent-indigo) 28%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)",
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
                transition: "all 0.18s ease",
                "&:hover": {
                  borderColor: "var(--accent-indigo)",
                  backgroundColor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
                  transform: "translateY(-1px)",
                },
              }}
              aria-expanded={showAllSkills}
              aria-label={showAllSkills ? "Show fewer skills" : `Show all ${filteredAndSorted.length} skills`}
            >
              <IconWrapper icon={showAllSkills ? "mdi:chevron-up" : "mdi:chevron-down"} size={16} />
              {showAllSkills
                ? `Show top ${SKILLS_PREVIEW_LIMIT}`
                : `Show all ${filteredAndSorted.length} skills`}
            </Box>
          </Box>
        )}
      </SectionShell>
    </Reveal>
  );
}
