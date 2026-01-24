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

interface LearningStyle {
  primary_style: string;
  attention_pattern: string;
  feedback_preference: string;
  recommended_content_formats: string[];
  visual_percentage: number;
  auditory_percentage: number;
  kinesthetic_percentage: number;
}

interface LearningStyleChartProps {
  learningStyle: LearningStyle;
}

export function LearningStyleChart({ learningStyle }: LearningStyleChartProps) {
  const data = [
    {
      name: "Visual",
      value: learningStyle.visual_percentage,
      color: "#6366f1",
    },
    {
      name: "Auditory",
      value: learningStyle.auditory_percentage,
      color: "#8b5cf6",
    },
    {
      name: "Kinesthetic",
      value: learningStyle.kinesthetic_percentage,
      color: "#10b981",
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
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
            Percentage: <strong>{data.value}%</strong>
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
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:school" size={24} color="#10b981" />
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
            Learning Style
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#6b7280",
              fontSize: "0.8125rem",
            }}
          >
            {learningStyle.primary_style}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ width: "100%", height: 350 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={100}
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
                  {value}: {entry.payload.value}%
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      {/* Additional Info */}
      <Box sx={{ mt: 3, pt: 3, borderTop: "1px solid #e5e7eb" }}>
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "#6b7280", mb: 1 }}
          >
            Attention Pattern: {learningStyle.attention_pattern}
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "#6b7280" }}
          >
            Feedback Preference: {learningStyle.feedback_preference}
          </Typography>
        </Box>
        <Box>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: "#1f2937", mb: 1 }}
          >
            Recommended Content Formats:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {learningStyle.recommended_content_formats.map((format, index) => (
              <Box
                key={index}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  backgroundColor: "rgba(99, 102, 241, 0.1)",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                }}
              >
                <Typography variant="caption" sx={{ color: "#6366f1", fontWeight: 600 }}>
                  {format}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
