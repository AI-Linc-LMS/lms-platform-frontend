"use client";

import { Box, Paper, Typography } from "@mui/material";
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
import { IconWrapper } from "@/components/common/IconWrapper";

interface TopicStats {
  total: number;
  correct: number;
  incorrect: number;
  accuracy_percent: number;
  rating_out_of_5: number;
}

interface TopicWiseChartProps {
  topicWiseStats: Record<string, TopicStats>;
}

export function TopicWiseChart({ topicWiseStats }: TopicWiseChartProps) {
  if (!topicWiseStats || Object.keys(topicWiseStats).length === 0) {
    return null;
  }

  const chartData = Object.entries(topicWiseStats).map(([topic, stats]) => ({
    topic: topic.length > 15 ? topic.substring(0, 15) + "..." : topic,
    fullTopic: topic,
    accuracy: Number(stats.accuracy_percent.toFixed(1)),
    correct: stats.correct,
    incorrect: stats.incorrect,
    total: stats.total,
  }));

  const getColor = (accuracy: number) => {
    if (accuracy >= 80) return "var(--course-cta)";
    if (accuracy >= 60) return "var(--accent-blue-light)";
    if (accuracy >= 40) return "var(--warning-500)";
    return "var(--error-500)";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: "var(--font-light)",
            border: "1px solid var(--border-default)",
            borderRadius: 2,
            p: 1.5,
            boxShadow: "0 4px 12px color-mix(in srgb, var(--font-dark) 10%, transparent)",
          }}
        >
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, mb: 1, color: "var(--font-primary-dark)" }}
          >
            {data.fullTopic}
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block" }}>
            Accuracy: <strong style={{ color: getColor(data.accuracy) }}>{data.accuracy}%</strong>
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block" }}>
            Correct: <strong style={{ color: "var(--course-cta)" }}>{data.correct}</strong>
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block" }}>
            Incorrect: <strong style={{ color: "var(--error-500)" }}>{data.incorrect}</strong>
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block" }}>
            Total: {data.total}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        border: "1px solid var(--border-default)",
        borderRadius: 3,
        background: "var(--font-light)",
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
            backgroundColor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:chart-bar" size={24} color="var(--accent-indigo)" />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "var(--font-primary-dark)",
              mb: 0.25,
            }}
          >
            Topic-wise Performance
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "var(--font-secondary)",
              fontSize: "0.8125rem",
            }}
          >
            Accuracy breakdown by topic
          </Typography>
        </Box>
      </Box>

      <Box sx={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-100)" />
            <XAxis
              dataKey="topic"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12, fill: "var(--font-secondary)" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "var(--font-secondary)" }}
              label={{
                value: "Accuracy (%)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "var(--font-secondary)" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.accuracy)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
