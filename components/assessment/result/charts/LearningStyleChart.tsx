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
      color: "var(--accent-indigo)",
    },
    {
      name: "Auditory",
      value: learningStyle.auditory_percentage,
      color: "var(--assessment-chart-violet)",
    },
    {
      name: "Kinesthetic",
      value: learningStyle.kinesthetic_percentage,
      color: "var(--course-cta)",
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
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
          <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--font-primary-dark)" }}>
            {data.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block" }}>
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
            backgroundColor: "color-mix(in srgb, var(--course-cta) 12%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:school" size={24} color="var(--course-cta)" />
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
            Learning Style
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "var(--font-secondary)",
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
              fill="var(--assessment-chart-secondary-fill)"
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
      <Box sx={{ mt: 3, pt: 3, borderTop: "1px solid var(--border-default)" }}>
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "var(--font-secondary)", mb: 1 }}
          >
            Attention Pattern: {learningStyle.attention_pattern}
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "var(--font-secondary)" }}
          >
            Feedback Preference: {learningStyle.feedback_preference}
          </Typography>
        </Box>
        <Box>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: "var(--font-primary-dark)", mb: 1 }}
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
                  backgroundColor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--accent-indigo) 22%, transparent)",
                }}
              >
                <Typography variant="caption" sx={{ color: "var(--accent-indigo)", fontWeight: 600 }}>
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
