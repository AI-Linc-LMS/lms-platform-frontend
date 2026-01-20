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
    if (accuracy >= 80) return "#10b981";
    if (accuracy >= 60) return "#3b82f6";
    if (accuracy >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
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
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, mb: 1, color: "#1f2937" }}
          >
            {data.fullTopic}
          </Typography>
          <Typography variant="caption" sx={{ color: "#6b7280", display: "block" }}>
            Accuracy: <strong style={{ color: getColor(data.accuracy) }}>{data.accuracy}%</strong>
          </Typography>
          <Typography variant="caption" sx={{ color: "#6b7280", display: "block" }}>
            Correct: <strong style={{ color: "#10b981" }}>{data.correct}</strong>
          </Typography>
          <Typography variant="caption" sx={{ color: "#6b7280", display: "block" }}>
            Incorrect: <strong style={{ color: "#ef4444" }}>{data.incorrect}</strong>
          </Typography>
          <Typography variant="caption" sx={{ color: "#6b7280", display: "block" }}>
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
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:chart-bar" size={24} color="#6366f1" />
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
            Topic-wise Performance
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#6b7280",
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
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="topic"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12, fill: "#6b7280" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              label={{
                value: "Accuracy (%)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "#6b7280" },
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
