"use client";

import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  cta?: ReactNode;
  eyebrow?: string;
  size?: "md" | "lg";
}

const SIZE_MAP = {
  md: { titleSize: 18, eyebrowSize: 11, subtitleSize: 13 },
  lg: { titleSize: 24, eyebrowSize: 12, subtitleSize: 14 },
};

export function SectionHeader({ title, subtitle, cta, eyebrow, size = "md" }: SectionHeaderProps) {
  const dims = SIZE_MAP[size];
  return (
    <header
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        {eyebrow ? (
          <span
            style={{
              fontSize: dims.eyebrowSize,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--sc-accent-primary)",
            }}
          >
            {eyebrow}
          </span>
        ) : null}
        <h2
          style={{
            margin: 0,
            fontSize: dims.titleSize,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "var(--sc-text-primary)",
            lineHeight: 1.25,
          }}
        >
          {title}
        </h2>
        {subtitle ? (
          <p
            style={{
              margin: 0,
              fontSize: dims.subtitleSize,
              color: "var(--sc-text-muted)",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {cta ? <div style={{ flexShrink: 0 }}>{cta}</div> : null}
    </header>
  );
}
