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

interface PersonalityTrait {
  trait_id: string;
  trait_name: string;
  band: string;
  score: number;
}

interface PersonalityRadarChartProps {
  personalitySnapshot: PersonalityTrait[];
}

export function PersonalityRadarChart({
  personalitySnapshot,
}: PersonalityRadarChartProps) {
  const chartData = personalitySnapshot.map((trait) => ({
    trait: trait.trait_name.length > 15
      ? trait.trait_name.substring(0, 15) + "..."
      : trait.trait_name,
    fullTrait: trait.trait_name,
    score: trait.score,
    band: trait.band,
  }));

  const getBandColor = (band: string) => {
    const bandLower = band.toLowerCase();
    if (bandLower.includes("high") || bandLower.includes("analytical")) {
      return "var(--course-cta)";
    }
    if (bandLower.includes("balanced") || bandLower.includes("moderate")) {
      return "var(--accent-blue-light)";
    }
    return "var(--warning-500)";
  };

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
            backgroundColor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:account-circle" size={24} color="var(--accent-indigo)" />
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
            Personality Traits
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "var(--font-secondary)",
              fontSize: "0.8125rem",
            }}
          >
            Your personality profile
          </Typography>
        </Box>
      </Box>

      <Box sx={{ width: "100%", height: 450 }}>
        <ResponsiveContainer>
          <RadarChart data={chartData}>
            <PolarGrid stroke="var(--border-default)" />
            <PolarAngleAxis
              dataKey="trait"
              tick={{ fontSize: 11, fill: "var(--font-secondary)" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "var(--font-tertiary)" }}
            />
            <Radar
              name="Trait Score"
              dataKey="score"
              stroke="var(--accent-indigo)"
              fill="var(--accent-indigo)"
              fillOpacity={0.6}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </Box>

      {/* Trait Bands */}
      <Box
        sx={{
          mt: 3,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        {personalitySnapshot.map((trait) => (
          <Box
            key={trait.trait_id}
            sx={{
              p: 2,
              borderRadius: 2,
              border: `1px solid ${getBandColor(trait.band)}40`,
              backgroundColor: `${getBandColor(trait.band)}10`,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: "var(--font-primary-dark)",
                mb: 0.5,
              }}
            >
              {trait.trait_name}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  backgroundColor: getBandColor(trait.band),
                  color: "var(--font-light)",
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {trait.band}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                {trait.score}/100
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
