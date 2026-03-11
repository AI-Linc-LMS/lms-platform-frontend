"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Box, Typography, Paper } from "@mui/material";

interface RadarData {
  subject: string;
  [key: string]: any;
}

interface SkillRadarChartProps {
  data: RadarData[];
  dataKeys: Array<{
    key: string;
    label: string;
    color: string;
  }>;
  title?: string;
  height?: number;
}

export function SkillRadarChart({
  data,
  dataKeys,
  title,
  height = 400,
}: SkillRadarChartProps) {
  return (
    <Box>
      {title && (
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            fontWeight: 600,
            color: "#000000",
            fontSize: "1.125rem",
          }}
        >
          {title}
        </Typography>
      )}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          border: "1px solid rgba(0,0,0,0.08)",
          backgroundColor: "#ffffff",
        }}
      >
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={data}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#666666", fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "#666666", fontSize: 10 }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "16px" }}
              formatter={(value) => (
                <span style={{ color: "#666666", fontSize: "0.875rem" }}>{value}</span>
              )}
            />
            {dataKeys.map(({ key, label, color }) => (
              <Radar
                key={key}
                name={label}
                dataKey={key}
                stroke={color}
                fill={color}
                fillOpacity={0.6}
                strokeWidth={2}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
