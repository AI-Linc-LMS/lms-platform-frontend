"use client";

import { Box, Typography, Paper, Grid } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { BehavioralMetrics } from "@/lib/types/scorecard.types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface BehavioralMetricsSectionProps {
  data: BehavioralMetrics;
}

export function BehavioralMetricsSection({ data }: BehavioralMetricsSectionProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: 2,
        border: "1px solid rgba(0,0,0,0.08)",
        backgroundColor: "#ffffff",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: "#000000",
          fontSize: { xs: "1.25rem", sm: "1.5rem" },
          mb: 3,
        }}
      >
        Behavioral & Consistency Metrics
      </Typography>

      <Grid container spacing={3}>
        {/* Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "#f9fafb",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <IconWrapper icon="mdi:calendar-missed" size={20} color="#0a66c2" />
              <Typography variant="body2" sx={{ color: "#666666" }}>
                Missed Deadlines
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#000000" }}>
              {data.missedDeadlinesCount}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "#f9fafb",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <IconWrapper icon="mdi:chart-line" size={20} color="#0a66c2" />
              <Typography variant="body2" sx={{ color: "#666666" }}>
                Consistency Score
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#000000" }}>
              {data.consistencyScore}%
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "#f9fafb",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <IconWrapper icon="mdi:clock-check" size={20} color="#0a66c2" />
              <Typography variant="body2" sx={{ color: "#666666" }}>
                Last Active
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 600, color: "#000000" }}>
              {new Date(data.lastActiveDate).toLocaleDateString()}
            </Typography>
          </Box>
        </Grid>

        {/* Login Frequency Chart */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: "1rem" }}>
              Login Frequency (Last 8 Weeks)
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.loginFrequency} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" stroke="#666666" fontSize={12} tick={{ fill: "#666666" }} />
                <YAxis stroke="#666666" fontSize={12} tick={{ fill: "#666666" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                  }}
                />
                <Bar dataKey="loginCount" fill="#0a66c2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>

        {/* Study Time Distribution */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: "1rem" }}>
              Study Time Distribution (Weekly)
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.studyTimeDistribution} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#666666" fontSize={12} tick={{ fill: "#666666" }} />
                <YAxis stroke="#666666" fontSize={12} tick={{ fill: "#666666" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                  }}
                  formatter={(value: number) => [`${value} hours`, "Study Time"]}
                />
                <Bar dataKey="hours" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
