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
import { proficiencyBandColor } from "@/lib/utils/scorecard-visual";

export interface SkillBarChartRow {
  skillName: string;
  accuracy: number;
  attemptCount?: number;
  confidenceScore?: number;
}

interface SkillBarChartProps {
  data: SkillBarChartRow[];
  title?: string;
  height?: number;
  dataKey?: string;
  showInfoTooltip?: boolean;
  infoTooltipTitle?: React.ReactNode;
}

const DEFAULT_INFO =
  "Accuracy = proficiency from quizzes, assessments, videos, coding, and interviews. Confidence = min(100, √(attempt count) × 20). See Skill Scorecard for full breakdown per skill.";

function CustomBarTooltip(props: {
  active?: boolean;
  payload?: readonly { payload: SkillBarChartRow }[];
}) {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;
  const entry = payload[0]?.payload;
  if (!entry) return null;
  return (
    <Paper elevation={8} sx={{ px: 2, py: 1.5, borderRadius: 2, border: "1px solid rgba(0,0,0,0.08)", minWidth: 180 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        {entry.skillName}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography variant="body2" sx={{ color: "#0f766e", fontWeight: 600 }}>
          Accuracy: {entry.accuracy}%
        </Typography>
        {entry.attemptCount != null && (
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Attempts: {entry.attemptCount} activities completed
          </Typography>
        )}
        {entry.confidenceScore != null && (
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Confidence: {entry.confidenceScore}% (√attempts × 20, capped at 100)
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
  showInfoTooltip = false,
  infoTooltipTitle,
}: SkillBarChartProps) {
  const barValue = (row: SkillBarChartRow) =>
    Number((row as unknown as Record<string, unknown>)[dataKey] ?? row.accuracy ?? 0);
  return (
    <Box>
      {title && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.125rem" }}>
            {title}
          </Typography>
          {showInfoTooltip && (
            <MuiTooltip title={infoTooltipTitle ?? DEFAULT_INFO} placement="top" arrow>
              <IconButton size="small" sx={{ p: 0.25, color: "primary.main" }}>
                <IconWrapper icon="mdi:information-outline" size={18} color="currentColor" />
              </IconButton>
            </MuiTooltip>
          )}
        </Box>
      )}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid rgba(0,0,0,0.08)" }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" domain={[0, 100]} stroke="#666" fontSize={12} tick={{ fill: "#666" }} />
            <YAxis type="category" dataKey="skillName" stroke="#666" fontSize={12} tick={{ fill: "#666" }} width={70} />
            <Tooltip content={<CustomBarTooltip />} />
            <Bar dataKey={dataKey} radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={proficiencyBandColor(barValue(entry))} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
