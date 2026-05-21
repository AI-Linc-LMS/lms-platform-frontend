"use client";

import type { ReactNode } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface StatTileProps {
  value: string | number;
  label: string;
  delta?: { value: number; label?: string };
  icon?: ReactNode;
  sparkline?: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}

const TONE_COLOR: Record<NonNullable<StatTileProps["tone"]>, string> = {
  neutral: "var(--sc-text-primary)",
  success: "var(--sc-accent-success)",
  warning: "var(--sc-accent-warning)",
  danger: "var(--sc-accent-danger)",
};

function deltaPresentation(value: number) {
  if (value > 0) {
    return { icon: <TrendingUp size={14} />, color: "var(--sc-accent-success)" };
  }
  if (value < 0) {
    return { icon: <TrendingDown size={14} />, color: "var(--sc-accent-danger)" };
  }
  return { icon: <Minus size={14} />, color: "var(--sc-text-muted)" };
}

export function StatTile({ value, label, delta, icon, sparkline, tone = "neutral" }: StatTileProps) {
  const deltaUi = delta ? deltaPresentation(delta.value) : null;
  return (
    <GlassCard padding="md" radius="md">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "var(--sc-text-muted)", fontSize: 12, fontWeight: 500, letterSpacing: "0.01em" }}>
            {label}
          </span>
          {icon ? <span style={{ color: "var(--sc-text-muted)" }}>{icon}</span> : null}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontFamily: '"SF Mono", ui-monospace, Menlo, monospace',
              fontSize: 28,
              lineHeight: 1.1,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: TONE_COLOR[tone],
            }}
          >
            {value}
          </span>
          {deltaUi ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                fontWeight: 600,
                color: deltaUi.color,
              }}
            >
              {deltaUi.icon}
              {delta!.value > 0 ? "+" : ""}{delta!.value}
              {delta?.label ? <span style={{ color: "var(--sc-text-muted)", fontWeight: 500 }}>{delta.label}</span> : null}
            </span>
          ) : null}
        </div>
        {sparkline ? <div style={{ marginTop: 4 }}>{sparkline}</div> : null}
      </div>
    </GlassCard>
  );
}
