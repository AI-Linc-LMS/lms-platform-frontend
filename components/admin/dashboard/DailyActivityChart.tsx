"use client";

import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("common");
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
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
        boxShadow:
          "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
        height: "100%",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: "var(--font-primary)",
          mb: 3,
          fontSize: { xs: "1rem", sm: "1.25rem" },
        }}
      >
        {t("admin.dashboard.studentDailyActivity")}
      </Typography>
      {formattedData.length === 0 ? (
        <Box
          sx={{
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--font-secondary)",
          }}
        >
          <Typography variant="body2">{t("admin.dashboard.noActivityData")}</Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={formattedData} margin={{ bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
            <XAxis
              dataKey="label"
              stroke="var(--font-secondary)"
              fontSize={11}
              tick={{ fill: "var(--font-secondary)" }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              stroke="var(--font-secondary)"
              fontSize={12}
              tick={{ fill: "var(--font-secondary)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--border-default)",
                borderRadius: "8px",
              }}
            />
            <Legend iconType="square" wrapperStyle={{ paddingTop: 16 }} />
            <Bar
              dataKey="Articles"
              stackId="a"
              fill="var(--font-primary)"
              name="Articles"
            />
            <Bar
              dataKey="Videos"
              stackId="a"
              fill="var(--accent-indigo-dark)"
              name="Videos"
            />
            <Bar
              dataKey="Problems"
              stackId="a"
              fill="var(--warning-500)"
              name="Problems"
            />
            <Bar
              dataKey="Quiz"
              stackId="a"
              fill="var(--accent-purple)"
              name="Quiz"
            />
            <Bar
              dataKey="Subjective"
              stackId="a"
              fill="var(--success-500)"
              name="Subjective"
            />
            <Bar
              dataKey="Development"
              stackId="a"
              fill="var(--error-500)"
              name="Development"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}

