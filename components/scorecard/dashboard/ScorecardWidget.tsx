"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Button, Paper, Grid } from "@mui/material";
import { useRouter } from "next/navigation";
import { IconWrapper } from "@/components/common/IconWrapper";
import { OverallScoreCard } from "./OverallScoreCard";
import { QuickStatsGrid } from "./QuickStatsGrid";
import { MiniChartCard } from "./MiniChartCard";
import { MiniBarChart } from "./MiniBarChart";
import { scorecardService } from "@/lib/services/scorecard.service";
import { PerformanceLevel, Skill } from "@/lib/types/scorecard.types";

interface DashboardSummary {
  overallScore: number;
  overallGrade: PerformanceLevel;
  totalTimeSpent: number;
  activeDaysStreak: number;
  completionPercentage: number;
  currentWeek: number;
  currentModule: string;
  topSkills: Skill[];
  recentTrend: Array<{
    week: number;
    weekLabel: string;
    mcqAccuracy: number;
  }>;
  learningConsumption?: LearningConsumption;
  skillDistribution?: Array<{ name: string; score: number; level: string }>;
  assessmentScores?: Array<{ name: string; score: number }>;
  skillLevels?: {
    beginner: number;
    intermediate: number;
    advanced: number;
    interviewReady: number;
  };
}

