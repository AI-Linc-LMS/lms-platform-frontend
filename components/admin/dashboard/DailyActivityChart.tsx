"use client";

import { Box, Typography, Paper } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DailyActivityChartProps {
  data: Array<{
    date: string;
    video: number;
    article: number;
    quiz: number;
    assignment: number;
    coding_problem: number;
    dev_coding_problem: number;
    total: number;
  }>;
}

export function DailyActivityChart({ data }: DailyActivityChartProps) {
  const formattedData = (data || []).map((item) => {
    const date = new Date(item.date);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    return {
      ...item,
      label: `${month}/${day} ${dayName}`,
      Articles: item.article || 0,
      Videos: item.video || 0,
      Problems: item.coding_problem || 0,
      Quiz: item.quiz || 0,
      Subjective: item.assignment || 0,
      Development: item.dev_coding_problem || 0,
    };
  });

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        height: "100%",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: "#111827",
          mb: 3,
          fontSize: { xs: "1rem", sm: "1.25rem" },
        }}
      >
        Student Daily Activity
      </Typography>
      {formattedData.length === 0 ? (
        <Box
          sx={{
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
          }}
        >
          <Typography variant="body2">No activity data available</Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: "#6b7280" }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: "#6b7280" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Legend iconType="square" />
            <Bar
              dataKey="Articles"
              stackId="a"
              fill="#000000"
              name="Articles"
            />
            <Bar
              dataKey="Videos"
              stackId="a"
              fill="#4ecdc4"
              name="Videos"
            />
            <Bar
              dataKey="Problems"
              stackId="a"
              fill="#ffd93d"
              name="Problems"
            />
            <Bar
              dataKey="Quiz"
              stackId="a"
              fill="#6c5ce7"
              name="Quiz"
            />
            <Bar
              dataKey="Subjective"
              stackId="a"
              fill="#a8e6cf"
              name="Subjective"
            />
            <Bar
              dataKey="Development"
              stackId="a"
              fill="#ff6b9d"
              name="Development"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}

