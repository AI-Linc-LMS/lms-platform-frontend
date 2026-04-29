"use client";

import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("common");
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
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
        boxShadow:
          "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
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
            color: "var(--font-primary)",
            fontSize: { xs: "1rem", sm: "1.25rem" },
          }}
        >
          {t("admin.dashboard.studentActiveDays")}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "var(--font-secondary)",
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
        >
          {t("admin.dashboard.top20Students")}
        </Typography>
      </Box>
      <ResponsiveContainer width="100%" height={380}>
        <BarChart
          data={
            topStudents.length > 0
              ? topStudents
              : [{ name: "", "Active Days": 0, "Present Streak": 0 }]
          }
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
          <XAxis
            dataKey="name"
            stroke="var(--font-secondary)"
            fontSize={10}
            tick={{ fill: "var(--font-secondary)" }}
            angle={-45}
            textAnchor="end"
            height={120}
          />
          <YAxis
            stroke="var(--font-secondary)"
            fontSize={12}
            tick={{ fill: "var(--font-secondary)" }}
            label={{ value: "Days", angle: -90, position: "insideLeft" }}
            domain={[0, "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--border-default)",
              borderRadius: "8px",
            }}
          />
          <Legend iconType="square" wrapperStyle={{ paddingTop: 16 }} />
          {topStudents.length > 0 && (
            <>
              <Bar
                dataKey="Active Days"
                fill="var(--success-500)"
                name="Active Days"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="Present Streak"
                fill="var(--accent-indigo)"
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
