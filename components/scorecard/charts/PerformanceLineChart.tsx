"use client";

import { Box, Typography } from "@mui/material";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface PerformanceLineChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface PerformanceLineChartProps<TData extends Record<string, unknown>> {
  data: TData[];
  xKey: keyof TData & string;
  series: PerformanceLineChartSeries[];
  height?: number;
  title?: string;
  emptyHint?: string;
}

/**
 * Recharts line chart used by the Performance Trends section.
 *
 * Designed for the staging revamp surface: transparent background, dashed
 * grid in `var(--border-default)`, axis labels in `var(--font-secondary)`,
 * tooltip card in `var(--card-bg)` with the same border style as the
 * surrounding section cards. Multi-series with up to 4 metrics.
 */
export function PerformanceLineChart<TData extends Record<string, unknown>>({
  data,
  xKey,
  series,
  height = 280,
  title,
  emptyHint,
}: PerformanceLineChartProps<TData>) {
  const isEmpty = !data || data.length === 0;

  return (
    <Box>
      {title && (
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: "var(--font-primary)",
            mb: 1.5,
            letterSpacing: 0.2,
          }}
        >
          {title}
        </Typography>
      )}
      <Box
        sx={{
          width: "100%",
          height,
          position: "relative",
          borderRadius: 2,
          bgcolor:
            "color-mix(in srgb, var(--surface-subtle, rgba(15,23,42,0.04)) 100%, transparent)",
          p: 1.5,
        }}
      >
        {isEmpty ? (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 0.5,
              color: "var(--font-secondary)",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {emptyHint ?? "No data yet."}
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 4"
                stroke="color-mix(in srgb, var(--border-default) 70%, transparent)"
                vertical={false}
              />
              <XAxis
                dataKey={xKey}
                tick={{ fill: "var(--font-secondary)", fontSize: 11 }}
                tickLine={false}
                axisLine={{
                  stroke: "color-mix(in srgb, var(--border-default) 60%, transparent)",
                }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "var(--font-secondary)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip
                cursor={{
                  stroke: "color-mix(in srgb, var(--accent-indigo) 30%, transparent)",
                  strokeWidth: 1,
                }}
                contentStyle={{
                  background: "var(--card-bg)",
                  border:
                    "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                  borderRadius: 8,
                  fontSize: 12,
                  boxShadow:
                    "0 12px 32px -16px rgba(15, 23, 42, 0.18)",
                }}
                labelStyle={{ color: "var(--font-primary)", fontWeight: 700 }}
                itemStyle={{ color: "var(--font-primary)" }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingBottom: 6, fontSize: 11 }}
              />
              {series.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  isAnimationActive
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Box>
  );
}
