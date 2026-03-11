"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  LinearProgress,
  Tooltip as MuiTooltip,
  IconButton,
  Dialog,
  DialogContent,
  Fade,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Skill } from "@/lib/types/scorecard.types";

const CARD_STYLE = {
  p: 2.5,
  borderRadius: 2,
  border: "1px solid rgba(0,0,0,0.08)",
  backgroundColor: "#ffffff",
  minHeight: 0,
  transition: "box-shadow 0.2s ease, border-color 0.2s ease",
  "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.06)", borderColor: "rgba(0,0,0,0.12)" },
};

const STAT_BOX = {
  px: 1.5,
  py: 1,
  borderRadius: 1.5,
  border: "1px solid rgba(0,0,0,0.08)",
  backgroundColor: "#f9fafb",
  minHeight: 56,
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
};

const SUMMARY_STAT_CARD = {
  ...STAT_BOX,
  width: "100%",
  height: 88,
  minHeight: 88,
  textAlign: "center" as const,
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
  alignItems: "center",
};

const SKILL_TOOLTIPS = {
  proficiency:
    "Weighted average: Assessment 30%, Quiz 25%, Coding 20%, Interview 15%, Video 10%. Activities not attempted contribute 0. Completing more activity types improves this score.",
  confidence:
    "Confidence = min(100, √(attempt count) × 20). More completed activities (quizzes, videos, assessments, etc.) increase confidence.",
  strength: "Strong: ≥80%, Intermediate: ≥50%, Needs Attention: <50%",
  level: "Interview-Ready: ≥85%, Advanced: ≥75%, Intermediate: ≥65%, Beginner: <65%",
  breakdown: {
    quiz: "Average of (marks / max_marks) × 100 for each passed quiz with this skill.",
    video: "Average of (marks / 10) × 100 for each passed video with this skill.",
    assessment: "Average accuracy % for this skill from assessment submissions (MCQ + coding).",
    interview: "Average overall score from completed mock interviews tagged with this skill.",
    coding: "Average of (passed test cases / total test cases) × 100 for each coding attempt.",
  },
};
import { ProgressRingChart } from "../charts/ProgressRingChart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface SkillScorecardSectionProps {
  skills: Skill[];
}

