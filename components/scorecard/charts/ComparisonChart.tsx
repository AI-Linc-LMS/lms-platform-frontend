"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Box, Typography, Paper } from "@mui/material";

interface ComparisonData {
  metric: string;
  studentValue: number;
  batchAverage: number;
  top10Percent?: number;
  interviewCleared?: number;
}

interface ComparisonChartProps {
  data: ComparisonData[];
  title?: string;
  height?: number;
}

export function ComparisonChart({
  data,
  title,
  height = 300,
}: ComparisonChartProps) {
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
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="metric"
              stroke="#666666"
              fontSize={12}
              tick={{ fill: "#666666" }}
            />
            <YAxis
              stroke="#666666"
              fontSize={12}
              tick={{ fill: "#666666" }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              labelStyle={{ color: "#000000", fontWeight: 600 }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "16px" }}
              formatter={(value) => (
                <span style={{ color: "#666666", fontSize: "0.875rem" }}>{value}</span>
              )}
            />
            <Bar
              dataKey="studentValue"
              name="You"
              fill="#0a66c2"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="batchAverage"
              name="Batch Average"
              fill="#9ca3af"
              radius={[4, 4, 0, 0]}
            />
            {data[0]?.top10Percent !== undefined && (
              <Bar
                dataKey="top10Percent"
                name="Top 10%"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            )}
            {data[0]?.interviewCleared !== undefined && (
              <Bar
                dataKey="interviewCleared"
                name="Interview Cleared"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
