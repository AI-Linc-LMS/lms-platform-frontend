"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Row {
  name: string;
  value: number;
  color: string;
}

interface HorizontalMiniBarChartProps {
  data: Row[];
  height?: number;
}

export function HorizontalMiniBarChart({ data, height = 90 }: HorizontalMiniBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis type="category" dataKey="name" tick={{ fill: "#666", fontSize: 11 }} width={60} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "6px",
            padding: "4px 8px",
            fontSize: "0.75rem",
          }}
          formatter={(value: number | undefined) => [value != null ? `${value}%` : "—", "Score"]}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((e, i) => (
            <Cell key={i} fill={e.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
