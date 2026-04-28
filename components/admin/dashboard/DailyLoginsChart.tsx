"use client";

import { useTranslation } from "react-i18next";
import { Box, Typography, Paper } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DailyLoginsChartProps {
  data: Array<{
    date: string;
    login_count: number;
  }>;
}

export function DailyLoginsChart({ data }: DailyLoginsChartProps) {
  const { t } = useTranslation("common");
  const formattedData = (data || []).map((item) => {
    const date = new Date(item.date);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    return {
      ...item,
      label: `${month}/${day} ${dayName}`,
      login_count: item.login_count || 0,
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
        {t("admin.dashboard.studentDailyLoginsChart")}
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
          <Typography variant="body2">{t("admin.dashboard.noLoginData")}</Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={formattedData} margin={{ bottom: 20 }}>
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
              label={{ value: "No. of logins", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--border-default)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="login_count"
              stroke="var(--accent-indigo)"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="No. of logins"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}

