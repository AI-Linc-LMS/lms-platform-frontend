"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  AnimatedRing,
  CountUp,
  Reveal,
  gridStagger,
} from "@/components/scorecard/shared";
import { motion } from "framer-motion";
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
  if (strength === "Strong") {
    return { color: "#10b981", bg: "color-mix(in srgb, #10b981 14%, transparent)" };
  }
  if (strength === "Intermediate") {
    return { color: "#f59e0b", bg: "color-mix(in srgb, #f59e0b 14%, transparent)" };
  }
  return { color: "#ef4444", bg: "color-mix(in srgb, #ef4444 14%, transparent)" };
}

function SkillCard({ skill, expanded, onToggle }: { skill: Skill; expanded: boolean; onToggle: () => void }) {
  const accent = proficiencyBandColor(skill.proficiencyScore);
  const levelColor = gradeLevelColor(skill.level);
  const strengthStyle = strengthChipProps(skill.strength);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
        },
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
          transition: "border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            borderColor:
              "color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
            transform: "translateY(-1px)",
            boxShadow:
              "0 18px 40px -24px color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
          },
        }}
      >
        {/* Accent strip on the left, color follows proficiency band. */}
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
          {/* Identity + chips */}
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                mb: 1,
                flexWrap: "wrap",
              }}
            >
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
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    bgcolor:
                      "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
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
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  color: levelColor,
                  bgcolor: "color-mix(in srgb, currentColor 12%, transparent)",
                  borderColor: "color-mix(in srgb, currentColor 30%, transparent)",
                }}
              />
              <Chip
                size="small"
                label={skill.strength}
                sx={{
                  height: 22,
                  fontWeight: 700,
                  fontSize: "0.7rem",
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
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    color: "var(--font-secondary)",
                    bgcolor:
                      "color-mix(in srgb, var(--border-default) 35%, transparent)",
                  }}
                />
              </Tooltip>
            </Box>

            {/* Channel breakdown — top 5 bars even when collapsed, with counts where present */}
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
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                      >
                        {row.label}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.max(0, Math.min(100, value))}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor:
                          "color-mix(in srgb, var(--border-default) 45%, transparent)",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 3,
                          backgroundColor: proficiencyBandColor(value),
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 700,
                        color: hasData ? "var(--font-primary)" : "var(--font-secondary)",
                        minWidth: 56,
                        textAlign: "right",
                      }}
                    >
                      {hasData
                        ? `${value.toFixed(0)}% · ${count}`
                        : "—"}
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
                  borderTop:
                    "1px dashed color-mix(in srgb, var(--border-default) 70%, transparent)",
                  display: "grid",
                  gap: 1.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "var(--font-secondary)", letterSpacing: 0.4, textTransform: "uppercase" }}
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
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, color: "var(--font-primary)" }}
                      >
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
                              <Box component="span" sx={{ ml: 0.75, color: proficiencyBandColor(item.score) }}>
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

          {/* Proficiency ring + expand toggle */}
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
              size={86}
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
  const [sortMode, setSortMode] = useState<SortMode>("proficiency");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of data) {
      if (s.category) set.add(s.category);
    }
    return Array.from(set).sort();
  }, [data]);

  const filteredAndSorted = useMemo(() => {
    const filtered =
      selectedCategory === "all"
        ? data
        : data.filter((s) => (s.category || "") === selectedCategory);
    const sorted = [...filtered];
    if (sortMode === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === "confidence") {
      sorted.sort((a, b) => b.confidenceScore - a.confidenceScore || b.proficiencyScore - a.proficiencyScore);
    } else {
      sorted.sort((a, b) => b.proficiencyScore - a.proficiencyScore || b.confidenceScore - a.confidenceScore);
    }
    return sorted;
  }, [data, sortMode, selectedCategory]);

  const summary = useMemo(() => {
    if (!data.length) {
      return { total: 0, avg: 0, strong: 0, interviewReady: 0 };
    }
    const total = data.length;
    const avg = Math.round(
      data.reduce((acc, s) => acc + (Number.isFinite(s.proficiencyScore) ? s.proficiencyScore : 0), 0) / total,
    );
    const strong = data.filter((s) => s.strength === "Strong").length;
    const interviewReady = data.filter((s) => s.level === "Interview-Ready").length;
    return { total, avg, strong, interviewReady };
  }, [data]);

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
              "radial-gradient(55% 70% at 0% 0%, color-mix(in srgb, var(--accent-indigo) 18%, transparent), transparent 60%)",
              "radial-gradient(45% 60% at 100% 100%, color-mix(in srgb, var(--accent-purple) 12%, transparent), transparent 60%)",
            ].join(", "),
            pointerEvents: "none",
          }}
        />

        <Box sx={{ position: "relative", p: { xs: 2.5, sm: 3.5, md: 4.5 } }}>
          {/* Header */}
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
                  background:
                    "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-indigo-dark) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "0 12px 24px -12px color-mix(in srgb, var(--accent-indigo) 60%, transparent)",
                  flexShrink: 0,
                }}
              >
                <IconWrapper icon="mdi:star-circle" size={22} color="#fff" />
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
                  Skill Scorecard
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.85rem", mt: 0.25 }}
                >
                  Per-skill proficiency across quizzes, assessments, coding, interviews, and videos.
                </Typography>
              </Box>
            </Box>

            {/* Summary metrics — counts + average */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, auto)" },
                gap: { xs: 1, sm: 1.5 },
              }}
            >
              {[
                { label: "Skills", value: summary.total, color: "var(--accent-indigo-dark)" },
                {
                  label: "Avg",
                  value: `${summary.avg}%`,
                  color: proficiencyBandColor(summary.avg),
                },
                { label: "Strong", value: summary.strong, color: "#10b981" },
                { label: "Interview-Ready", value: summary.interviewReady, color: "#0a66c2" },
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
                    {typeof stat.value === "number" ? (
                      <CountUp value={stat.value} duration={0.8} />
                    ) : (
                      stat.value
                    )}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Empty state */}
          {data.length === 0 ? (
            <Box
              sx={{
                py: { xs: 4, sm: 6 },
                textAlign: "center",
                borderRadius: 2,
                border:
                  "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
                color: "var(--font-secondary)",
              }}
            >
              <IconWrapper icon="mdi:medal-outline" size={40} color="var(--font-secondary)" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                No skill scores yet. Once admins tag content with skills and you complete attempts, cards populate here.
              </Typography>
            </Box>
          ) : (
            <>
              {/* Filter + sort row */}
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 2,
                }}
              >
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
                      "&:hover": {
                        bgcolor:
                          selectedCategory === "all"
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
                        bgcolor:
                          selectedCategory === cat
                            ? "var(--accent-indigo)"
                            : "color-mix(in srgb, var(--border-default) 35%, transparent)",
                        color: selectedCategory === cat ? "#fff" : "var(--font-secondary)",
                        "&:hover": {
                          bgcolor:
                            selectedCategory === cat
                              ? "var(--accent-indigo-dark)"
                              : "color-mix(in srgb, var(--accent-indigo) 14%, transparent)",
                        },
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
                            bgcolor: selected
                              ? "color-mix(in srgb, var(--accent-indigo) 14%, transparent)"
                              : "transparent",
                            "&:hover": {
                              bgcolor: "color-mix(in srgb, var(--accent-indigo) 14%, transparent)",
                            },
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

              {/* Skill cards grid */}
              <motion.div
                variants={gridStagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}
              >
                {filteredAndSorted.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    expanded={expandedId === skill.id}
                    onToggle={() => setExpandedId(expandedId === skill.id ? null : skill.id)}
                  />
                ))}
              </motion.div>
            </>
          )}
        </Box>
      </Box>
    </Reveal>
  );
}
