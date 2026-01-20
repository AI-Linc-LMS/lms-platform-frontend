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
      return "#10b981";
    }
    if (bandLower.includes("balanced") || bandLower.includes("moderate")) {
      return "#3b82f6";
    }
    return "#f59e0b";
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        border: "1px solid #e5e7eb",
        borderRadius: 3,
        background: "#ffffff",
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
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:account-circle" size={24} color="#6366f1" />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#1f2937",
              mb: 0.25,
            }}
          >
            Personality Traits
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#6b7280",
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
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="trait"
              tick={{ fontSize: 11, fill: "#6b7280" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
            />
            <Radar
              name="Trait Score"
              dataKey="score"
              stroke="#6366f1"
              fill="#6366f1"
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
                color: "#1f2937",
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
                  color: "#ffffff",
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {trait.band}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                {trait.score}/100
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
