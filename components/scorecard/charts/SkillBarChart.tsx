"use client";

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
import { Box, Typography, Paper, Tooltip as MuiTooltip, IconButton } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface SkillData {
  skillName: string;
  accuracy: number;
  attemptCount?: number;
  confidenceScore?: number;
  [key: string]: any;
}

interface SkillBarChartProps {
  data: SkillData[];
  title?: string;
  height?: number;
  dataKey?: string;
  color?: string;
  showInfoTooltip?: boolean;
  infoTooltipTitle?: React.ReactNode;
}

const SKILL_WISE_ACCURACY_TOOLTIP =
  "Accuracy = proficiency from quizzes, assessments, videos, coding, and interviews. Confidence = min(100, √(attempt count) × 20). See Skill Scorecard for full breakdown per skill.";

function CustomBarTooltip(props: {
  active?: boolean;
  payload?: readonly { payload: SkillData }[];
  label?: string | number;
}) {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;
  const entry = payload[0]?.payload;
  if (!entry) return null;
  const { skillName, accuracy, attemptCount, confidenceScore } = entry;
  return (
    <Paper
      elevation={8}
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 2,
        border: "1px solid rgba(0,0,0,0.08)",
        minWidth: 180,
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
        {skillName}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography variant="body2" sx={{ color: "#0f766e", fontWeight: 600 }}>
          Accuracy: {accuracy}%
        </Typography>
        {attemptCount != null && (
          <Typography variant="body2" sx={{ color: "#6b7280", fontWeight: 500 }}>
            Attempts: {attemptCount} activities completed
          </Typography>
        )}
        {confidenceScore != null && (
          <Typography variant="body2" sx={{ color: "#6b7280", fontWeight: 500 }}>
            Confidence: {confidenceScore}% (√attempts × 20, capped at 100)
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

export function SkillBarChart({
  data,
  title,
  height = 300,
  dataKey = "accuracy",
  color = "#0a66c2",
  showInfoTooltip = false,
  infoTooltipTitle,
}: SkillBarChartProps) {
  const getColor = (value: number) => {
    if (value >= 80) return "#10b981"; // Green
    if (value >= 60) return "#0a66c2"; // Blue
    if (value >= 40) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  return (
    <Box>
      {title && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#000000",
              fontSize: "1.125rem",
            }}
          >
            {title}
          </Typography>
          {showInfoTooltip && (
            <MuiTooltip title={infoTooltipTitle ?? SKILL_WISE_ACCURACY_TOOLTIP} placement="top" arrow>
              <IconButton size="small" sx={{ p: 0.25, color: "#0a66c2" }}>
                <IconWrapper icon="mdi:information-outline" size={18} color="currentColor" />
              </IconButton>
            </MuiTooltip>
          )}
        </Box>
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
            layout="vertical"
            margin={{ top: 5, right: 20, bottom: 5, left: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              domain={[0, 100]}
              stroke="#666666"
              fontSize={12}
              tick={{ fill: "#666666" }}
            />
            <YAxis
              type="category"
              dataKey="skillName"
              stroke="#666666"
              fontSize={12}
              tick={{ fill: "#666666" }}
              width={70}
            />
            <Tooltip content={({ active, payload, label }) => <CustomBarTooltip active={active} payload={payload} label={label} />} />
            <Bar dataKey={dataKey} radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry[dataKey])} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
