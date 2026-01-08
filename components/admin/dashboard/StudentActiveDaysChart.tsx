"use client";

import { StudentActiveDaysAnalytics } from "@/lib/services/admin/admin-dashboard.service";
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

interface StudentActiveDaysChartProps {
  data: StudentActiveDaysAnalytics[] | null;
}

export function StudentActiveDaysChart({ data }: StudentActiveDaysChartProps) {
  // Get top 20 students by active days
  const topStudents = (data || [])
    .filter(
      (item) => item && item.studentName && typeof item.Active_days === "number"
    )
    .sort((a, b) => b.Active_days - a.Active_days)
    .slice(0, 20)
    .map((item) => ({
      name: item.studentName,
      "Active Days": item.Active_days,
      "Present Streak": item.Present_streak,
    }));

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        height: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: "#111827",
            fontSize: { xs: "1rem", sm: "1.25rem" },
          }}
        >
          Student Active Days
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#6b7280",
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
        >
          Top 20 Students
        </Typography>
      </Box>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={
            topStudents.length > 0
              ? topStudents
              : [{ name: "", "Active Days": 0, "Present Streak": 0 }]
          }
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            stroke="#6b7280"
            fontSize={10}
            tick={{ fill: "#6b7280" }}
            angle={-45}
            textAnchor="end"
            height={120}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tick={{ fill: "#6b7280" }}
            label={{ value: "Days", angle: -90, position: "insideLeft" }}
            domain={[0, "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Legend iconType="square" />
          {topStudents.length > 0 && (
            <>
              <Bar
                dataKey="Active Days"
                fill="#10b981"
                name="Active Days"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="Present Streak"
                fill="#6366f1"
                name="Present Streak"
                radius={[4, 4, 0, 0]}
              />
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
