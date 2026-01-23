"use client";

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
import { Box, Typography, Paper } from "@mui/material";

interface SkillData {
  skillName: string;
  accuracy: number;
  [key: string]: any;
}

interface SkillBarChartProps {
  data: SkillData[];
  title?: string;
  height?: number;
  dataKey?: string;
  color?: string;
}

export function SkillBarChart({
  data,
  title,
  height = 300,
  dataKey = "accuracy",
  color = "#0a66c2",
}: SkillBarChartProps) {
  const getColor = (value: number) => {
    if (value >= 80) return "#10b981"; // Green
    if (value >= 60) return "#0a66c2"; // Blue
    if (value >= 40) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

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
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, bottom: 5, left: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              domain={[0, 100]}
              stroke="#666666"
              fontSize={12}
              tick={{ fill: "#666666" }}
            />
            <YAxis
              type="category"
              dataKey="skillName"
              stroke="#666666"
              fontSize={12}
              tick={{ fill: "#666666" }}
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              labelStyle={{ color: "#000000", fontWeight: 600 }}
              formatter={(value: number) => [`${value}%`, "Accuracy"]}
            />
            <Bar dataKey={dataKey} radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry[dataKey])} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