export function ScorecardWidget() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const summary = await scorecardService.getDashboardSummary();
        setData(summary);
      } catch (error) {
        console.error("Failed to load scorecard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: "1px solid rgba(0,0,0,0.08)",
          backgroundColor: "#ffffff",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        }}
      >
        <Typography variant="body2" sx={{ color: "#666666" }}>
          Loading scorecard...
        </Typography>
      </Paper>
    );
  }

  if (!data) {
    return null;
  }

  const stats = [
    {
      label: "Total Time Spent",
      value: `${data.totalTimeSpent}h`,
      icon: "mdi:clock-outline",
      color: "#0a66c2",
    },
    {
      label: "Active Days Streak",
      value: `${data.activeDaysStreak} days`,
      icon: "mdi:fire",
      color: "#f59e0b",
    },
    {
      label: "Completion",
      value: `${data.completionPercentage}%`,
      icon: "mdi:check-circle-outline",
      color: "#10b981",
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3.5, md: 4 },
        borderRadius: 3,
        border: "1px solid rgba(0,0,0,0.08)",
        backgroundColor: "#ffffff",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)",
        mb: 3,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          pb: 3,
          borderBottom: "2px solid rgba(0,0,0,0.08)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0a66c2 0%, #004182 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(10, 102, 194, 0.3)",
            }}
          >
            <IconWrapper icon="mdi:chart-line" size={24} color="#ffffff" />
          </Box>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#000000",
                fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                mb: 0.5,
                lineHeight: 1.2,
              }}
            >
              Performance Scorecard
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#666666",
                fontSize: "0.875rem",
              }}
            >
              Track your learning progress and performance
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          endIcon={<IconWrapper icon="mdi:arrow-right" size={18} />}
          onClick={() => router.push("/user/scorecard")}
          sx={{
            backgroundColor: "#0a66c2",
            color: "#ffffff",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.9375rem",
            px: 2.5,
            py: 1.25,
            borderRadius: "24px",
            boxShadow: "0 4px 12px rgba(10, 102, 194, 0.3)",
            "&:hover": {
              backgroundColor: "#004182",
              boxShadow: "0 6px 16px rgba(10, 102, 194, 0.4)",
              transform: "translateY(-2px)",
            },
            transition: "all 0.2s ease",
            display: { xs: "none", sm: "flex" },
          }}
        >
          View Detailed
        </Button>
      </Box>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left: Overall Performance */}
        <Grid item xs={12} sm={6} md={4}>
          <OverallScoreCard score={data.overallScore} grade={data.overallGrade} />
        </Grid>

        {/* Middle: Performance Graph */}
        <Grid item xs={12} sm={6} md={4}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              backgroundColor: "#ffffff",
              border: "2px solid #0a66c230",
              background: "linear-gradient(135deg, #0a66c208 0%, #0a66c202 100%)",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s ease",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              "&:hover": {
                boxShadow: "0 8px 24px #0a66c230",
                transform: "translateY(-4px)",
                borderColor: "#0a66c250",
              },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "linear-gradient(135deg, #0a66c2 0%, #004182 100%)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <IconWrapper icon="mdi:chart-line" size={20} color="#0a66c2" />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "#000000",
                  fontSize: "1rem",
                }}
              >
                Performance Trend
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <MiniChartCard
                title=""
                data={data.recentTrend.map((week) => ({
                  week: week.weekLabel,
                  value: week.mcqAccuracy,
                }))}
                color="#0a66c2"
                height={200}
              />
            </Box>
          </Box>
        </Grid>

        {/* Right: Top Skills Graph */}
        <Grid item xs={12} sm={6} md={4}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              backgroundColor: "#ffffff",
              border: "2px solid #10b98130",
              background: "linear-gradient(135deg, #10b98108 0%, #10b98102 100%)",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s ease",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              "&:hover": {
                boxShadow: "0 8px 24px #10b98130",
                transform: "translateY(-4px)",
                borderColor: "#10b98150",
              },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <IconWrapper icon="mdi:chart-bar" size={20} color="#10b981" />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "#000000",
                  fontSize: "1rem",
                }}
              >
                Top Skills Performance
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                "& .MuiPaper-root": {
                  boxShadow: "none",
                  border: "none",
                  backgroundColor: "transparent",
                  p: 0,
                },
              }}
            >
              <MiniBarChart
                title=""
                data={data.topSkills.slice(0, 5).map((skill) => ({
                  name: skill.name.length > 8 ? skill.name.substring(0, 8) + "..." : skill.name,
                  value: skill.proficiencyScore,
                }))}
                height={200}
              />
            </Box>
          </Box>
        </Grid>

        {/* Quick Stats - Full Width Below */}
        <Grid item xs={12}>
          <QuickStatsGrid stats={stats} />
        </Grid>
      </Grid>

      {/* Top Skills */}
      {data.topSkills.length > 0 && (
        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: "2px solid rgba(0,0,0,0.08)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
            <IconWrapper icon="mdi:star-circle" size={20} color="#0a66c2" />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#000000",
                fontSize: "1.125rem",
              }}
            >
              Top Skills
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            {data.topSkills.map((skill) => {
              const getSkillColor = () => {
                if (skill.proficiencyScore >= 80) return "#10b981";
                if (skill.proficiencyScore >= 60) return "#0a66c2";
                if (skill.proficiencyScore >= 40) return "#f59e0b";
                return "#9ca3af";
              };

              return (
                <Box
                  key={skill.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 2.5,
                    py: 1.5,
                    borderRadius: 2,
                    backgroundColor: "#f9fafb",
                    border: `2px solid ${getSkillColor()}30`,
                    background: `linear-gradient(135deg, ${getSkillColor()}08 0%, ${getSkillColor()}02 100%)`,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: `0 4px 12px ${getSkillColor()}25`,
                      transform: "translateY(-2px)",
                      borderColor: `${getSkillColor()}50`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: `${getSkillColor()}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconWrapper icon="mdi:star" size={16} color={getSkillColor()} />
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: "#000000",
                        fontSize: "0.9375rem",
                        lineHeight: 1.2,
                      }}
                    >
                      {skill.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: getSkillColor(),
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {skill.proficiencyScore}% proficiency
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Mobile View Button */}
      <Box
        sx={{
          mt: 4,
          display: { xs: "flex", sm: "none" },
          justifyContent: "center",
        }}
      >
        <Button
          variant="contained"
          fullWidth
          endIcon={<IconWrapper icon="mdi:arrow-right" size={18} />}
          onClick={() => router.push("/user/scorecard")}
          sx={{
            backgroundColor: "#0a66c2",
            color: "#ffffff",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.9375rem",
            py: 1.5,
            borderRadius: "24px",
            boxShadow: "0 4px 12px rgba(10, 102, 194, 0.3)",
            "&:hover": {
              backgroundColor: "#004182",
              boxShadow: "0 6px 16px rgba(10, 102, 194, 0.4)",
              transform: "translateY(-2px)",
            },
            transition: "all 0.2s ease",
          }}
        >
          View Detailed Scorecard
        </Button>
      </Box>
    </Paper>
  );
}