export function SkillScorecardSection({ skills }: SkillScorecardSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"proficiency" | "name">("proficiency");
  const [breakdownModalSkill, setBreakdownModalSkill] = useState<Skill | null>(null);

  const getGradeColor = (level: string) => {
    switch (level) {
      case "Interview-Ready":
        return "#10b981";
      case "Advanced":
        return "#0a66c2";
      case "Intermediate":
        return "#f59e0b";
      default:
        return "#9ca3af";
    }
  };

  const getGradeGradient = (level: string) => {
    switch (level) {
      case "Interview-Ready":
        return "linear-gradient(135deg, #10b981 0%, #059669 100%)";
      case "Advanced":
        return "linear-gradient(135deg, #0a66c2 0%, #004182 100%)";
      case "Intermediate":
        return "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
      default:
        return "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)";
    }
  };

  const getProficiencyColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#0a66c2";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalSkills = skills.length;
    const avgProficiency =
      totalSkills > 0
        ? Math.round(skills.reduce((sum, s) => sum + s.proficiencyScore, 0) / totalSkills)
        : 0;
    const strongSkills = skills.filter((s) => s.strength === "Strong").length;
    const interviewReady = skills.filter((s) => s.level === "Interview-Ready").length;
    const topSkill =
      skills.length > 0
        ? skills.reduce((top, current) =>
            current.proficiencyScore > top.proficiencyScore ? current : top
          )
        : null;

    return {
      totalSkills,
      avgProficiency,
      strongSkills,
      interviewReady,
      topSkill,
    };
  }, [skills]);

  // Filter and sort skills
  const filteredAndSortedSkills = useMemo(() => {
    let filtered = skills;
    if (selectedCategory !== "all") {
      filtered = skills.filter((s) => s.category === selectedCategory);
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "proficiency") {
        return b.proficiencyScore - a.proficiencyScore;
      }
      return a.name.localeCompare(b.name);
    });

    return sorted;
  }, [skills, selectedCategory, sortBy]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = skills
      .map((s) => s.category)
      .filter((c): c is string => c !== undefined);
    return Array.from(new Set(cats));
  }, [skills]);

  // Prepare chart data and breakdown config (with items that contributed: quiz, assessment, interview, coding, video)
  const breakdownConfig = (skill: Skill) => [
    { name: "Quiz", value: skill.breakdown.quizScore, color: "#0a66c2", items: skill.breakdownItems?.quiz ?? [], tooltip: SKILL_TOOLTIPS.breakdown.quiz },
    { name: "Assessment", value: skill.breakdown.assessmentScore, color: "#10b981", items: skill.breakdownItems?.assessment ?? [], tooltip: SKILL_TOOLTIPS.breakdown.assessment },
    { name: "Interview", value: skill.breakdown.interviewScore, color: "#6366f1", items: skill.breakdownItems?.interview ?? [], tooltip: SKILL_TOOLTIPS.breakdown.interview },
    { name: "Coding", value: skill.breakdown.codingScore, color: "#f59e0b", items: skill.breakdownItems?.coding ?? [], tooltip: SKILL_TOOLTIPS.breakdown.coding },
    { name: "Video", value: skill.breakdown.videoScore, color: "#ec4899", items: skill.breakdownItems?.video ?? [], tooltip: SKILL_TOOLTIPS.breakdown.video },
  ];
  const breakdownData = (skill: Skill) =>
    breakdownConfig(skill).map(({ name, value, color }) => ({ name, value, color }));

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: 3,
        border: "1px solid rgba(0,0,0,0.08)",
        backgroundColor: "#ffffff",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          pb: 3,
          borderBottom: "2px solid rgba(0,0,0,0.08)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            }}
          >
            <IconWrapper icon="mdi:star-circle" size={28} color="#ffffff" />
          </Box>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#000000",
                fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                lineHeight: 1.2,
              }}
            >
              Skill Scorecard
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#666666",
                fontSize: "0.875rem",
                mt: 0.5,
              }}
            >
              Comprehensive skill proficiency analysis and breakdown
            </Typography>
          </Box>
        </Box>

        {/* Summary Stats - unified size */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={SUMMARY_STAT_CARD}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827", fontSize: "1.5rem" }}>
                {summaryStats.totalSkills}
              </Typography>
              <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.75rem" }}>
                Total Skills
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={SUMMARY_STAT_CARD}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: getProficiencyColor(summaryStats.avgProficiency), fontSize: "1.5rem" }}>
                {summaryStats.avgProficiency}%
              </Typography>
              <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.75rem" }}>
                Avg Proficiency
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={SUMMARY_STAT_CARD}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#10b981", fontSize: "1.5rem" }}>
                {summaryStats.strongSkills}
              </Typography>
              <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.75rem" }}>
                Strong Skills
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={SUMMARY_STAT_CARD}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#10b981", fontSize: "1.5rem" }}>
                {summaryStats.interviewReady}
              </Typography>
              <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.75rem" }}>
                Interview-Ready
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Filters and Sort */}
      <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", flex: 1 }}>
          <Button
            variant={selectedCategory === "all" ? "contained" : "outlined"}
            onClick={() => setSelectedCategory("all")}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "20px",
              px: 2,
              py: 0.75,
              ...(selectedCategory === "all" && {
                backgroundColor: "#6366f1",
                "&:hover": { backgroundColor: "#4f46e5" },
              }),
            }}
          >
            All Skills
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "contained" : "outlined"}
              onClick={() => setSelectedCategory(cat)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "20px",
                px: 2,
                py: 0.75,
                ...(selectedCategory === cat && {
                  backgroundColor: "#6366f1",
                  "&:hover": { backgroundColor: "#4f46e5" },
                }),
              }}
            >
              {cat}
            </Button>
          ))}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant={sortBy === "proficiency" ? "contained" : "outlined"}
            onClick={() => setSortBy("proficiency")}
            startIcon={<IconWrapper icon="mdi:sort" size={18} />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "20px",
              px: 2,
              py: 0.75,
              ...(sortBy === "proficiency" && {
                backgroundColor: "#0a66c2",
                "&:hover": { backgroundColor: "#004182" },
              }),
            }}
          >
            By Proficiency
          </Button>
          <Button
            variant={sortBy === "name" ? "contained" : "outlined"}
            onClick={() => setSortBy("name")}
            startIcon={<IconWrapper icon="mdi:sort-alphabetical" size={18} />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "20px",
              px: 2,
              py: 0.75,
              ...(sortBy === "name" && {
                backgroundColor: "#0a66c2",
                "&:hover": { backgroundColor: "#004182" },
              }),
            }}
          >
            By Name
          </Button>
        </Box>
      </Box>

      {/* Skill Cards - unified style */}
      <Grid container spacing={2}>
        {filteredAndSortedSkills.map((skill) => {
          const proficiencyColor = getProficiencyColor(skill.proficiencyScore);
          const breakdownChartData = breakdownData(skill);
          const hasBreakdownItems = breakdownConfig(skill).some((c) => c.items.length > 0);

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={skill.id}>
              <Box
                sx={{
                  ...CARD_STYLE,
                  position: "relative",
                  overflow: "hidden",
                  borderLeft: `4px solid ${proficiencyColor}`,
                }}
              >
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: "#000000",
                        fontSize: "1.25rem",
                        mb: 0.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {skill.name}
                    </Typography>
                    <MuiTooltip title={SKILL_TOOLTIPS.level} placement="top" arrow>
                      <Chip
                        label={skill.level}
                        size="small"
                        sx={{
                          background: getGradeGradient(skill.level),
                          color: "#ffffff",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          height: 24,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                        }}
                      />
                    </MuiTooltip>
                  </Box>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      flexShrink: 0,
                      ml: 2,
                    }}
                  >
                    <ProgressRingChart
                      value={skill.proficiencyScore}
                      size={80}
                      fontSize={18}
                      color={proficiencyColor}
                    />
                  </Box>
                </Box>

                {/* Proficiency Score */}
                <Box sx={{ mb: 2.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography variant="body2" sx={{ color: "#666666", fontWeight: 500, fontSize: "0.875rem" }}>
                        Proficiency Score
                      </Typography>
                      <MuiTooltip title={SKILL_TOOLTIPS.proficiency} placement="top" arrow>
                        <IconButton size="small" sx={{ p: 0.25, color: "#0a66c2" }}>
                          <IconWrapper icon="mdi:information-outline" size={16} color="currentColor" />
                        </IconButton>
                      </MuiTooltip>
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: proficiencyColor,
                        fontSize: "1.25rem",
                      }}
                    >
                      {skill.proficiencyScore}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={skill.proficiencyScore}
                    sx={{
                      height: 8,
                      borderRadius: 2,
                      backgroundColor: "#e5e7eb",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: proficiencyColor,
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>

                {/* Strength and Confidence - unified stat boxes */}
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={STAT_BOX}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.7rem", fontWeight: 500 }}>
                          Strength
                        </Typography>
                        <MuiTooltip title={SKILL_TOOLTIPS.strength} placement="top" arrow>
                          <IconButton size="small" sx={{ p: 0.25, color: "#9ca3af" }}>
                            <IconWrapper icon="mdi:information-outline" size={12} color="currentColor" />
                          </IconButton>
                        </MuiTooltip>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color:
                            skill.strength === "Strong"
                              ? "#10b981"
                              : skill.strength === "Intermediate"
                              ? "#0a66c2"
                              : "#f59e0b",
                          fontSize: "0.8rem",
                        }}
                      >
                        {skill.strength}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={STAT_BOX}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.7rem", fontWeight: 500 }}>
                          Confidence
                        </Typography>
                        <MuiTooltip title={SKILL_TOOLTIPS.confidence} placement="top" arrow>
                          <IconButton size="small" sx={{ p: 0.25, color: "#9ca3af" }}>
                            <IconWrapper icon="mdi:information-outline" size={12} color="currentColor" />
                          </IconButton>
                        </MuiTooltip>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827", fontSize: "0.8rem" }}>
                        {skill.confidenceScore}%
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Performance Breakdown - unified layout */}
                <Box sx={{ pt: 2, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.7rem", fontWeight: 600, mb: 1, display: "block" }}>
                    Performance Breakdown
                  </Typography>
                  <ResponsiveContainer width="100%" height={90}>
                    <BarChart data={breakdownChartData} layout="vertical" margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: "#666666", fontSize: 11 }}
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid rgba(0,0,0,0.08)",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          fontSize: "0.75rem",
                        }}
                        formatter={(value: number | undefined) => [value != null ? `${value}%` : "—", "Score"]}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {breakdownChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {hasBreakdownItems && (
                    <Button
                      size="small"
                      onClick={() => setBreakdownModalSkill(skill)}
                      sx={{
                        textTransform: "none",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#6366f1",
                        mt: 1,
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: "transparent",
                        "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.12)" },
                      }}
                    >
                      Show breakdown
                      <Box component="span" sx={{ ml: 0.5, display: "inline-flex", alignItems: "center" }}>
                        <IconWrapper icon="mdi:chevron-right" size={18} />
                      </Box>
                    </Button>
                  )}
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {filteredAndSortedSkills.length === 0 && (
        <Box
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 2,
            backgroundColor: "#f9fafb",
            border: "1px dashed rgba(0,0,0,0.08)",
          }}
        >
          <IconWrapper icon="mdi:filter-off" size={48} color="#9ca3af" />
          <Typography variant="body1" sx={{ color: "#666666", mt: 2 }}>
            No skills found for the selected category
          </Typography>
        </Box>
      )}

      {/* Breakdown modal */}
      <Dialog
        open={breakdownModalSkill != null}
        onClose={() => setBreakdownModalSkill(null)}
        aria-labelledby={breakdownModalSkill ? "breakdown-modal-title" : undefined}
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 300 }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxWidth: 520,
            overflow: "hidden",
            boxShadow: "0 32px 64px rgba(0,0,0,0.16), 0 0 1px rgba(0,0,0,0.08)",
          },
        }}
      >
        {breakdownModalSkill && (
          <>
            <Box
              id="breakdown-modal-title"
              component="div"
              role="heading"
              aria-level={2}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 2.5,
                background: `linear-gradient(135deg, ${getProficiencyColor(breakdownModalSkill.proficiencyScore)}18 0%, ${getProficiencyColor(breakdownModalSkill.proficiencyScore)}08 100%)`,
                borderBottom: `2px solid ${getProficiencyColor(breakdownModalSkill.proficiencyScore)}40`,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: getProficiencyColor(breakdownModalSkill.proficiencyScore) + "30",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconWrapper icon="mdi:chart-box-outline" size={24} color={getProficiencyColor(breakdownModalSkill.proficiencyScore)} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography component="span" sx={{ fontWeight: 700, fontSize: "1.25rem", color: "#111827", display: "block" }}>
                  {breakdownModalSkill.name}
                </Typography>
                <Typography component="span" variant="body2" sx={{ color: "#6b7280", fontWeight: 500, fontSize: "0.8rem" }}>
                  Performance breakdown · {breakdownModalSkill.proficiencyScore}% proficiency
                </Typography>
              </Box>
              <IconButton
                onClick={() => setBreakdownModalSkill(null)}
                sx={{
                  color: "#6b7280",
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.06)", color: "#111827" },
                }}
              >
                <IconWrapper icon="mdi:close" size={22} />
              </IconButton>
            </Box>
            <DialogContent sx={{ p: 2.5, maxHeight: "65vh", overflowY: "auto", bgcolor: "#fafbfc" }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {breakdownConfig(breakdownModalSkill)
                  .filter((cat) => cat.items.length > 0)
                  .map((cat) => (
                    <Box
                      key={cat.name}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "#ffffff",
                        border: "1px solid rgba(0,0,0,0.06)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            backgroundColor: cat.color,
                            flexShrink: 0,
                            boxShadow: `0 0 0 3px ${cat.color}30`,
                          }}
                        />
                        <Typography component="span" sx={{ color: "#1f2937", fontWeight: 700, fontSize: "0.875rem" }}>
                          {cat.name}
                        </Typography>
                        {cat.value > 0 && (
                          <Chip
                            size="small"
                            label={`${cat.value}%`}
                            sx={{
                              height: 24,
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              backgroundColor: cat.color + "20",
                              color: cat.color,
                              border: "none",
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, pl: 1.5 }}>
                        {cat.items.map((item, idx) => {
                          const path = [item.courseName, item.moduleName, item.submoduleName].filter(Boolean).join(" › ");
                          return (
                            <Box
                              key={`${cat.name}-${idx}-${item.name}`}
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.25,
                                py: 1,
                                px: 1.5,
                                borderRadius: 1.5,
                                backgroundColor: "#f8fafc",
                                border: "1px solid rgba(0,0,0,0.04)",
                                transition: "background-color 0.2s, border-color 0.2s",
                                "&:hover": { backgroundColor: "#f1f5f9", borderColor: "rgba(0,0,0,0.08)" },
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, minWidth: 0 }}>
                                <Typography
                                  component="span"
                                  sx={{
                                    color: "#374151",
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                  title={item.name}
                                >
                                  {item.name}
                                </Typography>
                                {item.score != null && (
                                  <Chip
                                    size="small"
                                    label={`${item.score}%`}
                                    sx={{
                                      height: 24,
                                      fontSize: "0.75rem",
                                      fontWeight: 700,
                                      backgroundColor: getProficiencyColor(item.score) + "25",
                                      color: getProficiencyColor(item.score),
                                      border: "none",
                                      flexShrink: 0,
                                    }}
                                  />
                                )}
                              </Box>
                              {path && (
                                <Typography
                                  component="span"
                                  sx={{
                                    color: "#6b7280",
                                    fontSize: "0.7rem",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.25,
                                  }}
                                  title={path}
                                >
                                  <IconWrapper icon="mdi:folder-outline" size={12} color="#9ca3af" />
                                  {path}
                                </Typography>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  ))}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Paper>
  );
}
