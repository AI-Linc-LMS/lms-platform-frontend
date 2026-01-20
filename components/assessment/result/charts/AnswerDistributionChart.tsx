"use client";

import { Box, Paper, Typography } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { IconWrapper } from "@/components/common/IconWrapper";

interface AnswerDistributionChartProps {
  correct: number;
  incorrect: number;
  unattempted: number;
}

export function AnswerDistributionChart({
  correct,
  incorrect,
  unattempted,
}: AnswerDistributionChartProps) {
  const data = [
    { name: "Correct", value: correct, color: "#10b981" },
    { name: "Incorrect", value: incorrect, color: "#ef4444" },
    { name: "Unattempted", value: unattempted, color: "#9ca3af" },
  ].filter((item) => item.value > 0);

  const total = correct + incorrect + unattempted;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <Box
          sx={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 2,
            p: 1.5,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#1f2937" }}>
            {data.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "#6b7280", display: "block" }}>
            Count: <strong>{data.value}</strong>
          </Typography>
          <Typography variant="caption" sx={{ color: "#6b7280", display: "block" }}>
            Percentage: <strong>{percentage}%</strong>
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for very small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={14}
        fontWeight={700}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:chart-pie" size={24} color="#8b5cf6" />
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
            Answer Distribution
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#6b7280",
              fontSize: "0.8125rem",
            }}
          >
            Breakdown of your answers
          </Typography>
        </Box>
      </Box>

      <Box sx={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color, fontWeight: 600 }}>
                  {value}: {entry.payload.value} ({((entry.payload.value / total) * 100).toFixed(1)}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
