"use client";

import { useState, useMemo } from "react";
import { Box, Typography, Paper, Grid, Chip, Button, Tabs, Tab, LinearProgress } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Skill } from "@/lib/types/scorecard.types";
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
    const avgProficiency = Math.round(
      skills.reduce((sum, s) => sum + s.proficiencyScore, 0) / totalSkills
    );
    const strongSkills = skills.filter((s) => s.strength === "Strong").length;
    const interviewReady = skills.filter((s) => s.level === "Interview-Ready").length;
    const topSkill = skills.reduce((top, current) =>
      current.proficiencyScore > top.proficiencyScore ? current : top
    );

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

  // Prepare chart data for breakdown visualization
  const breakdownData = (skill: Skill) => [
    { name: "MCQ", value: skill.breakdown.mcqAccuracy, color: "#0a66c2" },
    { name: "Subjective", value: skill.breakdown.subjectiveScore, color: "#10b981" },
    { name: "Project", value: skill.breakdown.projectScore, color: "#f59e0b" },
    { name: "Interview", value: skill.breakdown.interviewScore, color: "#6366f1" },
  ];

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

        {/* Summary Stats */}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "#f9fafb",
                border: "1px solid rgba(0,0,0,0.08)",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "#000000",
                  fontSize: "1.75rem",
                  mb: 0.5,
                }}
              >
                {summaryStats.totalSkills}
              </Typography>
              <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                Total Skills
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "#f9fafb",
                border: "1px solid rgba(0,0,0,0.08)",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: getProficiencyColor(summaryStats.avgProficiency),
                  fontSize: "1.75rem",
                  mb: 0.5,
                }}
              >
                {summaryStats.avgProficiency}%
              </Typography>
              <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                Avg Proficiency
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "#f0fdf4",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "#10b981",
                  fontSize: "1.75rem",
                  mb: 0.5,
                }}
              >
                {summaryStats.strongSkills}
              </Typography>
              <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                Strong Skills
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "#f0fdf4",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "#10b981",
                  fontSize: "1.75rem",
                  mb: 0.5,
                }}
              >
                {summaryStats.interviewReady}
              </Typography>
              <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
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

      {/* Skill Cards */}
      <Grid container spacing={3}>
        {filteredAndSortedSkills.map((skill) => {
          const proficiencyColor = getProficiencyColor(skill.proficiencyScore);
          const breakdownChartData = breakdownData(skill);

          return (
            <Grid item xs={12} sm={6} md={4} key={skill.id}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: "#ffffff",
                  border: `2px solid ${proficiencyColor}30`,
                  background: `linear-gradient(135deg, ${proficiencyColor}08 0%, ${proficiencyColor}02 100%)`,
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: `0 12px 32px ${proficiencyColor}30`,
                    transform: "translateY(-6px)",
                    borderColor: `${proficiencyColor}60`,
                  },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "4px",
                    background: getGradeGradient(skill.level),
                  },
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
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" sx={{ color: "#666666", fontWeight: 500, fontSize: "0.875rem" }}>
                      Proficiency Score
                    </Typography>
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

                {/* Strength and Confidence */}
                <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: skill.strength === "Strong" ? "#f0fdf4" : "#fffbeb",
                        border: `1px solid ${skill.strength === "Strong" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)"}`,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                        <IconWrapper
                          icon={skill.strength === "Strong" ? "mdi:check-circle" : "mdi:alert-circle"}
                          size={16}
                          color={skill.strength === "Strong" ? "#10b981" : "#f59e0b"}
                        />
                        <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem", fontWeight: 500 }}>
                          Strength
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: skill.strength === "Strong" ? "#10b981" : "#f59e0b",
                          fontSize: "0.875rem",
                        }}
                      >
                        {skill.strength}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: "#f9fafb",
                        border: "1px solid rgba(0,0,0,0.08)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                        <IconWrapper icon="mdi:lightbulb" size={16} color="#0a66c2" />
                        <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem", fontWeight: 500 }}>
                          Confidence
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: "#000000",
                          fontSize: "0.875rem",
                        }}
                      >
                        {skill.confidenceScore}%
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Breakdown Chart */}
                <Box
                  sx={{
                    pt: 2.5,
                    borderTop: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#666666",
                      fontSize: "0.75rem",
                      mb: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    Performance Breakdown
                  </Typography>
                  <ResponsiveContainer width="100%" height={120}>
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
                        formatter={(value: number) => [`${value}%`, "Score"]}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {breakdownChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
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
    </Paper>
  );
}
