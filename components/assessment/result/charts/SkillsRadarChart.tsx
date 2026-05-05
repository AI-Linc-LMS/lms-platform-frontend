"use client";

import { Box, Paper, Typography } from "@mui/material";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { IconWrapper } from "@/components/common/IconWrapper";

interface SkillData {
  skill: string;
  accuracy_percent: number;
  rating_out_of_5: number;
}

interface SkillsRadarChartProps {
  topSkills: SkillData[];
  lowSkills: SkillData[];
}

export function SkillsRadarChart({ topSkills, lowSkills }: SkillsRadarChartProps) {
  if (topSkills.length === 0 && lowSkills.length === 0) {
    return null;
  }

  // Combine and format skills data
  const allSkills = [
    ...topSkills.map((s) => ({
      skill: s.skill.length > 20 ? s.skill.substring(0, 20) + "..." : s.skill,
      fullSkill: s.skill,
      topSkills: s.accuracy_percent,
      lowSkills: 0,
    })),
    ...lowSkills.map((s) => ({
      skill: s.skill.length > 20 ? s.skill.substring(0, 20) + "..." : s.skill,
      fullSkill: s.skill,
      topSkills: 0,
      lowSkills: s.accuracy_percent,
    })),
  ];

  // Limit to top 8 skills for readability
  const chartData = allSkills.slice(0, 8);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        border: "1px solid var(--border-default)",
        borderRadius: 3,
        background: "var(--font-light)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 3,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            backgroundColor: "color-mix(in srgb, var(--accent-blue-light) 12%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:radar" size={24} color="var(--accent-blue-light)" />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "var(--font-primary-dark)",
              mb: 0.25,
            }}
          >
            Skills Performance
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "var(--font-secondary)",
              fontSize: "0.8125rem",
            }}
          >
            Top skills vs areas for improvement
          </Typography>
        </Box>
      </Box>

      <Box sx={{ width: "100%", height: 450 }}>
        <ResponsiveContainer>
          <RadarChart data={chartData}>
            <PolarGrid stroke="var(--border-default)" />
            <PolarAngleAxis
              dataKey="skill"
              tick={{ fontSize: 11, fill: "var(--font-secondary)" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "var(--font-tertiary)" }}
            />
            <Radar
              name="Top Skills"
              dataKey="topSkills"
              stroke="var(--course-cta)"
              fill="var(--course-cta)"
              fillOpacity={0.6}
            />
            <Radar
              name="Areas for Improvement"
              dataKey="lowSkills"
              stroke="var(--error-500)"
              fill="var(--error-500)"
              fillOpacity={0.6}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: value === "Top Skills" ? "var(--course-cta)" : "var(--error-500)", fontWeight: 600 }}>
                  {value}
                </span>
              )}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
