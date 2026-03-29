"use client";

import type { CSSProperties } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const boxStyle: CSSProperties = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: "0.8125rem",
};

interface VerticalGradientBarChartProps {
  data: Record<string, string | number>[];
  xDataKey: string;
  yDataKey: string;
  gradientId: string;
  colorFrom: string;
  colorTo: string;
  height?: number;
  /** e.g. (v) => [`${v} days`, "Active"] */
  formatTooltip?: (value: number, label: string) => { primary: string; secondary?: string };
}

export function VerticalGradientBarChart({
  data,
  xDataKey,
  yDataKey,
  gradientId,
  colorFrom,
  colorTo,
  height = 280,
  formatTooltip,
}: VerticalGradientBarChartProps) {
  return (
    <div style={{ width: "100%", height, position: "relative" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorFrom} />
              <stop offset="100%" stopColor={colorTo} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey={xDataKey}
            tick={{ fontSize: 10, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const v = Number(payload[0]?.value);
              const lbl = String(label ?? "");
              const fmt = formatTooltip?.(v, lbl) ?? { primary: String(v) };
              return (
                <div style={boxStyle}>
                  <div style={{ color: "#334155", fontWeight: 600, marginBottom: 4 }}>{lbl}</div>
                  <div style={{ color: "#64748b" }}>{fmt.primary}</div>
                  {fmt.secondary && <div style={{ color: "#94a3b8", fontSize: 12 }}>{fmt.secondary}</div>}
                </div>
              );
            }}
          />
          <Bar dataKey={yDataKey} fill={`url(#${gradientId})`} radius={[4, 4, 0, 0]} maxBarSize={80} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
