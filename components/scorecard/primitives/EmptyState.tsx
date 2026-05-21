"use client";

import type { ReactNode } from "react";
import { GlassCard } from "./GlassCard";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  size?: "sm" | "md";
}

const SIZE_MAP = {
  sm: { padding: 20, iconBox: 40, iconSize: 20 },
  md: { padding: 32, iconBox: 56, iconSize: 28 },
};

export function EmptyState({ icon, title, description, action, size = "md" }: EmptyStateProps) {
  const dims = SIZE_MAP[size];
  return (
    <GlassCard padding="none" radius="lg">
      <div
        style={{
          padding: dims.padding,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 12,
        }}
      >
        {icon ? (
          <span
            aria-hidden
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: dims.iconBox,
              height: dims.iconBox,
              borderRadius: 999,
              background: "var(--sc-bg-overlay)",
              color: "var(--sc-accent-primary)",
            }}
          >
            {icon}
          </span>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 360 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--sc-text-primary)" }}>{title}</span>
          {description ? (
            <span style={{ fontSize: 13, color: "var(--sc-text-muted)", lineHeight: 1.5 }}>{description}</span>
          ) : null}
        </div>
        {action ? <div style={{ marginTop: 4 }}>{action}</div> : null}
      </div>
    </GlassCard>
  );
}
